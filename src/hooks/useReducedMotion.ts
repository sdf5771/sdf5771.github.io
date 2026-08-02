import { useCallback } from 'react';

/** 저감 모션 미디어쿼리 — 문자열이 여러 곳에 흩어지지 않게 한 곳에 둡니다 */
export const MEDIA_REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * 스크롤 동작(`behavior`)을 **호출 시점에** 결정해 돌려줍니다.
 * 명세: docs/handoff-step3-post.md §9-3-② · docs/handoff-step1-shell.md §5-6
 *
 * 🔴 왜 값이 아니라 함수를 돌려주는가
 * ------------------------------------
 * `matchMedia(...).matches` 를 모듈 로드 시나 마운트 시 한 번 읽어 캐시하면,
 * 사용자가 OS 설정을 바꿔도 **탭을 새로 열기 전까지 반영되지 않습니다.**
 * 목차 점프·맨 위로는 세션 중에 몇 번이고 눌리는 동작이라 그 사이에 설정이
 * 바뀔 수 있습니다. 호출할 때마다 새로 읽습니다.
 *
 * ⚠️ CSS 로 못 고치는 건 `scrollIntoView`/`scrollTo` 의 `behavior` **인자뿐**입니다.
 *    나머지 저감(transform 제거·애니메이션 정지)은 전부 컴포넌트 CSS 의
 *    `@media (prefers-reduced-motion: reduce)` 가 처리합니다.
 *
 *    🔴 저감 규칙: **transform 은 값을 지우고(`transform: none`), 색·opacity
 *       전환은 그대로 둡니다.** 지속시간을 0 으로 만드는 것은 해결이 아닙니다 —
 *       `translateY(-3px)` 는 지속시간이 0 이어도 여전히 3px 점프합니다.
 */
export function useScrollBehavior(): () => ScrollBehavior {
    return useCallback(() => {
        return window.matchMedia(MEDIA_REDUCED_MOTION).matches ? 'auto' : 'smooth';
    }, []);
}
