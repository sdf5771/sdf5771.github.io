import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import postsData from '../../public/posts-data.json';
import { HOME_TITLE, NOT_FOUND_TITLE_NAME, buildPageTitle } from '../constants/site';

/**
 * 현재 라우트에 해당하는 `<title>` 문자열.
 * 표기 규격은 WRITING_GUIDE §6.13, 경로 판정은 useTerminalPath 와 같은 규칙입니다.
 */
function resolveDocumentTitle(pathname: string, search: string): string {
    if (pathname === '/' || pathname === '') {
        return HOME_TITLE;
    }

    if (pathname === '/post') {
        const slug = new URLSearchParams(search).get('id');
        // 글 데이터는 빌드 타임 JSON 이라 동기적으로 찾을 수 있습니다 — 본문 fetch 를
        // 기다리지 않으므로 제목이 뒤늦게 바뀌는 깜빡임이 없습니다.
        const post = slug ? postsData.find(item => item.slug === slug) : undefined;

        return buildPageTitle(post ? post.title : NOT_FOUND_TITLE_NAME);
    }

    if (pathname === '/posts') {
        return buildPageTitle('글 목록');
    }

    if (pathname === '/about') {
        return buildPageTitle('소개');
    }

    if (pathname === '/tags') {
        return buildPageTitle('태그');
    }

    const tagMatch = /^\/tags\/(.+)$/.exec(pathname);
    if (tagMatch) {
        return buildPageTitle(`#${decodeURIComponent(tagMatch[1])}`);
    }

    return buildPageTitle(NOT_FOUND_TITLE_NAME);
}

/**
 * 라우트가 바뀔 때 `document.title` 을 갱신합니다.
 *
 * SPA 는 문서를 새로 불러오지 않으므로 아무것도 하지 않으면 첫 진입의 제목이
 * 끝까지 남습니다. 스크린리더는 페이지 전환을 제목으로 알리고 사용자는 탭·기록·
 * 북마크에서 제목으로 화면을 구분하므로 **접근성 필수 항목**입니다
 * (§10 체크리스트 · WRITING_GUIDE §7.4).
 */
function useDocumentTitle(): void {
    const { pathname, search } = useLocation();

    useEffect(() => {
        document.title = resolveDocumentTitle(pathname, search);
    }, [pathname, search]);
}

export default useDocumentTitle;
