import { useCallback, useEffect, useId, useRef, useState } from 'react';
import styles from './PostToc.module.css';
import type { PostHeading } from '../../utils/postContent';
import { useOverlayBehavior, useScrollBehavior } from '../../hooks';

/**
 * 목차 — 데스크톱 사이드바 · 모바일 바텀시트.
 * 명세: docs/handoff-step3-post.md §8-3 ~ §8-6 · §18(확정 카피)
 *
 * 🔴 **H2 + H3 를 모두 담습니다.** H2 만 담으면 목차 없는 글이 12편이지만,
 *    그 12편 중 10편은 **H3 를 최상위 섹션 구분으로 쓰고 있습니다**(§2-2).
 *    본문 h1 강등(§5-5)까지 하면 41편 **전부**가 목차를 갖습니다.
 *    h4 는 제외입니다 — 4편만 쓰는데 항목 수만 늘립니다.
 */

/**
 * 목차를 그릴 최소 항목 수.
 *
 * 🔴 1개짜리 목차는 목차가 아닙니다. 누를 곳이 하나뿐이고 그 하나는 대개
 *    화면에 이미 보입니다. h1 강등 후 실측하면 **항목 0개인 글은 없고**,
 *    1개인 글이 2편(`React-Redux` · `Python-under-bar`)입니다.
 *    이 2편에 §2-2 의 대체 카드가 나갑니다.
 */
const MIN_TOC_ITEMS = 2;

function hasUsableToc(headings: PostHeading[]): boolean {
    return headings.length >= MIN_TOC_ITEMS;
}

/**
 * 목차 아이콘 5×5 비트맵 — 폰트 대신 **CSS 도트**로 그립니다.
 * 명세: docs/handoff-step1-shell.md §4-7 (2026-08-01 추가)
 *
 * 🔴 원래 `≡`(U+2261)를 썼는데 **세 서브셋 어디에도 없습니다.** macOS 에서는
 *    시스템 폰트로 폴백돼 보이지만 전역 규칙(§4-7 "장식 기호는 서브셋 cmap 에
 *    실재하는 문자만") 위반입니다. `☰`(U+2630)은 폰트에 있지만 **모바일 메뉴가
 *    이미 쓰고 있어** 같은 글리프가 두 의미를 갖게 되므로 반려됐습니다.
 *    검색 아이콘·테마 토글과 같은 기법이라 서브셋 범위가 바뀌어도 안 깨집니다.
 *
 * 명세의 기본형은 같은 길이의 3줄(`# # # # #` × 3)이지만 그대로 두면 햄버거와
 * 구별되지 않습니다. 명세가 허용한 재량(*"줄 길이를 들여쓰기해 문서 개요처럼
 * 차별화하세요"*)을 써서 2·3번째 줄을 한 칸 들여썼습니다.
 *
 *   # # # # #     ← 최상위 소제목
 *   . . . . .
 *   . # # # #     ← 하위 항목
 *   . . . . .
 *   . # # # #
 */
const TOC_ICON_BITMAP = [
    1, 1, 1, 1, 1,
    0, 0, 0, 0, 0,
    0, 1, 1, 1, 1,
    0, 0, 0, 0, 0,
    0, 1, 1, 1, 1,
];

/** 색은 `currentColor` 를 따르므로 감싸는 쪽이 정합니다. 순수 장식입니다 */
function TocIcon() {
    return (
        <span className={styles.icon} aria-hidden="true">
            {TOC_ICON_BITMAP.map((isOn, index) => (
                <span key={index} className={isOn ? styles.icon_dot : styles.icon_dot_off} />
            ))}
        </span>
    );
}

/* ------------------------------------------------------------
 * 공통 목록
 * ---------------------------------------------------------- */

interface TocListProps {
    headings: PostHeading[];
    activeId: string | null;
    onJump: (id: string) => void;
    /** 바텀시트는 항목이 커지고(48px) 활성 배경이 깔립니다 */
    variant: 'sidebar' | 'sheet';
}

function TocList({ headings, activeId, onJump, variant }: TocListProps) {
    const listRef = useRef<HTMLUListElement>(null);

    /*
     * 활성 항목이 목차의 스크롤 영역 밖으로 나가면 목차 **안에서만** 스크롤해
     * 보이게 합니다. 항목이 최대 24개(≈864px)라 노트북 뷰포트를 넘습니다(§8-5).
     *
     * 🔴 `behavior` 를 주지 않습니다. 여기는 사용자가 시작한 이동이 아니라
     *    스크롤에 따라오는 보정이라, 부드럽게 하면 목차가 계속 미끄러집니다.
     *    `block: 'nearest'` 라 이미 보이는 항목은 아무 일도 일어나지 않습니다.
     */
    useEffect(() => {
        if (!activeId || !listRef.current) {
            return;
        }

        listRef.current
            .querySelector(`[data-heading-id="${activeId}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [activeId]);

    return (
        <ul ref={listRef} className={`${styles.list} ${styles[`list_${variant}`]}`}>
            {headings.map(heading => {
                const isActive = heading.id === activeId;

                return (
                    <li key={heading.id}>
                        <a
                            className={styles.item}
                            data-heading-id={heading.id}
                            data-level={heading.level}
                            data-active={isActive ? 'true' : undefined}
                            href={`#${heading.id}`}
                            /* 🔴 활성 표시를 색에만 의존하지 않습니다 — 좌측 바 + 이 속성(§8-4) */
                            aria-current={isActive ? 'location' : undefined}
                            /* 2행 클램프로 잘린 항목의 전체 텍스트. 최장 101자입니다 */
                            title={heading.text}
                            onClick={event => {
                                event.preventDefault();
                                onJump(heading.id);
                            }}
                        >
                            {heading.text}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * 목차를 그리기엔 소제목이 부족한 글의 대체 카드 (§2-2 · 확정 카피 §18).
 * h1 강등 후 실측 **2편**(항목 1개 이하)에만 나타납니다.
 *
 * 🔴 카피가 `소제목이 없는 글이에요` 였는데 **사실이 아니었습니다.** 해당 2편
 *    (`react-redux`·`python-under-bar`)에는 소제목이 1개 있고 화면에 보입니다.
 *    확정안은 소제목 0개와 1개 **양쪽에 참**이라 헤딩 분포가 바뀌어도 거짓이
 *    되지 않습니다(2026-08-01 정정).
 *
 * 🔴 액션 버튼을 두지 않습니다. 실패 상태가 아니라 정상 안내이고, 여기서
 *    사용자가 할 수 있는 일이 없습니다 — WRITING_GUIDE §6.2 의 3요소는
 *    "빠져나와야 하는 상태" 에 적용됩니다.
 */
function TocEmpty() {
    return (
        <div className={styles.empty}>
            <p className={styles.empty_title}>목차를 만들기엔 소제목이 적어요</p>
            <p className={styles.empty_description}>대신 진행률로 위치를 알려드려요.</p>
        </div>
    );
}

/* ------------------------------------------------------------
 * 점프 동작
 * ---------------------------------------------------------- */

function useHeadingJump(onAfterJump?: () => void) {
    const getScrollBehavior = useScrollBehavior();

    return useCallback(
        (id: string) => {
            const heading = document.getElementById(id);
            if (!heading) {
                return;
            }

            onAfterJump?.();

            /* 🔴 저감 모션이면 즉시 이동입니다. 부드러운 스크롤은 전정기관 자극의
               대표 원인이고, 목차 점프는 이동 거리가 깁니다(§9-2 3번) */
            heading.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' });

            /*
             * 키보드·스크린리더 사용자를 위해 포커스도 함께 옮깁니다. 스크롤만
             * 시키면 다음 Tab 이 문서 처음으로 돌아가 점프가 무의미해집니다.
             * 헤딩은 원래 포커스를 받지 않으므로 `tabIndex = -1` 을 임시로 답니다.
             */
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
        },
        [getScrollBehavior, onAfterJump],
    );
}

/* ------------------------------------------------------------
 * 데스크톱 사이드바
 * ---------------------------------------------------------- */

export function PostTocSidebar({
    headings,
    activeId,
}: {
    headings: PostHeading[];
    activeId: string | null;
}) {
    const jump = useHeadingJump();
    const getScrollBehavior = useScrollBehavior();

    return (
        /* 🔴 랜드마크 이름은 `목차` 입니다. `INDEX`·`Contents` 금지(§6.10) */
        <nav className={styles.sidebar} aria-label="목차">
            <p className={styles.label}>목차</p>

            {hasUsableToc(headings) ? (
                <TocList headings={headings} activeId={activeId} onJump={jump} variant="sidebar" />
            ) : (
                <TocEmpty />
            )}

            <button
                type="button"
                className={styles.top_button}
                aria-label="맨 위로 이동"
                onClick={() => window.scrollTo({ top: 0, behavior: getScrollBehavior() })}
            >
                맨 위로
            </button>
        </nav>
    );
}

/* ------------------------------------------------------------
 * 모바일 — 플로팅 버튼 + 바텀시트 (§8-6)
 * ---------------------------------------------------------- */

export function PostTocMobile({
    headings,
    activeId,
    percent,
}: {
    headings: PostHeading[];
    activeId: string | null;
    percent: number;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const sheetId = useId();
    const close = useCallback(() => setIsOpen(false), []);

    /*
     * 포커스 트랩 · ESC 닫기 · body 스크롤 락 · 닫을 때 트리거로 포커스 복귀를
     * 셸의 오버레이 훅이 전부 갖고 있습니다. 여기서 다시 만들지 않습니다 —
     * 특히 스크롤 락은 전역 참조 카운트라 사본을 만들면 잠금이 영구히 남는
     * 결함이 돌아옵니다(utils/bodyScrollLock 주석).
     */
    const sheetRef = useOverlayBehavior<HTMLDivElement>({ isOpen, onClose: close, isModal: true });

    /* 항목을 누르면 **시트를 먼저 닫고** 스크롤합니다(§8-6) */
    const jump = useHeadingJump(close);

    /* 🔴 목차가 없는 글에서는 버튼 자체가 나타나지 않습니다(§8-6) */
    if (!hasUsableToc(headings)) {
        return null;
    }

    return (
        <>
            <button
                type="button"
                className={styles.floating}
                aria-label="목차 열기"
                aria-expanded={isOpen}
                aria-controls={sheetId}
                onClick={() => setIsOpen(true)}
            >
                <TocIcon />
                목차
                {/*
                 * 버튼이 진행률 표시를 겸합니다 — 닫혀 있는 동안에도 정보를
                 * 제공하므로 "아무 일도 하지 않는 버튼" 이 아닙니다(§2-1).
                 * 진행바가 이미 `role=progressbar` 로 같은 값을 말하므로
                 * 여기서는 중복 낭독을 피해 숨깁니다.
                 */}
                <span className={styles.floating_percent} aria-hidden="true">
                    {percent}%
                </span>
            </button>

            {isOpen && (
                <div className={styles.scrim}>
                    <div
                        ref={sheetRef}
                        id={sheetId}
                        className={styles.sheet}
                        role="dialog"
                        aria-modal="true"
                        aria-label="목차"
                    >
                        <div className={styles.sheet_header}>
                            <p className={styles.label}>목차</p>
                            <button
                                type="button"
                                className={styles.sheet_close}
                                aria-label="목차 닫기"
                                data-autofocus
                                onClick={close}
                            >
                                {/*
                                 * 🔴 `✕`(U+2715)는 Galmuri 서브셋에 없습니다
                                 * (Dingbats 블록이 통째로 빠져 있음). 라틴-1 의
                                 * `×`(U+00D7)로 대체합니다 — `AppliedConditions`
                                 * 도 같은 이유로 이 문자를 씁니다(§4-7).
                                 */}
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>

                        <TocList
                            headings={headings}
                            activeId={activeId}
                            onJump={jump}
                            variant="sheet"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
