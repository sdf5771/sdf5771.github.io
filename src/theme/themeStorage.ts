import type { ResolvedTheme, ThemeSetting } from './types';

export const THEME_STORAGE_KEY = 'theme';
export const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';

/** system → light → dark → system */
export const THEME_CYCLE: ThemeSetting[] = ['system', 'light', 'dark'];

const isThemeSetting = (value: string | null): value is ThemeSetting =>
    value === 'system' || value === 'light' || value === 'dark';

/**
 * index.html 의 부트스트랩 스크립트와 같은 키를 읽습니다.
 * 두 곳이 어긋나면 첫 페인트와 React 상태가 달라지므로 키를 바꿀 때 함께 고쳐야 합니다.
 */
export function readStoredSetting(): ThemeSetting {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        return isThemeSetting(stored) ? stored : 'system';
    } catch {
        return 'system';
    }
}

export function writeStoredSetting(setting: ThemeSetting): void {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, setting);
    } catch {
        /* 사파리 프라이빗 모드 등에서 쓰기가 막혀도 화면 동작은 유지합니다 */
    }
}

export function readSystemPrefersDark(): boolean {
    return window.matchMedia(PREFERS_DARK_QUERY).matches;
}

/**
 * 부트스트랩 스크립트가 이미 써 둔 값을 읽습니다.
 * 첫 렌더의 상태를 DOM 과 일치시켜 깜빡임을 없애는 것이 목적입니다.
 */
export function readDocumentTheme(): ResolvedTheme {
    return document.documentElement.getAttribute('data-theme') === 'light'
        ? 'light'
        : 'dark';
}

/**
 * <html data-theme> 을 갱신합니다.
 * shouldSuppressTransition 이 true 면 전환 순간 색 트랜지션을 잠시 꺼서
 * 화면 전체가 훑히듯 바뀌는 것을 막습니다(§5-4).
 */
export function applyDocumentTheme(
    theme: ResolvedTheme,
    shouldSuppressTransition: boolean,
): void {
    const root = document.documentElement;

    if (!shouldSuppressTransition) {
        root.setAttribute('data-theme', theme);
        return;
    }

    root.classList.add('theme-switching');
    root.setAttribute('data-theme', theme);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            root.classList.remove('theme-switching');
        });
    });
}
