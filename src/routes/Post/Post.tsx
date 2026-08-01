import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import styles from './Post.module.css';
import NotFound from '../NotFound/NotFound';
import {
    PostHeader,
    PostLoadError,
    PostNeighbors,
    PostSkeleton,
    PostTocMobile,
    PostTocSidebar,
    ReadingProgress,
} from '../../components/post';
import { POSTS } from '../../data/posts';
import type { PostMetadata } from '../../types';
import { toPostSlug } from '../../utils/postSlug';
import { renderPostMarkdown } from '../../utils/postMarkdown';
import {
    COPY_BUTTON_ATTRIBUTE,
    CONTENT_CLASS,
    transformPostContent,
} from '../../utils/postContent';
import type { PostHeading } from '../../utils/postContent';
import { copyText } from '../../utils/clipboard';
import { useActiveHeading, useReadingProgress } from '../../hooks';

/** 복사 완료 라벨이 원복되기까지(ms). WRITING_GUIDE §6.12 확정값입니다 */
const COPY_FEEDBACK_MS = 1400;

type LoadStatus = 'loading' | 'ready' | 'error';

interface LoadedContent {
    html: string;
    headings: PostHeading[];
}

const EMPTY_CONTENT: LoadedContent = { html: '', headings: [] };

const Post = () => {
    /*
     * 경로가 `/post?id=<slug>` 에서 `/posts/<slug>` 로 바뀌었습니다(§15-1).
     * 구 경로는 LegacyPostRedirect 와 dist/404.html 이 받아 넘겨 줍니다.
     */
    const { slug } = useParams<{ slug: string }>();

    const [content, setContent] = useState<LoadedContent>(EMPTY_CONTENT);
    const [status, setStatus] = useState<LoadStatus>('loading');
    /** `다시 시도` 가 effect 를 다시 돌리기 위한 카운터입니다 */
    const [retryCount, setRetryCount] = useState(0);
    const [isLinkCopied, setIsLinkCopied] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);

    /* 두 번째 인자는 "본문이 실제로 마운트됐다" 를 알리는 트리거입니다 — 훅 주석 참고 */
    const progress = useReadingProgress(contentRef, content.html);
    const activeHeadingId = useActiveHeading(content.headings);

    /*
     * 정본 slug 는 **소문자**입니다(product.md §7-3 R3). 대문자가 섞인 주소로
     * 들어와도 같은 글을 찾을 수 있게 요청 slug 를 같은 규칙으로 정규화합니다 —
     * 41편 중 33편의 파일명에 대문자가 있어, 정규화가 없으면 그 글들의 딥링크가
     * 전부 404 가 됩니다.
     */
    const requestedSlug = slug ? toPostSlug(slug) : '';

    /* 글 목록은 빌드 타임 JSON 이라 동기적으로 찾습니다 */
    const post: PostMetadata | undefined = requestedSlug
        ? POSTS.find(item => item.slug === requestedSlug)
        : undefined;

    /* ------------------------------------------------------------
     * 본문 로드
     * ---------------------------------------------------------- */
    useEffect(() => {
        if (!post) {
            return;
        }

        /*
         * 🔴 경합 가드. 글 A → B 로 빠르게 이동하면 A 의 fetch 가 B 보다 늦게
         *    resolve 될 수 있고, 그러면 **B 의 제목·태그 아래에 A 의 본문**이
         *    남습니다. 머리말은 동기 렌더라 이미 B 인데 본문만 A 인 상태이고,
         *    다시 이동하기 전까지 스스로 교정되지 않습니다.
         *
         *    ⚠️ 이 가드는 이제 **실효를 갖습니다.** STEP 4 에서 검색 결과와
         *    목록이 생겨 글에서 글로 곧장 넘어가는 경로가 실제로 존재합니다.
         *    늦게 도착한 응답은 버립니다.
         */
        let isActive = true;

        setStatus('loading');
        /* 다른 글로 이동했을 때 이전 본문이 잠깐 남지 않게 비웁니다 */
        setContent(EMPTY_CONTENT);

        const loadPost = async () => {
            try {
                /*
                 * 🔴 slug 가 아니라 **원본 파일명(post.file)** 으로 읽습니다.
                 * slug 는 소문자 정본이지만 디스크의 파일명에는 대문자가 남아
                 * 있고(41편 중 33편), GitHub Pages(Linux)는 대소문자를 구분합니다.
                 * slug(URL)와 file(디스크)을 다시 하나로 합치지 마세요.
                 */
                const response = await fetch(`/_posts/${encodeURIComponent(post.file)}`);
                if (!response.ok) {
                    throw new Error(`본문을 불러오지 못했습니다 (${response.status})`);
                }

                const markdown = await response.text();
                /* 수식이 있는 글에서만 katex 플러그인이 여기서 동적 로드됩니다 */
                const rendered = await renderPostMarkdown(markdown);

                /*
                 * 후처리는 **DOM 위에서** 합니다 — 원시 HTML `<h2>` 8개를 놓치지
                 * 않으려면 마크다운 토큰이 아니라 렌더 결과를 봐야 합니다(§5-4).
                 * 목차도 같은 순회에서 나옵니다.
                 */
                const transformed = transformPostContent(rendered, post.imageSizes);

                /*
                 * 🔴 KaTeX CSS 는 **수식이 실제로 렌더된 글에서만** 내려받습니다.
                 *    41편 중 1편에서 3회 쓰이고 그중 2개는 지금도 파싱 실패로
                 *    평문입니다. 전역 로드면 40편이 쓰지도 않는 21KB 를 물고
                 *    다닙니다(§7-1). 폰트 2.1MB 는 실제 렌더될 때만 따라옵니다.
                 */
                if (transformed.hasMath) {
                    await import('katex/dist/katex.min.css');
                }

                /* 그 사이 다른 글로 이동했으면 이 응답은 버립니다 */
                if (!isActive) {
                    return;
                }

                setContent({ html: transformed.html, headings: transformed.headings });
                setStatus('ready');
            } catch (error) {
                if (!isActive) {
                    return;
                }

                /*
                 * 본문 로드 실패는 글이 없다는 뜻이 아닙니다(글 목록에는 있음).
                 * 404 로 보내면 거짓말이 되고, 홈으로 튕기면 주소가 사라집니다.
                 * 머리말은 그대로 두고 본문 자리에만 회복 경로를 그립니다(§12-2).
                 */
                console.error('Failed to fetch post', error);
                setStatus('error');
            }
        };

        void loadPost();

        return () => {
            isActive = false;
        };
    }, [post, retryCount]);

    /* 글이 바뀌면 맨 위에서 시작합니다 */
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [post?.slug]);

    /* ------------------------------------------------------------
     * 코드 복사 — 위임 처리
     * ------------------------------------------------------------
     * 본문은 `dangerouslySetInnerHTML` 로 들어가므로 버튼마다 React 핸들러를
     * 붙일 수 없습니다. 컨테이너 하나에서 위임합니다 — 코드 블록이 한 글에
     * 최대 수십 개라 리스너를 그만큼 만들 이유도 없습니다.
     * ---------------------------------------------------------- */
    const handleContentClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const button = (event.target as HTMLElement).closest(`[${COPY_BUTTON_ATTRIBUTE}]`);
        if (!(button instanceof HTMLButtonElement)) {
            return;
        }

        const code = button.closest('figure')?.querySelector('pre')?.textContent ?? '';

        void copyText(code).then(isCopied => {
            /* 🔴 실패했으면 아무 말도 하지 않습니다 — 복사되지 않았는데
               `복사됨` 을 띄우는 것이 침묵보다 나쁩니다(utils/clipboard.ts) */
            if (!isCopied) {
                return;
            }

            /* 확정 카피 — `복사` → `복사됨`(§6.1) */
            button.textContent = '복사됨';
            button.dataset.copied = 'true';

            window.setTimeout(() => {
                button.textContent = '복사';
                delete button.dataset.copied;
            }, COPY_FEEDBACK_MS);
        });
    }, []);

    /*
     * 이미지 로드 실패(§12-3). `error` 는 **버블링하지 않으므로** 캡처 단계에서
     * 잡습니다. 깨진 이미지 아이콘을 그대로 노출하지 않고, 매트만 남긴 채
     * 안내를 넣습니다. `alt` 원문이 있으면 함께 보여 정보를 보존합니다.
     */
    useEffect(() => {
        const container = contentRef.current;
        if (!container) {
            return;
        }

        const handleError = (event: Event) => {
            const image = event.target;
            if (!(image instanceof HTMLImageElement)) {
                return;
            }

            const matte = image.closest(`.${CONTENT_CLASS.matte}`);
            if (!matte) {
                return;
            }

            const alt = image.getAttribute('data-alt');
            const notice = document.createElement('p');
            notice.className = CONTENT_CLASS.imageError;
            notice.textContent = alt
                ? `이미지를 불러오지 못했어요 — ${alt}`
                : '이미지를 불러오지 못했어요';

            matte.replaceChildren(notice);
        };

        container.addEventListener('error', handleError, true);
        return () => container.removeEventListener('error', handleError, true);
    }, [content.html]);

    const handleCopyLink = useCallback(() => {
        void copyText(window.location.href).then(isCopied => {
            if (!isCopied) {
                return;
            }

            setIsLinkCopied(true);
            window.setTimeout(() => setIsLinkCopied(false), COPY_FEEDBACK_MS);
        });
    }, []);

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
        <div className={styles.page}>
            <ReadingProgress percent={progress} />

            <article className={styles.article}>
                <PostHeader post={post} />

                <div className={styles.body}>
                    <div className={styles.main_column}>
                        {status === 'loading' && <PostSkeleton />}

                        {status === 'error' && (
                            <PostLoadError
                                path={`/_posts/${post.file}`}
                                onRetry={() => setRetryCount(count => count + 1)}
                            />
                        )}

                        {status === 'ready' && (
                            <>
                                {/*
                                 * 본문. 콘텐츠가 본인 소유라 XSS 위험이 없어
                                 * `html: true` 를 유지합니다(§5-2). `<script>` 는
                                 * 변환 단계에서 이미 제거했습니다(§5-6).
                                 */}
                                <div
                                    ref={contentRef}
                                    className={styles.content}
                                    onClick={handleContentClick}
                                    dangerouslySetInnerHTML={{ __html: content.html }}
                                />

                                <div className={styles.article_footer}>
                                    <button
                                        type="button"
                                        className={styles.copy_link}
                                        data-copied={isLinkCopied ? 'true' : undefined}
                                        onClick={handleCopyLink}
                                    >
                                        {/* 확정 카피 — `링크 복사` → `복사됨`(§6.12) */}
                                        {isLinkCopied ? '복사됨' : '링크 복사'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/*
                         * 🔴 완료 알림은 별도 live 영역에 **텍스트만** 넣습니다.
                         *    체크 기호를 aria-live 에 넣지 마세요(§7.4).
                         */}
                        <p className="sr-only" role="status" aria-live="polite">
                            {isLinkCopied ? '복사됨' : ''}
                        </p>
                    </div>

                    <PostTocSidebar headings={content.headings} activeId={activeHeadingId} />
                </div>

                <PostNeighbors slug={post.slug} />
            </article>

            <PostTocMobile
                headings={content.headings}
                activeId={activeHeadingId}
                percent={progress}
            />
        </div>
    );
};

export default Post;
