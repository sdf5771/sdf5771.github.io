import { Link, useLocation } from 'react-router-dom';
import styles from './MobileDrawer.module.css';
import Wordmark from './Wordmark';
import { CONTACT_LINKS, NAV_ITEMS, isNavItemActive } from '../../constants/site';
import { THEME_LABEL } from '../../constants/theme';
import { useOverlayBehavior } from '../../hooks';
import { useTheme } from '../../theme';
import type { ThemeSetting } from '../../theme';

const THEME_OPTIONS: ThemeSetting[] = ['system', 'light', 'dark'];

interface MobileDrawerProps {
    id: string;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 모바일 전체화면 드로어.
 * 포커스 트랩 · ESC 닫기 · body 스크롤 락 · 닫을 때 트리거로 포커스 복귀는
 * useOverlayBehavior 가 담당합니다. 명세: §6-3
 */
function MobileDrawer({ id, isOpen, onClose }: MobileDrawerProps) {
    const { pathname } = useLocation();
    const { setting, setTheme } = useTheme();
    const containerRef = useOverlayBehavior<HTMLDivElement>({
        isOpen,
        onClose,
        isModal: true,
    });

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className={styles.drawer}
            id={id}
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label="메뉴"
        >
            <div className={styles.head}>
                <Wordmark className={styles.wordmark} />
                <button
                    className={styles.close}
                    type="button"
                    onClick={onClose}
                    aria-label="메뉴 닫기"
                    data-autofocus
                >
                    {/* `✕`(U+2715)는 Galmuri 에 없습니다. `×`(U+00D7) 로 대체(§4-7) */}
                    <span aria-hidden="true">×</span>
                </button>
            </div>

            <nav className={styles.nav} aria-label="주요 메뉴">
                <ul className={styles.nav_list}>
                    {NAV_ITEMS.map(item => {
                        const isActive = isNavItemActive(item, pathname);

                        return (
                            <li key={item.path}>
                                <Link
                                    className={
                                        isActive
                                            ? `${styles.nav_link} ${styles.nav_link_active}`
                                            : styles.nav_link
                                    }
                                    to={item.path}
                                    aria-current={isActive ? 'page' : undefined}
                                    onClick={onClose}
                                >
                                    <span className={styles.bullet} aria-hidden="true">
                                        {isActive ? '●' : '○'}
                                    </span>
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <section className={styles.section}>
                <h2 className={styles.section_title}>연락처</h2>
                <ul className={styles.contact_list}>
                    {CONTACT_LINKS.map(link => (
                        <li key={link.label}>
                            <a className={styles.contact_link} href={link.href}>
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </section>

            <section className={styles.section}>
                <h2 className={styles.section_title} id={`${id}-theme`}>
                    테마
                </h2>
                <div className={styles.theme_options} role="group" aria-labelledby={`${id}-theme`}>
                    {THEME_OPTIONS.map(option => (
                        <button
                            key={option}
                            className={
                                option === setting
                                    ? `${styles.theme_option} ${styles.theme_option_active}`
                                    : styles.theme_option
                            }
                            type="button"
                            aria-pressed={option === setting}
                            onClick={() => setTheme(option)}
                        >
                            {THEME_LABEL[option]}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default MobileDrawer;
