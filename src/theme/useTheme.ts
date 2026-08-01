import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ThemeContextValue } from './types';

export function useTheme(): ThemeContextValue {
    const value = useContext(ThemeContext);

    if (!value) {
        throw new Error('useTheme 은 ThemeProvider 안에서만 쓸 수 있습니다.');
    }

    return value;
}
