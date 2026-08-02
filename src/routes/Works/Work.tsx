import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from './Work.module.css';
/*
 * 🔴 페이지 골격과 본문 조판은 **글 상세의 CSS 를 그대로 씁니다**(§6-1 복제 금지).
 *    `composes` 로는 `.content p` 같은 자손 규칙이 따라오지 않아 클래스 자체를
 *    공유합니다. 두 상세 화면의 본문이 서로 다르게 늙는 것을 막는 유일한 방법입니다.
 */
import postStyles from '../Post/Post.module.css';
import NotFound from '../NotFound/NotFound';
import { WorkGlyph } from '../../components/works';
import {
    PostLoadError,
    PostSkeleton,
    PostTocMobile,
    PostTocSidebar,
    ReadingProgress,
} from '../../components/post';
import { findWork, WORK_TYPE_LABEL } from '../../data/works';
import { WORKS_PATH } from '../../constants/site';
import { formatWorkPeriod } from '../../utils/workMeta';
import { renderPostMarkdown } from '../../utils/postMarkdown';
import { COPY_BUTTON_ATTRIBUTE, transformPostContent } from '../../utils/postContent';
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

/**
 * 작업 상세 `/works/<slug>`.
 * 명세: docs/handoff-step7-works.md §6
 *
 * 🔴 **글 상세(STEP 3)의 하위 요소를 그대로 재사용합니다. 복제 금지**(§6-1).
 *    마크다운 렌더러 · 코드블록 + 복사 버튼 · 조건부 KaTeX · 헤딩 앵커 · 목차
 *    수집/활성 판정 · 목차 사이드바/바텀시트 · 이미지 매트 · 스켈레톤 ·
 *    로드 실패 · 저감 모션 처리 전부 같은 컴포넌트입니다.
 *
 * 다른 것은 **4가지뿐**입니다(§6-2).
 *   ① 브레드크럼에 카테고리 세그먼트가 없습니다 (`cd .. / ~/works / <slug>`)
 *   ② 메타가 태그 줄이 아니라 **정의 목록**(`<dl>`)입니다
 *   ③ 시리즈 블록이 없습니다
 *   ④ 이전/다음이 없고 하단은 `← 작업 목록으로` 하나입니다
 *
 * 🔴 이전/다음을 두지 않는 이유: 작업 15건은 **연속 읽기 대상이 아닙니다.**
 *    연도순 인접 항목은 서로 무관한 프로젝트이고 "다음 작업" 이라는 개념이
 *    사용자 머릿속에 없습니다. 글 41편과 다릅니다(§6-2).
 *
 * 🔴 **본문이 없는 slug 는 이 라우트에 도달해도 404 입니다**(§6-5).
 *    목록 리다이렉트는 반려됐습니다 — 사용자가 요청한 것과 다른 페이지를 주면서
 *    성공(200)으로 응답하는 soft-redirect 이고, 목록에 그 항목으로 가는 링크가
 *    애초에 없으므로 정상 경로로는 도달할 수 없습니다.
 */
function Work() {
    const { slug } = useParams<{ slug: string }>();

    const [content, setContent] = useState<LoadedContent>(EMPTY_CONTENT);
    const [status, setStatus] = useState<LoadStatus>('loading');
    const [retryCount, setRetryCount] = useState(0);
    /**
     * 🔴 본문이 뷰포트보다 짧으면 진행바를 렌더하지 않습니다(§6-4).
     *    작업 본문은 짧을 수 있고(초기엔 문단 3~4개), 항상 0% 또는 100% 인
     *    진행바는 정보가 아니라 고장으로 읽힙니다.
     */
    const [isScrollable, setIsScrollable] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);

    const progress = useReadingProgress(contentRef, content.html);
    const activeHeadingId = useActiveHeading(content.headings);

    /*
     * 🔴 slug 정규화를 하지 않습니다. 작업 slug 는 **처음부터 소문자로 만들었고**
     *    (규칙 W1) 파일명 = slug 라 대소문자 이형이 존재하지 않습니다. 글 쪽의
     *    `toPostSlug` 는 기존 41편의 대문자 파일명 때문에 필요한 장치입니다.
     *    대문자 주소는 `public/404.html` 의 인라인 스크립트가 소문자로 넘깁니다.
     */
    const work = slug ? findWork(slug) : undefined;

    /* 상세 유무 판정. 본문 없는 항목은 라우트가 없는 것과 같습니다(§6-5 ③) */
    const isRoutable = Boolean(work?.hasBody);

    useEffect(() => {
        if (!work || !isRoutable) {
            return;
        }

        /* 작업에서 작업으로 이동하는 경로는 없지만, 재시도 경합은 막아 둡니다 */
        let isActive = true;

        setStatus('loading');
        setContent(EMPTY_CONTENT);

        const loadWork = async () => {
            try {
                /* 🔴 파일명 = slug 입니다(글과 달리 `file` 필드가 없습니다) */
                const response = await fetch(`/_works/${encodeURIComponent(work.slug)}.md`);

                if (!response.ok) {
                    throw new Error(`본문을 불러오지 못했습니다 (${response.status})`);
                }

                const markdown = await response.text();
                const rendered = await renderPostMarkdown(markdown);
                /* 작업 본문에는 빌드가 읽어 둔 이미지 크기가 없습니다 — 매트만 씌웁니다 */
                const transformed = transformPostContent(rendered);

                if (transformed.hasMath) {
                    await import('katex/dist/katex.min.css');
                }

                if (!isActive) {
                    return;
                }

                setContent({ html: transformed.html, headings: transformed.headings });
                setStatus('ready');
            } catch (error) {
                console.error('Failed to fetch work', error);

                if (isActive) {
                    setStatus('error');
                }
            }
        };

        void loadWork();

        return () => {
            isActive = false;
        };
    }, [work, isRoutable, retryCount]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [work?.slug]);

    /* 본문 높이 ↔ 뷰포트 비교. 이미지 로드로 높이가 변할 수 있어 관찰도 겁니다 */
    useEffect(() => {
        const node = contentRef.current;

        if (!node) {
            setIsScrollable(false);
            return;
        }

        const measure = () => setIsScrollable(node.offsetHeight > window.innerHeight);

        measure();
        window.addEventListener('resize', measure);

        const observer = new ResizeObserver(measure);
        observer.observe(node);

        return () => {
            window.removeEventListener('resize', measure);
            observer.disconnect();
        };
    }, [content.html]);

    /* 코드 복사 — 글 상세와 같은 위임 처리입니다(§6-1) */
    const handleContentClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const button = (event.target as HTMLElement).closest(`[${COPY_BUTTON_ATTRIBUTE}]`);

        if (!(button instanceof HTMLButtonElement)) {
            return;
        }

        const code = button.closest('figure')?.querySelector('pre')?.textContent ?? '';

        void copyText(code).then(isCopied => {
            /* 복사되지 않았는데 `복사됨` 을 띄우는 것이 침묵보다 나쁩니다 */
            if (!isCopied) {
                return;
            }

            button.textContent = '복사됨';
            button.dataset.copied = 'true';

            window.setTimeout(() => {
                button.textContent = '복사';
                delete button.dataset.copied;
            }, COPY_FEEDBACK_MS);
        });
    }, []);

    /*
     * 🔴 없는 slug 도, **본문 없는 slug 도** 404 입니다. 주소는 그대로 남고
     *    404 화면의 CTA 가 `/works*` 문맥이라 `작업 목록으로` 를 먼저 보여 줍니다.
     */
    if (!work || !isRoutable) {
        return <NotFound />;
    }

    const period = formatWorkPeriod(work.start, work.end);

    return (
        <div className={postStyles.page}>
            {isScrollable && <ReadingProgress percent={progress} />}

            <article className={postStyles.article}>
                <header className={styles.header}>
                    {/* `cd ..` / `~/works` / `<slug>` — 전부 라틴이라 모노 11px 통과(§10-1 23번) */}
                    <nav className={styles.breadcrumb} aria-label="현재 위치">
                        <Link
                            className={styles.breadcrumb_link}
                            to={WORKS_PATH}
                            /* 링크 텍스트만으로 목적지를 알 수 없으므로 이름이 필수입니다(§7.2) */
                            aria-label="작업 목록으로"
                        >
                            cd ..
                        </Link>
                        <span aria-hidden="true">/</span>
                        <span>~/works</span>
                        <span aria-hidden="true">/</span>
                        <span className={styles.breadcrumb_slug}>{work.slug}</span>
                    </nav>

                    {/*
                     * 히어로 = 생성 그래픽. 🔴 실제 화면 캡처는 히어로에 쓰지
                     * 않습니다(§6-4) — 개인·팀 3건만 사진 히어로가 되면 상세
                     * 화면들 사이에 위계가 생깁니다.
                     *
                     * ⚠️ 명세는 "전폭" 이라고 적었지만 `viewBox` 를 가로로 늘이면
                     *    격자가 찌그러져 조형이 무너집니다. 전폭 매트 위에 타일을
                     *    3배(288×192)로 **비율 그대로** 놓습니다.
                     */}
                    <div className={styles.hero} role="presentation">
                        <WorkGlyph
                            className={styles.hero_glyph}
                            slug={work.slug}
                            stackCount={work.stack.length}
                        />
                    </div>

                    {/* 🔴 제목을 클램프하지 않습니다 — 상세에서는 전문이 보여야 합니다(§6.11) */}
                    <h1 className={styles.title}>{work.title}</h1>

                    {/*
                     * 🔴 `<dl>` 입니다. 시안의 `<div>` 2열 그리드는 라벨과 값의
                     *    관계가 표현되지 않습니다(§6-3).
                     * 🔴 `org` 는 렌더하지 않습니다(§13-1 안 A).
                     * 🔴 `외부 링크는 업무 항목에 없습니다` 같은 문장을 두지
                     *    않습니다 — 없는 것을 설명하는 문장이고 익명화 제약을
                     *    사용자에게 상기시킵니다. 링크가 없으면 줄 자체가 없습니다.
                     */}
                    <dl className={styles.meta}>
                        <dt>기간</dt>
                        <dd className={styles.meta_period}>
                            {period.months}
                            {period.isOngoing && <span className={styles.ongoing}> 진행 중</span>}
                        </dd>

                        <dt>역할</dt>
                        <dd>{`${work.role} · ${WORK_TYPE_LABEL[work.type]}`}</dd>

                        {work.stack.length > 0 && (
                            <>
                                <dt>기술 스택</dt>
                                <dd>
                                    {/* 🔴 상세에서는 `+N` 없이 **전부 노출**합니다(§6-3) */}
                                    <ul className={styles.stack}>
                                        {work.stack.map(item => (
                                            <li key={item} className={styles.stack_chip}>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </dd>
                            </>
                        )}

                        {work.links.length > 0 && (
                            <>
                                <dt>링크</dt>
                                <dd className={styles.links}>
                                    {work.links.map(link => (
                                        <a
                                            key={link.url}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`${link.label} (새 창)`}
                                        >
                                            {link.label}
                                            <span aria-hidden="true"> ↗</span>
                                        </a>
                                    ))}
                                </dd>
                            </>
                        )}

                        {work.relatedPost && (
                            <>
                                <dt>관련 글</dt>
                                <dd>
                                    <Link
                                        className={styles.related}
                                        to={`/posts/${work.relatedPost}`}
                                        aria-label={`${work.title} 관련 글 보기`}
                                    >
                                        관련 글 보기
                                    </Link>
                                </dd>
                            </>
                        )}
                    </dl>
                </header>

                <div className={postStyles.body}>
                    <div className={postStyles.main_column}>
                        {status === 'loading' && <PostSkeleton />}

                        {status === 'error' && (
                            <PostLoadError
                                path={`/_works/${work.slug}.md`}
                                onRetry={() => setRetryCount(count => count + 1)}
                            />
                        )}

                        {status === 'ready' && (
                            <div
                                ref={contentRef}
                                className={postStyles.content}
                                onClick={handleContentClick}
                                /* 콘텐츠가 본인 소유라 XSS 위험이 없습니다. `<script>` 는 변환에서 제거됩니다 */
                                dangerouslySetInnerHTML={{ __html: content.html }}
                            />
                        )}
                    </div>

                    {/* H2/H3 가 2개 미만이면 컴포넌트가 스스로 렌더하지 않습니다(§6-4) */}
                    <PostTocSidebar headings={content.headings} activeId={activeHeadingId} />
                </div>

                {/* 🔴 이전/다음이 없습니다. 하단은 이 링크 하나입니다(§6-2 ④) */}
                <div className={styles.footer}>
                    <Link className={styles.back} to={WORKS_PATH}>
                        <span aria-hidden="true">← </span>
                        작업 목록으로
                    </Link>
                </div>
            </article>

            <PostTocMobile
                headings={content.headings}
                activeId={activeHeadingId}
                percent={progress}
            />
        </div>
    );
}

export default Work;
