import styles from './PostCard.module.css';
import type { PostMetadata } from '../../types';
import { useNavigate } from 'react-router-dom';
function PostCard({ post }: { post: PostMetadata }) {

    const navigate = useNavigate();
    return (
        // 신 경로 `/posts/<slug>`. 구 경로 `/post?id=` 는 리다이렉트로만 남습니다(§4-8)
        <div className={styles.post_card} onClick={() => navigate(`/posts/${post.slug}`)}>
            <div className={styles.thumbnail}>
                {
                    post.thumbnail ?
                        <img src={post.thumbnail} alt={post.title} />
                    :
                        <div className={styles.thumbnail_placeholder}>
                            <img src='/images/shared/thumbnail_placeholder.png' alt={post.title} />
                        </div>
                }
                <div className={styles.tags}>
                    {post.keywords.map((keyword) => (
                        <span key={keyword} className={styles.tag}>{keyword}</span>
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
        </div>
    )
}

export default PostCard;