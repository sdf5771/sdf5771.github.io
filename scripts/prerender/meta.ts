/**
 * per-URL `<head>` 메타 블록 생성 (product.md §14-5 R-4 · R-4a · R-7).
 *
 * 이 블록이 `index.html` 의 `<!-- prerender:meta -->` 자리에 들어가고,
 * 프리렌더는 **이 블록만 갈아 끼워** 74개 HTML 을 만듭니다.
 */

import { HOME_TITLE, SITE_ORIGIN, WORDMARK_TEXT } from '../../src/constants/site';
import type { PrerenderTarget } from './targets';

/** 프리렌더가 라우트별 블록을 찾아 갈아 끼우는 자리 표시. `index.html` 에 있습니다 */
export const META_PLACEHOLDER = '<!-- prerender:meta -->';

const META_START = '<!-- prerender:meta:start -->';
const META_END = '<!-- prerender:meta:end -->';

/**
 * OG 카드. 41편 공통 1장입니다 — 글별 카드는 v2 로 미뤘습니다(§14-1 Q-S2).
 *
 * 🔴 `og:image` 는 반드시 **절대 URL** 입니다. 스크레이퍼(페이스북·슬랙·카카오)는
 *    HTML 을 내려받아 서버 밖에서 파싱하므로 `/og/default.png` 같은 상대 경로를
 *    해석하지 못합니다. 이전에 `/favicon.ico` 로 두어 미리보기가 비던 것이 이
 *    문제였습니다(handoff-step8-og.md §2-3).
 *    width/height 를 함께 주면 이미지를 다 받기 전에 자리를 잡아 더 빨리 뜹니다.
 */
const OG_IMAGE_URL = `${SITE_ORIGIN}/og/default.png`;

/**
 * 카드 이미지의 대체 텍스트 — **이미지 안의 글자를 그대로** 담습니다
 * (WRITING_GUIDE §7.1 · WCAG 1.1.1). 워드마크가 빠진 `Software Engineer` 는 오답이라
 * 홈 제목 상수를 그대로 씁니다. 카드가 전 페이지 공통 1장이므로 값도 공통입니다.
 */
const OG_IMAGE_ALT = HOME_TITLE;

/** 속성값에 넣기 전 이스케이프. **정규화가 모두 끝난 뒤**여야 합니다(§6.13b-2) */
export function escapeHtmlAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** 정본 절대 URL. 후행 슬래시는 홈에만 붙습니다(R-12 — 표기를 한 형태로 통일) */
export function toAbsoluteUrl(path: string): string {
    return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

/**
 * 🔴 Open Graph 는 `property=` 입니다 — `name=` 이 아닙니다(OGP 는 RDFa 기반).
 *    규격을 엄격히 보는 스크레이퍼(페이스북·링크드인·카카오)는 `name="og:*"` 를
 *    읽지 않고 `<title>` 로 폴백합니다. 아래 문구를 손보면서 `name=` 으로 바꾸면
 *    바꾼 문구가 공유 카드에 끝내 나타나지 않습니다.
 *    `twitter:*` 는 반대로 `name=` 이 맞습니다(트위터 카드는 RDFa 가 아님).
 */
export function renderMetaBlock(target: PrerenderTarget): string {
    /*
     * 🔴 URL 도 **이스케이프해서** 넣습니다. 지금 slug 가 전부 `[a-z0-9-]` 라
     *    결과가 같지만, 그것을 보장하는 것은 코드가 아니라 **데이터의 우연**입니다 —
     *    `toPostSlug` 는 소문자화와 연속 하이픈 정리만 하고 `&`·`"` 를 걷어내지
     *    않으므로, `Foo & Bar.md` 한 편이면 `href="…/posts/foo & bar"` 가 나옵니다.
     *    sitemap 의 `<loc>`(plugin.ts)은 이미 이스케이프하고 있어 표기도 갈립니다.
     */
    const url = escapeHtmlAttribute(toAbsoluteUrl(target.path));
    const title = escapeHtmlAttribute(target.title);
    const description = escapeHtmlAttribute(target.description);

    const lines = [
        `<meta name="description" content="${description}" />`,
        /*
         * 🔴 R-4a — canonical 은 **언제나 자기 자신**입니다. 두 태그 페이지가 같은
         *    목록을 보여준다고 해서 한쪽을 다른 쪽으로 접는 교차 canonical 을 넣지
         *    마세요. 그 태그만 달린 글이 한 편 생기는 순간 거짓이 되고, 거짓이 된
         *    시점을 알 수단이 없습니다(Search Console 미등록).
         */
        `<link rel="canonical" href="${url}" />`,
        `<meta property="og:title" content="${title}" />`,
        `<meta property="og:description" content="${description}" />`,
        `<meta property="og:image" content="${OG_IMAGE_URL}" />`,
        '<meta property="og:image:width" content="1200" />',
        '<meta property="og:image:height" content="630" />',
        `<meta property="og:image:alt" content="${escapeHtmlAttribute(OG_IMAGE_ALT)}" />`,
        `<meta property="og:url" content="${url}" />`,
        `<meta property="og:site_name" content="${WORDMARK_TEXT}" />`,
        `<meta property="og:type" content="${target.ogType}" />`,
        '<meta property="og:locale" content="ko_KR" />',
        /*
         * summary 는 정사각 썸네일이라 1200×630 카드의 좌우가 잘립니다.
         * summary_large_image 여야 1.91:1 이 그대로 적용됩니다.
         */
        '<meta name="twitter:card" content="summary_large_image" />',
        `<meta name="twitter:title" content="${title}" />`,
        `<meta name="twitter:description" content="${description}" />`,
        `<meta name="twitter:image" content="${OG_IMAGE_URL}" />`,
        /* R-7 — handoff-step8 §3-3 이 남긴 미적용 후속. 값은 og:image:alt 와 같습니다 */
        `<meta name="twitter:image:alt" content="${escapeHtmlAttribute(OG_IMAGE_ALT)}" />`,
        `<meta name="twitter:url" content="${url}" />`,
        `<title>${escapeHtmlAttribute(target.title)}</title>`,
    ];

    return [META_START, ...lines.map(line => `    ${line}`), `    ${META_END}`].join('\n');
}

/** `index.html` 의 자리 표시를 홈 블록으로 채웁니다(dev·build 공통) */
export function fillPlaceholder(html: string, homeTarget: PrerenderTarget): string {
    return html.replace(META_PLACEHOLDER, renderMetaBlock(homeTarget));
}

/**
 * 이미 채워진 HTML 의 메타 블록을 다른 라우트의 것으로 갈아 끼웁니다.
 * 블록을 찾지 못하면 **던집니다** — 조용히 홈 메타를 그대로 둔 74개 HTML 이
 * 배포되는 것이 이 작업이 고치려는 바로 그 증상입니다.
 */
export function replaceMetaBlock(html: string, target: PrerenderTarget): string {
    const start = html.indexOf(META_START);
    const end = html.indexOf(META_END);

    if (start === -1 || end === -1) {
        throw new Error(
            `[prerender] dist/index.html 에서 메타 블록(${META_START})을 찾지 못했습니다.\n` +
                `   → index.html 의 ${META_PLACEHOLDER} 자리 표시가 지워졌는지 확인하세요.`,
        );
    }

    return (
        html.slice(0, start) +
        renderMetaBlock(target).trimStart() +
        html.slice(end + META_END.length)
    );
}
