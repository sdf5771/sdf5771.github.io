/**
 * `/posts` 의 URL 쿼리 계약 — 파싱·정규화·직렬화.
 * 명세: docs/handoff-step4-list.md §4
 *
 * 이 화면의 상태(`q`·`category`·`sort`·`page`)는 **전부 URL 에 있습니다.**
 * 공유·뒤로가기·새로고침에서 복원되어야 하고, 이 프로젝트의 1순위 과제가
 * 딥링크 복구이므로 목록만 상태가 URL 밖에 있으면 원칙이 갈립니다.
 */

import type { PostMetadata } from '../types';
import { POST_LIST_PATH } from '../constants/site';

/** 한 페이지에 20개. 시안의 6개는 7페이지가 되어 "41개를 훑는다"에 반합니다(§7-2) */
export const POSTS_PER_PAGE = 20;

/**
 * URL 에 쓰는 값이 `desc`/`asc` 가 아닌 이유: 사용자에게 보이는 URL 은 UI 라벨
 * (`최신순`/`오래된순`)과 대응해야 읽힙니다. 내부 정렬 방향과는 별개입니다.
 */
export type PostSortOrder = 'latest' | 'oldest';

export const DEFAULT_SORT: PostSortOrder = 'latest';

export interface PostListQuery {
    /** 검색어 원문. 빈 문자열이 기본값 */
    q: string;
    /** 저장된 대소문자 그대로의 카테고리명. `null` 이 전체(기본값) */
    category: string | null;
    sort: PostSortOrder;
    /** 1 이 기본값 */
    page: number;
}

/**
 * 이 화면이 소유하는 키. 나머지 키(UTM 등 외부 추적 파라미터)는 **건드리지
 * 않고 그대로 보존**합니다 — 남이 붙인 파라미터를 지우면 유입 경로가 끊깁니다.
 */
const OWNED_KEYS = new Set(['q', 'category', 'sort', 'page']);

/**
 * URL → 상태. **잘못된 값에서 절대 빈 화면이나 에러가 되면 안 됩니다.**
 * 주소는 사용자가 직접 편집할 수 있고 오래된 링크도 들어옵니다.
 *
 * | 입력 | 처리 |
 * |---|---|
 * | `?category=study` (소문자) | 대소문자 무시 매칭 → `Study` 로 정규화 |
 * | `?category=Foo` (없는 값) | 버리고 전체로 |
 * | `?sort=asc` | `oldest` 로 해석(관용). 그 외 알 수 없는 값은 기본값 |
 * | `?page=0` · `?page=abc` · 음수 | `1` 로 |
 *
 * `page` 의 **상한 클램프는 여기서 하지 않습니다.** 총 페이지 수는 검색·필터
 * 결과에 달려 있어 이 함수가 알 수 없습니다. 호출부가 `clampPage` 로 마무리하고,
 * 그 결과를 **렌더에 그대로 씁니다** — 렌더 뒤에 고치면 빈 목록이 한 프레임
 * 그려졌다 사라지는 깜빡임이 보입니다(§4-4).
 */
export function parsePostListQuery(
    search: string,
    categories: readonly string[],
): PostListQuery {
    const params = new URLSearchParams(search);

    const rawCategory = params.get('category');
    const category =
        categories.find(name => name.toLowerCase() === rawCategory?.toLowerCase()) ?? null;

    const rawSort = params.get('sort');
    const sort: PostSortOrder = rawSort === 'oldest' || rawSort === 'asc' ? 'oldest' : DEFAULT_SORT;

    const rawPage = Number.parseInt(params.get('page') ?? '', 10);
    const page = Number.isFinite(rawPage) && rawPage > 1 ? rawPage : 1;

    return { q: params.get('q') ?? '', category, sort, page };
}

export function clampPage(page: number, totalPages: number): number {
    return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

/**
 * 상태 → URL. **기본값은 키 자체를 뺍니다.**
 * `/posts?q=&category=&sort=latest&page=1` 이 아니라 `/posts` 가 정규형입니다 —
 * 링크를 붙여넣을 때 지저분하고, 같은 화면에 URL 이 여러 개 생기는 것을 막습니다.
 *
 * `URLSearchParams.toString()` 을 쓰지 않고 직접 만듭니다. 그쪽은 공백을 `+` 로
 * 인코딩하는데, 명세(§4-2)의 정규형은 `encodeURIComponent` 기준 `%20` 입니다.
 *
 * @param currentSearch 현재 `location.search`. 여기서 **알 수 없는 키만** 가져옵니다
 */
export function buildPostListSearch(currentSearch: string, next: PostListQuery): string {
    const parts: string[] = [];

    for (const [key, value] of new URLSearchParams(currentSearch)) {
        if (OWNED_KEYS.has(key)) {
            continue;
        }

        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    /* 공백뿐인 검색어는 조건이 아닙니다 — `?q=%20%20` 을 남기지 않습니다 */
    if (next.q.trim()) {
        parts.push(`q=${encodeURIComponent(next.q)}`);
    }

    if (next.category) {
        parts.push(`category=${encodeURIComponent(next.category)}`);
    }

    if (next.sort !== DEFAULT_SORT) {
        parts.push(`sort=${next.sort}`);
    }

    if (next.page > 1) {
        parts.push(`page=${next.page}`);
    }

    return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/**
 * 헤더 전역 검색이 결과 화면으로 넘어갈 때 쓰는 주소.
 *
 * **입력 지점은 2개(헤더·목록 인라인)이지만 결과 화면은 하나**입니다(§2-3).
 * 헤더는 다른 화면에서의 진입로일 뿐이라, 확정되면 `/posts?q=<검색어>` 로
 * 이동시키고 인라인 입력에 값이 채워진 상태로 넘깁니다. 이 URL 동기화가
 * 두 입력 지점을 하나의 결과 화면으로 묶는 장치입니다.
 */
export function buildSearchResultPath(query: string): string {
    const trimmed = query.trim();
    return trimmed ? `${POST_LIST_PATH}?q=${encodeURIComponent(trimmed)}` : POST_LIST_PATH;
}

/**
 * 정렬 — 🔴 타이브레이커 `[date, slug]` 가 **필수**입니다.
 *
 * `date` 는 날짜만 있고 시각이 없는데 **41편 중 25편이 같은 날짜를 공유**합니다
 * (2023-04-13 에만 5편). 날짜만으로 정렬하면 같은 날짜 묶음의 순서가 정의되지
 * 않고, 그 묶음이 페이지 경계에 걸리면 페이지를 오가는 사이 **같은 글이 두 번
 * 보이거나 한 편이 사라집니다.** `slug` 는 41편 전부 고유해 전순서를 보장합니다.
 *
 * `localeCompare` 가 아니라 `<` `>` 로 충분합니다 — `date` 는 고정폭 ISO,
 * `slug` 는 ASCII 이고, 로케일에 따라 결과가 흔들리면 안 되는 자리입니다.
 */
export function sortPosts(
    posts: readonly PostMetadata[],
    order: PostSortOrder,
): PostMetadata[] {
    /*
     * `a` 가 더 작을 때(= 더 이른 날짜 / 앞선 slug) 돌려줄 값입니다.
     * 최신순이면 작은 쪽이 **뒤로** 가야 하므로 양수(1),
     * 오래된순이면 앞으로 와야 하므로 음수(-1)입니다.
     */
    const whenSmaller = order === 'latest' ? 1 : -1;

    return [...posts].sort((a, b) => {
        if (a.date !== b.date) {
            return a.date < b.date ? whenSmaller : -whenSmaller;
        }

        if (a.slug === b.slug) {
            return 0;
        }

        return a.slug < b.slug ? whenSmaller : -whenSmaller;
    });
}
