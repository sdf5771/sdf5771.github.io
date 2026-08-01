/**
 * 브레이크포인트 계약.
 *
 * 계약 원본은 docs/handoff-step1-shell.md §7 의 표입니다.
 * CSS 커스텀 프로퍼티는 @media 안에서 못 쓰므로 숫자가 CSS·JS 양쪽에 존재할 수밖에
 * 없습니다. **CSS 미디어쿼리를 고칠 때 이 파일도 함께 고쳐야 합니다.**
 *
 * | 이름 | 범위        | 셸 형태                                  |
 * |------|-------------|------------------------------------------|
 * | sm   | ~767px      | 모바일 헤더 52px + 드로어 + 검색 오버레이 |
 * | md   | 768~1023px  | 워드마크 + 경로 + 내비 + 검색 아이콘      |
 * | lg   | 1024~1279px | 데스크톱 전체 (인라인 검색)               |
 * | xl   | ≥1280px     | 동일, 컨테이너 1180px 고정                |
 *
 * 역할 분담: 레이아웃·표시 여부는 **CSS 미디어쿼리**가 담당합니다.
 * useMediaQuery 는 첫 렌더에서 false 를 반환해 레이아웃 플래시를 만듭니다.
 * 아래 상수는 **JS 가 뷰포트를 알아야만 하는 경우**(모달 여부 판단 등)에만 씁니다.
 */
export const BREAKPOINTS = {
    md: 768,
    lg: 1024,
    xl: 1280,
} as const;

/** ≤767px — 드로어·검색 오버레이가 전체화면 모달로 동작하는 구간 */
export const MEDIA_MOBILE = `(max-width: ${BREAKPOINTS.md - 1}px)`;

/** ≥1024px — 인라인 검색이 나오는 구간 */
export const MEDIA_DESKTOP = `(min-width: ${BREAKPOINTS.lg}px)`;
