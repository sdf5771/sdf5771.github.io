import { Link, useLocation } from 'react-router-dom';
import styles from './GlobalNavigationBar.module.css';
import Wordmark from './Wordmark';
import ThemeToggle from './ThemeToggle';
import { NAV_ITEMS, WORDMARK_TEXT, isNavItemActive } from '../../constants/site';
import { useTerminalPath } from '../../hooks';

/**
 * 전역 헤더.
 * 반응형은 CSS 미디어쿼리 하나로 처리합니다 — 내비 <ul> 은 DOM 에 하나뿐이고,
 * 뷰포트에 따라 배치·표시 여부만 바뀝니다. (데스크톱용·모바일용 메뉴가 DOM 에
 * 둘 다 있으면 스크린리더가 메뉴를 두 번 읽습니다.)
 * 명세: docs/handoff-step1-shell.md §6-1
 */
function GlobalNavigationBar() {
    const { pathname } = useLocation();
    const terminalPath = useTerminalPath();

    return (
        <header className={styles.header}>
            {/* 헤더가 sticky 라 스킵 링크가 필수입니다. 포커스 시에만 노출됩니다. */}
            <a className={styles.skip_link} href="#main">
                본문 바로가기
            </a>

            <div className={styles.inner}>
                <Link className={styles.brand} to="/" aria-label={`${WORDMARK_TEXT} 홈`}>
                    <Wordmark className={styles.wordmark} withMemoji />
                </Link>

                <p className={styles.path}>
                    <span className={styles.prompt} aria-hidden="true">
                        ➜
                    </span>
                    {/* 자리가 부족하면 왼쪽부터 잘립니다 — 파일명이 정보량이 가장 큽니다 */}
                    <bdi className={styles.path_text}>{terminalPath}</bdi>
                </p>

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
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className={styles.actions}>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}

export default GlobalNavigationBar;
