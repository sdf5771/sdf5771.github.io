import { Link } from 'react-router-dom';
import styles from './PostHeader.module.css';
import PostTags from './PostTags';
import type { PostMetadata } from '../../types';
import { POST_LIST_PATH } from '../../constants/site';
import { formatPostDate, formatReadingMinutes } from '../../utils/postMeta';

/**
 * 브레드크럼 · 히어로 · 제목 · 메타 · 태그 · 시리즈.
 * 명세: docs/handoff-step3-post.md §4-2 ~ §4-5 · §18(확정 카피)
 */

/** 카테고리 → 히어로 그라데이션 토큰. 썸네일이 없는 17편이 씁니다(§4-3) */
const HERO_GRADIENT: Record<string, string> = {
    Survey: 'var(--gradient-hero-survey)',
    Study: 'var(--gradient-hero-study)',
    Activity: 'var(--gradient-hero-activity)',
};

function Breadcrumb({ post }: { post: PostMetadata }) {
    return (
        <nav className={styles.breadcrumb} aria-label="현재 위치">
            {/*
             * `cd ..` 만 링크입니다. 🔴 링크 텍스트만으로 목적지를 알 수 없으므로
             * aria-label 이 필수입니다(§7.2).
             */}
            <Link className={styles.breadcrumb_link} to={POST_LIST_PATH} aria-label="글 목록으로">
                cd ..
            </Link>
            <span aria-hidden="true">/</span>
            <span>~/posts</span>
            <span aria-hidden="true">/</span>
            <span className={styles.breadcrumb_category} data-category={post.category}>
                {post.category}
            </span>
            <span aria-hidden="true">/</span>
            {/* slug 최장 97자 — 가로 스크롤로 흘립니다(§4-2) */}
            <span className={styles.breadcrumb_slug}>{post.slug}</span>
        </nav>
    );
}

function Hero({ post }: { post: PostMetadata }) {
    const hasThumbnail = Boolean(post.thumbnail);

    return (
        <div
            className={styles.hero}
            /*
             * 썸네일이 없으면 카테고리 그라데이션입니다. 🔴 이모지를 얹지 않습니다 —
             * 41편에 이모지 필드가 없어서 자동 할당하면 부정확한 이모지가 붙습니다(§4-3).
             */
            style={
                hasThumbnail
                    ? undefined
                    : { background: HERO_GRADIENT[post.category] ?? 'var(--gradient-hero-study)' }
            }
            /* 그라데이션 히어로는 순수 장식입니다(§7.1) */
            role="presentation"
        >
            {hasThumbnail && (
                <img
                    className={styles.hero_image}
                    src={post.thumbnail}
                    alt=""
                    /* 첫 화면 이미지라 지연 로드하지 않습니다(§11-2 요구 5) */
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                />
            )}
            <span className={styles.hero_badge}>{post.category}</span>
        </div>
    );
}

function Series({ post }: { post: PostMetadata }) {
    const { series } = post;

    /* 🔴 시리즈가 아니면 **블록 자체가 없습니다.** 시안이 시리즈 아닌 글에
       "2편 중 1편" 을 붙인 것은 데이터 오류였습니다(§4-5 · §13-2) */
    if (!series) {
        return null;
    }

    return (
        <aside className={styles.series}>
            <p className={styles.series_label}>
                시리즈 · {series.total}편 중 {series.index}편
            </p>

            {series.next ? (
                /* 🔴 링크 텍스트가 `다음 편` 만이면 안 됩니다 — 접근 가능한 이름에
                   글 제목이 들어가야 합니다(§7.2). `<a>` 안에 전체를 넣습니다 */
                <Link className={styles.series_next} to={`/posts/${series.next.slug}`}>
                    다음 편 — {series.next.title}
                </Link>
            ) : (
                <p className={styles.series_end}>이어지는 편이 아직 없습니다</p>
            )}
        </aside>
    );
}

export default function PostHeader({ post }: { post: PostMetadata }) {
    const readingMinutes = formatReadingMinutes(post.readingMinutes);

    return (
        <header className={styles.header}>
            <Breadcrumb post={post} />
            <Hero post={post} />

            {/*
             * 🔴 제목을 클램프하지 않습니다. 글 제목은 전문이 보여야 합니다(§6.11).
             *    최장 96자라 모바일에서 8행이 되지만 그게 맞습니다 —
             *    2행 클램프는 목록·이전/다음 카드에만 적용합니다(§13-1).
             */}
            <h1 className={styles.title}>{post.title}</h1>

            {/*
             * 형식 고정: 카테고리 · 날짜 · 읽기 시간 (§6.7).
             * 🔴 저자를 표시하지 않습니다 — 41편이 전부 같은 저자라 정보량이 0 이고,
             *    그 자리를 읽기 시간이 씁니다. (구 코드는 저자를 표시했습니다)
             */}
            <p className={styles.meta}>
                <span className={styles.meta_category}>
                    {/* 카테고리는 색 점 + 텍스트 병기. 색 단독 전달 금지(§7.5) */}
                    <span className={styles.meta_dot} data-category={post.category} aria-hidden="true" />
                    {post.category}
                </span>
                <span aria-hidden="true">·</span>
                {/* 🔴 toLocaleDateString() 은 로케일에 따라 결과가 달라집니다 — 고정 포매터 */}
                <span>{formatPostDate(post.date)}</span>
                {readingMinutes && (
                    <>
                        <span aria-hidden="true">·</span>
                        <span>{readingMinutes}</span>
                    </>
                )}
            </p>

            <PostTags tags={post.keywords} />
            <Series post={post} />
        </header>
    );
}
