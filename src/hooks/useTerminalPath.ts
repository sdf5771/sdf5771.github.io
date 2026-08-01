import { useLocation } from 'react-router-dom';
import { safeDecodeURIComponent } from '../utils/url';

/**
 * 현재 라우트를 헤더의 경로 표시 문자열로 옮깁니다.
 * 표기 규격: `~` · `~/posts` · `~/posts/<slug>.md` · `~/tags/<태그>` · `~/about.md`
 * 근거: docs/handoff-step1-shell.md §9
 */
function useTerminalPath(): string {
    const location = useLocation();
    const { pathname, search } = location;

    const slugMatch = /^\/posts\/(.+)$/.exec(pathname);
    if (slugMatch) {
        return `~/posts/${safeDecodeURIComponent(slugMatch[1])}.md`;
    }

    /* 구 경로. 리다이렉트 직전 한 프레임 동안만 보입니다 */
    if (pathname === '/post') {
        const slug = new URLSearchParams(search).get('id');
        return slug ? `~/posts/${slug}.md` : '~/posts';
    }

    if (pathname === '/' || pathname === '') {
        return '~';
    }

    if (pathname === '/about') {
        return '~/about.md';
    }

    const tagMatch = /^\/tags\/(.+)$/.exec(pathname);
    if (tagMatch) {
        /*
         * 🔴 safeDecode 여야 합니다. `/tags/%ZZ` 처럼 잘못된 인코딩이 들어오면
         *    decodeURIComponent 가 URIError 를 던져 렌더 도중 트리 전체가 죽습니다.
         *    404 라우트가 생기면서 임의 경로가 여기까지 도달할 수 있게 됐습니다.
         */
        return `~/tags/${safeDecodeURIComponent(tagMatch[1])}`;
    }

    return `~${pathname.replace(/\/$/, '')}`;
}

export default useTerminalPath;
