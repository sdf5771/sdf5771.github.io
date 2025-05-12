import React, { useMemo } from 'react';
import { usePosts } from '../../hooks';
import { PostCard } from '.';
import styles from './PostList.module.css';
interface PostListProps {
    title?: string;
    pagination?: {
        page: number;
        limit: number;
    }
    sort?: 'asc' | 'desc';
}

function PostList({ title, pagination, sort }: PostListProps) {
    const paginationOptions = useMemo(() => ({
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 10
    }), [pagination?.page, pagination?.limit]);
    
    const { posts, loading, error } = usePosts({
        sort: sort ?? 'desc',
        pagination: paginationOptions
    });

    console.log('posts', posts);

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
        </div>
    );
}

export default PostList;