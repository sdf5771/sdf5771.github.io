import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { SITE_ORIGIN } from '../../src/constants/site';
import {
    DESCRIPTION_MAX_LENGTH,
    DESCRIPTION_MIN_LENGTH,
} from './description';
import {
    META_PLACEHOLDER,
    escapeHtmlAttribute,
    fillPlaceholder,
    replaceMetaBlock,
    toAbsoluteUrl,
} from './meta';
import { collectPrerenderTargets, type PrerenderTarget } from './targets';

/**
 * 🔴 프리렌더 · sitemap · robots — `dist/` 에 라우트별 HTML 을 굽습니다.
 * 명세: agent-log/product.md §14 (요구사항 R-1 ~ R-16 · R-4a)
 *
 * 무엇을 고치는가
 * ---------------
 * 이 사이트는 SPA 이고 GitHub Pages 는 정적 파일 서버입니다. `dist/` 에 HTML 이
 * `index.html` · `404.html` 둘뿐이라, **글 41편을 포함한 모든 딥링크가
 * `HTTP 404` + `noindex` 로 서빙되고 있었습니다.** 사람에게는 폴백 스크립트 덕에
 * 정상으로 보이지만 크롤러에게는 "없는 페이지이고 색인하지 말라"는 뜻이고,
 * 어떤 글을 공유해도 언펄러는 `og:url` 이 가리키는 **홈 카드**를 보여줬습니다.
 *
 * 무엇을 굽는가 — **셸 + per-URL `<head>`**
 * -----------------------------------------
 * 각 HTML 은 `dist/index.html` 과 같은 셸이고 `<head>` 의 메타 블록만 그 URL 의
 * 값으로 바뀝니다. **본문(`#root`)은 비어 있고 클라이언트가 그립니다.**
 *
 *  - 이것으로 §14-4 의 M1~M4 가 전부 충족됩니다 — 링크가 200 으로 열리고,
 *    그 URL 고유의 미리보기가 뜨고, 크롤러가 정본을 압니다.
 *  - React 를 Node 에서 렌더(SSR)하지 않는 이유: ①글 본문은 런타임에
 *    `/_posts/*.md` 를 fetch 해 그리므로 **어차피 빌드 시점에 본문이 없습니다**
 *    ②같은 날짜 글이 25/41편이라 서버·클라이언트 정렬이 한 톨만 어긋나도 목록이
 *    재배열됩니다(§14-8 리스크 중). 본문을 굽지 않으면 **하이드레이션 불일치가
 *    원리적으로 발생하지 않습니다**(R-10).
 *  - 런타임 번들은 1바이트도 늘지 않습니다(R-16) — 이 코드는 빌드에서만 돕니다.
 *
 * 왜 파일을 두 벌 쓰는가 (`/posts/x.html` + `/posts/x/index.html`)
 * ---------------------------------------------------------------
 * GitHub Pages 가 `/posts/x` 요청에 `x.html` 을 주는지, `x/` 로 301 한 뒤
 * `x/index.html` 을 주는지 **확인되지 않았습니다**(R-13 `[확인필요]`).
 * 로컬에서는 재현되지 않습니다(lessons L16·L17). 어느 규칙이 먼저 걸리든 200 이
 * 되도록 두 벌을 둡니다 — HTML 하나가 3KB 대라 비용은 무시할 만하고, 실측 뒤
 * 한쪽을 끄면 됩니다. canonical·sitemap 은 **후행 슬래시 없는 한 형태**로
 * 통일돼 있으므로 표기가 갈리지는 않습니다.
 */

const SITEMAP_FILE = 'sitemap.xml';
const ROBOTS_FILE = 'robots.txt';

/** 프리렌더 산출물이 아닌 것 — 여기에만 `noindex` 가 있어야 합니다(R-9) */
const FALLBACK_FILE = '404.html';

const NOINDEX_PATTERN = /<meta[^>]+name=["']robots["'][^>]*noindex/i;

/**
 * 🔴 canonical·og:url 을 **찾는 유일한 패턴**입니다. 검사 세 곳이 이것을 공유합니다:
 *    74개에는 「정확히 하나 있을 것」, `404.html` 에는 「하나도 없을 것」.
 *    같은 패턴으로 있음과 없음을 함께 단언하므로, 패턴이 고장 나면 404 쪽 단언이
 *    먼저 터집니다 — 검사기가 스스로를 증명합니다.
 *    `/g` 를 상수에 박지 않는 이유: `lastIndex` 가 호출 사이에 남아 두 번째
 *    호출부터 결과가 달라집니다. 필요할 때마다 새로 만듭니다.
 */
const CANONICAL_SOURCE = '<link rel="canonical" href="([^"]*)"';
const OG_URL_SOURCE = '<meta property="og:url" content="([^"]*)"';

function findAll(html: string, source: string): string[] {
    return [...html.matchAll(new RegExp(source, 'g'))].map(match => match[1]);
}

/**
 * 🔴 파싱한 속성값을 원문으로 되돌립니다 — `escapeHtmlAttribute` 의 **역함수**입니다.
 *    검사가 생성기를 다시 부르는 대신 **되짚기 때문에** 둘이 같이 틀어질 수 없습니다.
 *    (`&amp;` 를 마지막에 푸는 순서가 중요합니다. 먼저 풀면 `&amp;lt;` 가 `<` 가 됩니다.)
 */
function decodeHtmlAttribute(value: string): string {
    return value
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
}

/**
 * 🔴 절대 URL 에서 경로를 **되꺼냅니다** — `meta.ts` 의 `toAbsoluteUrl` 의 역함수입니다.
 *    자리를 벗어난 값이면 `null`.
 *
 * 🔴 **여기서 `toAbsoluteUrl` 을 부르지 마세요.** 그러면 합격 기준이 구현과 같은
 *    소스에서 나와 검사가 독립 오라클이기를 그만둡니다 — `toAbsoluteUrl` 이 전
 *    URL 을 홈으로 돌려주게 망가져도 기대값이 똑같이 홈이 되어 74개가 전부 홈
 *    canonical 을 단 채 통과합니다. 그것이 이 작업이 고치려던 라이브 증상 자체입니다.
 *    구성(construct)이 아니라 분해(decompose)로 적은 것도 같은 이유입니다 —
 *    한 줄짜리 중복처럼 보여서 "그냥 `toAbsoluteUrl` 을 쓰자"로 되돌려지지 않게.
 */
function toPathFromAbsolute(absolute: string): string | null {
    if (!absolute.startsWith(`${SITE_ORIGIN}/`)) {
        return null;
    }

    return absolute.slice(SITE_ORIGIN.length);
}

interface PlannedPage {
    target: PrerenderTarget;
    /** `outDir` 기준 상대 경로. 홈만 1개, 나머지는 두 벌(R-13) */
    files: string[];
    html: string;
}

/**
 * 쓰지 않고 **계획만** 세웁니다.
 *
 * 🔴 계획과 쓰기를 나눈 이유: 예전에는 148개 파일을 다 쓴 **뒤에** 검사가 돌아,
 *    검사가 터져도 `dist/` 에 검증되지 않은 산출물이 그대로 남았습니다. 그 상태로
 *    `gh-pages -d dist` 를 한 번만 돌리면 그대로 배포됩니다. 메모리만 보면 되는
 *    검사는 이제 전부 쓰기 전에 돕니다.
 */
function planPage(target: PrerenderTarget, html: string): PlannedPage {
    /* 홈은 vite 가 이미 쓴 dist/index.html 이 그대로 정답입니다 */
    if (target.path === '/') {
        return { target, files: ['index.html'], html };
    }

    return {
        target,
        files: [`${target.path.slice(1)}.html`, path.join(target.path.slice(1), 'index.html')],
        html,
    };
}

function commitPage(outDir: string, page: PlannedPage): void {
    /* 홈은 vite 가 쓴 것을 그대로 둡니다 — 덮어쓰면 자기 자신을 다시 쓰는 셈입니다 */
    if (page.target.path === '/') {
        return;
    }

    for (const relative of page.files) {
        const full = path.join(outDir, relative);
        mkdirSync(path.dirname(full), { recursive: true });
        writeFileSync(full, page.html);
    }
}

function renderSitemap(targets: readonly PrerenderTarget[]): string {
    const entries = targets
        .map(
            target =>
                '    <url>\n' +
                `        <loc>${escapeHtmlAttribute(toAbsoluteUrl(target.path))}</loc>\n` +
                `        <lastmod>${target.lastmod}</lastmod>\n` +
                '    </url>',
        )
        .join('\n');

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        `${entries}\n` +
        '</urlset>\n'
    );
}

/**
 * robots.txt — 사용자 결정 #26.
 *
 * 🔴 **일반 검색 색인은 그대로 허용합니다**(Googlebot·Bingbot). 이 사이트의 목적
 *    1순위가 포트폴리오이고 findability 기준이 "내 이름으로 검색했을 때 나오는가"
 *    라, 검색 크롤러를 막으면 작업 자체의 목적과 반대가 됩니다.
 *    막는 것은 **학습 데이터 수집 크롤러**뿐이며, 사용자가 지목한 4종입니다.
 *    (`Google-Extended` 는 색인이 아니라 Gemini 학습 사용만 끕니다 —
 *    Googlebot 과 별개의 토큰이라 검색 노출에 영향이 없습니다.)
 */
function renderRobots(): string {
    return [
        '# 검색 색인은 허용합니다 — 이 사이트의 목적이 findability 입니다',
        'User-agent: *',
        'Allow: /',
        '',
        '# AI 학습 데이터 수집 크롤러는 차단합니다 (사용자 결정 #26)',
        'User-agent: GPTBot',
        'Disallow: /',
        '',
        'User-agent: CCBot',
        'Disallow: /',
        '',
        'User-agent: ClaudeBot',
        'Disallow: /',
        '',
        '# 색인이 아니라 Gemini 학습 사용만 끕니다 (Googlebot 과 별개 토큰)',
        'User-agent: Google-Extended',
        'Disallow: /',
        '',
        `Sitemap: ${SITE_ORIGIN}/${SITEMAP_FILE}`,
        '',
    ].join('\n');
}

/* ------------------------------------------------------------------ *
 * 빌드가 스스로 막는 것들 — 위반이면 빌드를 세웁니다
 * ------------------------------------------------------------------ */

/**
 * 🔴 R-9. 프리렌더 산출물의 `noindex` 허용치는 **예외 없이 0** 이고,
 *    `404.html` 에는 **반드시 있어야** 합니다.
 *
 * 프리렌더가 `index.html` 을 복사하는 구조라 404 생성기와 형제 자리입니다 —
 * 실수가 나기 가장 쉽고, 새면 조용히 배포된 뒤 몇 주 지나서야 드러납니다.
 * **예외 목록을 만들지 마세요.** "이 12개는 되고 나머지는 안 됨" 이 되는 순간
 * 손으로 유지하는 목록이 생기고, 틀렸을 때 이 검사가 아무 말도 하지 못합니다.
 */
function assertNoindexIsolation(outDir: string, pages: readonly PlannedPage[]): void {
    const leaked = pages
        .filter(page => NOINDEX_PATTERN.test(page.html))
        .flatMap(page => page.files);

    if (leaked.length > 0) {
        throw new Error(
            `[prerender] 프리렌더 산출물에 noindex 가 있습니다 (${leaked.length}건): ` +
                `${leaked.slice(0, 5).join(', ')}\n` +
                '   → 이 파일들은 색인되지 않습니다. 74개가 전부 새면 작업 전체가 무효입니다.',
        );
    }

    const fallback = readFileSync(path.join(outDir, FALLBACK_FILE), 'utf8');

    if (!NOINDEX_PATTERN.test(fallback)) {
        throw new Error(
            `[prerender] dist/${FALLBACK_FILE} 에 noindex 가 없습니다.\n` +
                '   → 404 응답 본문은 색인되면 안 됩니다(handoff-step5 §4-7).',
        );
    }

    /*
     * 🔴 그리고 **canonical 은 없어야 합니다.**
     *
     * `404.html` 은 `dist/index.html` 의 복사본이라 홈 canonical 이 딸려 오기
     * 쉽습니다. 그러면 한 문서가 *"색인하지 마라 + 내 정본은 홈"* 을 동시에
     * 말하고, 구글은 이 병용을 충돌로 보아 **`noindex` 를 홈에 전파**할 수
     * 있습니다. 이 파일은 프리렌더되지 않은 **모든** 경로의 응답 본문이라 그
     * 신호가 한 번이 아니라 계속 나갑니다.
     *
     * 지우는 쪽은 `scripts/spa-fallback-plugin.ts` 이고 검사는 여기입니다 —
     * 만드는 코드와 검사하는 코드를 일부러 다른 파일·다른 플러그인에 두었습니다.
     * 74개의 「반드시 있을 것」과 404 의 「반드시 없을 것」이 `CANONICAL_SOURCE`
     * 하나를 공유하므로, 패턴이 고장 나면 둘 중 하나가 반드시 터집니다.
     */
    const fallbackCanonicals = findAll(fallback, CANONICAL_SOURCE);

    if (fallbackCanonicals.length > 0) {
        throw new Error(
            `[prerender] dist/${FALLBACK_FILE} 에 canonical 이 있습니다 ` +
                `(${fallbackCanonicals.length}건): ${fallbackCanonicals.join(', ')}\n` +
                '   → noindex 와 canonical 을 함께 선언하면 구글이 충돌로 보고\n' +
                '     noindex 를 canonical 대상(=홈)에 전파할 수 있습니다.\n' +
                '     spa-fallback-plugin.ts 의 CANONICAL_LINE 이 헛돌았는지 확인하세요.',
        );
    }
}

/**
 * 🔴 R-4 · R-4a. 74개가 각자 **자기 URL** 을 말해야 합니다.
 * 하나라도 홈으로 남으면 언펄러가 홈 카드를 보여주고 검색엔진이 그 페이지를
 * 홈의 중복으로 접습니다 — 이 작업이 고치려는 증상 그 자체입니다.
 *
 * 🔴 **기대값을 `toAbsoluteUrl` 로 만들지 않습니다.**
 *
 * 예전에는 `const expected = toAbsoluteUrl(page.target.path)` 로 기대값을
 * 세웠습니다. 그러면 이 검사가 잡는 것은 「메타 블록 ↔ `toAbsoluteUrl` 불일치」
 * 뿐이고, **`toAbsoluteUrl` 자체가 틀어지는 경우 = 라이브에서 실제로 일어났던
 * 그 증상**은 그대로 통과합니다. 실제로 그 함수를 「전 URL 홈 반환」으로 바꿔도
 * 빌드가 `exit 0` 에 `✅ canonical/og:url 자기참조` 를 찍으면서 74개 전부
 * `og:url=canonical=홈` 인 채로 배포 가능했습니다. 합격 기준이 구현과 같은
 * 소스에서 나오면 독립 오라클이 아닙니다.
 *
 * 그래서 두 층으로 봅니다. 둘은 **서로 다른 것이 망가졌을 때** 웁니다.
 *
 *  ① **되짚기** — HTML 에서 URL 을 꺼내 origin 을 떼고, 남은 것이 그 페이지의
 *    `target.path` 와 글자 그대로 같은지. 생성기를 부르지 않으므로 생성기가
 *    망가지면 여기서 걸립니다.
 *  ② **서로 다름** — 74개의 canonical 이 74개 모두 달라야 합니다. `SITE_ORIGIN`
 *    자체가 흔들려 ①의 origin 판정까지 함께 틀어지는 날에도 이 층은 남습니다.
 *    "전부 한 값으로 접혔다" 는 것이 우리가 실제로 겪은 사고의 모양입니다.
 */
function assertSelfReferentialUrls(pages: readonly PlannedPage[]): void {
    const problems: string[] = [];

    const check = (page: PlannedPage, label: string, found: string[]): string | null => {
        if (found.length !== 1) {
            return `${page.files[0]} — ${label} ${found.length}개 (정확히 1개여야 합니다)`;
        }

        const actual = toPathFromAbsolute(decodeHtmlAttribute(found[0]));

        if (actual !== page.target.path) {
            return (
                `${page.files[0]} — ${label} 이 "${found[0]}"\n` +
                `        가리키는 경로 "${actual ?? '(사이트 밖)'}" ≠ 자기 경로 "${page.target.path}"`
            );
        }

        return null;
    };

    for (const page of pages) {
        const canonicals = findAll(page.html, CANONICAL_SOURCE);

        problems.push(
            ...[
                check(page, 'og:url', findAll(page.html, OG_URL_SOURCE)),
                check(page, 'canonical', canonicals),
            ].filter((line): line is string => line !== null),
        );

        const titles = page.html.match(/<title>/g) ?? [];

        if (titles.length !== 1) {
            problems.push(`${page.files[0]} — <title> ${titles.length}개`);
        }
    }

    if (problems.length > 0) {
        throw new Error(
            `[prerender] 자기참조 URL 위반 (${problems.length}건):\n` +
                `${problems.slice(0, 5).map(line => `      ${line}`).join('\n')}\n` +
                '   → canonical·og:url 은 예외 없이 그 페이지 자신의 URL 이어야 합니다(R-4a).',
        );
    }

    /* ② 74개가 74개 다른 URL 을 말하는가 — 「전부 홈으로 접힘」의 직접 관측 */
    const canonicals = pages.map(page => findAll(page.html, CANONICAL_SOURCE)[0]);
    const distinct = new Set(canonicals);

    if (distinct.size !== pages.length) {
        const repeated = [...new Set(canonicals.filter((url, i) => canonicals.indexOf(url) !== i))];

        throw new Error(
            `[prerender] canonical 이 겹칩니다 — ${pages.length}개 페이지가 ` +
                `${distinct.size}개 URL 만 말하고 있습니다.\n` +
                `${repeated.slice(0, 5).map(url => `      "${url}"`).join('\n')}\n` +
                '   → 서로 다른 URL 이 한 값으로 접혔습니다. 절대 URL 생성이\n' +
                '     경로를 잃어버렸는지(meta.ts toAbsoluteUrl) 확인하세요.',
        );
    }
}

/**
 * 🔴 두 벌 발행(R-13)의 파일명 충돌 — **조용히 덮어쓰는 것을 막습니다.**
 *
 * `/posts` 는 `posts.html` 과 `posts/index.html` 을 씁니다. 그런데 slug 가
 * `index` 인 대상이 생기면 `/posts/index` 가 `posts/index.html` 을 써서
 * **`/posts` 의 중첩본을 덮습니다.** 배열 순서상 나중 것이 이기고, 다른 검사는
 * 전부 **메모리의 html** 을 보므로 아무 말도 하지 않습니다 — 디스크에서만
 * 벌어지는 일입니다.
 *
 * 지금 147경로에 중복은 0건입니다. 그래도 두는 이유는 **작업 slug 가 날짜 접두
 * 없는 자유 형식**이라(`decisions.md #19`) `public/_works/index.md` 파일 하나로
 * 성립하기 때문입니다. 데이터가 우연히 안전한 것을 코드의 보장으로 착각하지 않습니다.
 */
function assertUniqueFiles(pages: readonly PlannedPage[]): void {
    const owner = new Map<string, string>();
    const collisions: string[] = [];

    for (const page of pages) {
        for (const file of page.files) {
            const previous = owner.get(file);

            if (previous) {
                collisions.push(`${file} — ${previous} 와 ${page.target.path} 가 같은 파일`);
            } else {
                owner.set(file, page.target.path);
            }
        }
    }

    if (collisions.length > 0) {
        throw new Error(
            `[prerender] 출력 파일명이 겹칩니다 (${collisions.length}건):\n` +
                `${collisions.slice(0, 5).map(line => `      ${line}`).join('\n')}\n` +
                '   → 나중 것이 앞의 것을 조용히 덮어씁니다. slug 를 바꾸거나\n' +
                '     그 경로를 프리렌더 대상에서 빼세요.',
        );
    }
}

/**
 * 🔴 **sitemap 이 신고한 URL 마다 실제 파일이 있는가** — 디스크를 봅니다.
 *
 * §14-4 M3 의 「sitemap ↔ 프리렌더 개수 일치」를 지금까지 **빌드가 아니라 QA 가
 * 외부에서** 확인하고 있었습니다. 그래서 프리렌더 대상 배열에서 `/tags/ui` 하나를
 * 빼고 빌드하면 `exit 0` 에 `✅ sitemap.xml 74건` 을 찍으면서 **존재하지 않는 URL
 * 을 신고하는 sitemap 이 배포 가능**했습니다. §14-3 이 "없는 페이지 74개를
 * 신고하는 꼴" 이라며 작업 순서를 확정한 바로 그 사고의 축소판입니다.
 *
 * 🔴 R-2(단일 소스)와는 **다른 층입니다.** 단일 소스는 「두 목록이 갈리지 않음」을
 *    보장하지 「그 목록의 파일이 실제로 있음」을 보장하지 않습니다. 배열은 하나여도
 *    쓰는 단계에서 빠지면 그만입니다.
 *
 * 🔴 파일 이름 규칙(`x.html` + `x/index.html`)을 `planPage` 에서 가져오지 않고
 *    **여기에 다시 적습니다.** 발행한 쪽의 계산을 그대로 믿으면 이름을 잘못 지어
 *    엉뚱한 자리에 쓴 경우를 못 잡습니다 — 이 검사가 보는 것은 「우리가 썼다고
 *    생각하는 것」이 아니라 **배포될 바이트**입니다. 중복이 아니라 대조입니다.
 */
function assertPublishedFiles(
    outDir: string,
    expectedUrlCount: number,
    expectedFileCount: number,
): void {
    const sitemap = readFileSync(path.join(outDir, SITEMAP_FILE), 'utf8');
    const locs = findAll(sitemap, '<loc>([^<]*)</loc>').map(decodeHtmlAttribute);

    if (locs.length !== expectedUrlCount) {
        throw new Error(
            `[prerender] ${SITEMAP_FILE} 의 <loc> 이 ${locs.length}건입니다 ` +
                `(대상 ${expectedUrlCount}건).`,
        );
    }

    const missing: string[] = [];
    let seen = 0;

    for (const loc of locs) {
        const routePath = toPathFromAbsolute(loc);

        if (routePath === null) {
            missing.push(`${loc} — 사이트 밖 URL`);
            continue;
        }

        const files =
            routePath === '/'
                ? ['index.html']
                : [
                      `${routePath.slice(1)}.html`,
                      path.join(routePath.slice(1), 'index.html'),
                  ];

        seen += files.length;

        for (const file of files) {
            if (!existsSync(path.join(outDir, file))) {
                missing.push(`${loc} → dist/${file} 없음`);
            }
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `[prerender] sitemap 이 신고한 URL 에 파일이 없습니다 (${missing.length}건):\n` +
                `${missing.slice(0, 5).map(line => `      ${line}`).join('\n')}\n` +
                '   → 이대로 배포하면 sitemap 이 없는 페이지를 크롤러에 신고합니다(§14-3).',
        );
    }

    if (seen !== expectedFileCount) {
        throw new Error(
            `[prerender] sitemap 이 요구하는 HTML 은 ${seen}개인데 ` +
                `${expectedFileCount}개를 발행했습니다.\n` +
                '   → 두 수가 갈리면 어느 한쪽이 목록을 잃은 것입니다.',
        );
    }
}

/**
 * 🔴 WRITING_GUIDE §6.13b-7 「빌드가 검사할 것」 다섯 줄.
 * 74개 HTML 에 구워진 뒤에는 되돌리는 비용이 다릅니다.
 */
function assertDescriptions(targets: readonly PrerenderTarget[]): void {
    const problems: string[] = [];
    const seen = new Map<string, string>();

    for (const target of targets) {
        const text = target.description;

        if (text.length > DESCRIPTION_MAX_LENGTH) {
            problems.push(`${target.path} — ${text.length}자 (상한 ${DESCRIPTION_MAX_LENGTH})`);
        }

        if (text.length < DESCRIPTION_MIN_LENGTH) {
            problems.push(`${target.path} — ${text.length}자 (바닥값 ${DESCRIPTION_MIN_LENGTH})`);
        }

        if (/^[-*+•]/.test(text)) {
            problems.push(`${target.path} — 선두 리스트 마커`);
        }

        if (/https?:\/\//.test(text)) {
            problems.push(`${target.path} — URL 포함`);
        }

        const duplicate = seen.get(text);

        if (duplicate) {
            problems.push(`${target.path} — description 중복 (${duplicate} 와 같음)`);
        } else {
            seen.set(text, target.path);
        }
    }

    if (problems.length > 0) {
        throw new Error(
            `[prerender] description 규격 위반 (${problems.length}건):\n` +
                `${problems.slice(0, 8).map(line => `      ${line}`).join('\n')}\n` +
                '   → 규격은 docs/WRITING_GUIDE.md §6.13b · §6.13c 입니다.',
        );
    }
}

export default function prerenderPlugin(): Plugin {
    let config: ResolvedConfig;
    let targets: PrerenderTarget[] | null = null;

    const getTargets = (): PrerenderTarget[] => {
        targets ??= collectPrerenderTargets(new Date().toISOString().slice(0, 10));
        return targets;
    };

    return {
        name: 'prerender-seo',

        configResolved(resolved) {
            config = resolved;
        },

        /* dev·build 공통 — index.html 의 자리 표시를 홈 메타로 채웁니다 */
        transformIndexHtml(html) {
            if (!html.includes(META_PLACEHOLDER)) {
                throw new Error(
                    `[prerender] index.html 에서 ${META_PLACEHOLDER} 를 찾지 못했습니다.\n` +
                        '   → 이 자리 표시가 없으면 어떤 페이지에도 메타가 들어가지 않습니다.',
                );
            }

            return fillPlaceholder(html, getTargets()[0]);
        },

        closeBundle() {
            /*
             * 🔴 dev 서버도 종료 시 이 훅을 부릅니다(환경마다 한 번씩). 그대로 두면
             *    `npm run dev` 가 `dist/` 를 건드리고, dist 가 없으면 아예 던집니다.
             *    프리렌더는 빌드 산출물에만 관여합니다.
             */
            if (config.command !== 'build') {
                return;
            }

            const outDir = path.resolve(config.root, config.build.outDir);
            const indexPath = path.join(outDir, 'index.html');

            /*
             * 🔴 **앞선 오류를 덮지 않습니다.** `transformIndexHtml` 이나
             *    `collectPrerenderTargets` 가 던지면 vite 는 `dist/index.html` 을
             *    쓰지 않은 채 이 훅을 부르고, 여기서 곧장 읽으면 **ENOENT 가
             *    마지막 오류 자리를 빼앗습니다.** `targets.ts` 가 「§6.13c-1 이 규격을
             *    보류했습니다 · 문구를 여기서 지어내지 마십시오」라고 적어 둔 안내가
             *    사람에게 도달하지 못하던 이유입니다 — 멈추기는 하되 이유는 말하지
             *    못하는 정지였습니다. 성공한 빌드에 이 파일이 없는 경우는 없습니다.
             */
            if (!existsSync(indexPath)) {
                config.logger.warn(
                    '  ⚠️ dist/index.html 이 없어 프리렌더를 건너뜁니다 — ' +
                        '위에 먼저 난 빌드 오류가 원인입니다(이 플러그인은 그것을 덮지 않습니다).',
                );
                return;
            }

            const indexHtml = readFileSync(indexPath, 'utf8');
            const all = getTargets();

            const pages = all.map(target =>
                planPage(
                    target,
                    target.path === '/' ? indexHtml : replaceMetaBlock(indexHtml, target),
                ),
            );

            /*
             * 🔴 **쓰기 전에 도는 검사들.** 메모리의 html 과 대상 배열만 보면 되는
             *    것은 전부 여기입니다. 예전에는 148개 파일을 다 쓴 뒤에 돌아, 검사가
             *    터져도 검증되지 않은 산출물이 `dist/` 에 남았습니다.
             */
            assertDescriptions(all);
            assertSelfReferentialUrls(pages);
            assertUniqueFiles(pages);

            for (const page of pages) {
                commitPage(outDir, page);
            }

            /*
             * sitemap 은 **프리렌더 대상과 같은 배열**에서 나옵니다(R-2 · R-12).
             * 규칙 하나 — 「200 으로 서빙되는 정본 URL 만」. 쿼리 URL·1회성 태그·
             * `hasBody=false` 작업·404.html 은 애초에 이 배열에 없습니다(R-14).
             */
            writeFileSync(path.join(outDir, SITEMAP_FILE), renderSitemap(all));
            writeFileSync(path.join(outDir, ROBOTS_FILE), renderRobots());

            const fileCount = pages.reduce((sum, page) => sum + page.files.length, 0);

            /* 디스크를 봐야만 하는 검사 — 404.html 과 실제로 발행된 바이트 */
            assertNoindexIsolation(outDir, pages);
            assertPublishedFiles(outDir, all.length, fileCount);

            config.logger.info(
                `  ✅ 프리렌더 ${all.length}개 URL · HTML ${fileCount}개 ` +
                    `(글 ${all.filter(t => t.ogType === 'article').length}편 포함)\n` +
                    `  ✅ ${SITEMAP_FILE} ${all.length}건 — 신고한 URL 전부 파일 실재 확인\n` +
                    `  ✅ ${ROBOTS_FILE} 생성 · dist/${FALLBACK_FILE} noindex 유지 · canonical 없음\n` +
                    '  ✅ noindex 0건 · canonical/og:url 자기참조 · description 규격 통과',
            );
        },
    };
}
