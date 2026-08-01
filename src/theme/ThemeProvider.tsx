import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import {
    PREFERS_DARK_QUERY,
    THEME_CYCLE,
    applyDocumentTheme,
    readDocumentTheme,
    readStoredSetting,
    writeStoredSetting,
} from './themeStorage';
import type { ResolvedTheme, ThemeSetting } from './types';

/**
 * 테마 상태 보관소.
 *
 * zustand 가 아니라 Context 를 쓴 이유:
 * 값이 문자열 하나이고 갱신 빈도가 극히 낮아(사용자가 토글을 누를 때만) 리렌더 비용이
 * 문제가 되지 않습니다. 또 실제 적용은 <html data-theme> 속성이 하고 React 는 그 값을
 * 들고만 있으므로, 스토어를 하나 도입해서 얻을 이점이 없습니다.
 * src/stores/index.ts 는 여전히 빈 채로 둡니다.
 */
function ThemeProvider({ children }: { children: ReactNode }) {
    // 초기값은 index.html 부트스트랩이 이미 결정해 둔 것을 그대로 읽습니다.
    const [setting, setSettingState] = useState<ThemeSetting>(readStoredSetting);
    const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(readDocumentTheme);

    // setting 이 'system' 일 때 OS 테마 변화를 런타임에 따라가야 합니다.
    useLayoutEffect(() => {
        const query = window.matchMedia(PREFERS_DARK_QUERY);
        const syncSystemTheme = () => setSystemTheme(query.matches ? 'dark' : 'light');

        syncSystemTheme();
        query.addEventListener('change', syncSystemTheme);
        return () => query.removeEventListener('change', syncSystemTheme);
    }, []);

    const resolved: ResolvedTheme = setting === 'system' ? systemTheme : setting;

    // 첫 적용은 부트스트랩 결과와 같으므로 트랜지션 차단이 필요 없습니다.
    const hasAppliedRef = useRef(false);
    useLayoutEffect(() => {
        applyDocumentTheme(resolved, hasAppliedRef.current);
        hasAppliedRef.current = true;
    }, [resolved]);

    const setTheme = useCallback((next: ThemeSetting) => {
        setSettingState(next);
        writeStoredSetting(next);
    }, []);

    const cycleTheme = useCallback(() => {
        const nextIndex = (THEME_CYCLE.indexOf(setting) + 1) % THEME_CYCLE.length;
        setTheme(THEME_CYCLE[nextIndex]);
    }, [setting, setTheme]);

    const value = useMemo(
        () => ({ setting, resolved, setTheme, cycleTheme }),
        [setting, resolved, setTheme, cycleTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export default ThemeProvider;
