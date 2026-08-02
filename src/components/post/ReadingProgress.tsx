import styles from './ReadingProgress.module.css';

/**
 * 읽기 진행바. 헤더 바로 아래에 sticky 로 붙습니다.
 * 명세: docs/handoff-step3-post.md §4-1 · §8-1
 *
 * 값은 `useReadingProgress` 가 계산합니다. 이 컴포넌트는 그리기만 합니다.
 *
 * 🔴 저감 모션에서도 **사라지지 않습니다.** 진행률은 장식이 아니라 정보입니다.
 *    없애는 게 아니라 보간(`transition`)만 끕니다(§9-2 1번).
 */
export default function ReadingProgress({ percent }: { percent: number }) {
    return (
        <div
            className={styles.track}
            role="progressbar"
            aria-label="읽기 진행률"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            {/*
             * 폭을 인라인 CSS 변수로 넘깁니다. state 는 **정수 퍼센트가 바뀔 때만**
             * 갱신되므로(훅 참조) 리렌더는 최대 100회이고, 그 사이는 CSS 전환이
             * 메웁니다.
             */}
            <div className={styles.fill} style={{ '--progress': `${percent}%` } as React.CSSProperties} />
        </div>
    );
}
