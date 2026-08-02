import styles from './ThemeToggle.module.css';
import { useTheme } from '../../theme';
import { THEME_ICONS, THEME_NEXT_ACTION_LABEL } from '../../constants/theme';

interface ThemeToggleProps {
    className?: string;
}

/**
 * 3단계 테마 토글 (시스템 → 라이트 → 다크 → 시스템).
 * 위치는 헤더 우측 끝이며 데스크톱·모바일이 동일합니다 — 드로어 안에 숨기지 않습니다.
 */
function ThemeToggle({ className }: ThemeToggleProps) {
    const { setting, cycleTheme } = useTheme();
    const icon = THEME_ICONS[setting];

    return (
        <button
            className={className ? `${styles.toggle} ${className}` : styles.toggle}
            type="button"
            onClick={cycleTheme}
            /* 다음에 일어날 동작을 말합니다 */
            aria-label={THEME_NEXT_ACTION_LABEL[setting]}
        >
            <span className={styles.icon} aria-hidden="true">
                {icon.map((isOn, index) => (
                    <span
                        key={index}
                        className={isOn ? styles.dot : styles.dot_off}
                    />
                ))}
            </span>
        </button>
    );
}

export default ThemeToggle;
