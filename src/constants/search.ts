/**
 * 검색 UI 확정 카피(§9)와 상수.
 *
 * ⚠️ 검색 **로직은 이번 범위 밖**입니다(STEP 4로 이월).
 *    현재 usePosts 의 필터는 title·category·tag 에 같은 키워드를 AND 완전일치로
 *    걸어 결과가 항상 0입니다. 재작성 전까지 여기에 연결하지 마세요.
 */

export const SEARCH_PLACEHOLDER = '제목, 태그로 검색';
export const SEARCH_SCOPE_HINT = '제목·태그·카테고리에서 찾아요';
export const SEARCH_INITIAL_HINT = '검색어를 입력하면 결과가 나와요';
export const SEARCH_EMPTY_TITLE = '일치하는 글이 없어요';
export const SEARCH_EMPTY_DESCRIPTION_DESKTOP =
    '다른 키워드로 찾아보거나, 전체 글을 둘러보세요.';
export const SEARCH_EMPTY_DESCRIPTION_MOBILE =
    '다른 키워드를 넣거나 위 태그에서 골라 보세요.';
export const SEARCH_POPULAR_TAGS_TITLE = '자주 쓰는 태그';

export interface PopularTag {
    label: string;
    count: number;
}

/** 모바일 검색 오버레이의 `자주 쓰는 태그` 칩. 명세에 값이 그대로 주어졌습니다(§6-4). */
export const SEARCH_POPULAR_TAGS: PopularTag[] = [
    { label: 'Python', count: 16 },
    { label: 'React', count: 14 },
    { label: 'CodingTest', count: 9 },
];
