import { Link } from 'react-router-dom';
import styles from './PostCard.module.css';
import PostGlyph from '../posts/PostGlyph';
import type { PostMetadata } from '../../types';
import { formatPostDate, formatReadingMinutes } from '../../utils/postMeta';

/**
 * 홈 「읽어볼 만한 글」 카드.
 * 명세: docs/handoff-step2-home.md §5-3 · §8-4
 *
 * ⚠️ **홈 전용입니다.** 글 목록 `/posts` 와 홈의 「최근 글」은 행 컴포넌트
 *    `src/components/posts/PostRow.tsx` 를 씁니다 — 요약이 41편 중 1편뿐이라
 *    목록에서는 카드의 설명 블록이 기계 추출 파편이 됩니다
 *    (handoff-step4-list.md §2-1). 여기서는 **손으로 쓴 한 줄(`note`)** 이
 *    있어서 카드가 성립합니다. 그래서 `shared/` 가 아니라 `home/` 에 있습니다.
 *
 * 🔴 접근 가능한 이름 = **글 제목뿐**입니다.
 *    직전 구현은 카드 전체를 `<Link>` 로 감쌌고, 그 안이
 *    `썸네일 → 태그 전량 → <h2>제목` 순서라 링크 이름이
 *    `"Web Frontend AI ML Google … 클라이언트 AI의 시대 …"` 로 읽혔습니다.
 *    스크린리더의 링크 목록에서 글을 구분할 수 없는 상태였습니다.
 *    제목만 `<a>` 로 감싸고 카드 전체는 `.link::after` 가 덮습니다 —
 *    ⌘+클릭 새 탭·가운데 클릭·주소 복사·크롤러 인식은 전부 그대로입니다
 *    (코드 리뷰 Y-7 이 요구한 것이 `<a>` 의 존재이지 감싸는 범위가 아닙니다).
 *
 * 🔴 태그를 그리지 않습니다. 직전 구현은 `keywords.map` 으로 **전량**을
 *    렌더해서 태그 15개짜리 글이 카드를 무너뜨렸습니다. 명세의 카드 구성
 *    (§5-3)에 태그가 없습니다 — 카드의 설명 자리는 `note` 가 씁니다.
 *
 * 🔴 `post.author` 를 표시하지 않습니다. 41편이 전부 같은 저자라 정보량이
 *    0 이고, 그 자리를 읽기 시간이 씁니다(WRITING_GUIDE §6.7).
 */

interface PostCardProps {
    post: PostMetadata;
    /** 손으로 쓴 한 줄. `description` 도, 제목 자르기 폴백도 쓰지 않습니다 */
    note: string;
}

function PostCard({ post, note }: PostCardProps) {
    const thumbnailSize = post.imageSizes?.[post.thumbnail];

    return (
        <li className={styles.card} data-category={post.category}>
            <div className={styles.thumbnail}>
                {post.thumbnail ? (
                    /*
                     * 바로 아래에 같은 제목이 있습니다. alt 에 제목을 넣으면
                     * 스크린리더가 제목을 두 번 읽습니다(WRITING_GUIDE §7.1).
                     */
                    <img
                        className={styles.thumbnail_image}
                        src={post.thumbnail}
                        alt=""
                        aria-hidden="true"
                        width={thumbnailSize?.width}
                        height={thumbnailSize?.height}
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    /*
                     * 썸네일이 없으면 생성 그래픽입니다. 명세 §8-4 는 "대표 태그
                     * 원문" 을 제시했지만, 그 뒤 사용자가 썸네일을 생성 그래픽으로
                     * 통일하기로 확정했고 `PostGlyph` 가 이미 그 조형(점 + 연결선,
                     * 카테고리 색)을 갖고 있습니다. 결정론적이고, 정보를 담고,
                     * 결핍을 말하지 않는다는 §8-4 의 요구를 그대로 만족합니다.
                     */
                    <PostGlyph
                        className={styles.thumbnail_glyph}
                        slug={post.slug}
                        category={post.category}
                    />
                )}
            </div>

            {/* 카테고리는 색 점 + 원본 표기 병기. 색 단독 전달 금지(§7.5) */}
            <p className={styles.category}>
                <span className={styles.category_dot} aria-hidden="true" />
                {post.category}
            </p>

            <h3 className={styles.title}>
                {/* 신 경로 `/posts/<slug>`. 구 경로 `/post?id=` 는 리다이렉트로만 남습니다 */}
                <Link className={styles.link} to={`/posts/${post.slug}`}>
                    {post.title}
                </Link>
            </h3>

            <p className={styles.note}>{note}</p>

            {/* 형식 고정: 날짜 · 읽기 시간. 카테고리는 위에 이미 있습니다(§6.7) */}
            <p className={styles.meta}>
                {[formatPostDate(post.date), formatReadingMinutes(post.readingMinutes)]
                    .filter(Boolean)
                    .join(' · ')}
            </p>
        </li>
    );
}

export default PostCard;
