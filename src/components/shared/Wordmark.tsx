import styles from './Wordmark.module.css';
import memoji from '../../assets/images/memoji-72.webp';
import { WORDMARK } from '../../constants/site';

interface WordmarkProps {
    className?: string;
    /**
     * 메모지를 워드마크 왼쪽에 함께 둡니다.
     * 순수 장식이므로 alt="" 입니다 — 같은 링크 안의 워드마크 텍스트가 이미
     * 사이트명을 말하고 있어서, alt 를 채우면 스크린리더가 이름을 두 번 읽습니다.
     */
    withMemoji?: boolean;
}

/**
 * 워드마크 조형(픽셀 서체 + `.log` 액센트).
 * 표기 자체는 src/constants/site.ts 의 WORDMARK 한 곳에서만 정의합니다.
 */
function Wordmark({ className, withMemoji = false }: WordmarkProps) {
    return (
        <span className={className ? `${styles.wordmark} ${className}` : styles.wordmark}>
            {withMemoji && (
                <img className={styles.memoji} src={memoji} alt="" width={24} height={24} />
            )}
            <span className={styles.label}>
                {WORDMARK.base}
                <span className={styles.accent}>{WORDMARK.accent}</span>
            </span>
        </span>
    );
}

export default Wordmark;
