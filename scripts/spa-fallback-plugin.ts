import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

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
          q = location.search;

        // 구 경로 /post?id=<slug> → 신 경로 /posts/<slug>
        // 단수 'post' + id 쿼리일 때만. 신 경로 '/posts/'는 이 패턴에 걸리지
        // 않으므로 리다이렉트가 되돌아오지 않습니다.
        if (/^\\/post\\/?$/.test(p)) {
          var m = /[?&]id=([^&]+)/.exec(q);
          if (m) {
            location.replace('/posts/' + m[1].toLowerCase());
            return;
          }
        }

        // 대문자 slug → 소문자 (소문자 slug 가 정본).
        // 이미 소문자면 아무것도 하지 않습니다 — 이 가드가 무한 루프를 막습니다.
        if (p.indexOf('/posts/') === 0 && p !== p.toLowerCase()) {
          location.replace(p.toLowerCase() + q);
          return;
        }

        // 그 외에는 손대지 않고 SPA 부팅에 맡깁니다. 없는 경로면 404 화면이 뜹니다.
      })();
    </script>
`;

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
