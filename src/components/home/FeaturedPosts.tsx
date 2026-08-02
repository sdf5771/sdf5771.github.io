import { Link } from 'react-router-dom';
import styles from './HomeSection.module.css';
import PostCard from './PostCard';
import type { FeaturedPick } from '../../data/featured';
import { POST_LIST_PATH } from '../../constants/site';

/**
 * 홈 「읽어볼 만한 글」 — 3열 카드.
 * 명세: docs/handoff-step2-home.md §5-1 · §5-3
 *
 * 이 트랙의 목적은 "학습 노트에 묻힌 좋은 글을 끌어올리는 것" 입니다. 그래서
 * 최신순이 아니라 **손으로 고른 순서**이고, 「최근 글」과 겹치면 건너뜁니다
 * (중복 제거 규칙은 `data/featured.ts`).
 */

interface FeaturedPostsProps {
    picks: readonly FeaturedPick[];
}

function FeaturedPosts({ picks }: FeaturedPostsProps) {
    /*
     * 🔴 하나도 없으면 **섹션 자체를 그리지 않습니다.** 빈 상태를 만들지
     *    않습니다 — 여기는 사용자가 빠져나와야 하는 실패가 아니라 그냥
     *    보여 줄 것이 없는 상태이고, 바로 위 「최근 글」이 이미 글로 가는
     *    경로를 제공합니다(§5-3).
     */
    if (picks.length === 0) {
        return null;
    }

    return (
        <section className={styles.section} aria-labelledby="featured-heading">
            <div className={styles.header}>
                <h2 className={styles.heading} id="featured-heading">
                    읽어볼 만한 글
                </h2>
            </div>

            {/* 🔴 `3` 을 하드코딩하지 않습니다. 중복 제거로 1~2편이 될 수 있습니다(§10) */}
            <p className={styles.section_note}>직접 고른 {picks.length}편입니다.</p>

            {/* auto-fit 이라 2편이어도 레이아웃이 무너지지 않습니다(§5-3) */}
            <ul className={styles.cards}>
                {picks.map(pick => (
                    <PostCard key={pick.post.slug} post={pick.post} note={pick.note} />
                ))}
            </ul>

            <p className={styles.more}>
                {/* "읽는 것" 이라 Pretendard 입니다. 픽셀 서체는 히어로 주 CTA 만(§9-3) */}
                <Link className={styles.more_link} to={POST_LIST_PATH}>
                    글 목록 더 보기
                </Link>
            </p>
        </section>
    );
}

export default FeaturedPosts;
