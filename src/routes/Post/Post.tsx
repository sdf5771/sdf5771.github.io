import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import styles from './Post.module.css';
import NotFound from '../NotFound/NotFound';
import MarkdownIt from 'markdown-it';
import markdownItMath from 'markdown-it-katex';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItFootnote from 'markdown-it-footnote';
import hljs from 'highlight.js';
import postsData from '../../../public/posts-data.json';
import type { PostMetadata } from '../../types';
import { toPostSlug } from '../../utils/postSlug';

const Post = () => {
    /*
     * 경로가 `/post?id=<slug>` 에서 `/posts/<slug>` 로 바뀌었습니다(§4-8).
     * 구 경로는 LegacyPostRedirect 와 dist/404.html 이 받아 넘겨 줍니다.
     */
    const { slug } = useParams<{ slug: string }>();
    const [htmlContent, setHtmlContent] = useState('');

    /*
     * 정본 slug 는 **소문자**입니다(product.md §7-3 R3). 대문자가 섞인 주소로
     * 들어와도 같은 글을 찾을 수 있게 요청 slug 를 같은 규칙으로 정규화합니다 —
     * 41편 중 33편의 파일명에 대문자가 있어, 정규화가 없으면 그 글들의 딥링크가
     * 전부 404 가 됩니다.
     */
    const requestedSlug = slug ? toPostSlug(slug) : '';

    /* 글 목록은 빌드 타임 JSON 이라 동기적으로 찾습니다 */
    const post: PostMetadata | undefined = requestedSlug
        ? postsData.find(item => item.slug === requestedSlug)
        : undefined;

    useEffect(() => {
        if (!post) {
            return;
        }

        /* 다른 글로 이동했을 때 이전 본문이 잠깐 남지 않게 비웁니다 */
        setHtmlContent('');

        const getPost = async () => {
            try {
                /*
                 * 🔴 slug 가 아니라 **원본 파일명(post.file)** 으로 읽습니다.
                 * slug 는 소문자 정본이고 디스크의 파일명에는 대문자가 남아
                 * 있는데, GitHub Pages(Linux)는 대소문자를 구분합니다.
                 * macOS 로컬에서는 둘 다 통과해 차이가 드러나지 않습니다.
                 */
                const response = await fetch(`/_posts/${encodeURIComponent(post.file)}`);
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

    /*
     * 대문자 등 비정본 표기로 들어왔으면 정본 주소로 한 번 바꿔 둡니다(§15-1).
     * 프로덕션에서는 404.html 인라인 스크립트가 먼저 처리하지만, dev 서버와
     * SPA 내부 이동에는 그 스크립트가 없습니다. 주소·공유 링크·`~/posts/…` 경로
     * 표시가 항상 한 가지 형태로 수렴합니다. `replace` 라 뒤로 가기가 튕기지 않습니다.
     */
    if (slug !== post.slug) {
        return <Navigate to={`/posts/${post.slug}`} replace />;
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