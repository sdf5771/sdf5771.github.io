/**
 * 이미지 파일 헤더에서 픽셀 크기를 읽습니다. **빌드 전용**입니다.
 * 명세: docs/handoff-step3-post.md §11-2 (요구 2·3)
 *
 * 왜 필요한가
 * -----------
 * 모든 `<img>` 에 `width`/`height` 속성이 있어야 합니다. 이건 성능 문제가 아니라
 * **기능 문제**입니다 — 속성이 없으면 이미지가 로드될 때마다 문서 높이가 변하고,
 * 읽기 진행바(§8-2)가 그때마다 재계산되어 뒤로 튑니다. 본문 이미지는 113장이라
 * 한 글에서 13번 튀는 경우가 생깁니다(mongodb-local).
 * 런타임에는 크기를 알 방법이 없으므로 빌드 때 기록해야 합니다.
 *
 * 왜 `image-size` 를 안 쓰는가
 * ---------------------------
 * 필요한 건 png·jpeg·gif·webp 네 형식뿐이고(실측 113장이 전부 이 넷 + webp),
 * 넷 다 헤더 수십 바이트만 읽으면 됩니다. 의존성 하나를 늘릴 만한 일이 아닙니다.
 *
 * 🔴 파일 **전체**를 읽지 않습니다. 최대 5.64MB 짜리가 24장 있어서 전부 메모리에
 *    올리면 빌드가 수백 MB 를 씁니다. 앞부분만 열어 읽습니다.
 */

import fs from 'fs';

export interface ImageSize {
    width: number;
    height: number;
}

/** 헤더 탐색에 쓸 선두 바이트 수. JPEG 는 세그먼트를 건너뛰어야 해서 넉넉히 잡습니다 */
const HEADER_BYTES = 64 * 1024;

function readHead(filePath: string): Buffer {
    const handle = fs.openSync(filePath, 'r');

    try {
        const buffer = Buffer.alloc(HEADER_BYTES);
        const bytesRead = fs.readSync(handle, buffer, 0, HEADER_BYTES, 0);
        return buffer.subarray(0, bytesRead);
    } finally {
        fs.closeSync(handle);
    }
}

/** PNG — IHDR 청크가 항상 선두 8바이트 시그니처 바로 뒤에 옵니다 */
function readPngSize(head: Buffer): ImageSize | null {
    if (head.length < 24 || head.readUInt32BE(0) !== 0x89504e47) {
        return null;
    }

    return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
}

/** GIF — 논리 화면 서술자에 리틀엔디언 16비트로 들어 있습니다 */
function readGifSize(head: Buffer): ImageSize | null {
    if (head.length < 10 || head.subarray(0, 3).toString('ascii') !== 'GIF') {
        return null;
    }

    return { width: head.readUInt16LE(6), height: head.readUInt16LE(8) };
}

/**
 * JPEG — 세그먼트를 순회하며 SOF 마커를 찾습니다.
 * SOF0/1/2/3/5/6/7/9/10/11/13/14/15 가 크기를 갖고, DHT(C4)·JPG(C8)·DAC(CC)는 아닙니다.
 */
function readJpegSize(head: Buffer): ImageSize | null {
    if (head.length < 4 || head.readUInt16BE(0) !== 0xffd8) {
        return null;
    }

    let offset = 2;

    while (offset + 9 < head.length) {
        if (head[offset] !== 0xff) {
            offset += 1;
            continue;
        }

        const marker = head[offset + 1];
        const isSizeMarker =
            marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

        if (isSizeMarker) {
            /* 세그먼트: [길이 2][정밀도 1][높이 2][너비 2] */
            return { height: head.readUInt16BE(offset + 5), width: head.readUInt16BE(offset + 7) };
        }

        const segmentLength = head.readUInt16BE(offset + 2);
        if (segmentLength < 2) {
            return null;
        }
        offset += 2 + segmentLength;
    }

    return null;
}

/** WebP — VP8(로시) · VP8L(로스리스) · VP8X(확장) 세 형태의 청크가 다릅니다 */
function readWebpSize(head: Buffer): ImageSize | null {
    if (
        head.length < 30 ||
        head.subarray(0, 4).toString('ascii') !== 'RIFF' ||
        head.subarray(8, 12).toString('ascii') !== 'WEBP'
    ) {
        return null;
    }

    const chunk = head.subarray(12, 16).toString('ascii');

    if (chunk === 'VP8 ') {
        /* 14바이트 프레임 헤더 뒤 2바이트씩. 상위 2비트는 스케일이라 마스킹합니다 */
        return {
            width: head.readUInt16LE(26) & 0x3fff,
            height: head.readUInt16LE(28) & 0x3fff,
        };
    }

    if (chunk === 'VP8L') {
        /* 1바이트 시그니처 뒤 14비트씩 패킹 */
        const bits = head.readUInt32LE(21);
        return {
            width: (bits & 0x3fff) + 1,
            height: ((bits >> 14) & 0x3fff) + 1,
        };
    }

    if (chunk === 'VP8X') {
        /* 24비트 리틀엔디언, 1을 뺀 값이 저장돼 있습니다 */
        return {
            width: (head.readUIntLE(24, 3) & 0xffffff) + 1,
            height: (head.readUIntLE(27, 3) & 0xffffff) + 1,
        };
    }

    return null;
}

/**
 * 지원 형식이 아니거나 헤더가 깨졌으면 `null`.
 *
 * 🔴 여기서 throw 하지 않습니다. 크기를 못 읽는 이미지 한 장 때문에 빌드를 세우면
 *    글 41편이 전부 배포되지 않습니다. 크기가 없으면 그 이미지만 `width`/`height`
 *    없이 렌더되고(CLS 방어를 못 받고), 나머지는 정상입니다.
 */
export function readImageSize(filePath: string): ImageSize | null {
    let head: Buffer;

    try {
        head = readHead(filePath);
    } catch {
        return null;
    }

    const size =
        readPngSize(head) ?? readGifSize(head) ?? readJpegSize(head) ?? readWebpSize(head);

    /* 0 이나 NaN 이 나오면 속성으로 쓸 수 없습니다 */
    if (!size || !Number.isFinite(size.width) || !Number.isFinite(size.height)) {
        return null;
    }

    return size.width > 0 && size.height > 0 ? size : null;
}
