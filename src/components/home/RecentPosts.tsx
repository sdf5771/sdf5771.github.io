import styles from './HomeSection.module.css';
import { PostRow } from '../posts';
import type { PostMetadata } from '../../types';

/**
 * 홈 「최근 글」 — 전폭 리스트.
 * 명세: docs/handoff-step2-home.md §5-1 · §5-2
 *
 * 🔴 행 컴포넌트를 **새로 만들지 않고** 글 목록(`/posts`)의 `PostRow` 를
 *    그대로 씁니다. 같은 정보를 두 형태로 그리면 규격이 갈리고, 실제로
 *    갈릴 자리가 많습니다 — 태그 3 + `+N`, 메타 순서, NEW 배지 규칙,
 *    스트레치 링크의 접근 가능한 이름, 저감 모션 처리.
 *    검색어 강조가 없으므로 토큰만 빈 배열로 넘깁니다.
 *
 * 「읽어볼 만한 글」이 카드인 것과 형태가 다른 것은 의도입니다 — 스크롤만으로
 * 두 트랙의 성격 차이가 읽힙니다(§5-1 N1).
 */

/** 검색 화면이 아니므로 강조할 토큰이 없습니다. 배열을 매번 새로 만들지 않습니다 */
const NO_TOKENS: readonly string[] = [];

interface RecentPostsProps {
    posts: readonly PostMetadata[];
    /** 전체 글 수. 🔴 하드코딩 금지 — 데이터에서 셉니다(§5-2) */
    total: number;
}

function RecentPosts({ posts, total }: RecentPostsProps) {
    return (
        <section className={styles.section} aria-labelledby="recent-heading">
            <div className={styles.header}>
                <h2 className={styles.heading} id="recent-heading">
                    최근 글
                </h2>
                <p className={styles.header_meta}>최신순 · 전체 {total}편</p>
            </div>

            <ul className={styles.rows}>
                {posts.map(post => (
                    /* 홈은 `h1 Seobisback → h2 최근 글 → h3 글 제목` 입니다 */
                    <PostRow key={post.slug} post={post} tokens={NO_TOKENS} headingLevel={3} />
                ))}
            </ul>
        </section>
    );
}

export default RecentPosts;
