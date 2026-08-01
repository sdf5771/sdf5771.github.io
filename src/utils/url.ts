/**
 * 주소를 화면에 안전하게 옮기기 위한 도구.
 * 명세: docs/handoff-step5-404-about.md §4-6
 */

/**
 * 던지지 않는 `decodeURIComponent`.
 *
 * `%ZZ` 처럼 잘못된 퍼센트 인코딩이 들어오면 `decodeURIComponent` 는
 * **URIError 를 던집니다.** 렌더 도중이면 React 트리 전체가 죽어 흰 화면이 됩니다.
 * 주소는 사용자가 직접 치거나 남이 만든 링크로 들어오므로 잘못된 인코딩은
 * 가정이 아니라 실제로 발생합니다.
 *
 * 디코드에 실패하면 인코딩된 원문을 그대로 돌려줍니다 — 못 읽는 것보다
 * 낫고, 어차피 표시는 §4-6 의 정제 단계를 한 번 더 거칩니다.
 */
export function safeDecodeURIComponent(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

/** 화면에 보여 줄 경로 최대 길이. 넘으면 가운데를 접습니다 */
const MAX_DISPLAY_LENGTH = 72;

/**
 * 제어문자 + 양방향 제어문자.
 * `U+202E`(RTL override)가 남으면 **뒤따르는 화면 텍스트가 좌우 반전**돼 보입니다.
 * 경로는 이 사이트에서 유일하게 임의 외부 입력이 화면에 들어가는 자리라
 * 반드시 걷어냅니다.
 */
const UNSAFE_CHARACTERS =
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u001F\u007F-\u009F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

/**
 * `location.pathname` + `location.search` 를 화면에 안전하게 표시할 문자열로.
 *
 * 이 결과는 **React 텍스트 노드로만** 렌더하세요. `dangerouslySetInnerHTML` 에
 * 넣으면 React 의 자동 이스케이프라는 유일한 XSS 방어선이 사라집니다.
 */
export function safeDisplayPath(pathname: string, search: string): string {
    const raw = `${pathname}${search}`;

    let display = safeDecodeURIComponent(raw).replace(UNSAFE_CHARACTERS, '');

    /* 앞뒤를 남겨 무엇을 치려 했는지가 보이게 가운데를 접습니다 */
    if (display.length > MAX_DISPLAY_LENGTH) {
        display = `${display.slice(0, MAX_DISPLAY_LENGTH - 20)}…${display.slice(-16)}`;
    }

    return display;
}
