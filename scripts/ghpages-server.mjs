#!/usr/bin/env node
/**
 * GitHub Pages 를 흉내내는 로컬 정적 서버 — **검증 전용입니다.**
 *
 * 왜 `vite preview` 를 쓰면 안 되는가 (lessons L17)
 * ------------------------------------------------
 * `vite preview` 는 **없는 경로에도 200 을 줍니다**(SPA 폴백). 프리렌더가 하나도
 * 안 됐는데 74/74 통과로 보입니다. 자기 검증에 쓰면 측정이 무효입니다.
 *
 * 왜 대소문자를 직접 검사하는가 (lessons L16)
 * -------------------------------------------
 * macOS 로컬 파일시스템은 **대소문자를 구분하지 않습니다.** `readFileSync` 는
 * `/Posts/Foo.html` 도 열어 주지만 GitHub Pages 는 404 를 줍니다. 이 사이트에서
 * 그 차이로 배포 후에야 드러난 버그가 이미 두 건 있었습니다. 그래서 경로 세그먼트
 * 하나하나를 `readdirSync` 결과와 **글자 단위로** 대조합니다.
 *
 * 흉내내는 규칙 (nginx 의 `try_files $uri $uri.html $uri/index.html` 과 같은 순서)
 *   1. 요청 경로와 같은 파일
 *   2. `<경로>.html`
 *   3. `<경로>/index.html`
 *   4. 없으면 **HTTP 404 + `dist/404.html` 본문** (GitHub Pages 의 실제 동작 —
 *      주소창 URL 을 바꾸지 않습니다)
 *
 * 🔴 **후행 슬래시 301 은 흉내내지 않습니다.** GitHub Pages 가 `/posts/x` 를
 *    `/posts/x/` 로 301 하는지는 **확인되지 않았고**(product.md §14-5 R-13
 *    `[확인필요]`) 로컬에서는 재현할 수 없습니다. 이 서버가 임의로 301 을 만들면
 *    "측정했다"는 착각만 남습니다. 배포 후 프로덕션 실측 항목입니다.
 *
 * 사용법
 *   node scripts/ghpages-server.mjs [--dir dist] [--port 4173]
 */

import { createServer } from 'node:http';
import { createReadStream, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const readFlag = (name, fallback) => {
    const index = args.indexOf(name);
    return index === -1 ? fallback : args[index + 1];
};

const root = path.resolve(readFlag('--dir', 'dist'));
const port = Number(readFlag('--port', '4173'));

const CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

/**
 * 대소문자를 **구분해서** 존재를 확인합니다.
 * 세그먼트마다 부모 디렉터리의 목록에 글자 그대로 있는지 봅니다 —
 * 대소문자를 구분하지 않는 파일시스템에서도 GitHub Pages 와 같은 답이 나옵니다.
 */
function resolveCaseSensitive(relative) {
    const segments = relative.split('/').filter(Boolean);
    let current = root;

    for (const segment of segments) {
        let entries;

        try {
            entries = readdirSync(current);
        } catch {
            return null;
        }

        if (!entries.includes(segment)) {
            return null;
        }

        current = path.join(current, segment);
    }

    return current;
}

function findFile(pathname) {
    const clean = pathname.replace(/\/+$/, '');
    const candidates =
        clean === ''
            ? ['index.html']
            : [clean, `${clean}.html`, `${clean}/index.html`];

    for (const candidate of candidates) {
        const resolved = resolveCaseSensitive(candidate);

        if (resolved && statSync(resolved).isFile()) {
            return resolved;
        }
    }

    return null;
}

const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = findFile(pathname);

    if (!file) {
        const fallback = path.join(root, '404.html');
        let body = 'Not Found';

        try {
            body = readFileSync(fallback, 'utf8');
        } catch {
            /* 404.html 이 없으면 평문으로 답합니다 — 그 자체가 회귀 신호입니다 */
        }

        response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
        response.end(body);
        return;
    }

    response.writeHead(200, {
        'content-type': CONTENT_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(response);
});

server.listen(port, () => {
    console.log(`ghpages-server: ${root} → http://localhost:${port} (대소문자 구분 · 실제 404)`);
});
