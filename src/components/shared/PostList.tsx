import React from 'react';
import { usePosts } from '../../hooks';

function PostList() {
    const { posts, loading, error } = usePosts(
        {
            sort: 'desc'
        }
    );

    return (
        <div>
            {posts.map((post) => (
                <div key={post.slug}>
                    <h2>{post.title}</h2>
                    <p>{post.description}</p>
                </div>
            ))}
        </div>
    );
}

export default PostList;