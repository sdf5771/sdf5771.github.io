/**
 * `/tags` · `/tags/:tag` 의 URL 쿼리 계약.
 * 명세: docs/handoff-step6-tags-archive.md §2-1b · §7-5 · §7-6
 *
 * 규칙은 STEP 4 §4 와 같습니다 — **기본값은 URL 에 쓰지 않고**, 알 수 없는 값은
 * 조용히 기본값으로 떨어지며, 남이 붙인 파라미터(UTM 등)는 건드리지 않습니다.
 *
 * `/archive` 는 여기 없습니다. **검색·필터·정렬·페이지네이션이 하나도 없어서**
 * 쿼리 상태 자체가 존재하지 않습니다(§1-1 R-1). 접기 상태도 URL 에 넣지
 * 않습니다 — 4개 boolean 이면 같은 콘텐츠를 가리키는 URL 이 16가지가 됩니다(§8-5).
 */

import type { PostSortOrder } from './postListQuery';
import { DEFAULT_SORT } from './postListQuery';

/** 태그 인덱스의 정렬. 시안의 티어 필터 칩은 반려됐습니다(§2-1b) */
export type TagIndexSort = 'count' | 'name';

/** `빈도순`. 이 값은 URL 에 쓰지 않습니다 */
export const DEFAULT_TAG_INDEX_SORT: TagIndexSort = 'count';

/** 두 화면 모두 `sort` 하나만 소유합니다. `page` 는 태그 페이지 전용입니다 */
const TAG_INDEX_OWNED_KEYS = new Set(['sort']);
const TAG_POSTS_OWNED_KEYS = new Set(['sort', 'page']);

/**
 * 알 수 없는 키만 남긴 쿼리 조각. 우리가 소유한 키는 호출부가 다시 붙입니다.
 *
 * `URLSearchParams.toString()` 을 쓰지 않는 이유는 STEP 4 와 같습니다 —
 * 그쪽은 공백을 `+` 로 인코딩하는데 정규형은 `encodeURIComponent` 기준입니다.
 */
function keepForeignParams(currentSearch: string, ownedKeys: ReadonlySet<string>): string[] {
    const parts: string[] = [];

    for (const [key, value] of new URLSearchParams(currentSearch)) {
        if (ownedKeys.has(key)) {
            continue;
        }

        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    return parts;
}

function joinSearch(parts: readonly string[]): string {
    return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/* ------------------------------------------------------------
 * `/tags` — 빈도순 / 이름순
 * ---------------------------------------------------------- */

export function parseTagIndexSort(search: string): TagIndexSort {
    return new URLSearchParams(search).get('sort') === 'name' ? 'name' : DEFAULT_TAG_INDEX_SORT;
}

export function buildTagIndexSearch(currentSearch: string, sort: TagIndexSort): string {
    const parts = keepForeignParams(currentSearch, TAG_INDEX_OWNED_KEYS);

    if (sort !== DEFAULT_TAG_INDEX_SORT) {
        parts.push(`sort=${sort}`);
    }

    return joinSearch(parts);
}

/* ------------------------------------------------------------
 * `/tags/:tag` — 최신순 / 오래된순
 * ---------------------------------------------------------- */

export interface TagPostsQuery {
    sort: PostSortOrder;
    /**
     * 1 이 기본값. **지금 데이터에서는 항상 1 입니다** — 최대 태그가 Python 16편
     * 이라 20편/페이지에 못 미쳐 페이저가 발동하지 않습니다(§7-5).
     * 그래도 파싱·클램프 분기는 남깁니다. 글이 늘면 STEP 4 의 페이저가 그대로
     * 나타납니다.
     */
    page: number;
}

export function parseTagPostsQuery(search: string): TagPostsQuery {
    const params = new URLSearchParams(search);

    const rawSort = params.get('sort');
    /* `?sort=asc` 도 관용으로 받습니다 — STEP 4 §4-2 와 같은 규칙 */
    const sort: PostSortOrder = rawSort === 'oldest' || rawSort === 'asc' ? 'oldest' : DEFAULT_SORT;

    const rawPage = Number.parseInt(params.get('page') ?? '', 10);
    const page = Number.isFinite(rawPage) && rawPage > 1 ? rawPage : 1;

    return { sort, page };
}

export function buildTagPostsSearch(currentSearch: string, next: TagPostsQuery): string {
    const parts = keepForeignParams(currentSearch, TAG_POSTS_OWNED_KEYS);

    if (next.sort !== DEFAULT_SORT) {
        parts.push(`sort=${next.sort}`);
    }

    if (next.page > 1) {
        parts.push(`page=${next.page}`);
    }

    return joinSearch(parts);
}
