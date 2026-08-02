import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import styles from './Works.module.css';
import { WorkTypeFilter, WorkYearSection } from '../../components/works';
import { WORKS, WORK_TYPE_OPTIONS, groupWorksByYear } from '../../data/works';
import { WORKS_LABEL } from '../../constants/site';
import { buildWorkListPath, parseWorkType } from '../../utils/workListQuery';
import { useScrollBehavior } from '../../hooks';
import type { WorkType } from '../../types';

/**
 * 목록 헤더 문구 — `▸ 연도순 · 전체 15건`.
 *
 * 🔴 정렬 컨트롤이 **없습니다**(§5-6). 15건에 정렬 옵션은 과잉이고, 연도 그룹
 *    구조가 곧 정렬입니다. 그래서 `연도순` 은 선택지가 아니라 사실 진술입니다.
 * 🔴 수량사는 `건` 입니다(WRITING_GUIDE §3.4 — 글은 `편`, 태그·페이지는 `개`).
 */
function buildResultSummary(type: WorkType | null, count: number): string {
    const label = WORK_TYPE_OPTIONS.find(option => option.value === type)?.label ?? '전체';
    return `연도순 · ${label} ${count}건`;
}

/**
 * 작업 목록 `/works`.
 * 명세: docs/handoff-step7-works.md (토큰·셸은 docs/handoff-step1-shell.md 가 최종 권위)
 *
 * 주 과업: **처음 보는 사람이 "이 사람이 무엇을 만들어 왔는지" 를 스크롤 한 번으로
 * 파악하고, 궁금한 항목이 있으면 그 하나를 깊게 읽는다.**
 *
 * 이 화면의 조건은 다른 어떤 화면과도 다릅니다(§1).
 *
 * | 조건 | 결과 |
 * |---|---|
 * | 고객사 화면 캡처 사용 불가 | **썸네일 0장.** 이미지가 위계를 만들 수 없음 |
 * | 고객사·프로젝트명 전부 익명화 | 제목이 브랜드 후광을 못 씀 |
 * | 외부 링크 대부분 불가 | 업무 12건에 검증 경로가 없음 |
 * | 성과 % 수치 전부 제외 | "얼마나 잘했나" 를 말할 수 없음 |
 * | 초기 상세 0건 | 목록이 **끝**일 수 있음 |
 *
 * 남는 판단 재료는 **제목 · 기간 · 역할 · 요약 · 기술 스택** 다섯뿐이라, 이 화면은
 * 이미지가 아니라 **정보의 구조**로 버팁니다.
 *
 * 🔴 **빈 상태 UI 를 만들지 않습니다**(§13-3). 업무 12 · 개인·팀 3 이라 어떤
 *    필터에서도 결과가 0 이 아니고, 데이터는 번들 import 라 로드 실패도
 *    발생하지 않습니다. 도달할 수 없는 화면을 그리면 그 코드가 영원히 검증되지
 *    않은 채 남습니다.
 */
function Works() {
    const location = useLocation();
    const navigate = useNavigate();
    const navigationType = useNavigationType();
    const getScrollBehavior = useScrollBehavior();

    const type = useMemo(() => parseWorkType(location.search), [location.search]);

    const filtered = useMemo(
        () => (type === null ? WORKS : WORKS.filter(work => work.type === type)),
        [type],
    );

    /*
     * 🔴 연도 그룹을 **필터된 배열에서 파생**시킵니다(§3-1 구현 계약).
     *    `개인·팀` 필터를 걸면 2025·2022 가 통째로 사라지고 `2024 · 1건` /
     *    `2023 · 2건` 만 남습니다. 연도 목록을 상수로 두고 순회하면 그 두 연도에
     *    **빈 헤더**가 남습니다(규칙 5 위반).
     */
    const groups = useMemo(() => groupWorksByYear(filtered), [filtered]);

    /* ---------------------------------------------------------------
     * URL 정규화 — `?type=foo` 같은 알 수 없는 값은 `/works` 로 replace
     * ------------------------------------------------------------- */
    const canonicalPath = buildWorkListPath(location.search, type);

    useEffect(() => {
        const current = `${location.pathname}${location.search}`;

        if (canonicalPath === current) {
            return;
        }

        /*
         * `replace` 입니다. 잘못된 파라미터 교정은 **사용자가 한 일이 아니므로**
         * 히스토리에 남기지 않습니다. 칩 클릭은 링크라 기본 동작인 `push` 로 쌓여
         * 뒤로 가기로 이전 필터에 돌아갑니다(§5-7).
         */
        navigate(canonicalPath, { replace: true });
    }, [canonicalPath, location.pathname, location.search, navigate]);

    /* ---------------------------------------------------------------
     * 🔴 필터 전환 시 스크롤 계약 (§3-2)
     * ---------------------------------------------------------------
     * 목록 전체 높이가 전체 ≈3,000px → 개인·팀 ≈600px 로 **5배 급변**합니다.
     * 목록 하단에서 필터를 바꾸면 문서가 스크롤 위치보다 짧아져 브라우저가
     * 스크롤을 임의 지점으로 되돌립니다.
     *
     * 🔴 **위로 튀어 오르는 것도 튐입니다.** 이미 목록 상단 위(헤더·h1 을 보고
     *    있는 상태)면 스크롤하지 않습니다.
     * 🔴 포커스는 이동시키지 않습니다 — 방금 누른 칩에 그대로 둡니다.
     * ------------------------------------------------------------- */
    const listHeaderRef = useRef<HTMLDivElement>(null);
    const scrollKeyRef = useRef<WorkType | null | undefined>(undefined);

    useEffect(() => {
        const previous = scrollKeyRef.current;
        scrollKeyRef.current = type;

        /* 최초 마운트에서는 스크롤하지 않습니다 */
        if (previous === undefined || previous === type) {
            return;
        }

        /* 뒤로 가기(POP)는 브라우저 기본 복원에 맡깁니다 */
        if (navigationType !== 'PUSH') {
            return;
        }

        const node = listHeaderRef.current;

        if (!node || node.getBoundingClientRect().top >= 0) {
            return;
        }

        node.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' });
    }, [type, navigationType, getScrollBehavior]);

    const summary = buildResultSummary(type, filtered.length);

    return (
        <div className={styles.root}>
            <div className={styles.inner}>
                {/* 화면 이름은 `작업` 입니다 — `Works`·`포트폴리오` 금지(WRITING_GUIDE §9) */}
                <h1 className={styles.title}>{WORKS_LABEL}</h1>

                <p className={styles.lead}>만들어 온 것들을 연도별로 모았습니다.</p>

                <div className={styles.controls}>
                    <WorkTypeFilter
                        selected={type}
                        buildHref={next => buildWorkListPath(location.search, next)}
                    />
                </div>

                <div className={styles.list_header} ref={listHeaderRef}>
                    <p className={styles.summary}>
                        {/* `➜`(U+279C)는 Galmuri 서브셋에 없습니다. `▸`(U+25B8)로 통일(STEP 1 §4-7) */}
                        <span className={styles.prompt} aria-hidden="true">
                            ▸
                        </span>
                        {summary}
                    </p>
                </div>

                {/*
                 * 🔴 눈에 보이는 헤더와 **분리된** 알림 영역입니다(STEP 4 §9-4 와
                 *    같은 계약). 헤더 자체를 aria-live 로 만들면 그 안의 장식
                 *    기호 `▸` 가 낭독 범위에 들어갑니다(WRITING_GUIDE §7.4).
                 *
                 *    필터 전환의 재진입 애니메이션은 "목록이 바뀌었다" 의 유일한
                 *    시각 신호인데, 저감 모드에서는 사라지고 스크린리더 사용자는
                 *    애초에 받은 적이 없습니다. 이 영역이 그 자리를 메웁니다(§8-4).
                 */}
                <div className="sr-only" aria-live="polite" aria-atomic="true">
                    {summary}
                </div>

                <div
                    className={styles.groups}
                    /*
                     * key 를 바꿔 목록이 갈릴 때마다 재진입 애니메이션이 돕니다.
                     * 저감 모드에서는 CSS 가 이 애니메이션을 제거합니다(§8-1 1번).
                     */
                    key={type ?? 'all'}
                >
                    {groups.map(group => (
                        <WorkYearSection key={group.year} group={group} />
                    ))}
                </div>

                {/*
                 * 🔴 인위적 종결 장치를 두지 않습니다(§3-4). 마지막 그룹이
                 *    `2022 · 1건` 이라 목록이 "끊긴" 인상을 주지만, `➜ 끝` 류는
                 *    WRITING_GUIDE §1.4 위트 정지선에 걸립니다. 아래 여백과 푸터
                 *    경계선이 물리적으로 종결시킵니다.
                 *
                 * 🔴 **2021년 이전 그룹을 만들지 않습니다.** `2021 · 0건` 같은
                 *    헤더는 규칙 5(빈 연도 헤더 금지) 위반입니다.
                 */}
            </div>
        </div>
    );
}

export default Works;
