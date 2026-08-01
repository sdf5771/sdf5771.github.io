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
import { useHeaderScroll, useLeftTruncate, useMediaMatch, useTerminalPath } from '../../hooks';

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
    /* 넘칠 때 앞을 잘라 `…뒷부분` 으로 만듭니다. CSS direction: rtl 은 경로를 뒤집습니다 */
    const { ref: pathRef, display: pathDisplay } = useLeftTruncate<HTMLSpanElement>(terminalPath);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    /*
     * 검색 UI 의 형태는 뷰포트에 따라 셋으로 갈립니다.
     *   ≤767px  전체화면 모달 오버레이 (포커스 트랩 + body 스크롤 락)
     *   768~1023px  헤더 아래 전폭 행 — 모달이 아님
     *   ≥1024px  헤더 인라인 입력 — 오버레이를 쓰지 않음
     * 여는 시점의 값에 고착되면 창 크기를 바꿨을 때 오버레이가 남고 스크롤 락이
     * 풀리지 않으므로(QA A-3) 구독해서 따라갑니다.
     */
    const isMobileViewport = useMediaMatch(MEDIA_MOBILE);
    const isDesktopViewport = useMediaMatch(MEDIA_DESKTOP);

    /* 홈에서만 헤더가 반투명하게 시작해 히어로 그래픽이 화면 끝까지 이어져 보입니다 */
    const scroll = useHeaderScroll({ isTransparentAtTop: pathname === '/' });

    const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
    const closeSearch = useCallback(() => setIsSearchOpen(false), []);

    const openSearch = useCallback(() => setIsSearchOpen(true), []);

    /*
     * 데스크톱으로 넘어가면 오버레이를 닫습니다.
     * 인라인 입력이 이미 헤더에 있어서, 그대로 두면 검색 UI 가 화면에 둘이 되고
     * role="dialog" 가 남은 채로 페이지가 잠깁니다(QA A-3).
     */
    useEffect(() => {
        if (isSearchOpen && isDesktopViewport) {
            setIsSearchOpen(false);
        }
    }, [isSearchOpen, isDesktopViewport]);

    /* ⌘K / Ctrl+K — 헤더에 노출된 힌트가 실제로 동작하게 합니다 */
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) {
                return;
            }

            event.preventDefault();

            if (isDesktopViewport) {
                document.querySelector<HTMLInputElement>('[data-header-search-input]')?.focus();
                return;
            }

            setIsSearchOpen(true);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isDesktopViewport]);

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
                    <span className={styles.path_text} ref={pathRef}>
                        {/* 자리가 부족하면 왼쪽부터 잘립니다 — 파일명이 정보량이 가장 큽니다.
                            보이는 쪽은 잘린 형태라 낭독은 전체 경로로 따로 둡니다. */}
                        <span aria-hidden="true">{pathDisplay}</span>
                        <span className="sr-only">{terminalPath}</span>
                    </span>
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
                isModal={isMobileViewport}
            />
        </>
    );
}

export default GlobalNavigationBar;
