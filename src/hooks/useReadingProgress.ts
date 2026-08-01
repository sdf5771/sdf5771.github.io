import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * 읽기 진행률(0~100 정수).
 * 명세: docs/handoff-step3-post.md §8-1 · §8-2
 *
 * 계산 (확정)
 * ```
 * 시작점 = 본문 컨테이너의 문서상 top      (히어로·제목·메타 제외)
 * 끝점   = 본문 컨테이너의 문서상 bottom   (이전/다음·푸터 제외)
 * 진행률 = clamp(0, (스크롤 + 뷰포트×0.5 - 시작) / (끝 - 시작), 1)
 * ```
 *
 * 🔴 **페이지 전체 스크롤 기준**입니다. 초안의 "본문 내부 스크롤 컨테이너" 방식은
 *    모바일 브라우저의 주소창 자동 숨김을 깨고, 스크롤 복원·딥링크 앵커가 전부
 *    어긋납니다(§8-1).
 *
 * 왜 히어로·제목을 시작점에 넣지 않는가
 *   넣으면 글을 열자마자 8~15% 로 시작해 "이미 읽었다" 는 거짓 신호를 줍니다.
 * 왜 이전/다음·푸터를 끝점에 넣지 않는가
 *   본문을 다 읽었는데 80% 면 남은 게 있다고 오인합니다.
 *   **본문 마지막 줄이 화면 중앙에 오면 100%** 가 됩니다.
 * 왜 뷰포트 절반을 더하는가
 *   "읽고 있는 지점" 은 화면 상단이 아니라 중앙입니다.
 */
export function useReadingProgress(
    contentRef: RefObject<HTMLElement | null>,
    /**
     * 🔴 본문이 마운트·교체될 때 **바뀌는 값**을 넘기세요(렌더된 HTML 등).
     *
     * ref 객체는 정체성이 절대 바뀌지 않습니다. 그것만 의존성에 두면 이 효과는
     * **마운트 때 딱 한 번** 돌고, 그 시점에는 아직 로딩 상태라 본문 div 가
     * 존재하지 않아 `ref.current` 가 `null` 입니다. 그대로 빠져나간 뒤 다시
     * 불리지 않아 스크롤 리스너가 영영 붙지 않고, **진행바가 0% 에 얼어붙습니다.**
     * (실제로 그렇게 났습니다 — 본문 끝까지 내려도 0% 였습니다.)
     */
    contentKey: string,
): number {
    /*
     * 정수 퍼센트만 state 에 둡니다. 스크롤 프레임마다 갱신하면 리렌더가 폭주하고,
     * `aria-valuenow` 가 매 프레임 바뀌어 스크린리더가 함께 폭주합니다(§8-1).
     * 폭 자체는 CSS 변수로 직접 밀어 넣어 리렌더 없이 부드럽게 움직입니다.
     */
    const [progress, setProgress] = useState(0);
    const frameRef = useRef(0);

    useEffect(() => {
        const content = contentRef.current;
        if (!content) {
            return;
        }

        let lastReported = -1;

        const measure = () => {
            frameRef.current = 0;

            /*
             * 🔴 rAF 안에서 `getBoundingClientRect()` 를 **1회만** 부릅니다.
             *    읽기와 쓰기를 섞으면 레이아웃 스래싱이 납니다(§8-2).
             */
            const rect = content.getBoundingClientRect();
            const viewport = window.innerHeight;
            const height = rect.height;

            /* 본문이 뷰포트보다 짧으면 스크롤할 것이 없습니다 */
            const ratio =
                height <= 0 ? 0 : Math.min(1, Math.max(0, (viewport * 0.5 - rect.top) / height));

            const percent = Math.round(ratio * 100);
            if (percent !== lastReported) {
                lastReported = percent;
                setProgress(percent);
            }
        };

        const schedule = () => {
            /* 프레임당 1회. 진행률은 연속값이라 rAF 스로틀이 정확히 맞습니다(§8-2) */
            if (frameRef.current === 0) {
                frameRef.current = window.requestAnimationFrame(measure);
            }
        };

        measure();

        /* 🔴 passive 필수 — 스크롤 성능이 걸린 리스너입니다 */
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);

        /*
         * 이미지가 늦게 로드되면 문서 높이가 변합니다. 최선의 대응은 애초에
         * `width`/`height` 를 주어 높이가 변하지 않게 하는 것이고(§11-2),
         * 크기를 못 읽은 이미지(외부 URL 등)를 위해 관찰도 함께 겁니다.
         */
        const observer = new ResizeObserver(schedule);
        observer.observe(content);

        return () => {
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            observer.disconnect();

            if (frameRef.current !== 0) {
                window.cancelAnimationFrame(frameRef.current);
            }
        };
    }, [contentRef, contentKey]);

    return progress;
}
