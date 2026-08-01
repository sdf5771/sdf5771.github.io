import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { POSTS } from '../data/posts';
import {
    HOME_TITLE,
    NOT_FOUND_TITLE_NAME,
    POST_LIST_PATH,
    buildPageTitle,
} from '../constants/site';
import { safeDecodeURIComponent } from '../utils/url';
import { toPostSlug } from '../utils/postSlug';

/**
 * 현재 라우트에 해당하는 `<title>` 문자열.
 * 표기 규격은 WRITING_GUIDE §6.13, 경로 판정은 useTerminalPath 와 같은 규칙입니다.
 */
function resolveDocumentTitle(pathname: string, search: string): string {
    if (pathname === '/' || pathname === '') {
        return HOME_TITLE;
    }

    // 글 데이터는 빌드 타임 JSON 이라 동기적으로 찾을 수 있습니다 — 본문 fetch 를
    // 기다리지 않으므로 제목이 뒤늦게 바뀌는 깜빡임이 없습니다.
    const findTitle = (slug: string | null | undefined): string => {
        /* 정본 slug 는 소문자입니다 — 대문자 주소로 들어와도 같은 글을 찾습니다 */
        const post = slug ? POSTS.find(item => item.slug === toPostSlug(slug)) : undefined;

        // 없는 slug 는 이제 404 화면으로 갑니다. 제목도 거기에 맞춥니다.
        return buildPageTitle(post ? post.title : NOT_FOUND_TITLE_NAME);
    };

    const slugMatch = /^\/posts\/(.+)$/.exec(pathname);
    if (slugMatch) {
        return findTitle(safeDecodeURIComponent(slugMatch[1]));
    }

    /*
     * 글 목록(STEP 4). `/posts/<slug>` 검사 **뒤**에 와야 합니다.
     *
     * 🔴 필터·검색 상태를 제목에 반영하지 않습니다(§10-2). 타이핑마다 탭 제목이
     *    바뀌면 산만하고, 스크린리더가 페이지 전환으로 오해합니다.
     */
    if (pathname === POST_LIST_PATH) {
        return buildPageTitle('글 목록');
    }

    /* 구 경로. 리다이렉트 전 한 프레임 동안만 쓰이므로 깜빡임을 줄여 둡니다 */
    if (pathname === '/post') {
        return findTitle(new URLSearchParams(search).get('id'));
    }

    if (pathname === '/about') {
        return buildPageTitle('소개');
    }

    /*
     * 🔴 **아직 없는 라우트의 제목을 미리 쓰지 않습니다.**
     * `/tags`·`/tags/<태그>` 는 STEP 6 이고 지금은 404 화면입니다.
     * 여기에 제목을 넣어 두면 화면은 404 인데 탭 제목만 정상이라,
     * **페이지 전환을 제목으로 안내받는 스크린리더 사용자에게 거짓말**이 됩니다.
     * 라우트가 생기는 STEP 에서 그 라우트와 **함께** 제목을 되살리세요.
     */
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
