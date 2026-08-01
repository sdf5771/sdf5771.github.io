import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './GlobalNavigationBar.module.css';
import Wordmark from './Wordmark';
import ThemeToggle from './ThemeToggle';
import MobileDrawer from './MobileDrawer';
import HeaderSearch from './HeaderSearch';
import SearchPanel from './SearchPanel';
import { NAV_ITEMS, WORDMARK_TEXT, isNavItemActive } from '../../constants/site';
import { MEDIA_DESKTOP, MEDIA_MOBILE } from '../../styles/breakpoints';
import { useHeaderScroll, useTerminalPath } from '../../hooks';

const DRAWER_ID = 'mobile-drawer';
const SEARCH_PANEL_ID = 'header-search-overlay';

/**
 * 전역 헤더.
 * 반응형은 CSS 미디어쿼리 하나로 처리합니다 — 내비 <ul> 은 DOM 에 하나뿐이고,
 * 뷰포트에 따라 배치·표시 여부만 바뀝니다. (데스크톱용·모바일용 메뉴가 DOM 에
 * 둘 다 있으면 스크린리더가 메뉴를 두 번 읽습니다.)
 * 명세: docs/handoff-step1-shell.md §6-1 / §6-2 / §6-3
 */
function GlobalNavigationBar() {
    const { pathname } = useLocation();
    const terminalPath = useTerminalPath();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSearchModal, setIsSearchModal] = useState(false);

    /* 홈에서만 헤더가 반투명하게 시작해 히어로 그래픽이 화면 끝까지 이어져 보입니다 */
    const scroll = useHeaderScroll({ isTransparentAtTop: pathname === '/' });

    const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
    const closeSearch = useCallback(() => setIsSearchOpen(false), []);

    /*
     * 검색 패널이 전체화면 모달인지(≤767px)는 여는 시점에 결정합니다.
     * 768~1023px 의 전폭 행은 모달이 아니라서 포커스 트랩·스크롤 락을 걸면 안 됩니다.
     * 레이아웃이 아니라 "JS 가 뷰포트를 알아야 하는" 경우라 matchMedia 를 직접 씁니다(§7).
     */
    const openSearch = useCallback(() => {
        setIsSearchModal(window.matchMedia(MEDIA_MOBILE).matches);
        setIsSearchOpen(true);
    }, []);

    /* ⌘K / Ctrl+K — 헤더에 노출된 힌트가 실제로 동작하게 합니다 */
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) {
                return;
            }

            event.preventDefault();

            if (window.matchMedia(MEDIA_DESKTOP).matches) {
                document.querySelector<HTMLInputElement>('[data-header-search-input]')?.focus();
                return;
            }

            setIsSearchModal(window.matchMedia(MEDIA_MOBILE).matches);
            setIsSearchOpen(true);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <header
                className={styles.header}
                data-has-border={scroll.hasBorder}
                data-hidden={scroll.isHidden && !isDrawerOpen && !isSearchOpen}
                style={{ '--header-bg-alpha': scroll.backgroundAlpha } as CSSProperties}
            >
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
                    <div className={styles.search_inline}>
                        <HeaderSearch />
                    </div>

                    <button
                        className={styles.icon_button}
                        type="button"
                        aria-label="검색 열기"
                        aria-expanded={isSearchOpen}
                        aria-controls={SEARCH_PANEL_ID}
                        onClick={openSearch}
                    >
                        <span aria-hidden="true">⌕</span>
                    </button>

                    <ThemeToggle />

                    <button
                        className={`${styles.icon_button} ${styles.menu_trigger}`}
                        type="button"
                        aria-label={isDrawerOpen ? '메뉴 닫기' : '메뉴 열기'}
                        aria-expanded={isDrawerOpen}
                        aria-controls={DRAWER_ID}
                        onClick={() => setIsDrawerOpen(prev => !prev)}
                    >
                        <span aria-hidden="true">☰</span>
                    </button>
                    </div>
                </div>
            </header>

            {/*
             * 드로어·검색 패널은 <header> **밖**에 둡니다.
             * 헤더가 숨을 때 transform 이 걸리는데, transform 이 걸린 요소는
             * position: fixed 자손의 컨테이닝 블록이 되어 전체화면 오버레이가
             * 헤더 기준으로 잘려 버립니다.
             */}
            <MobileDrawer id={DRAWER_ID} isOpen={isDrawerOpen} onClose={closeDrawer} />
            <SearchPanel
                id={SEARCH_PANEL_ID}
                isOpen={isSearchOpen}
                onClose={closeSearch}
                isModal={isSearchModal}
            />
        </>
    );
}

export default GlobalNavigationBar;
