import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * 미디어 쿼리 일치 여부를 **구독**합니다.
 *
 * 레이아웃·표시 여부는 CSS 미디어쿼리가 담당합니다(§7). 이 훅은 JS 가 뷰포트를
 * 알아야만 하는 경우 — 검색 패널을 모달로 다룰지 같은 판단 — 에만 씁니다.
 *
 * `window.matchMedia(...).matches` 를 한 번만 읽으면 그 시점의 값에 고착되어,
 * 창을 넓혔을 때 모바일 오버레이가 남고 body 스크롤 락이 풀리지 않습니다(QA A-3).
 * useSyncExternalStore 를 쓰면 첫 렌더부터 실제 값을 주면서 변화도 따라갑니다
 * (react-responsive 의 useMediaQuery 는 첫 렌더에서 false 를 반환해 플래시가 납니다).
 */
function useMediaMatch(query: string): boolean {
    /*
     * MediaQueryList 는 쿼리당 하나만 만듭니다.
     * getSnapshot 안에서 window.matchMedia() 를 부르면 React 가 스냅샷을 읽을
     * 때마다 새 객체가 생깁니다 — 부팅 한 번에 8개, 리사이즈를 반복하면 수십 개까지
     * 늘어납니다. 값은 같아 동작은 맞지만 만들 이유가 없는 객체입니다.
     */
    const mediaQueryList = useMemo(() => window.matchMedia(query), [query]);

    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            mediaQueryList.addEventListener('change', onStoreChange);
            return () => mediaQueryList.removeEventListener('change', onStoreChange);
        },
        [mediaQueryList],
    );

    const getSnapshot = useCallback(() => mediaQueryList.matches, [mediaQueryList]);

    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export default useMediaMatch;
