import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { toPostSlug } from '../src/utils/postSlug';

/**
 * 🔴 딥링크 복구 — `dist/404.html` 생성 플러그인.
 * 명세: docs/handoff-step5-404-about.md §4-8
 *
 * 문제
 * ----
 * 이 사이트는 SPA 인데 GitHub Pages 는 정적 파일 서버입니다. `/posts/<slug>` 로
 * **직접 들어오거나 새로고침하면** 그런 파일이 없으므로 GitHub 의 기본 404 가
 * 뜹니다. 글 링크를 공유해도 열리지 않는 상태였습니다(커밋 6a099511 에서
 * public/404.html 이 삭제된 뒤로).
 *
 * 왜 `public/404.html` 을 손으로 두지 않는가
 * ------------------------------------------
 * `public/` 의 파일은 **그대로 복사**될 뿐 Vite 의 자산 주입을 받지 못합니다.
 * 즉 `<script src="/src/main.tsx">` 를 손으로 적어야 하는데 그 경로는 빌드
 * 결과물에 존재하지 않고(`/assets/index-<해시>.js` 로 바뀜), 해시는 빌드마다
 * 달라져 하드코딩이 불가능합니다. 결과는 흰 화면입니다.
 *
 * 그래서 **빌드가 끝난 뒤 `dist/index.html` 을 그대로 복사**해 404.html 을
 * 만듭니다. 자산 참조가 항상 정확하고, 앞으로 자산 이름이 바뀌어도 따라옵니다.
 *
 * GitHub Pages 는 404.html 을 서빙할 때 **주소창 URL 을 바꾸지 않습니다.**
 * 따라서 `location.pathname` 이 사용자가 요청한 경로 그대로이고, React Router 의
 * `<Route path="*">` 가 그것을 받습니다. `?/path` 같은 쿼리 인코딩 트릭은
 * **쓰지 않습니다**(§4-8 — 주소창을 오염시키고 경로 표시 로직을 복잡하게 만듦).
 */

/**
 * 🔴 브라우저에서 도는 slug 정규화 — **`src/utils/postSlug.ts` 의 사본입니다.**
 *
 * 왜 사본일 수밖에 없는가
 * -----------------------
 * 이 스크립트는 번들 밖에서, React 마운트 **전에**, 인라인으로 돌아야 합니다.
 * 그래서 `toPostSlug` 를 import 해 쓸 수가 없고 규칙을 문자열로 다시 적습니다.
 *
 * 🔴 사본은 조용히 어긋납니다. `toPostSlug` 가 규칙을 하나라도 더 얻는데 여기가
 *    그대로면, 대문자가 섞인 33편의 딥링크가 정본과 다른 주소로 착지합니다 —
 *    에러 없이, 배포된 뒤에야.
 *    그래서 `closeBundle` 이 **이 소스 자체를 Node 에서 실행해** 41편 전부와
 *    대문자 변형에 대해 `toPostSlug` 와 결과가 같은지 검사하고, 어긋나면
 *    빌드를 세웁니다(아래 assertNormalizerParity). 재타이핑한 복사본이 아니라
 *    **실제로 배포될 소스**를 검사한다는 점이 핵심입니다 —
 *    verify-font-glyphs.mjs 가 실제 배포될 폰트를 여는 것과 같은 이유입니다.
 *
 * 규칙을 고칠 때는 `toPostSlug` 와 이 문자열을 **함께** 고치세요.
 */
const BROWSER_SLUG_NORMALIZER = `function (value) {
          return value
            .replace(/\\.md$/i, '')
            .toLowerCase()
            .replace(/-{2,}/g, '-');
        }`;

/**
 * `<head>` 최상단에 들어가는 인라인 리다이렉트.
 *
 * 🔴 **React 마운트 전에** 끝내야 합니다. 부팅한 뒤 리다이렉트하면 사용자가
 *    404 화면을 한 번 보고 튕겨 나가는 깜빡임이 생깁니다.
 *
 * 🔴 **DOM 에 아무것도 쓰지 않습니다.** `document.write`·`innerHTML` 에 경로를
 *    넣지 마세요 — 여기는 React 밖이라 자동 이스케이프가 없는 진짜 위험한
 *    자리입니다(§4-6). 이 스크립트가 하는 일은 `location.replace` 뿐입니다.
 */
const REDIRECT_SCRIPT = `
    <meta name="robots" content="noindex" />
    <!--
      딥링크 복구. React 마운트 전에 끝냅니다 — 부팅 후 처리하면 404 를 한 번
      보고 튕기는 깜빡임이 생깁니다. 생성처: scripts/spa-fallback-plugin.ts
    -->
    <script>
      (function () {
        var p = location.pathname,
          q = location.search,
          h = location.hash;

        // 🔴 src/utils/postSlug.ts 의 toPostSlug 와 같은 규칙이어야 합니다.
        //    빌드가 이 함수와 toPostSlug 의 결과를 대조합니다(spa-fallback-plugin.ts).
        var normalize = ${BROWSER_SLUG_NORMALIZER};

        // 구 경로 /post?id=<slug> → 신 경로 /posts/<slug>
        // 단수 'post' + id 쿼리일 때만. 신 경로 '/posts/'는 이 패턴에 걸리지
        // 않으므로 리다이렉트가 되돌아오지 않습니다.
        if (/^\\/post\\/?$/.test(p)) {
          var m = /[?&]id=([^&]+)/.exec(q);
          if (m) {
            // h 를 붙이지 않으면 /post?id=Foo#결론 의 앵커가 사라집니다.
            location.replace('/posts/' + normalize(m[1]) + h);
            return;
          }
        }

        // 비정본 slug → 정본 slug (소문자 + 연속 하이픈 정리).
        // 이미 정본이면 아무것도 하지 않습니다 — 이 가드가 무한 루프를 막습니다.
        // toPostSlug 는 멱등이라(normalize(normalize(x)) === normalize(x))
        // 착지한 주소는 이 분기에 다시 걸리지 않습니다.
        //
        // 글과 작업이 **같은 규칙**을 씁니다(§6-5 ⑤). 작업 slug 는 처음부터
        // 소문자라(규칙 W1) 이 분기가 실제로 하는 일은 사용자가 대문자로 친
        // 주소를 정본으로 되돌리는 것뿐이며, 빌드가 works slug 전부에 대해
        // 멱등성을 단언합니다(assertNormalizerParity).
        //
        // 접두가 소문자일 때만 걸립니다 — '/Posts/x' 는 글 쪽도 마찬가지이고,
        // 명세가 정규화 대상으로 삼은 것은 slug 세그먼트입니다.
        var prefixes = ['/posts/', '/works/'];

        for (var i = 0; i < prefixes.length; i++) {
          if (p.indexOf(prefixes[i]) === 0) {
            var canonical = prefixes[i] + normalize(p.slice(prefixes[i].length));
            if (canonical !== p) {
              location.replace(canonical + q + h);
              return;
            }
            break;
          }
        }

        // 그 외에는 손대지 않고 SPA 부팅에 맡깁니다. 없는 경로면 404 화면이 뜹니다.
      })();
    </script>
`;

interface PostsDataEntry {
    slug: string;
    file: string;
}

interface WorksDataEntry {
    slug: string;
}

/**
 * 🔴 빌드타임 단언 — 인라인 사본이 `toPostSlug` 와 같은 규칙인지 검사합니다.
 *
 * 리포에 테스트가 하나도 없고, 파일명 41개 중 33개에 대문자가 있습니다.
 * 규칙이 하나만 어긋나도 그 33편의 딥링크가 정본과 다른 주소로 갑니다.
 * 지금까지 이것을 막던 것은 주석뿐이었습니다 — 이 함수가 그 자리를 대신합니다.
 *
 * 🔴 **작업(works) slug 도 같은 단언에 겁니다.** 인라인 스크립트가 `/posts/` 와
 *    `/works/` 에 같은 `normalize` 를 쓰므로(§6-5 ⑤), works slug 가 이미 정본이
 *    아니면 — 예컨대 누군가 `a--b.md` 를 넣으면 — 그 작업의 딥링크가 존재하지
 *    않는 주소로 replace 됩니다. W1 검증(generateWorksData)은 연속 하이픈을
 *    막지 않으므로 여기서 잡아야 합니다.
 */
function assertNormalizerParity(outDir: string): void {
    const dataPath = path.join(outDir, 'posts-data.json');
    const posts = JSON.parse(readFileSync(dataPath, 'utf8')) as PostsDataEntry[];
    const works = JSON.parse(
        readFileSync(path.join(outDir, 'works-data.json'), 'utf8'),
    ) as WorksDataEntry[];

    /* 배포될 소스 문자열을 그대로 함수로 만듭니다 — 재타이핑한 사본이 아닙니다 */
    const normalizeInBrowser = new Function(
        `return (${BROWSER_SLUG_NORMALIZER});`,
    )() as (value: string) => string;

    /* 실제 slug·파일명과, 사용자가 실제로 쳐 넣는 대문자 변형까지 */
    const samples = [
        ...posts.flatMap(post => [
            post.slug,
            post.file,
            post.slug.toUpperCase(),
            post.slug.replace(/-/g, '--'),
        ]),
        ...works.flatMap(work => [work.slug, work.slug.toUpperCase()]),
    ];

    const mismatches = samples.filter(
        sample => normalizeInBrowser(sample) !== toPostSlug(sample),
    );

    if (mismatches.length > 0) {
        const listed = [...new Set(mismatches)]
            .slice(0, 5)
            .map(
                sample =>
                    `      "${sample}"\n` +
                    `        인라인   → "${normalizeInBrowser(sample)}"\n` +
                    `        toPostSlug → "${toPostSlug(sample)}"`,
            )
            .join('\n');

        throw new Error(
            `[spa-fallback-404] 인라인 slug 규칙이 toPostSlug 와 어긋납니다 ` +
                `(${mismatches.length}/${samples.length}건).\n${listed}\n` +
                '   → scripts/spa-fallback-plugin.ts 의 BROWSER_SLUG_NORMALIZER 를\n' +
                '     src/utils/postSlug.ts 의 toPostSlug 와 같은 규칙으로 맞추세요.',
        );
    }

    /* 멱등성 — 정본에 다시 규칙을 걸어도 그대로여야 리다이렉트가 되돌아오지 않습니다 */
    const notIdempotent = [
        ...posts.map(post => ({ source: 'posts-data.json', slug: post.slug })),
        ...works.map(work => ({ source: 'works-data.json', slug: work.slug })),
    ].filter(entry => toPostSlug(entry.slug) !== entry.slug);

    if (notIdempotent.length > 0) {
        throw new Error(
            `[spa-fallback-404] slug 가 정본이 아닙니다 ` +
                `(${notIdempotent.length}건): ${notIdempotent
                    .slice(0, 5)
                    .map(
                        entry =>
                            `${entry.source} "${entry.slug}" → "${toPostSlug(entry.slug)}"`,
                    )
                    .join(', ')}\n` +
                '   → 인라인 리다이렉트가 그 항목을 존재하지 않는 주소로 보냅니다.\n' +
                '     generatePostsData / generateWorksData 를 확인하세요.',
        );
    }

    console.log(
        `  ✅ slug 규칙 일치 — 인라인 사본 ≡ toPostSlug ` +
            `(${samples.length}개 표본, 글 ${posts.length}편 · 작업 ${works.length}건)`,
    );
}

export default function spaFallbackPlugin(): Plugin {
    let config: ResolvedConfig;

    return {
        name: 'spa-fallback-404',
        /* dev 서버는 어떤 경로든 index.html 을 돌려주므로(historyApiFallback)
           이 플러그인이 필요 없습니다. 빌드에서만 동작합니다. */
        apply: 'build',

        configResolved(resolved) {
            config = resolved;
        },

        closeBundle() {
            const outDir = path.resolve(config.root, config.build.outDir);

            /* 규칙이 어긋난 채로 404.html 을 쓰느니 빌드를 세웁니다 */
            assertNormalizerParity(outDir);

            const indexHtml = readFileSync(path.join(outDir, 'index.html'), 'utf8');

            /*
             * charset 선언 **바로 뒤**에 넣습니다. `<head>` 직후에 끼우면 이 블록의
             * 한글 주석(문자당 3바이트)이 charset 을 1024바이트 밖으로 밀어내
             * 브라우저가 인코딩을 추측하게 됩니다.
             * 그 뒤라면 테마 부트스트랩·모듈 스크립트보다는 여전히 먼저 실행됩니다.
             */
            const charsetMatch = /<meta[^>]+charset[^>]*>/i.exec(indexHtml);

            if (!charsetMatch) {
                /* 조용히 넘어가면 딥링크가 죽은 채로 배포됩니다 */
                throw new Error(
                    '[spa-fallback-404] dist/index.html 에서 charset 선언을 찾지 못했습니다.',
                );
            }

            const insertAt = charsetMatch.index + charsetMatch[0].length;
            const fallbackHtml =
                indexHtml.slice(0, insertAt) + REDIRECT_SCRIPT + indexHtml.slice(insertAt);

            writeFileSync(path.join(outDir, '404.html'), fallbackHtml);
            config.logger.info('  ✅ dist/404.html 생성 (딥링크 폴백 + 구 경로 리다이렉트)');
        },
    };
}
