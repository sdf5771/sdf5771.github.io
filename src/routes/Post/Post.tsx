import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Post.module.css';
import { GlobalNavigationBar, Footer } from '../../components/shared';
import MarkdownIt from 'markdown-it';
import markdownItMath from 'markdown-it-katex';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItFootnote from 'markdown-it-footnote';
import hljs from 'highlight.js';
import postsData from '../../../public/posts-data.json';
import type { PostMetadata } from '../../types';

const Post = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [postData, setPostData] = useState<PostMetadata | null>(null);
    const [htmlContent, setHtmlContent] = useState('');

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const postId = searchParams.get('id');
        if(!postId) return navigate('/');
        const getPost = async () => {
            try {
                const post = postsData.find(post => post.slug === postId);
                if(!post) throw new Error('Post not found');

                const response = await fetch(`/_posts/${postId}.md`);
                if(!response.ok) throw new Error('Failed to fetch post');

                const md = new MarkdownIt({
                    html: true,
                    breaks: true,
                    linkify: true,
                    highlight: function (str, lang) {
                        if (lang && hljs.getLanguage(lang)) {
                            try {
                                return hljs.highlight(str, { language: lang }).value;
                            } catch (__) {}
                        }
                        return ''; // 언어가 지정되지 않은 경우 기본값 사용
                    }
                })
                .use(markdownItMath) // 수식 플러그인 추가
                .use(markdownItTaskLists) // 체크리스트 플러그인 추가
                .use(markdownItFootnote); // 각주 플러그인 추가
                const contentText = await response.text();
                setPostData(post);

                // Front Matter Content
                const content = contentText.replace(/^---[\s\S]*?---\n/, '');

                const htmlContent = md.render(content);
                setHtmlContent(htmlContent);
            } catch (error) {
                console.error('Failed to fetch post');
                navigate('/');
            }
        }
        getPost();
    }, [location.search])

    return (
        <main className={styles.main}>
            <GlobalNavigationBar />
            <section className={styles.article_section}>
                <header className={styles.article_header}>
                    <div className={styles.category}>
                        <span>
                            {postData?.category}
                        </span>
                    </div>
                    <h1 className={styles.title}>{postData?.title}</h1>
                    <div className={styles.info_container}>
                        <span className={styles.date}>{new Date(postData?.date).toLocaleDateString()}</span>
                        <div className={styles.dot}></div>
                        <span className={styles.author}>{postData?.author}</span>
                    </div>
                    <div className={styles.group_wrapper}>
                        <div className={styles.keywords}>
                            {postData?.keywords.map((keyword: string) => (
                                <div key={keyword} className={styles.tag}>
                                    <span>
                                        #{keyword}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </header>
                <div className={styles.content}
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                />
            </section>
            <Footer />
        </main>
    )
};

export default Post;