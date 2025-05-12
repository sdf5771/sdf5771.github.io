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
        limit: pagination?.limit ?? 10
    }), [pagination?.page, pagination?.limit]);
    
    const { posts, loading, error } = usePosts({
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
                <div>
                    <h2>No posts</h2>
                </div>
            )}
            {
                pagination && pagination.limit && pagination.page && (
                    <Pagination currentPage={pagination.page} totalPage={pagination.limit} urlPath={urlPath} />
                )
            }
        </div>
    );
}

export default PostList;