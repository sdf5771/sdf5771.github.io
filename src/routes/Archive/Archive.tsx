import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Archive.module.css';
import { ArchiveYearSection } from '../../components/archive';
import { ARCHIVE_FIRST_POST_DATE, ARCHIVE_YEARS, yearSectionId } from '../../data/archive';
import { TOTAL_POST_COUNT } from '../../data/posts';
import { ARCHIVE_LABEL } from '../../constants/site';
import { useScrollBehavior } from '../../hooks';

/** `2022-12-20` → `2022년 12월`. 앞자리 0 은 떼어냅니다 — 서술문이라 `12월` 이 자연스럽습니다 */
function formatFirstPostMonth(date: string): string {
    const [year, month] = date.split('-');
    return year && month ? `${year}년 ${Number(month)}월` : '';
}

/**
 * 연도별 보기 `/archive`.
 * 명세: docs/handoff-step6-tags-archive.md §8
 *
 * 주 과업: **조건 없이 전체를 시기 순서로 훑는다.**
 *
 * 🔴 `/posts` 와의 역할 분담 — 세 규칙 중 하나라도 어기면 즉시 중복이 됩니다(§1-1).
 *
 * | 규칙 | 내용 |
 * |:--:|---|
 * | R-1 | **검색·카테고리 필터·정렬 옵션·페이지네이션을 넣지 않습니다.** 하나라도 넣는 순간 `/posts?sort=oldest` 의 열화판이 됩니다 |
 * | R-2 | `/posts` 에 연도 필터를 넣지 않습니다 (그쪽 화면의 규칙) |
 * | R-3 | **행 컴포넌트를 공유하지 않습니다.** 좌측 축이 썸네일이 아니라 날짜입니다 (`ArchiveRow`) |
 *
 * 이 파일에 `useState` 가 접기 하나뿐인 것이 R-1 의 실행 증거입니다.
 *
 * 🔴 GNB 4항목에 없는 화면이라 **활성 내비 항목이 없는 것이 정답**입니다(§8-6).
 *    셸은 STEP 1 컴포넌트 하나이고 화면마다 다시 그리지 않습니다.
 */
function Archive() {
    const location = useLocation();
    const getScrollBehavior = useScrollBehavior();

    /*
     * 🔴 **접기 상태를 URL 에 넣지 않습니다**(§8-5). "상태는 URL" 원칙은
     *    *결과 집합을 바꾸는 조건*에 대한 것입니다. 접기 4개 boolean 은 같은
     *    콘텐츠를 가리키는 URL 16가지를 만들어 정규형을 지웁니다. 그리고
     *    "2023년이 접힌 아카이브" 를 공유할 이유가 없습니다.
     *
     * 기본값은 **전 연도 펼침**이고 데스크톱·모바일이 같습니다(§2-4).
     * 여기 담기는 것은 사용자가 **직접 접은** 연도뿐입니다.
     */
    const [collapsedYears, setCollapsedYears] = useState<ReadonlySet<string>>(new Set());

    /** 이동 요청. 펼침이 DOM 에 반영된 뒤 스크롤·포커스를 옮기기 위한 한 프레임짜리 상태 */
    const [pendingYear, setPendingYear] = useState<string | null>(null);

    /* 앵커 이동 시 포커스를 옮길 대상. 연도 → 섹션 헤딩 */
    const headingRefs = useRef(new Map<string, HTMLHeadingElement>());

    /*
     * ref 콜백은 **연도마다 하나를 만들어 재사용**합니다. 렌더마다 새 함수를
     * 넘기면 React 가 매번 `null` 로 떼었다 다시 붙이는데, 접기 토글이 리렌더를
     * 일으키므로 실제로 반복됩니다.
     */
    const headingRefCallbacks = useRef(
        new Map<string, (node: HTMLHeadingElement | null) => void>(),
    );

    const registerHeading = (year: string) => {
        const existing = headingRefCallbacks.current.get(year);

        if (existing) {
            return existing;
        }

        const callback = (node: HTMLHeadingElement | null) => {
            if (node) {
                headingRefs.current.set(year, node);
                return;
            }

            headingRefs.current.delete(year);
        };

        headingRefCallbacks.current.set(year, callback);
        return callback;
    };

    /**
     * 연도로 이동합니다.
     *
     * 🔴 시안의 `onPick` 은 `closed[y] = false` 만 하고 **스크롤 이동이 없었습니다.**
     *    29편 아래의 `2022` 를 눌러도 화면이 그대로라 아무 일도 일어나지 않은
     *    것처럼 보입니다.
     *
     * 🔴 저감 모드에서는 스크롤이 즉시 점프하므로 어디로 갔는지 알 수 없습니다.
     *    그래서 대상 섹션 헤딩으로 **포커스를 옮깁니다**(§11-4). `preventScroll`
     *    로 포커스가 자기 방식대로 한 번 더 스크롤하는 것을 막습니다.
     */
    const goToYear = useCallback((year: string) => {
        setCollapsedYears(current => {
            if (!current.has(year)) {
                return current;
            }

            /* 접혀 있으면 강제로 펼칩니다 — 눌렀는데 내용이 없으면 이동이 아닙니다 */
            const next = new Set(current);
            next.delete(year);
            return next;
        });

        /*
         * 실제 이동은 아래 효과가 합니다. **펼침이 DOM 에 반영된 뒤**에 스크롤해야
         * 목적지 높이가 맞기 때문입니다.
         *
         * 🔴 `requestAnimationFrame` 을 쓰지 않습니다. 배경 탭에서는 rAF 가 아예
         *    호출되지 않아(브라우저가 프레임을 그리지 않음) 이동이 조용히
         *    사라집니다. 효과는 커밋 직후 반드시 한 번 돕니다.
         */
        setPendingYear(year);
    }, []);

    useEffect(() => {
        if (!pendingYear) {
            return;
        }

        setPendingYear(null);

        const heading = headingRefs.current.get(pendingYear);

        if (!heading) {
            return;
        }

        heading.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' });

        /*
         * 🔴 포커스를 함께 옮깁니다(§11-4). 저감 모드에서는 스크롤이 즉시
         *    점프하는데, 포커스가 그대로면 키보드·스크린리더 사용자는 화면이
         *    어디로 갔는지 알 수 없습니다. `preventScroll` 은 포커스가 자기
         *    방식으로 한 번 더 스크롤해 sticky 헤더 보정을 덮어쓰는 것을 막습니다.
         */
        heading.focus({ preventScroll: true });
    }, [pendingYear, getScrollBehavior]);

    /* 주소에 `#year-2023` 을 달고 들어온 경우(공유 링크·새로고침) */
    useEffect(() => {
        const year = /^#year-(\d{4})$/.exec(location.hash)?.[1];

        if (year && ARCHIVE_YEARS.some(section => section.year === year)) {
            goToYear(year);
        }
        /* 해시가 바뀔 때만 반응합니다 — goToYear 는 안정된 콜백입니다 */
    }, [location.hash, goToYear]);

    const toggleYear = (year: string) => {
        setCollapsedYears(current => {
            const next = new Set(current);

            if (!next.delete(year)) {
                next.add(year);
            }

            return next;
        });
    };

    return (
        <div className={styles.root}>
            <div className={styles.inner}>
                <h1 className={styles.title}>{ARCHIVE_LABEL}</h1>

                {/* 시작 월과 편수를 **데이터에서** 뽑습니다. 문장에 박으면 글이 늘 때 틀립니다 */}
                <p className={styles.description}>
                    {`${formatFirstPostMonth(ARCHIVE_FIRST_POST_DATE)}부터 쓴 글 ${TOTAL_POST_COUNT}편입니다.`}
                </p>

                {/*
                 * 연도 칩 — **이동 링크이지 필터가 아닙니다.**
                 * 그래서 활성 상태를 두지 않고 `aria-pressed` 도 쓰지 않습니다(§8-5).
                 * `2025` 는 Galmuri11 11px 인데 **숫자라 규칙을 통과**하고, 옆의 수도
                 * GalmuriMono11 11px 이라 위반이 아닙니다.
                 */}
                <nav className={styles.years} aria-label="연도 이동">
                    <ul className={styles.year_list}>
                        {ARCHIVE_YEARS.map(section => (
                            <li key={section.year}>
                                <a
                                    className={styles.year_chip}
                                    href={`#${yearSectionId(section.year)}`}
                                    aria-label={`${section.year}년으로 이동, 글 ${section.posts.length}편`}
                                    onClick={event => {
                                        /*
                                         * ⌘/Ctrl+클릭·가운데 클릭은 브라우저에
                                         * 맡깁니다. 우리가 가로채는 것은 평범한
                                         * 좌클릭뿐입니다.
                                         */
                                        if (
                                            event.metaKey ||
                                            event.ctrlKey ||
                                            event.shiftKey ||
                                            event.altKey ||
                                            event.button !== 0
                                        ) {
                                            return;
                                        }

                                        event.preventDefault();
                                        goToYear(section.year);
                                    }}
                                >
                                    <span className={styles.year_chip_label} aria-hidden="true">
                                        {section.year}
                                    </span>
                                    <span className={styles.year_chip_count} aria-hidden="true">
                                        {section.posts.length}
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/*
                 * 🔴 연도 목록을 **데이터에서 파생**시킵니다. 시안의
                 *    `const YEARS = ['2025','2024','2023','2022']` 를 그대로 옮기면
                 *    2026년 글을 발행해도 섹션이 생기지 않습니다(§14-13).
                 *    빈 연도 분기도 만들지 않습니다 — 글이 없는 연도는 애초에
                 *    파생되지 않습니다.
                 */}
                <div className={styles.sections}>
                    {ARCHIVE_YEARS.map(section => (
                        <ArchiveYearSection
                            key={section.year}
                            ref={registerHeading(section.year)}
                            section={section}
                            isExpanded={!collapsedYears.has(section.year)}
                            onToggle={() => toggleYear(section.year)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Archive;
