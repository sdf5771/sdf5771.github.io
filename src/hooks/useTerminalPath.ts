import { useLocation } from 'react-router-dom';

/**
 * 현재 라우트를 헤더의 경로 표시 문자열로 옮깁니다.
 * 표기 규격: `~` · `~/posts` · `~/posts/<slug>.md` · `~/tags/<태그>` · `~/about.md`
 * 근거: docs/handoff-step1-shell.md §9
 */
function useTerminalPath(): string {
    const location = useLocation();
    const { pathname, search } = location;

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
        return `~/tags/${decodeURIComponent(tagMatch[1])}`;
    }

    return `~${pathname.replace(/\/$/, '')}`;
}

export default useTerminalPath;
