import { useLocation } from 'react-router-dom';
import { POSTS } from '../data/posts';
import { findTag } from '../data/tags';
import { ARCHIVE_PATH, TAG_INDEX_PATH } from '../constants/site';
import { safeDecodeURIComponent } from '../utils/url';
import { toPostSlug } from '../utils/postSlug';
import { toTagSlug } from '../utils/tags';

/**
 * 현재 라우트를 헤더의 경로 표시 문자열로 옮깁니다.
 * 표기 규격: `~` · `~/posts/<slug>.md` · `~/about.md`
 * 근거: docs/handoff-step1-shell.md §9 · §6-1c
 *
 * 🔴 **실재하는 화면만 경로로 표시합니다**(§6-1c, R-2 판정).
 *    헤더 경로 슬롯은 "여기가 어디"를 알리는 자리라, 존재하지 않는 위치를 넣으면
 *    사실과 다릅니다. 404 에서는 `~` 로 떨어집니다 — `cd` 가 실패하면 사용자는
 *    **원래 있던 곳에 그대로** 있고, 사용자가 친 잘못된 경로는 본문 장식 라인
 *    `▸ ~ cd <입력 경로>` 가 단독으로 담당합니다.
 *    이 규칙은 마지막 return 하나로 성립합니다 — 셸에 404 예외 분기가 없습니다.
 */
function useTerminalPath(): string {
    const location = useLocation();
    const { pathname, search } = location;

    /** 실재하는 글일 때만 파일 경로를 돌려줍니다. 없는 slug 는 404 이므로 `~` */
    const postPath = (slug: string | null): string | null => {
        /*
         * 🔴 safeDecode 여야 합니다. `%ZZ` 처럼 잘못된 인코딩이 들어오면
         *    decodeURIComponent 가 URIError 를 던져 렌더 도중 트리 전체가 죽습니다.
         *    404 라우트가 생기면서 임의 경로가 여기까지 도달할 수 있게 됐습니다.
         */
        const post = slug
            ? POSTS.find(item => item.slug === toPostSlug(safeDecodeURIComponent(slug)))
            : undefined;

        /* 표시도 정본 slug 로 통일합니다 — 대문자 주소로 들어와도 한 형태로 보입니다 */
        return post ? `~/posts/${post.slug}.md` : null;
    };

    const slugMatch = /^\/posts\/(.+)$/.exec(pathname);
    if (slugMatch) {
        return postPath(slugMatch[1]) ?? '~';
    }

    /* 구 경로. 리다이렉트 직전 한 프레임 동안만 보입니다 */
    if (pathname === '/post') {
        return postPath(new URLSearchParams(search).get('id')) ?? '~';
    }

    /* 글 목록(STEP 4). `/posts/<slug>` 검사 뒤라 글 상세를 가로채지 않습니다 */
    if (pathname === '/posts') {
        return '~/posts';
    }

    if (pathname === '/about') {
        return '~/about.md';
    }

    /*
     * 태그별 목록(STEP 6). 표기는 **slug** 입니다(§12) — 원문 표기를 쓰면
     * `~/tags/Android XR` 처럼 공백이 들어가 경로로 보이지 않습니다.
     * 실재하는 태그일 때만 돌려줍니다 — 없는 태그는 404 라 `~` 가 맞습니다.
     */
    const tagMatch = /^\/tags\/(.+)$/.exec(pathname);
    if (tagMatch) {
        const slug = toTagSlug(safeDecodeURIComponent(tagMatch[1]));
        return findTag(slug) ? `~/tags/${slug}` : '~';
    }

    /* 태그 인덱스. `/tags/<slug>` 검사 뒤라 태그별 목록을 가로채지 않습니다 */
    if (pathname === TAG_INDEX_PATH) {
        return '~/tags';
    }

    if (pathname === ARCHIVE_PATH) {
        return '~/archive';
    }

    /* 홈(`/`)과 그 밖의 모든 경로 */
    return '~';
}

export default useTerminalPath;
