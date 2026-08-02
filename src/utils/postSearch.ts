/**
 * 글 검색 매칭 규칙 — **이 파일이 유일한 정의처입니다.**
 * 명세: docs/handoff-step4-list.md §3-1 · §3-2 · §3-4 · §3-6
 *
 * 직전 구현(`usePosts`)은 하나의 검색어를 `title`·`category`·`tag` 세 필드에
 * **각각 완전일치 AND** 로 걸었습니다. 제목이면서 동시에 카테고리이면서 태그인
 * 문자열은 없으므로 **결과가 항상 0** 이었습니다. 전면 재작성입니다.
 *
 * 계약 (한 줄)
 *   NFC → 소문자 → trim → 공백 토큰화 → **토큰 간 AND · 필드 간 OR** · 부분일치
 */

import type { PostMetadata } from '../types';

/**
 * 매칭용 정규화.
 *
 *  - **NFC**: macOS 입력기가 NFD 를 만들고, 데이터 출처가 `.md` 파일명과
 *    프론트매터로 섞여 있습니다. 정규화가 없으면 `한글` 이 안 잡히는 사고가
 *    재현 불가능한 형태로 납니다.
 *  - **소문자**: 태그에 `JavaScript` 와 `Javascript` 가 **둘 다 존재**합니다.
 *    무시하지 않으면 같은 태그가 갈립니다.
 *  - 연속 공백 축약: `  react  ` 와 `react` 가 같은 결과를 내야 합니다.
 */
export function normalizeSearchText(value: string): string {
    return value.normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * 질의 → 토큰 배열. 빈 배열이면 "검색 조건 없음"(전체 통과)입니다.
 *
 * 최소 길이 제한을 두지 않습니다 — 41건 규모에서 1글자 검색(`훅`·`합`)이
 * 결과를 폭주시키지 않습니다.
 */
export function tokenizeQuery(query: string): string[] {
    const normalized = normalizeSearchText(query);
    return normalized ? normalized.split(' ') : [];
}

/**
 * 글 1건의 검색 대상 문자열.
 *
 * 🔴 **본문은 대상이 아닙니다.** `posts-data.json` 에 본문이 없고, 넣으면
 *    파일이 15KB 에서 25~40배가 됩니다(§3-1). 대신 검색 범위를 사용자가 알 수
 *    있도록 입력 아래 `제목·태그·카테고리에서 찾아요` 를 항상 노출합니다.
 *    `description` 은 41편 중 1편뿐이라 안내 문구에 넣지 않고 조용히 포함합니다.
 */
export function buildSearchHaystack(post: PostMetadata): string {
    /*
     * 🔴 필드 접근을 전부 방어합니다. 이 함수는 `data/posts.ts` 의 **모듈 평가
     *    시점**에 41번 호출됩니다 — `createRoot().render()` 보다 먼저입니다.
     *    여기서 throw 하면 ErrorBoundary 가 마운트되기 전이라 아무도 잡지 못하고
     *    **흰 화면**이 됩니다. 지금 41편은 전부 정상이고 생성기가 기본값을 주지만,
     *    프론트매터가 손으로 편집되는 이상 `keywords` 누락은 언제든 들어옵니다.
     *    검색 한 건이 덜 걸리는 것과 사이트 전체가 안 뜨는 것은 비용이 다릅니다.
     */
    const keywords = Array.isArray(post?.keywords) ? post.keywords.join(' ') : '';

    return normalizeSearchText(
        [post?.title, keywords, post?.category, post?.description]
            .filter((field): field is string => typeof field === 'string')
            .join('\n'),
    );
}

/**
 * 토큰 간 **AND**. `react hook` 은 "둘 다 있는 글"을 기대하므로 OR 이면
 * react 만 있는 14건이 전부 나와 필터가 무의미해집니다.
 *
 * haystack 이 4필드를 이어 붙인 하나의 문자열이라 **필드 간 OR** 은 자동으로
 * 성립합니다 — 토큰마다 다른 필드에서 맞아도 통과합니다.
 */
export function matchesTokens(haystack: string, tokens: readonly string[]): boolean {
    return tokens.every(token => haystack.includes(token));
}

/** 이 문자열이 토큰 중 **하나라도** 품고 있는가. 태그·카테고리 강조 판정용입니다 */
export function hasTokenMatch(value: string, tokens: readonly string[]): boolean {
    if (tokens.length === 0) {
        return false;
    }

    const normalized = normalizeSearchText(value);
    return tokens.some(token => normalized.includes(token));
}

export interface TextSegment {
    text: string;
    isMatch: boolean;
}

/**
 * 표시 문자열을 일치 구간 / 비일치 구간으로 쪼갭니다. `<mark>` 렌더용입니다.
 *
 * 🔴 **매칭은 정규화 문자열에서 하지만 표시는 원문이어야 합니다.**
 *    소문자화는 길이를 바꾸지 않지만 NFC 정규화는 바꿀 수 있으므로, 인덱스를
 *    구한 **그 NFC 문자열을 그대로 렌더**합니다(원문으로 되돌리지 않습니다).
 *    NFC 는 사람이 보는 결과가 동일합니다.
 *
 * 🔴 소문자화가 길이를 바꾸는 문자가 있으면(터키어 `İ` → `i̇` 2자) 인덱스가
 *    어긋나 엉뚱한 구간이 강조됩니다. 그때는 강조를 포기하고 원문을 그대로
 *    돌려줍니다 — 잘못 강조하는 것보다 강조가 없는 편이 낫습니다.
 */
export function splitByTokens(value: string, tokens: readonly string[]): TextSegment[] {
    const text = value.normalize('NFC');
    const plain: TextSegment[] = [{ text, isMatch: false }];

    if (tokens.length === 0 || text.length === 0) {
        return plain;
    }

    const lowered = text.toLowerCase();
    if (lowered.length !== text.length) {
        return plain;
    }

    const ranges: Array<[number, number]> = [];

    for (const token of tokens) {
        let from = lowered.indexOf(token);

        while (from !== -1) {
            ranges.push([from, from + token.length]);
            from = lowered.indexOf(token, from + 1);
        }
    }

    if (ranges.length === 0) {
        return plain;
    }

    /* 토큰이 여러 개면 구간이 겹칠 수 있습니다. 겹친 <mark> 는 중첩되어 깨집니다 */
    ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    const merged: Array<[number, number]> = [];

    for (const range of ranges) {
        const last = merged[merged.length - 1];

        if (last && range[0] <= last[1]) {
            last[1] = Math.max(last[1], range[1]);
            continue;
        }

        merged.push([range[0], range[1]]);
    }

    const segments: TextSegment[] = [];
    let cursor = 0;

    for (const [start, end] of merged) {
        if (start > cursor) {
            segments.push({ text: text.slice(cursor, start), isMatch: false });
        }

        segments.push({ text: text.slice(start, end), isMatch: true });
        cursor = end;
    }

    if (cursor < text.length) {
        segments.push({ text: text.slice(cursor), isMatch: false });
    }

    return segments;
}

/**
 * 🔴 일치한 태그를 앞으로 끌어올립니다.
 *
 * 목록은 태그를 3개까지만 노출합니다(WRITING_GUIDE §6.8). `browser`·`hooks` 는
 * **결과 3건 전부 제목에 일치 문자열이 없어서** 태그가 유일한 근거인데,
 * 그 태그가 4번째 이후에 있으면 사용자는 "왜 이게 결과인가"를 영영 알 수
 * 없습니다. 실측으로 `webxr`·`browser`·`nextjs` 가 그 경우에 해당합니다.
 *
 * 일치 태그를 먼저 배치하고 남은 자리를 원래 순서로 채웁니다.
 */
export function orderKeywordsForQuery(
    keywords: readonly string[],
    tokens: readonly string[],
): string[] {
    if (tokens.length === 0) {
        return [...keywords];
    }

    const matched: string[] = [];
    const rest: string[] = [];

    for (const keyword of keywords) {
        (hasTokenMatch(keyword, tokens) ? matched : rest).push(keyword);
    }

    return [...matched, ...rest];
}
