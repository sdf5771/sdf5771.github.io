import { useMemo } from 'react';
import { PostCard, Pagination } from '.';
import { POSTS } from '../../data/posts';
import { sortPosts } from '../../utils/postListQuery';
import { FILTER_EMPTY_DESCRIPTION, FILTER_EMPTY_TITLE } from '../../constants/search';
import styles from './PostList.module.css';

interface PostListProps {
    pagination?: {
        page: number;
        limit: number;
    };
    sort?: 'latest' | 'oldest';
    /** 페이지 링크의 기준 경로. `?page=N` 만 붙습니다 */
    urlPath: string;
}

const DEFAULT_LIMIT = 6;

/**
 * 홈의 카드 목록.
 *
 * ⚠️ **이 컴포넌트는 홈(STEP 2) 전용입니다.** 글 목록 화면은 `/posts`
 *    (`src/routes/Posts/Posts.tsx`)이며 행 목록 + 검색·필터·URL 동기화를 씁니다.
 *    카드 그리드는 홈의 선별 카드에만 남습니다(handoff-step4-list.md §2-1).
 *
 * 이번 STEP 에서 바뀐 것 (STEP 2 가 이 파일을 걷어낼 때까지의 임시 상태)
 *  - `usePosts` 삭제에 맞춰 데이터를 `src/data/posts` 에서 동기적으로 받습니다.
 *    로딩·에러 상태가 없어지면서 `로딩 중...`(WRITING_GUIDE §6.4 위반 표기)과
 *    `에러 발생: {message}`(§6.3 명시 금지)도 함께 사라졌습니다.
 *  - `Oops! Sorry, no posts found.`(§6.2 명시 금지 — 영어 + 사과 + 액션 없음)를
 *    기성 문구로 교체했습니다.
 *  - 검색어를 title·tag·category 에 **동시에** 걸던 필터를 들어냈습니다.
 *    홈은 검색을 하지 않고, 그 필터는 결과가 항상 0이었습니다.
 */
function PostList({ pagination, sort = 'latest', urlPath }: PostListProps) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? DEFAULT_LIMIT;

    /* 정렬 타이브레이커([date, slug])는 목록 화면과 **같은 함수**를 씁니다 */
    const sorted = useMemo(() => sortPosts(POSTS, sort), [sort]);
    const visible = useMemo(
        () => sorted.slice((page - 1) * limit, page * limit),
        [sorted, page, limit],
    );

    return (
        <div className={styles.post_list}>
            {visible.length > 0 ? (
                visible.map(post => <PostCard key={post.slug} post={post} />)
            ) : (
                <div className={styles.empty}>
                    <h2 className={styles.empty_title}>{FILTER_EMPTY_TITLE}</h2>
                    <p className={styles.empty_description}>{FILTER_EMPTY_DESCRIPTION}</p>
                </div>
            )}

            <div className={styles.pagination}>
                <Pagination
                    currentPage={page}
                    totalPage={Math.ceil(sorted.length / limit)}
                    buildHref={nextPage => `${urlPath}?page=${nextPage}`}
                />
            </div>
        </div>
    );
}

export default PostList;
