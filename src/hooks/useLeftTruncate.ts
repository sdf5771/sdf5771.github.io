import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/** 잘린 앞부분을 대신하는 기호. 서브셋 cmap 에 실재합니다(§4-7). */
const ELLIPSIS = '…';

interface LeftTruncateResult<T extends HTMLElement> {
    /** 측정 대상. 이 요소의 clientWidth 가 "쓸 수 있는 폭"입니다 */
    ref: RefObject<T | null>;
    /** 실제로 그릴 문자열. 넘치지 않으면 원문 그대로입니다 */
    display: string;
}

/**
 * 문자열이 넘칠 때 **앞쪽**을 잘라 `…뒷부분` 으로 만듭니다.
 *
 * CSS 로 하려면 `direction: rtl` 을 써야 하는데, 그러면 `~` `/` 같은 bidi 중립
 * 문자가 문자열 끝으로 재배치되어 `~/posts` 가 `posts/~` 로 렌더됩니다.
 * 터미널 경로 표기가 뒤집혀 보이므로 CSS 기법을 버리고 JS 로 직접 자릅니다(§12-5).
 *
 * 측정은 화면 밖 span 에 같은 서체를 복사해 붙여 폭을 재는 방식입니다.
 * 실제 요소의 textContent 를 건드리지 않으므로 React 가 관리하는 DOM 과 충돌하지 않습니다.
 */
function useLeftTruncate<T extends HTMLElement>(text: string): LeftTruncateResult<T> {
    const ref = useRef<T>(null);
    const [display, setDisplay] = useState(text);

    useLayoutEffect(() => {
        const host = ref.current;
        if (!host) {
            return;
        }

        const measurer = document.createElement('span');
        measurer.setAttribute('aria-hidden', 'true');
        measurer.style.position = 'fixed';
        measurer.style.top = '0';
        measurer.style.left = '-9999px';
        measurer.style.whiteSpace = 'pre';
        measurer.style.visibility = 'hidden';
        measurer.style.pointerEvents = 'none';
        document.body.appendChild(measurer);

        const widthOf = (value: string) => {
            measurer.textContent = value;
            return measurer.getBoundingClientRect().width;
        };

        const fit = () => {
            const available = host.clientWidth;

            // 서체가 바뀌었을 수 있으므로 잴 때마다 host 의 계산값을 복사합니다.
            const computed = window.getComputedStyle(host);
            measurer.style.fontFamily = computed.fontFamily;
            measurer.style.fontSize = computed.fontSize;
            measurer.style.fontWeight = computed.fontWeight;
            measurer.style.fontStyle = computed.fontStyle;
            measurer.style.letterSpacing = computed.letterSpacing;

            // 폭이 0 이면 아직 안 그려졌거나(display:none) 측정할 수 없는 상태입니다.
            if (available === 0 || widthOf(text) <= available) {
                setDisplay(text);
                return;
            }

            // 들어가는 가장 긴 꼬리를 찾습니다 — 앞에서 몇 글자를 버릴지 이분 탐색.
            let low = 1;
            let high = text.length;
            while (low < high) {
                const middle = Math.floor((low + high) / 2);
                if (widthOf(ELLIPSIS + text.slice(middle)) <= available) {
                    high = middle;
                } else {
                    low = middle + 1;
                }
            }

            setDisplay(ELLIPSIS + text.slice(low));
        };

        fit();

        /*
         * host 는 flex 로 남는 폭을 채우므로 내용 길이가 자기 폭을 바꾸지 않습니다.
         * (내용에 따라 폭이 변하면 관찰 → 재계산 → 폭 변화의 무한 루프가 됩니다)
         */
        const observer = new ResizeObserver(fit);
        observer.observe(host);

        // 픽셀 서체가 늦게 도착하면 폭이 달라지므로 로드 후 한 번 더 잽니다.
        let isStale = false;
        void document.fonts?.ready.then(() => {
            if (!isStale) {
                fit();
            }
        });

        return () => {
            isStale = true;
            observer.disconnect();
            measurer.remove();
        };
    }, [text]);

    return { ref, display };
}

export default useLeftTruncate;
