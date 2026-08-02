/**
 * 검색 UI 확정 카피(handoff-step1-shell.md §9)와 상수.
 *
 * 검색 로직은 `src/utils/postSearch.ts`, URL 계약은 `src/utils/postListQuery.ts`
 * 입니다(STEP 4에서 구현). 새 문구를 여기서 지어내지 마세요 —
 * `docs/WRITING_GUIDE.md` 에 없는 카피는 사용자 확인 대상입니다.
 */

export const SEARCH_PLACEHOLDER = '제목, 태그로 검색';
/**
 * `/posts` 인라인 검색의 제출 버튼 라벨 (§3-8-3).
 *
 * 🔴 **아이콘 단독으로 바꾸지 마세요.** 입력창 안에 이미 돋보기가 있어 같은
 *    화면에 돋보기가 둘이 됩니다. 커밋 기반에서는 "쳐도 아무 일이 안 일어나는"
 *    입력이라 실행 어포던스가 없으면 고장으로 보이고, ⌘K 가 없는 모바일에는
 *    이 버튼이 Enter 외의 유일한 실행 경로입니다.
 */
export const SEARCH_SUBMIT_LABEL = '검색';
export const SEARCH_SCOPE_HINT = '제목·태그·카테고리에서 찾아요';
export const SEARCH_INITIAL_HINT = '검색어를 입력하면 결과가 나와요';
export const SEARCH_EMPTY_TITLE = '일치하는 글이 없어요';
export const SEARCH_EMPTY_DESCRIPTION_DESKTOP =
    '다른 키워드로 찾아보거나, 전체 글을 둘러보세요.';
export const SEARCH_EMPTY_DESCRIPTION_MOBILE =
    '다른 키워드를 넣거나 위 태그에서 골라 보세요.';
export const SEARCH_POPULAR_TAGS_TITLE = '자주 쓰는 태그';

/**
 * 검색어 **없이** 필터만으로 0건일 때. WRITING_GUIDE §6.2 「필터 결과 0」 기성 문구입니다.
 *
 * ⚠️ 현재 데이터에서는 도달하지 않습니다(Study 30 / Survey 9 / Activity 2 전부 ≥1).
 *    그래도 분기를 남기는 이유는 `PostListEmpty.tsx` 주석에 있습니다.
 */
export const FILTER_EMPTY_TITLE = '이 조건에 맞는 글이 없어요';
export const FILTER_EMPTY_DESCRIPTION = '카테고리나 태그를 바꿔보세요.';

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
