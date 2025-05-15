import React, { useMemo } from 'react';
import { usePosts } from '../../hooks';
import { PostCard, Pagination } from '.';
import styles from './PostList.module.css';
interface PostListProps {
    searchKeyword?: string;
    pagination?: {
        page: number;
        limit: number;
    }
    sort?: 'asc' | 'desc';
    urlPath: string;
}

function PostList({ searchKeyword, pagination, sort, urlPath }: PostListProps) {
    const filterOptions = useMemo(() => {
        return {
            title: searchKeyword ?? undefined,
            tag: searchKeyword ?? undefined,
            category: searchKeyword ?? undefined,
        }
    }, [searchKeyword]);

    const paginationOptions = useMemo(() => ({
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 6
    }), [pagination?.page, pagination?.limit]);
    
    const { posts, loading, error, allPostCount } = usePosts({
        sort: sort ?? 'desc',
        pagination: paginationOptions,
        filter: filterOptions
    });

    if (loading) return <div>로딩 중...</div>;
    if (error) return <div>에러 발생: {error.message}</div>;

    return (
        <div className={styles.post_list}>
            {posts && posts.length > 0 ? posts.map((post) => (
                <PostCard key={post.slug} post={post} />
            )) : (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    width: '100%',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                }}>
                    <h2>Oops! Sorry, no posts found.</h2>
                </div>
            )}
            <div className={styles.pagination}>
                {
                    pagination && pagination.page && (
                        <Pagination currentPage={pagination.page} totalPage={Math.ceil(allPostCount / (pagination.limit ?? 6))} urlPath={urlPath} />
                    )
                }
            </div>
        </div>
    );
}

export default PostList;