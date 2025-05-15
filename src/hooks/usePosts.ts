import { useState, useEffect } from 'react';
import type { PostMetadata } from '../types';

interface UsePostsOptions {
    sort?: 'asc' | 'desc';
    filter?: {
        title?: string;
        category?: string;
        tag?: string;
    }
    pagination?: {
        page?: number;
        limit?: number;
    }
}

function usePosts({ filter, sort = 'desc', pagination }: UsePostsOptions){
    const [posts, setPosts] = useState<PostMetadata[]>([]);
    const [allPostCount, setAllPostCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                setLoading(true);
                const isSortAsc = sort === 'asc';
                const isLimitPagination = pagination?.limit;

                // read json file and filter posts
                const response = await fetch('/posts-data.json');
                
                if(!response.ok) {
                    throw new Error('Failed to fetch posts');
                }

                let allPostDatas: PostMetadata[] = await response.json();

                /** sort posts */
                if(isSortAsc){
                    allPostDatas = allPostDatas.sort((a, b) => a.date.localeCompare(b.date));
                    console.log('asc ', allPostDatas);
                } else {
                    allPostDatas = allPostDatas.sort((a, b) => b.date.localeCompare(a.date));
                    console.log('desc ', allPostDatas);
                }

                setAllPostCount(allPostDatas.length);
                
                // filter posts
                /** title filter */
                if(filter?.title){
                    allPostDatas = allPostDatas.filter(post => post.title === filter.title);
                }

                /** category filter */
                if(filter?.category){
                    allPostDatas = allPostDatas.filter(post => post.category === filter.category);
                }

                /** tag filter */
                if(filter?.tag){
                    allPostDatas = allPostDatas.filter(post => post.keywords.includes(filter.tag || ''));
                }

                

                /** pagination */
                if(pagination && pagination.page && pagination.limit && isLimitPagination){
                    const startIndex = (pagination.page - 1) * pagination.limit;
                    const endIndex = startIndex + pagination.limit;
                    setPosts(allPostDatas.slice(startIndex, endIndex));
                } else {
                    setPosts(allPostDatas);
                }
            } catch (error) {
                console.error('Failed to load posts:', error);
                setError(new Error('Failed to load posts'));
            } finally {
                setLoading(false);
            }
        }

        loadPosts();
    }, [filter, sort, pagination]);

    return {
        posts,
        loading,
        error,
        allPostCount,
    };
}

export default usePosts;