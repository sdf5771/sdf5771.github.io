/** 사용자가 고른 값. localStorage["theme"] 에 그대로 저장됩니다. */
export type ThemeSetting = 'system' | 'light' | 'dark';

/** 실제로 화면에 적용되는 값. <html data-theme> 에 들어갑니다. */
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
    /** 사용자가 고른 값 (system 포함) */
    setting: ThemeSetting;
    /** system 을 해석한 실제 적용값 */
    resolved: ResolvedTheme;
    setTheme: (next: ThemeSetting) => void;
    /** system → light → dark → system 순환 */
    cycleTheme: () => void;
}
