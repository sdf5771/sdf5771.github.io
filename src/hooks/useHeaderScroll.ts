import { useEffect, useState } from 'react';
import { MEDIA_MOBILE } from '../styles/breakpoints';

/** 배경이 완전히 불투명해지고, 모바일 숨김이 시작되는 스크롤 거리 */
const SCROLL_RANGE = 60;
/** 하단 보더가 나타나기 시작하는 진행률 */
const BORDER_THRESHOLD = 0.15;
const BASE_ALPHA = 0.35;

export interface HeaderScrollState {
    /** 헤더 배경 불투명도 (0.35 ~ 1) */
    backgroundAlpha: number;
    hasBorder: boolean;
    /** 모바일에서 스크롤 다운 시 헤더를 감출지 */
    isHidden: boolean;
}

interface UseHeaderScrollOptions {
    /**
     * 최상단에서 헤더가 반투명하게 시작하는가.
     * 홈에서만 true 입니다 — 히어로 그래픽이 화면 끝까지 이어져 보이게 하려는 것이고,
     * 홈 외 페이지에서는 처음부터 불투명합니다(§6-1b).
     */
    isTransparentAtTop: boolean;
}

/**
 * 스크롤에 따른 헤더 전환.
 *
 * 헤더의 **위치·크기는 절대 변하지 않습니다.** 배경 불투명도만 바뀝니다 —
 * 이것이 헤더가 하는 유일한 움직임이며, 히어로 그래픽과 시선을 다투지 않기 위한
 * 제약입니다(§6-1b).
 *
 * ⚠️ prefers-reduced-motion: reduce 에서는 모바일 **숨김 동작 자체를 끕니다.**
 *    전환만 끄면 헤더가 순간이동해 더 나쁩니다(§6-2).
 */
function useHeaderScroll({ isTransparentAtTop }: UseHeaderScrollOptions): HeaderScrollState {
    const [state, setState] = useState<HeaderScrollState>(() => ({
        backgroundAlpha: isTransparentAtTop ? BASE_ALPHA : 1,
        hasBorder: !isTransparentAtTop,
        isHidden: false,
    }));

    useEffect(() => {
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const mobileQuery = window.matchMedia(MEDIA_MOBILE);

        let lastScrollY = window.scrollY;
        let frame = 0;

        const update = () => {
            frame = 0;

            const scrollY = window.scrollY;
            const progress = Math.min(1, Math.max(0, scrollY / SCROLL_RANGE));

            const isHidden =
                !reducedMotionQuery.matches &&
                mobileQuery.matches &&
                scrollY > SCROLL_RANGE &&
                scrollY > lastScrollY;

            setState(previous => {
                const next: HeaderScrollState = {
                    backgroundAlpha: isTransparentAtTop
                        ? BASE_ALPHA + progress * (1 - BASE_ALPHA)
                        : 1,
                    hasBorder: isTransparentAtTop ? progress >= BORDER_THRESHOLD : true,
                    isHidden,
                };

                const isSame =
                    previous.backgroundAlpha === next.backgroundAlpha &&
                    previous.hasBorder === next.hasBorder &&
                    previous.isHidden === next.isHidden;

                return isSame ? previous : next;
            });

            lastScrollY = scrollY;
        };

        const handleScroll = () => {
            if (frame) {
                return;
            }

            frame = requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', handleScroll, { passive: true });

        /*
         * 두 쿼리를 똑같이 다룹니다. `update` 가 둘 다 읽으므로 한쪽에만 리스너를
         * 달면 그쪽 변화에만 반응합니다 — 데스크톱 폭에서 헤더를 숨긴 채 창을
         * 넓히면(또는 기기를 회전하면) 스크롤을 다시 건드릴 때까지 숨은 상태가
         * 남습니다. mobileQuery 만 빠져 있을 이유가 없습니다.
         */
        reducedMotionQuery.addEventListener('change', update);
        mobileQuery.addEventListener('change', update);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            reducedMotionQuery.removeEventListener('change', update);
            mobileQuery.removeEventListener('change', update);

            if (frame) {
                cancelAnimationFrame(frame);
            }
        };
    }, [isTransparentAtTop]);

    return state;
}

export default useHeaderScroll;
