import type { ThemeSetting } from '../theme';

/**
 * 테마 아이콘 — 5×5 도트 격자. 1 = 켜짐, 0 = 꺼짐.
 * 폰트·SVG 를 쓰지 않고 CSS 그리드로 직접 그립니다(§5-5).
 */
const toDots = (rows: string[]): boolean[] =>
    rows.flatMap(row => row.split('').map(cell => cell === '1'));

export const THEME_ICONS: Record<ThemeSetting, boolean[]> = {
    // A 자 — 시스템 설정을 따르는 상태
    system: toDots(['01110', '11000', '11011', '00011', '01110']),
    // 해
    light: toDots(['01010', '11111', '01110', '11111', '01010']),
    // 초승달
    dark: toDots(['01100', '11000', '11000', '11000', '01100']),
};

/** 확정 카피(§9). **다음에 일어날 동작**을 말합니다. */
export const THEME_NEXT_ACTION_LABEL: Record<ThemeSetting, string> = {
    // 지금 system → 누르면 light 로
    system: '라이트 모드로 전환',
    // 지금 light → 누르면 dark 로
    light: '다크 모드로 전환',
    // 지금 dark → 누르면 system 으로
    dark: '시스템 설정 따르기',
};

/** 드로어의 `테마` 섹션에 노출되는 3단계 라벨 */
export const THEME_LABEL: Record<ThemeSetting, string> = {
    system: '시스템',
    light: '라이트',
    dark: '다크',
};
