/**
 * 생성 그래픽의 **결정론 씨앗**.
 * 명세: docs/handoff-step4-list.md §6-3 R1 · docs/handoff-step7-works.md §9-2
 *
 * 글 목록 41편(`PostGlyph`)과 작업 목록 15건(`WorkGlyph`) — 두 화면 합계 56개
 * 타일이 **같은 해시**를 씁니다. 조형은 갈라져도(자유 성좌 vs 격자+직각 배선)
 * 씨앗이 같아야 "한 시스템" 이 유지되고, 무엇보다 같은 slug 가 언제나 같은
 * 그림을 냅니다.
 *
 * 🔴 씨앗은 **`slug` 입니다. `title` 이 아닙니다**(§9-2).
 *    익명 표기안은 앞으로 문구가 조정될 수 있고, 제목이 한 글자만 바뀌어도 그림이
 *    통째로 달라집니다. `slug` 는 URL 이라 불변 계약입니다.
 */

/**
 * FNV-1a 32비트. 암호 강도가 필요한 자리가 아니고, **같은 문자열이 언제나 같은
 * 수를 내는 것**만 필요합니다. 짧고 의존성이 없습니다.
 */
export function hashSeed(value: string): number {
    let hash = 0x811c9dc5;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        /* imul 이 없으면 32비트를 넘어가며 정밀도가 깨져 결정론이 무너집니다 */
        hash = Math.imul(hash, 0x01000193);
    }

    return hash >>> 0;
}

/**
 * 선형 합동 생성기. `Math.random` 을 쓰지 않는 이유가 곧 R1 입니다 —
 * 난수를 쓰면 같은 항목이 렌더마다 다른 그림이 되고, 프리렌더 HTML 과
 * 하이드레이션 결과가 어긋납니다.
 *
 * 계수는 Numerical Recipes 의 값입니다. 품질보다 **재현성과 짧음**이 목적입니다.
 */
export function createLcg(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state;
    };
}
