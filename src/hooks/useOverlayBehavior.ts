import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

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
}: UseOverlayBehaviorOptions): RefObject<T | null> {
    const containerRef = useRef<T>(null);

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
            trigger?.focus();
        };
    }, [isOpen, onClose, isModal]);

    useEffect(() => {
        if (!isOpen || !isModal) {
            return;
        }

        /*
         * overflow: hidden 만 쓰면 iOS 에서 배경이 밀립니다.
         * position: fixed + top: -scrollY 로 잠그고 풀 때 스크롤 위치를 복원합니다.
         */
        const scrollY = window.scrollY;
        const { body } = document;
        const previous = {
            position: body.style.position,
            top: body.style.top,
            left: body.style.left,
            right: body.style.right,
            overflow: body.style.overflow,
        };

        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.overflow = 'hidden';

        return () => {
            body.style.position = previous.position;
            body.style.top = previous.top;
            body.style.left = previous.left;
            body.style.right = previous.right;
            body.style.overflow = previous.overflow;
            window.scrollTo(0, scrollY);
        };
    }, [isOpen, isModal]);

    return containerRef;
}

export default useOverlayBehavior;
