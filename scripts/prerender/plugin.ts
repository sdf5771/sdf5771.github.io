import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

interface WrittenPage {
    target: PrerenderTarget;
    files: string[];
    html: string;
}

function writePage(outDir: string, target: PrerenderTarget, html: string): WrittenPage {
    /* 홈은 vite 가 이미 쓴 dist/index.html 이 그대로 정답입니다 */
    if (target.path === '/') {
        return { target, files: ['index.html'], html };
    }

    const flat = `${target.path.slice(1)}.html`;
    const nested = path.join(target.path.slice(1), 'index.html');

    for (const relative of [flat, nested]) {
        const full = path.join(outDir, relative);
        mkdirSync(path.dirname(full), { recursive: true });
        writeFileSync(full, html);
    }

    return { target, files: [flat, nested], html };
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
function assertNoindexIsolation(outDir: string, pages: readonly WrittenPage[]): void {
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
}

/**
 * 🔴 R-4 · R-4a. 74개가 각자 **자기 URL** 을 말해야 합니다.
 * 하나라도 홈으로 남으면 언펄러가 홈 카드를 보여주고 검색엔진이 그 페이지를
 * 홈의 중복으로 접습니다 — 이 작업이 고치려는 증상 그 자체입니다.
 */
function assertSelfReferentialUrls(pages: readonly WrittenPage[]): void {
    const problems: string[] = [];

    for (const page of pages) {
        const expected = toAbsoluteUrl(page.target.path);
        const ogUrls = [...page.html.matchAll(/<meta property="og:url" content="([^"]*)"/g)];
        const canonicals = [...page.html.matchAll(/<link rel="canonical" href="([^"]*)"/g)];
        const titles = [...page.html.matchAll(/<title>/g)];

        if (ogUrls.length !== 1 || ogUrls[0][1] !== expected) {
            problems.push(`${page.files[0]} — og:url ${ogUrls.map(m => m[1]).join(',') || '없음'}`);
        }

        if (canonicals.length !== 1 || canonicals[0][1] !== expected) {
            problems.push(
                `${page.files[0]} — canonical ${canonicals.map(m => m[1]).join(',') || '없음'}`,
            );
        }

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
            const indexHtml = readFileSync(path.join(outDir, 'index.html'), 'utf8');
            const all = getTargets();

            const pages = all.map(target =>
                writePage(
                    outDir,
                    target,
                    target.path === '/' ? indexHtml : replaceMetaBlock(indexHtml, target),
                ),
            );

            /*
             * sitemap 은 **프리렌더 대상과 같은 배열**에서 나옵니다(R-2 · R-12).
             * 규칙 하나 — 「200 으로 서빙되는 정본 URL 만」. 쿼리 URL·1회성 태그·
             * `hasBody=false` 작업·404.html 은 애초에 이 배열에 없습니다(R-14).
             */
            writeFileSync(path.join(outDir, SITEMAP_FILE), renderSitemap(all));
            writeFileSync(path.join(outDir, ROBOTS_FILE), renderRobots());

            assertDescriptions(all);
            assertSelfReferentialUrls(pages);
            assertNoindexIsolation(outDir, pages);

            const fileCount = pages.reduce((sum, page) => sum + page.files.length, 0);

            config.logger.info(
                `  ✅ 프리렌더 ${all.length}개 URL · HTML ${fileCount}개 ` +
                    `(글 ${all.filter(t => t.ogType === 'article').length}편 포함)\n` +
                    `  ✅ ${SITEMAP_FILE} ${all.length}건 · ${ROBOTS_FILE} 생성\n` +
                    '  ✅ noindex 0건 · canonical/og:url 자기참조 · description 규격 통과',
            );
        },
    };
}
