/**
 * meta description 생성 — **WRITING_GUIDE §6.13a·§6.13b·§6.13c 의 구현입니다.**
 *
 * 🔴 이 파일이 노출 문구를 담는 **코드상 유일한 자리**입니다.
 *    문구의 정본은 `docs/WRITING_GUIDE.md` 이고 여기는 그것을 옮겨 적은 한 곳입니다.
 *    같은 문장을 다른 파일에도 적지 마세요(lessons L15). 새 문구를 지어내지도
 *    마세요 — 규정이 없으면 web-design 에 요청하는 것이 규칙입니다.
 *
 * 입력은 `posts-data.json` 의 **`excerpt` 하나뿐**입니다(§6.13b-1).
 *  - 본문(`public/_posts/*.md`)을 다시 파싱하지 않습니다.
 *  - `description` 필드를 직접 읽지 않습니다 — 41편 중 40편이 빈 문자열이고,
 *    `excerpt` 가 이미 「프론트매터 description 우선, 없으면 본문 첫 문단」으로
 *    만들어져 있습니다. 폴백 분기를 여기서 다시 짜면 그때부터 갈립니다.
 */

import type { PostMetadata } from '../../src/types';
import { POSTS } from '../../src/data/posts';
import { INDEXED_TAGS, getPostsByTagSlug } from '../../src/data/tags';
import { WORKS } from '../../src/data/works';
import type { TagSummary } from '../../src/utils/tags';

/* ------------------------------------------------------------------ *
 * 고정 문구 (§6.13a · §6.13c-1)
 * ------------------------------------------------------------------ */

/** §6.13a. 홈의 description·og:description·twitter:description 공통값 (95자) */
export const HOME_DESCRIPTION =
    'Software Engineer Seobisback의 기술 블로그입니다. 공부하거나 조사한 내용을 기록합니다. ' +
    '프론트엔드, 브라우저, 그리고 그 사이의 이야기를 남깁니다.';

/**
 * §6.13c-1. `/about` (85자).
 * §5.5 의 확정 About 카피 1·2문장 그대로입니다 — 소개 화면(`About.tsx`)과 검색
 * 결과가 다른 말을 하지 않게 하려는 것이라 **문장을 바꾸려면 양쪽을 함께** 고쳐야
 * 합니다. 3문장("요즘은 …")은 가장 빨리 낡는 문장이라 뺐습니다.
 */
const ABOUT_DESCRIPTION =
    'Software Engineer로 일하는 Seobisback입니다. 더 나은 서비스를 만드는 방법을 고민하고, ' +
    '공부하거나 조사한 내용을 여기에 남깁니다.';

/* ------------------------------------------------------------------ *
 * §6.13b-2. 정규화 — 실측으로 확인된 잔재 6종만 걷어냅니다
 * ------------------------------------------------------------------ */

/** N1 — `[https://…]` 와 맨 URL (2편). `[url]` 은 마크다운 링크가 아니라 파서를 통과합니다 */
const BRACKETED_URL = /\[\s*https?:\/\/[^\]]*\]/g;
const BARE_URL = /https?:\/\/\S+/g;

/** N2 — **선두** 리스트 마커(20편). 문장 중간의 ` - ` 는 건드리지 않습니다 */
const LEADING_LIST_MARKER = /^(?:[-*+•]+\s+)+/;

/**
 * N3 — 이모지 · U+FFFD(2편).
 * `Extended_Pictographic` 만으로는 `©®™` 까지 지워 본문을 상하게 하므로 제외합니다.
 *
 * 🔴 `\u{200D}`(ZWJ)까지 포함합니다. 👨‍👩‍👧 같은 합자는 **이모지 + ZWJ + 이모지**로
 *    이뤄져 있어, 이모지만 지우면 폭 0 짜리 접합자가 문자열 한가운데 남습니다.
 *    눈에는 보이지 않지만 `text.length` 에는 들어가고 검색 결과 스니펫에도
 *    따라갑니다. 현재 41편에는 해당 글이 없으므로 이 줄은 **다음 글을 위한 것**입니다.
 */
const PICTOGRAPH = /[\p{Extended_Pictographic}\u{FE0F}\u{20E3}\u{200D}]/gu;
const KEEP_PICTOGRAPH = /[©®™]/;
const REPLACEMENT_CHAR = /�/g;

/**
 * N4 — 모든 공백류를 보통 공백 1칸으로.
 * `\s` 가 NBSP 를 포함한다는 점에 **의존하지 않고** 명시적으로 적습니다(§6.13b-2).
 * 눈에 보이지 않는 문자는 리터럴로 두지 않습니다 — 사람도 lint 도 읽지 못합니다.
 */
const ANY_SPACE = /[\s\u00A0\u200B\uFEFF]+/g;

/** N5 — 종결 부호 바로 뒤의 말줄임표(1편). `다.…` → `다.` */
const ELLIPSIS_AFTER_STOP = /([.!?])\s*(?:…|\.{3})+/g;

/** N6 — 앞뒤에 매달린 구분자(1편). N1 이 URL 을 걷어내면 `… (링크) -` 가 남습니다 */
const DANGLING_HEAD = /^[-–—·:,;([{\s]+/;
const DANGLING_TAIL = /[-–—·:,;([{\s]+$/;

export function normalizeExcerpt(raw: string): string {
    let text = raw ?? '';

    /* N1 */
    text = text.replace(BRACKETED_URL, ' ').replace(BARE_URL, ' ');

    /* N3 */
    text = text
        .replace(PICTOGRAPH, match => (KEEP_PICTOGRAPH.test(match) ? match : ''))
        .replace(REPLACEMENT_CHAR, '');

    /* N4 — 선두 마커 판정이 개행에 걸리지 않도록 공백을 먼저 접습니다 */
    text = text.replace(ANY_SPACE, ' ').trim();

    /* N2 */
    text = text.replace(LEADING_LIST_MARKER, '');

    /* N5 */
    text = text.replace(ELLIPSIS_AFTER_STOP, '$1');

    /* N6 */
    text = text.replace(DANGLING_HEAD, '').replace(DANGLING_TAIL, '');

    return text.replace(ANY_SPACE, ' ').trim();
}

/* ------------------------------------------------------------------ *
 * §6.13b-3 길이 · §6.13b-4 말줄임
 * ------------------------------------------------------------------ */

/** 상한(하드). 넘는 부분은 어느 검색 결과에서도 읽히지 않고 잘림만 만듭니다 */
export const DESCRIPTION_MAX_LENGTH = 120;

/** 바닥값. 이 아래면 `excerpt` 를 버리고 폴백 사다리로 내려갑니다(§6.13b-5) */
export const DESCRIPTION_MIN_LENGTH = 20;

/** T1 이 성립하려면 남는 길이가 이만큼은 돼야 합니다(§6.13b-4) */
const SENTENCE_CUT_MIN_LENGTH = 40;

/**
 * T1 → T2. **T1 에서는 `…` 를 붙이지 않습니다** — 마침표가 이미 완결을 말하고,
 * 거기 `…` 를 더하면 `지닌다.…` 가 됩니다. `…` 는 "문장 중간에서 끊었다"는
 * 신호로만 씁니다(§6.13b-4).
 */
export function truncateDescription(text: string, limit = DESCRIPTION_MAX_LENGTH): string {
    if (text.length <= limit) {
        return text;
    }

    /* T1 — 상한 이내의 마지막 문장 경계 */
    let sentenceEnd = -1;

    for (let index = 0; index < limit && index < text.length; index += 1) {
        const isTerminator = text[index] === '.' || text[index] === '!' || text[index] === '?';
        const next = text[index + 1];

        if (isTerminator && (next === undefined || next === ' ')) {
            sentenceEnd = index + 1;
        }
    }

    if (sentenceEnd >= SENTENCE_CUT_MIN_LENGTH) {
        return text.slice(0, sentenceEnd);
    }

    /*
     * T2 — 어절 경계.
     * 상한까지 자른 뒤 마지막 공백에서 끊습니다. 공백 한 칸이 `…` 자리로 바뀌므로
     * 결과는 상한을 넘지 않습니다. 공백이 없으면(한 어절이 상한보다 긴 경우)만
     * 한 칸을 미리 빼 둡니다.
     */
    const window = text.slice(0, limit);
    const lastSpace = window.lastIndexOf(' ');
    const cut = lastSpace > 0 ? window.slice(0, lastSpace) : text.slice(0, limit - 1);

    return `${cut.replace(DANGLING_TAIL, '')}…`;
}

/* ------------------------------------------------------------------ *
 * §6.13b-5. 폴백 사다리
 * ------------------------------------------------------------------ */

/** L2 — 태그 최대 3개. `에` 는 받침과 무관해 어떤 태그명 뒤에도 안전합니다(§3.7) */
function buildTagFallback(post: PostMetadata): string | null {
    const tags = post.keywords.slice(0, 3);

    return tags.length > 0 ? `${tags.join(' · ')}에 대해 정리한 글입니다.` : null;
}

export type DescriptionSource = 'L1' | 'L2' | 'L3';

export interface PostDescription {
    slug: string;
    text: string;
    source: DescriptionSource;
    /** §6.13b-6 의 시리즈 접미가 붙었는가 */
    hasSeriesSuffix: boolean;
}

function buildOne(post: PostMetadata, limit: number): { text: string; source: DescriptionSource } {
    const normalized = normalizeExcerpt(post.excerpt);

    if (normalized.length >= DESCRIPTION_MIN_LENGTH) {
        return { text: truncateDescription(normalized, limit), source: 'L1' };
    }

    const tagFallback = buildTagFallback(post);

    if (tagFallback) {
        return { text: truncateDescription(tagFallback, limit), source: 'L2' };
    }

    return { text: truncateDescription(HOME_DESCRIPTION, limit), source: 'L3' };
}

/**
 * §6.13b-6. 완성된 description 이 다른 글과 **글자 단위로 같으면** 검색엔진에
 * "같은 페이지"라고 신고하는 셈입니다. `series` 가 있는 글에 한해 문미에
 * ` (<index>/<total>편)` 을 붙여 구분하되, **접미를 먼저 확보하고** 남은 자리에
 * 본문을 맞춥니다 — 붙인 뒤 자르면 접미가 잘려 나갑니다.
 *
 * 🔴 `series` 가 없는데 겹치면 규칙으로 덮지 않고 **던집니다.** 그건 카피 문제가
 *    아니라 두 글이 실제로 같은 내용이라는 뜻이고, 조용히 넘기면 두 URL 이 같은
 *    설명을 달고 배포됩니다.
 */
export function buildPostDescriptions(posts: readonly PostMetadata[]): PostDescription[] {
    const first = posts.map(post => ({
        post,
        ...buildOne(post, DESCRIPTION_MAX_LENGTH),
    }));

    const duplicated = new Set(
        first
            .map(entry => entry.text)
            .filter((text, index, all) => all.indexOf(text) !== index),
    );

    return first.map(entry => {
        if (!duplicated.has(entry.text)) {
            return {
                slug: entry.post.slug,
                text: entry.text,
                source: entry.source,
                hasSeriesSuffix: false,
            };
        }

        const { series } = entry.post;

        if (!series) {
            throw new Error(
                `[prerender] description 이 겹치는데 시리즈가 아닙니다: "${entry.post.slug}"\n` +
                    `   "${entry.text}"\n` +
                    '   → WRITING_GUIDE §6.13b-6: 규칙으로 해결하지 말고 보고하십시오.\n' +
                    '     두 글이 실제로 같은 내용이라는 뜻입니다.',
            );
        }

        const suffix = ` (${series.index}/${series.total}편)`;
        const { text } = buildOne(entry.post, DESCRIPTION_MAX_LENGTH - suffix.length);

        return {
            slug: entry.post.slug,
            text: `${text}${suffix}`,
            source: entry.source,
            hasSeriesSuffix: true,
        };
    });
}

/* ------------------------------------------------------------------ *
 * §6.13c. 라우트별 description — 숫자는 전부 데이터에서 계산합니다
 * ------------------------------------------------------------------ */

/**
 * 🔴 문자열에 숫자를 박지 마세요. 글 한 편만 늘어도 74개 HTML 이 전부 거짓말을
 *    시작합니다(§6.13 각주).
 */
export const ROUTE_DESCRIPTIONS = {
    home: HOME_DESCRIPTION,
    posts: `프론트엔드와 웹 기술에 대해 쓴 글 ${POSTS.length}편을 모았습니다.`,
    about: ABOUT_DESCRIPTION,
    /*
     * 🔴 `<N>` 은 **인덱스에 오르는 태그 수**(`count>=2` 27종)입니다.
     *    `tags-data.json.length`(62)가 아닙니다 — 화면이 27종만 보여주는데
     *    설명이 62개라고 말하게 됩니다(§6.13c-1).
     *    프리렌더 문턱(scripts/prerender/targets.ts)과는 **다른 값**입니다.
     *    이 문장이 말하는 것은 `/tags` 화면에 실제로 그려지는 줄 수입니다.
     */
    tags: `이 블로그가 다루는 주제를 태그 ${INDEXED_TAGS.length}개로 모았습니다.`,
    archive: `${earliestPostYear()}년부터 쓴 글 ${POSTS.length}편을 연도별로 모았습니다.`,
    works: `만들어 온 작업 ${WORKS.length}건을 연도별로 모았습니다.`,
} as const;

function earliestPostYear(): string {
    return POSTS.reduce(
        (earliest, post) => (post.date < earliest ? post.date : earliest),
        POSTS[0].date,
    ).slice(0, 4);
}

/**
 * §6.13c-3. `<태그> 관련 글 <N>편을 모았습니다. <연도>년에 쓴 기록입니다.`
 *
 * - `<태그>` 는 `tags-data.json` 의 `name`(대표 표기) 그대로입니다 — `Vision Pro` 의
 *   공백·대소문자를 건드리지 않습니다(§6.8).
 * - 변수 뒤에 `을/를`·`이/가` 를 두지 않았습니다. `<태그> 관련` 은 다음이 공백+명사,
 *   `<N>편을` 의 조사는 변수가 아니라 고정된 `편` 에 붙습니다(§3.7).
 * - 여러 해면 `2022–2024`(엔 대시 U+2013). 범위에 붙임표를 쓰지 않습니다(§3.2).
 */
export function buildTagDescription(tag: TagSummary): string {
    const years = getPostsByTagSlug(tag.slug).map(post => post.date.slice(0, 4));
    const earliest = years.reduce((min, year) => (year < min ? year : min), years[0]);
    const latest = years.reduce((max, year) => (year > max ? year : max), years[0]);
    const span = earliest === latest ? earliest : `${earliest}–${latest}`;

    return `${tag.name} 관련 글 ${tag.count}편을 모았습니다. ${span}년에 쓴 기록입니다.`;
}
