import { useState, useEffect } from 'react';
import type { PostMetadata } from '../types';

interface UsePostsOptions {
    sort?: 'asc' | 'desc';
    filter?: {
        title?: string;
        category?: string;
        tag?: string;
    }
}

function usePosts({ filter, sort = 'desc' }: UsePostsOptions = {}){
    const [posts, setPosts] = useState<PostMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                setLoading(true);

                // read json file and filter posts
                const response = await fetch('/posts-data.json');
                
                if(!response.ok) {
                    throw new Error('Failed to fetch posts');
                }

                let allPostDatas: PostMetadata[] = await response.json();

                /** sort posts */
                if(sort === 'asc'){
                    allPostDatas = allPostDatas.sort((a, b) => a.date.localeCompare(b.date));
                    console.log('asc ', allPostDatas);
                } else {
                    allPostDatas = allPostDatas.sort((a, b) => b.date.localeCompare(a.date));
                    console.log('desc ', allPostDatas);
                }
                
                if(!filter){
                    setPosts(allPostDatas);
                } else {
                    // filter posts
                    /** title filter */
                    if(filter.title){
                        allPostDatas = allPostDatas.filter(post => post.title === filter.title);
                    }

                    /** category filter */
                    if(filter.category){
                        allPostDatas = allPostDatas.filter(post => post.category === filter.category);
                    }

                    /** tag filter */
                    if(filter.tag){
                        allPostDatas = allPostDatas.filter(post => post.keywords.includes(filter.tag || ''));
                    }
                }
            } catch (error) {
                console.error('Failed to load posts:', error);
                setError(new Error('Failed to load posts'));
            } finally {
                setLoading(false);
            }
        }

        loadPosts();
    }, [filter]);

    return {
        posts,
        loading,
        error,
    };
}

export default usePosts;