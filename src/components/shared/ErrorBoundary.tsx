import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

/**
 * 🔴 앱 전체의 마지막 방어선 — **렌더 중 예외 = 흰 화면**을 막습니다.
 *
 * 왜 지점별 방어로는 부족한가
 * ---------------------------
 * `src/utils/url.ts` 가 이미 이 실패 양식을 정확히 짚고 있습니다 —
 * "렌더 도중이면 React 트리 전체가 죽어 흰 화면이 됩니다". 그런데 처방이
 * `safeDecodeURIComponent` 하나뿐이었습니다. 렌더 중에 던질 수 있는 자리는
 * 그 밖에도 계속 생깁니다(형태가 계약과 다른 JSON, 예상 못 한 undefined 접근 등).
 * 매번 지점마다 막는 대신, 여기서 **클래스 전체를 닫습니다.**
 * 지점별 가드는 여전히 필요합니다 — 그쪽이 더 나은 화면을 보여 주니까요.
 * 이 컴포넌트는 그것들이 실패했을 때의 바닥입니다.
 *
 * 🔴 클래스 컴포넌트인 것은 취향이 아닙니다. 에러 경계를 만드는 훅이 React 에
 *    아직 없어 `componentDidCatch`/`getDerivedStateFromError` 가 유일한 방법입니다.
 *
 * ⚠️ 잡지 **못하는** 것: 이벤트 핸들러·비동기 콜백·SSR. 그쪽은 각자 try/catch 로.
 */

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        /*
         * 화면에는 기술 메시지를 절대 노출하지 않습니다(WRITING_GUIDE §6.3).
         * 개발자용 단서는 콘솔에만 남깁니다 — 이게 없으면 흰 화면을 고친 대가로
         * 원인을 영영 못 보게 됩니다.
         */
        console.error('[ErrorBoundary] 렌더 중 예외:', error, errorInfo.componentStack);
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            /*
             * 라우터 밖에서도 동작해야 하므로 <Link> 가 아니라 <a> 입니다.
             * 트리가 이미 죽은 상태라 문서를 새로 여는 편이 확실한 회복이기도 합니다.
             */
            <div className={styles.boundary}>
                <div className={styles.panel} role="alert">
                    {/*
                     * WRITING_GUIDE §6.3 필수 3요소 — ① 무엇이 실패했는지
                     * ② 사용자 잘못이 아님 ③ 회복 경로. 해요체, 이모지·농담 없음(S1·§3.6).
                     */}
                    <p className={styles.title}>화면을 표시하지 못했어요</p>
                    <p className={styles.description}>잠시 후 다시 시도해 주세요.</p>

                    <div className={styles.actions}>
                        <button
                            className={styles.action}
                            type="button"
                            onClick={() => window.location.reload()}
                        >
                            다시 시도
                        </button>
                        <a className={styles.action} href="/">
                            홈으로
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
