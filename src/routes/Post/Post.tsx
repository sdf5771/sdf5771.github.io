import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './Post.module.css';
import NotFound from '../NotFound/NotFound';
import MarkdownIt from 'markdown-it';
import markdownItMath from 'markdown-it-katex';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItFootnote from 'markdown-it-footnote';
import hljs from 'highlight.js';
import postsData from '../../../public/posts-data.json';
import type { PostMetadata } from '../../types';

const Post = () => {
    /*
     * 경로가 `/post?id=<slug>` 에서 `/posts/<slug>` 로 바뀌었습니다(§4-8).
     * 구 경로는 LegacyPostRedirect 와 dist/404.html 이 받아 넘겨 줍니다.
     */
    const { slug } = useParams<{ slug: string }>();
    const [htmlContent, setHtmlContent] = useState('');

    /* 글 목록은 빌드 타임 JSON 이라 동기적으로 찾습니다 */
    const post: PostMetadata | undefined = slug
        ? postsData.find(item => item.slug === slug)
        : undefined;

    useEffect(() => {
        if (!post) {
            return;
        }

        /* 다른 글로 이동했을 때 이전 본문이 잠깐 남지 않게 비웁니다 */
        setHtmlContent('');

        const getPost = async () => {
            try {
                const response = await fetch(`/_posts/${post.slug}.md`);
                if(!response.ok) throw new Error('Failed to fetch post');

                const md = new MarkdownIt({
                    html: true,
                    breaks: true,
                    linkify: true,
                    highlight: function (str, lang) {
                        if (lang && hljs.getLanguage(lang)) {
                            try {
                                return hljs.highlight(str, { language: lang }).value;
                            } catch {
                                // 하이라이트에 실패하면 아래에서 원문 그대로 렌더합니다
                            }
                        }
                        return ''; // 언어가 지정되지 않은 경우 기본값 사용
                    }
                })
                .use(markdownItMath) // 수식 플러그인 추가
                .use(markdownItTaskLists) // 체크리스트 플러그인 추가
                .use(markdownItFootnote); // 각주 플러그인 추가
                
                const contentText = await response.text();

                // Front Matter Content
                const content = contentText.replace(/^---[\s\S]*?---\n/, '');

                const htmlContent = md.render(content);
                setHtmlContent(htmlContent);
            } catch (error) {
                /*
                 * 본문 로드 실패는 글이 없다는 뜻이 아닙니다(글 목록에는 있음).
                 * 404 로 보내면 거짓말이 되고, 홈으로 튕기면 주소가 사라집니다.
                 * 머리말은 그대로 두고 본문만 비웁니다 — 전용 오류 화면은 STEP 3 소관.
                 */
                console.error('Failed to fetch post', error);
            }
        };

        // async 함수를 즉시 호출하되, Promise를 반환하지 않도록 void 처리
        void getPost();
        scrollTo(0, 0);
    }, [post]);

    /* 없는 slug 는 홈으로 튕기지 않고 404 를 보여 줍니다 — 주소가 그대로 남습니다 */
    if (!post) {
        return <NotFound />;
    }

    return (
        <div className={styles.main}>
            <section className={styles.article_section}>
                <header className={styles.article_header}>
                    <div className={styles.category}>
                        <span>
                            {post.category}
                        </span>
                    </div>
                    <h1 className={styles.title}>{post.title}</h1>
                    <div className={styles.info_container}>
                        <span className={styles.date}>
                            {post.date ? new Date(post.date).toLocaleDateString() : ''}
                        </span>
                        <div className={styles.dot}></div>
                        <span className={styles.author}>{post.author}</span>
                    </div>
                    <div className={styles.group_wrapper}>
                        <div className={styles.keywords}>
                            {post.keywords.map((keyword: string) => (
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
        </div>
    )
};

export default Post;