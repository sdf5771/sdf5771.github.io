import styles from './PostCard.module.css';
import type { PostMetadata } from '../../types';
function PostCard({ post }: { post: PostMetadata }) {
    return (
        <div className={styles.post_card}>
            <div className={styles.thumbnail}>
                {
                    post.thumbnail ?
                        <img src={post.thumbnail} alt={post.title} />
                    :
                        <div className={styles.thumbnail_placeholder}>
                            <span>NO THUMBNAIL IMAGE!</span>
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
                </div>
            </div>
        </div>
    )
}

export default PostCard;