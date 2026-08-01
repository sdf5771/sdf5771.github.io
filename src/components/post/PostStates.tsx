import { Link } from 'react-router-dom';
import styles from './PostStates.module.css';
import { POST_LIST_PATH } from '../../constants/site';

/**
 * 본문 로딩 · 에러 상태.
 * 명세: docs/handoff-step3-post.md §12-1 · §12-2 · §18(확정 카피)
 */

/**
 * 스켈레톤.
 *
 * 🔴 **텍스트를 넣지 않습니다.** 스켈레톤이 있으면 `불러오는 중…` 은 중복입니다
 *    (WRITING_GUIDE §6.4). 시안이 둘을 함께 그린 것은 정정 대상입니다(§13-2 11번).
 *
 * 🔴 **목차 자리까지 예약**합니다. 예약하지 않으면 로드 완료 시 본문이 좌측으로
 *    밀립니다(CLS) — §12-1.
 */
export function PostSkeleton() {
    return (
        <div className={styles.skeleton} aria-busy="true">
            <div className={styles.skeleton_body}>
                {/* 본문 7행 */}
                {Array.from({ length: 7 }, (_, index) => (
                    <span
                        key={index}
                        className={styles.line}
                        /* 마지막 행은 짧게 — 문단처럼 보이게 합니다 */
                        data-short={index === 6 ? 'true' : undefined}
                        aria-hidden="true"
                    />
                ))}
            </div>

            <div className={styles.skeleton_toc} aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                    <span key={index} className={styles.line} />
                ))}
            </div>
        </div>
    );
}

/**
 * 본문 로드 실패.
 *
 * 🔴 **없는 slug 는 이 화면이 아니라 404 입니다.** 두 상황의 카피가 다릅니다
 *    (`찾는 글이 없어요` vs `글을 불러오지 못했어요`) — §12-2.
 * 🔴 `다시 시도` 가 **실제로 재시도**해야 합니다. 구 코드처럼 홈으로 보내면
 *    사용자는 무슨 일이 일어났는지 모른 채 홈에 있게 됩니다(§1-2).
 */
export function PostLoadError({ path, onRetry }: { path: string; onRetry: () => void }) {
    return (
        <div className={styles.error} role="alert">
            <p className={styles.error_glyph} aria-hidden="true">
                ?
            </p>
            <p className={styles.error_title}>글을 불러오지 못했어요</p>
            <p className={styles.error_description}>잠시 후 다시 시도해 주세요.</p>

            <div className={styles.error_actions}>
                {/* 다시 시도는 **동작**이므로 <button> 입니다 */}
                <button type="button" className={styles.error_primary} onClick={onRetry}>
                    다시 시도
                </button>
                {/* 이동이므로 <a>(Link) 입니다 */}
                <Link className={styles.error_secondary} to={POST_LIST_PATH}>
                    글 목록으로
                </Link>
            </div>

            <p className={styles.error_path}>{path}</p>
        </div>
    );
}
