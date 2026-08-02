import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { lockBodyScroll } from '../utils/bodyScrollLock';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        element => element.offsetParent !== null || element === document.activeElement,
    );
}

interface UseOverlayBehaviorOptions {
    isOpen: boolean;
    onClose: () => void;
    /**
     * 전체화면 모달로 동작하는가.
     * false 면 ESC 닫기와 자동 포커스만 걸고 포커스 트랩·스크롤 락은 걸지 않습니다.
     * (태블릿의 헤더 아래 전폭 검색 행처럼 모달이 아닌 패널용)
     */
    isModal: boolean;
    /**
     * 닫을 때 포커스를 돌려줄 요소.
     * 생략하면 열기 직전에 포커스를 갖고 있던 요소(=트리거)로 돌아갑니다.
     * 셸 밖에서 openSearch({ returnFocusTo }) 로 연 경우에 씁니다(§6-4a).
     */
    returnFocusTo?: HTMLElement | null;
}

/**
 * 오버레이(드로어·검색)의 공통 동작을 한 곳에 모읍니다.
 * 포커스 트랩 · ESC 닫기 · body 스크롤 락 · 닫을 때 트리거로 포커스 복귀.
 * 명세: docs/handoff-step1-shell.md §6-3 / §10
 *
 * 컨테이너 안에서 처음 포커스를 받을 요소는 `data-autofocus` 로 지정합니다.
 */
function useOverlayBehavior<T extends HTMLElement>({
    isOpen,
    onClose,
    isModal,
    returnFocusTo,
}: UseOverlayBehaviorOptions): RefObject<T | null> {
    const containerRef = useRef<T>(null);

    /*
     * 복귀 대상은 ref 로 들고 있습니다.
     * 의존성 배열에 넣으면 값이 바뀔 때마다 정리 함수가 돌아 — 아직 열려 있는데 —
     * 포커스를 밖으로 빼앗습니다.
     *
     * 값이 있을 때만 기록합니다. 닫히는 렌더에서는 prop 이 이미 비어 있는데,
     * 그때 ref 를 같이 지우면 **정리 함수가 읽기 전에** 대상이 사라집니다.
     * 지우는 것은 정리 함수가 다 쓴 뒤입니다(다음 열기로 새지 않도록).
     */
    const returnFocusRef = useRef<HTMLElement | null>(null);
    if (returnFocusTo) {
        returnFocusRef.current = returnFocusTo;
    }

    useEffect(() => {
        const container = containerRef.current;
        if (!isOpen || !container) {
            return;
        }

        // 열기 직전에 포커스를 갖고 있던 요소(=트리거)로 닫을 때 되돌아갑니다.
        const trigger = document.activeElement as HTMLElement | null;

        const autoFocusTarget =
            container.querySelector<HTMLElement>('[data-autofocus]') ??
            getFocusable(container)[0];
        autoFocusTarget?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab' || !isModal) {
                return;
            }

            const focusable = getFocusable(container);
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const isInside = container.contains(document.activeElement);

            if (event.shiftKey && (document.activeElement === first || !isInside)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !isInside)) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            /*
             * 포커스가 아직 오버레이 안에 있거나(ESC·닫기 버튼), 오버레이가 사라지면서
             * 포커스를 잃은 경우에만 되돌립니다. 사용자가 이미 다른 곳을 눌러
             * 옮겨 갔다면 포커스를 빼앗아 오면 안 됩니다.
             */
            const target = returnFocusRef.current ?? trigger;
            returnFocusRef.current = null;

            const active = document.activeElement;
            const hasLostFocus = !active || active === document.body;
            if (!hasLostFocus && !container.contains(active)) {
                return;
            }

            if (target?.isConnected) {
                target.focus();
            }
        };
    }, [isOpen, onClose, isModal]);

    /*
     * 스크롤 락은 **전역 참조 카운트**가 관리합니다(utils/bodyScrollLock).
     * 오버레이마다 body.style 스냅샷을 들면 드로어 위에 검색이 겹쳐 열렸다가
     * 둘이 같은 커밋에서 닫힐 때 잠금이 영구히 남습니다 — 사유는 그 파일에 있습니다.
     */
    useEffect(() => {
        if (!isOpen || !isModal) {
            return;
        }

        return lockBodyScroll();
    }, [isOpen, isModal]);

    return containerRef;
}

export default useOverlayBehavior;
