import { Link } from 'react-router-dom';
import styles from './PostNeighbors.module.css';
import { getPostNeighbors } from '../../data/posts';

/**
 * 이전 / 다음 글.
 * 명세: docs/handoff-step3-post.md §4-6 · §10-2
 *
 * 🔴 `이전 글` 은 더 **오래된** 글입니다. 시간을 거슬러 올라가는 것이 블로그의
 *    관례이고, 목록 정렬(최신순)과 방향이 일관됩니다.
 */
export default function PostNeighbors({ slug }: { slug: string }) {
    const { previous, next } = getPostNeighbors(slug);

    if (!previous && !next) {
        return null;
    }

    return (
        <nav className={styles.neighbors} aria-label="다른 글">
            {/*
             * 🔴 한쪽이 없으면 그 칸을 **비우지 않고 제거**하고 남은 칸이 전체 폭을
             *    차지합니다. 빈 칸은 "로딩 실패" 로 오인됩니다(§4-6).
             *    최신 글(2025-05-26)에는 다음 글이 없고, 최고 글(2022-12-26)에는
             *    이전 글이 없습니다. 시안은 최신 글에 2024년 글을 "다음" 으로
             *    붙여 뒀는데 그건 데이터 오류입니다(§13-2 3·4번).
             */}
            {previous && (
                <Link className={styles.card} to={`/posts/${previous.slug}`}>
                    <span className={styles.label}>
                        <span aria-hidden="true">←</span> 이전 글
                    </span>
                    {/* 96자 제목이 4행을 먹으면 두 칸 높이가 어긋납니다 — 2행 클램프 */}
                    <span className={styles.title}>{previous.title}</span>
                </Link>
            )}

            {next && (
                <Link className={`${styles.card} ${styles.card_next}`} to={`/posts/${next.slug}`}>
                    <span className={styles.label}>
                        다음 글 <span aria-hidden="true">→</span>
                    </span>
                    <span className={styles.title}>{next.title}</span>
                </Link>
            )}
        </nav>
    );
}
