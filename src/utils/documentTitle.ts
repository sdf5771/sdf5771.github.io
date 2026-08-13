import { POSTS } from '../data/posts';
import { findTag } from '../data/tags';
import { findWork } from '../data/works';
import {
    ARCHIVE_LABEL,
    ARCHIVE_PATH,
    HOME_TITLE,
    NOT_FOUND_TITLE_NAME,
    POST_LIST_PATH,
    TAG_INDEX_PATH,
    WORKS_LABEL,
    WORKS_PATH,
    buildPageTitle,
} from '../constants/site';
import { safeDecodeURIComponent } from './url';
import { toPostSlug } from './postSlug';
import { toTagSlug } from './tags';

/**
 * 라우트별 `<title>` — **이 함수가 유일한 정본입니다.**
 * 표기 규격은 WRITING_GUIDE §6.13(그 표는 거울이고, 다르면 이 코드가 이깁니다),
 * 경로 판정은 useTerminalPath 와 같은 규칙입니다.
 *
 * 🔴 **왜 훅(useDocumentTitle.ts)에서 이 파일로 나왔는가.**
 *    빌드타임 프리렌더가 74개 HTML 의 `<title>` 을 이 함수로 만듭니다
 *    (`scripts/prerender/*` · product.md §14-5 R-5). 훅 파일은 `react` ·
 *    `react-router-dom` 을 import 하므로 Node 에서 부를 수 없습니다.
 *    **문구를 프리렌더 쪽에 다시 적으면 탭 제목과 공유 제목이 조용히 갈리므로**,
 *    함수를 react 의존이 없는 이 파일로 옮기고 훅이 이것을 씁니다.
 *    정의는 여전히 **한 곳**입니다 — 프리렌더에 사본이 생기지 않았습니다.
 */
export function resolveDocumentTitle(pathname: string, search: string): string {
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
     * 태그별 목록 — `#React · Seobisback.log`. 표기는 **대표 표기**입니다(§3-4).
     *
     * 🔴 없는 태그는 화면이 404 이므로 제목도 404 여야 합니다. 라우트가 있다는
     *    이유로 제목만 정상으로 두면, 페이지 전환을 제목으로 안내받는 스크린리더
     *    사용자에게 거짓말이 됩니다.
     *    반대로 **1회성 태그는 정상 화면**이라 정상 제목이 나갑니다(§4-2).
     */
    const tagMatch = /^\/tags\/(.+)$/.exec(pathname);
    if (tagMatch) {
        const tag = findTag(toTagSlug(safeDecodeURIComponent(tagMatch[1])));
        return buildPageTitle(tag ? `#${tag.name}` : NOT_FOUND_TITLE_NAME);
    }

    /* 태그 인덱스. `/tags/<slug>` 검사 뒤에 와야 합니다 */
    if (pathname === TAG_INDEX_PATH) {
        return buildPageTitle('태그');
    }

    /*
     * 🔴 화면 이름은 `연도별 보기` 입니다. WRITING_GUIDE §9 가 `아카이브` 를
     *    "쓰지 않는 표기" 로 지정했습니다 — URL 만 `/archive` 입니다.
     */
    if (pathname === ARCHIVE_PATH) {
        return buildPageTitle(ARCHIVE_LABEL);
    }

    /*
     * 작업 상세(STEP 7). `/works` 검사 **앞**에 와야 합니다.
     *
     * 🔴 **본문이 없는 slug 는 화면이 404 이므로 제목도 404 여야 합니다.**
     *    라우트가 있다는 이유로 제목만 정상으로 두면, 페이지 전환을 제목으로
     *    안내받는 스크린리더 사용자에게 거짓말이 됩니다 — 태그 쪽과 같은 판정입니다.
     */
    const workMatch = /^\/works\/(.+)$/.exec(pathname);
    if (workMatch) {
        const work = findWork(safeDecodeURIComponent(workMatch[1]));
        return buildPageTitle(work?.hasBody ? work.title : NOT_FOUND_TITLE_NAME);
    }

    /*
     * 🔴 필터 상태(`?type=`)를 제목에 반영하지 않습니다 — 글 목록과 같은 규칙입니다.
     *    화면 이름은 `작업` 입니다(`Works`·`포트폴리오` 금지).
     */
    if (pathname === WORKS_PATH) {
        return buildPageTitle(WORKS_LABEL);
    }

    /*
     * 🔴 **아직 없는 라우트의 제목을 미리 쓰지 않습니다.** 화면은 404 인데 탭
     *    제목만 정상이면 스크린리더 사용자에게 거짓말이 됩니다. 라우트가 생기는
     *    STEP 에서 그 라우트와 **함께** 제목을 살리세요.
     */
    return buildPageTitle(NOT_FOUND_TITLE_NAME);
}
