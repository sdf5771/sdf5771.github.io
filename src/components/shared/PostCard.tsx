import { Link } from 'react-router-dom';
import styles from './PostCard.module.css';
import type { PostMetadata } from '../../types';

/**
 * 홈의 글 카드.
 *
 * ⚠️ **홈(STEP 2) 전용입니다.** 글 목록 `/posts` 는 행(row) 컴포넌트
 *    `src/components/posts/PostRow.tsx` 를 씁니다 — 요약이 41편 중 1편뿐이고
 *    썸네일 24장 중 23장이 임의 본문 스크린샷이라 목록에서는 카드가
 *    성립하지 않습니다(handoff-step4-list.md §2-1).
 *
 * 🔴 코드 리뷰 Y-7 — 원래 `<div onClick={() => navigate(...)}>` 이었습니다.
 *    그러면 ① 키보드로 포커스할 수 없고 ② ⌘+클릭·가운데 클릭으로 새 탭을 열 수
 *    없고 ③ 크롤러가 글 링크를 보지 못합니다. ③ 이 프리렌더·sitemap 작업의
 *    전제를 깨므로 `<Link>` 로 바꿨습니다.
 */
function PostCard({ post }: { post: PostMetadata }) {
    return (
        /* 신 경로 `/posts/<slug>`. 구 경로 `/post?id=` 는 리다이렉트로만 남습니다(§4-8) */
        <Link className={styles.post_card} to={`/posts/${post.slug}`}>
            <div className={styles.thumbnail}>
                {post.thumbnail ? (
                    /*
                     * 바로 아래에 같은 제목이 있습니다. alt 에 제목을 넣으면
                     * 스크린리더가 제목을 두 번 읽습니다(WRITING_GUIDE §7.1).
                     */
                    <img src={post.thumbnail} alt="" />
                ) : (
                    <div className={styles.thumbnail_placeholder}>
                        <img src="/images/shared/thumbnail_placeholder.png" alt="" />
                    </div>
                )}
                <div className={styles.tags}>
                    {post.keywords.map(keyword => (
                        <span key={keyword} className={styles.tag}>
                            {keyword}
                        </span>
                    ))}
                </div>
            </div>
            <h2 className={styles.title}>{post.title}</h2>
            <div className={styles.container}>
                <div className={styles.info_container}>
                    <span className={styles.author}>{post.author}</span>
                    <div className={styles.graphic_dot}></div>
                    <span className={styles.date}>{post.date}</span>
                    <div className={styles.graphic_dot}></div>
                    <span className={styles.category}>{post.category}</span>
                </div>
            </div>
        </Link>
    );
}

export default PostCard;
