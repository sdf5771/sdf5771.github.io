/**
 * body 스크롤 락 — **전역 참조 카운트**.
 *
 * 왜 오버레이마다 스냅샷을 뜨면 안 되는가
 * ---------------------------------------
 * 오버레이가 각자 `body.style` 을 저장했다가 각자 되돌리면, 두 개가 겹쳤을 때
 * 저장된 값 자체가 서로 다릅니다.
 *
 *   ① 드로어 열림   → 스냅샷 position: ''      → body 를 fixed 로 잠금
 *   ② 검색 겹쳐 열림 → 스냅샷 position: 'fixed' ← **이미 잠긴 상태를 원본으로 기억**
 *   ③ ESC 한 번으로 둘이 같은 커밋에서 닫힘
 *      React 가 트리 순서로 정리 → 드로어가 '' 로 되돌린 **뒤에** 검색이 'fixed' 를 다시 씀
 *
 * 결과: UI 는 다 사라졌는데 body 가 `position: fixed; overflow: hidden` 으로 남아
 * 스크롤이 영구히 죽습니다. `window.scrollTo` 도 듣지 않아 새로고침 외에 복구 수단이
 * 없습니다. 닫는 순서가 어긋나는 경로(검색 × → 드로어 ×)만 우연히 멀쩡했습니다.
 *
 * 그래서 스냅샷을 **전역에서 한 번만** 뜹니다.
 * 첫 잠금이 원래 값을 기억하고, 마지막 해제만 복원합니다. 중간에 몇 개가 어떤
 * 순서로 여닫히든 body 가 거치는 상태는 「잠김」과 「원래대로」 둘뿐입니다.
 *
 * ⚠️ 이 모듈은 의도적으로 모듈 전역 상태를 가집니다. 훅 안에 두면 오버레이마다
 *    사본이 생겨 위 결함이 그대로 돌아옵니다.
 */

/** 현재 잠금을 잡고 있는 오버레이 수 */
let lockCount = 0;

/** 첫 잠금이 만들어 두는 복원 함수. 마지막 해제에서만 실행됩니다 */
let restore: (() => void) | null = null;

/**
 * body 스크롤을 잠그고 **해제 함수**를 돌려줍니다.
 * 반환된 함수는 여러 번 불려도 한 번만 셉니다(React 의 이중 호출·재마운트 대비).
 */
export function lockBodyScroll(): () => void {
    if (lockCount === 0) {
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

        restore = () => {
            body.style.position = previous.position;
            body.style.top = previous.top;
            body.style.left = previous.left;
            body.style.right = previous.right;
            body.style.overflow = previous.overflow;
            window.scrollTo(0, scrollY);
        };
    }

    lockCount += 1;

    let isReleased = false;
    return () => {
        if (isReleased) {
            return;
        }
        isReleased = true;

        lockCount -= 1;
        if (lockCount === 0) {
            restore?.();
            restore = null;
        }
    };
}
