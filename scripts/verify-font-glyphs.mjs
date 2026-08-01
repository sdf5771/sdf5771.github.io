/**
 * 🔴 빌드타임 단언 — 장식 기호가 서브셋 폰트에 실재하는지 검사합니다.
 *
 * 왜 필요한가 (docs/handoff-step1-shell.md §4-3a)
 * ----------------------------------------------
 * 서브셋을 화이트리스트(유지 목록) 방식으로 바꾸면서 생긴 위험의 안전망입니다.
 * 유지 목록에서 빠뜨린 기호는 **에러 없이 조용히 사라져 폴백 서체로 렌더**됩니다.
 * `➜`·`⌕` 사고와 증상이 같고, 원인이 우리 쪽이라 더 나쁩니다.
 * 이 스크립트가 그 실패를 「조용한 시각 버그」에서 「빌드 에러」로 바꿉니다.
 *
 * 왜 Python 이 아니라 Node 인가
 * -----------------------------
 * 같은 단언이 scripts/subset-galmuri.py 에도 있지만 그쪽은 fontTools 가 필요해서
 * **서브셋을 다시 만들 때만** 돌아갑니다. 배포 CI(.github/workflows/deploy.yml)는
 * Node 만 설치하므로, `npm run build` 가 실제로 검사하게 하려면 의존성 0 으로
 * 돌아야 합니다. 그래서 WOFF2 컨테이너를 직접 열어 cmap 만 읽습니다
 * (brotli 는 Node 내장 zlib 에 있습니다).
 *
 * 새 장식 기호를 쓰려면 ① subset-galmuri.py 의 유지 목록 ② 이 파일의 REQUIRED
 * ③ subset-galmuri.py 의 REQUIRED ④ §4-7 검증 — 네 곳을 함께 고치세요.
 */

import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';

/** §4-7 인벤토리. subset-galmuri.py 의 REQUIRED 와 같은 값이어야 합니다 */
const REQUIRED = '▸×●○→←↑↗★·…–☰⌘';

const FONTS = [
    'src/assets/fonts/Galmuri11-subset.woff2',
    'src/assets/fonts/GalmuriMono11-subset.woff2',
];

/* WOFF2 가 인덱스로 줄여 쓰는 표준 테이블 태그 63종 (WOFF2 명세 표 1) */
const KNOWN_TAGS = [
    'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post',
    'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
    'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea',
    'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH',
    'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar',
    'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
    'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop',
    'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
];

/** WOFF2 의 가변 길이 정수. 7비트씩 이어 붙이고 최상위 비트가 계속 표시입니다 */
function readUIntBase128(buffer, start) {
    let value = 0;

    for (let i = 0; i < 5; i += 1) {
        const byte = buffer[start + i];
        value = value * 128 + (byte & 0x7f);

        if ((byte & 0x80) === 0) {
            return { value, next: start + i + 1 };
        }
    }

    throw new Error('UIntBase128 이 5바이트를 넘었습니다 — 손상된 WOFF2');
}

/**
 * WOFF2 컨테이너에서 cmap 테이블 바이트만 꺼냅니다.
 *
 * 압축 스트림 안에서 테이블은 디렉터리 순서로 패딩 없이 이어 붙습니다.
 * 따라서 cmap 앞 테이블들의 길이를 더하면 시작 위치가 나옵니다.
 * glyf·loca 는 변환된 형태로 들어 있어 길이가 다르므로 그것만 구분하면 됩니다.
 */
function extractCmapTable(file) {
    if (file.toString('latin1', 0, 4) !== 'wOF2') {
        throw new Error('WOFF2 시그니처가 아닙니다');
    }

    if (file.toString('latin1', 4, 8) === 'ttcf') {
        throw new Error('폰트 컬렉션(ttcf)은 다루지 않습니다');
    }

    const numTables = file.readUInt16BE(12);
    const totalCompressedSize = file.readUInt32BE(20);

    let cursor = 48;
    const tables = [];

    for (let i = 0; i < numTables; i += 1) {
        const flags = file[cursor];
        cursor += 1;

        const knownIndex = flags & 0x3f;
        let tag;

        if (knownIndex === 0x3f) {
            tag = file.toString('latin1', cursor, cursor + 4);
            cursor += 4;
        } else {
            tag = KNOWN_TAGS[knownIndex];
        }

        const transformVersion = (flags >> 6) & 0x03;

        const origRead = readUIntBase128(file, cursor);
        cursor = origRead.next;

        /*
         * 변환 여부 규칙이 glyf·loca 만 반대입니다.
         *   glyf·loca : 버전 0 = 변환됨,  버전 3 = 변환 없음
         *   그 외     : 버전 0 = 변환 없음, 0 이 아니면 변환됨(hmtx 만 정의됨)
         */
        const isTransformed =
            tag === 'glyf' || tag === 'loca'
                ? transformVersion === 0
                : transformVersion !== 0;

        let length = origRead.value;

        if (isTransformed) {
            const transformRead = readUIntBase128(file, cursor);
            cursor = transformRead.next;
            length = transformRead.value;
        }

        tables.push({ tag, length });
    }

    const fontData = brotliDecompressSync(
        file.subarray(cursor, cursor + totalCompressedSize),
    );

    let offset = 0;

    for (const table of tables) {
        if (table.tag === 'cmap') {
            /* cmap 은 변환 대상이 아니므로 압축 해제된 바이트가 곧 원본입니다 */
            return fontData.subarray(offset, offset + table.length);
        }

        offset += table.length;
    }

    throw new Error('cmap 테이블이 없습니다');
}

/** cmap format 4 (BMP) 에서 코드포인트 집합을 읽습니다 */
function readFormat4(cmap, start, into) {
    const segCount = cmap.readUInt16BE(start + 6) / 2;
    const endBase = start + 14;
    const startBase = endBase + segCount * 2 + 2;
    const deltaBase = startBase + segCount * 2;
    const rangeOffsetBase = deltaBase + segCount * 2;

    for (let segment = 0; segment < segCount; segment += 1) {
        const endCode = cmap.readUInt16BE(endBase + segment * 2);
        const startCode = cmap.readUInt16BE(startBase + segment * 2);
        const idDelta = cmap.readInt16BE(deltaBase + segment * 2);
        const idRangeOffset = cmap.readUInt16BE(rangeOffsetBase + segment * 2);

        if (startCode > endCode || startCode === 0xffff) {
            continue;
        }

        for (let code = startCode; code <= endCode; code += 1) {
            let glyphId;

            if (idRangeOffset === 0) {
                glyphId = (code + idDelta) & 0xffff;
            } else {
                const glyphIndex =
                    rangeOffsetBase + segment * 2 + idRangeOffset + (code - startCode) * 2;

                if (glyphIndex + 1 >= cmap.length) {
                    continue;
                }

                const raw = cmap.readUInt16BE(glyphIndex);
                glyphId = raw === 0 ? 0 : (raw + idDelta) & 0xffff;
            }

            /* 글리프 0 은 .notdef — 매핑이 없다는 뜻입니다 */
            if (glyphId !== 0) {
                into.add(code);
            }
        }
    }
}

/** cmap format 12 (BMP 밖 포함) 에서 코드포인트 집합을 읽습니다 */
function readFormat12(cmap, start, into) {
    const groupCount = cmap.readUInt32BE(start + 12);

    for (let group = 0; group < groupCount; group += 1) {
        const base = start + 16 + group * 12;
        const startCode = cmap.readUInt32BE(base);
        const endCode = cmap.readUInt32BE(base + 4);

        for (let code = startCode; code <= endCode; code += 1) {
            into.add(code);
        }
    }
}

function readCodepoints(path) {
    const cmap = extractCmapTable(readFileSync(path));
    const subtableCount = cmap.readUInt16BE(2);
    const codepoints = new Set();

    for (let i = 0; i < subtableCount; i += 1) {
        const offset = cmap.readUInt32BE(4 + i * 8 + 4);
        const format = cmap.readUInt16BE(offset);

        if (format === 4) {
            readFormat4(cmap, offset, codepoints);
        } else if (format === 12) {
            readFormat12(cmap, offset, codepoints);
        }
    }

    return codepoints;
}

const failures = [];

for (const path of FONTS) {
    let codepoints;

    try {
        codepoints = readCodepoints(path);
    } catch (error) {
        failures.push(`${path} — 폰트를 읽지 못했습니다: ${error.message}`);
        continue;
    }

    const missing = [...REQUIRED].filter(char => !codepoints.has(char.codePointAt(0)));

    if (missing.length > 0) {
        const listed = missing
            .map(char => `${char} U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`)
            .join(', ');
        failures.push(`${path} — 누락: ${listed}`);
    } else {
        console.log(`✅ 장식 기호 ${[...REQUIRED].length}자 전부 존재 (${codepoints.size}자 수록): ${path}`);
    }
}

if (failures.length > 0) {
    console.error('\n❌ 서브셋 폰트 검증 실패 — 장식 기호가 폴백 서체로 렌더됩니다.');
    for (const failure of failures) {
        console.error(`   ${failure}`);
    }
    console.error(
        '\n   → scripts/subset-galmuri.py 의 유지 목록에 코드포인트를 추가하고 서브셋을 다시 만드세요.\n' +
            '     docs/handoff-step1-shell.md §4-3a · §4-7\n',
    );
    process.exit(1);
}
