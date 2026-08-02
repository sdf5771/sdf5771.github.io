import type { WorkLink, WorkMetadata, WorkType } from '../types';
import { hasRenderableBody, readMarkdownCollection, writeDataFile } from './markdownCollection';
import type { FrontMatter } from './markdownCollection';

/**
 * `public/_works/*.md` → `public/works-data.json`.
 * 명세: docs/handoff-step7-works.md §15 · agent-log/product.md §13-3
 *
 * 🔴 **`generatePostsData` 와 디렉터리 읽기·프론트매터 분리·JSON 쓰기를 공유**하고
 *    (`markdownCollection.ts`), 매핑·검증만 따로 갖습니다. 스키마가 다르기 때문에
 *    매퍼까지 합치면 양쪽이 선택 필드투성이가 됩니다(product.md §13-3).
 *
 * 🔴 **이 산출물은 글 목록 계열 어디에도 흘러가지 않습니다.** 검색·태그·
 *    이전/다음은 `posts-data.json` 만 봅니다. 디렉터리가 갈려 있어 필터를 한
 *    군데 빠뜨려도 섞이지 않는 것이 이 구조의 목적입니다.
 *
 *    sitemap 은 예외입니다 — 생기면 `/works` 와 `hasBody === true` 인 작업
 *    URL 을 **포함해야 합니다**(product.md §1-2 · 이 문서 §6-5, findability).
 *    현재 리포에 sitemap·RSS·프리렌더는 존재하지 않으므로 그때 구현할 일입니다.
 */

const MARKDOWN_DIRECTORY_PATH = 'public/_works';
const jsonOutputPath = 'public/works-data.json';

/** W1 — 소문자 영문·숫자·하이픈만. 대문자·언더스코어·한글 금지 (product.md §13-3) */
const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** W5 — 권고 40자, 상한 50자. 신규 생성이므로 처음부터 짧게 */
const SLUG_MAX_LENGTH = 40;

/** `YYYY-MM`. 연월까지만 — 정확한 입·퇴사일은 노출하지 않습니다(§13-5) */
const MONTH_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])$/;

const WORK_TYPES: readonly WorkType[] = ['work', 'personal'];

/** 요약 규격. 벗어나도 빌드를 세우지는 않고 경고만 합니다 — 저자가 고칠 대상입니다 */
const SUMMARY_MIN = 60;
const SUMMARY_MAX = 90;

function readString(data: FrontMatter, key: string): string {
    const value = data[key];
    return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(data: FrontMatter, key: string): string[] {
    const value = data[key];

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim())
        .filter(Boolean);
}

/** `links: [{ label, url }]`. 형태가 어긋난 항목은 조용히 버리지 않고 빌드를 세웁니다 */
function readLinks(data: FrontMatter, slug: string): WorkLink[] {
    const value = data.links;

    if (value === undefined || value === null || value === '') {
        return [];
    }

    if (!Array.isArray(value)) {
        throw new Error(`"${slug}": links 는 배열이어야 합니다`);
    }

    return value.map((item, index) => {
        const label = typeof item?.label === 'string' ? item.label.trim() : '';
        const url = typeof item?.url === 'string' ? item.url.trim() : '';

        if (!label || !url) {
            throw new Error(`"${slug}": links[${index}] 에 label 또는 url 이 없습니다`);
        }

        return { label, url };
    });
}

/**
 * 프론트매터 → `WorkMetadata`.
 *
 * 🔴 **`summary` 와 `stack` 이 비어 있어도 빌드를 세우지 않습니다.**
 *    둘 다 "저자가 채워야 하는 값" 이고(요약 15건 · 사이드 3건 스택), 초기
 *    릴리스는 그 상태로 성립하는 것이 §4-2 ① 의 전제입니다. 대신 아래에서
 *    **남은 건수를 빌드 로그에 찍습니다** — 조용히 넘어가면 영영 안 채워집니다.
 */
function toWorkMetadata(filename: string, data: FrontMatter, content: string): WorkMetadata {
    /* 파일명 = slug. 글과 달리 변환이 없습니다(product.md §13-3 W2) */
    const slug = filename.replace(/\.md$/, '');

    if (!SLUG_PATTERN.test(slug)) {
        throw new Error(`slug 가 W1 규칙(소문자·숫자·하이픈)에 어긋납니다: "${slug}"`);
    }

    if (slug.length > SLUG_MAX_LENGTH) {
        throw new Error(`slug 가 ${SLUG_MAX_LENGTH}자를 넘습니다(W5): "${slug}" (${slug.length}자)`);
    }

    const title = readString(data, 'title');
    const start = readString(data, 'start');
    const end = readString(data, 'end');
    const type = readString(data, 'type');
    const role = readString(data, 'role');

    if (!title) {
        throw new Error(`"${slug}": title 이 없습니다`);
    }

    if (!MONTH_PATTERN.test(start)) {
        throw new Error(`"${slug}": start 는 YYYY-MM 이어야 합니다 (받은 값: "${start}")`);
    }

    /* 빈 문자열은 `진행 중` 을 뜻하므로 허용합니다. 값이 있으면 형식을 봅니다 */
    if (end && !MONTH_PATTERN.test(end)) {
        throw new Error(`"${slug}": end 는 YYYY-MM 이거나 비어 있어야 합니다 (받은 값: "${end}")`);
    }

    if (end && end < start) {
        throw new Error(`"${slug}": end(${end}) 가 start(${start}) 보다 앞섭니다`);
    }

    if (!WORK_TYPES.includes(type as WorkType)) {
        throw new Error(`"${slug}": type 은 ${WORK_TYPES.join(' | ')} 중 하나여야 합니다 (받은 값: "${type}")`);
    }

    if (!role) {
        throw new Error(`"${slug}": role 이 없습니다`);
    }

    return {
        slug,
        title,
        start,
        end,
        type: type as WorkType,
        role,
        org: readString(data, 'org'),
        stack: readStringArray(data, 'stack'),
        summary: readString(data, 'summary'),
        links: readLinks(data, slug),
        relatedPost: readString(data, 'relatedPost'),
        hasBody: hasRenderableBody(content),
    };
}

function generateWorksData() {
    try {
        const works = readMarkdownCollection(MARKDOWN_DIRECTORY_PATH).map(entry =>
            toWorkMetadata(entry.filename, entry.data, entry.content),
        );

        /*
         * 🔴 정렬: start DESC, **동률이면 slug ASC**(§15-3).
         *    `start` 가 같은 항목이 3쌍 있습니다(2025-07 · 2024-10 · 2024-07).
         *    타이브레이커가 없으면 빌드 머신의 `readdirSync` 순서에 따라 목록
         *    순서가 흔들립니다 — 글 쪽(§10-2)과 같은 판정입니다.
         *    `YYYY-MM` 은 고정 폭이라 문자열 비교로 충분합니다.
         */
        works.sort((a, b) => b.start.localeCompare(a.start) || a.slug.localeCompare(b.slug));

        writeDataFile(jsonOutputPath, works);

        const bodyCount = works.filter(work => work.hasBody).length;
        const ongoingCount = works.filter(work => !work.end).length;
        const missingSummary = works.filter(work => !work.summary).map(work => work.slug);
        const missingStack = works.filter(work => work.stack.length === 0).map(work => work.slug);
        const oddSummary = works.filter(
            work =>
                work.summary &&
                (work.summary.length < SUMMARY_MIN || work.summary.length > SUMMARY_MAX),
        );

        console.log(
            `✅ Works data generated successfully: ${jsonOutputPath}\n` +
                `   작업 ${works.length}건 · 상세 보유 ${bodyCount}건 · 진행 중 ${ongoingCount}건`,
        );

        /*
         * 🔴 남은 저자 작업을 **매 빌드마다** 보여 줍니다. 이 두 필드는 코드가
         *    채울 수 없고(요약은 저자의 서술, 스택은 원본에 없는 사실),
         *    조용히 두면 빈 채로 배포됩니다.
         */
        if (missingSummary.length > 0) {
            console.warn(
                `⚠️  summary 미작성 ${missingSummary.length}건 — 60~90자 한 문장을 저자가 직접 써야 합니다.\n` +
                    `   비어 있는 동안 목록 행에서 요약 줄이 렌더되지 않습니다.\n` +
                    `   ${missingSummary.join(', ')}`,
            );
        }

        if (missingStack.length > 0) {
            console.warn(
                `⚠️  stack 미기입 ${missingStack.length}건 — 원본 경력기술서에 사용 기술이 없는 항목입니다.\n` +
                    `   ${missingStack.join(', ')}`,
            );
        }

        for (const work of oddSummary) {
            console.warn(
                `⚠️  "${work.slug}": summary 가 ${work.summary.length}자입니다 (규격 ${SUMMARY_MIN}~${SUMMARY_MAX}자)`,
            );
        }
    } catch (error) {
        console.error('❌ Error generating works data:', error);
        /* 조용히 넘어가면 이전 works-data.json 으로 그대로 배포됩니다 */
        process.exit(1);
    }
}

generateWorksData();
