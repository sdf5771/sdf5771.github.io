import { useEffect, useState } from 'react';
import styles from './ContributionGraph.module.css';
import { useMediaMatch } from '../../hooks';
import { MEDIA_MOBILE } from '../../styles/breakpoints';
import { loadContributions } from '../../utils/contributions';
import type { Contributions } from '../../utils/contributions';

/**
 * 기여 활동(잔디) — **홈과 소개가 함께 쓰는 공유 컴포넌트**.
 * 명세: docs/handoff-step5-404-about.md §5
 *
 * 🔴 props 를 늘리지 마세요. 주 수·요약 문구·색·캡션·범례를 props 로 열면
 *    두 화면이 갈리는 문을 여는 것입니다. "소개와 홈에서 주 수·요약 표기가
 *    다르면 안 된다"를 **구조적으로** 보장하는 방법은 조절할 수 없게 만드는
 *    것입니다. 주 수(52/16)는 props 가 아니라 이 컴포넌트가 결정합니다.
 */

/** 데스크톱은 뒤에서 52주, sm 은 뒤에서 16주 */
const WEEKS_DESKTOP = 52;
const WEEKS_MOBILE = 16;

const LEVELS = [0, 1, 2, 3, 4];

/** 14일 넘게 갱신되지 않으면 개발자에게만 알립니다 */
const STALE_THRESHOLD_MS = 14 * 864e5;

const GITHUB_URL = 'https://github.com/sdf5771';

interface ContributionGraphProps {
    /** 섹션 h2 에 `$` 터미널 프롬프트를 붙일지. 소개=true, 홈=false */
    showPrompt?: boolean;
}

/** `2026-07-26` → `2026.07.26` (화면 표시용) */
function formatDisplayDate(date: string): string {
    return date.split('-').join('.');
}

/**
 * `2026-07-26` → `2026년 7월 26일` (aria-label 용).
 * 음성으로 읽히는 문장이라 화면 표기와 형식이 다른 것이 정상입니다(§3.4).
 * Date 를 거치지 않고 문자열을 쪼갭니다 — `new Date('2026-07-26')` 는 UTC 로
 * 해석돼 시간대에 따라 하루가 밀립니다.
 */
function formatSpokenDate(date: string): string {
    const [year, month, day] = date.split('-');

    return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

type LoadState =
    | { status: 'loading' }
    | { status: 'ready'; data: Contributions }
    | { status: 'failed' };

function ContributionGraph({ showPrompt = false }: ContributionGraphProps) {
    const [state, setState] = useState<LoadState>({ status: 'loading' });
    const isMobileViewport = useMediaMatch(MEDIA_MOBILE);

    useEffect(() => {
        let isActive = true;

        loadContributions()
            .then(data => {
                if (!isActive) {
                    return;
                }

                /*
                 * 미갱신은 **UI 를 바꾸지 않습니다.** `데이터가 오래됐어요` 는
                 * 사용자에게 어떤 행동도 주지 못하고, Actions 가 멈춘 것은 사이트
                 * 오류가 아니라 저자 사정입니다. 이미 `마지막 활동 {날짜}` 가
                 * 사실을 그대로 말하고 있습니다(§5-5).
                 */
                if (Date.now() - Date.parse(data.generatedAt) > STALE_THRESHOLD_MS) {
                    console.warn(
                        '[contributions] 데이터가 14일 이상 갱신되지 않았습니다:',
                        data.generatedAt,
                    );
                }

                setState({ status: 'ready', data });
            })
            .catch(() => {
                if (isActive) {
                    setState({ status: 'failed' });
                }
            });

        return () => {
            isActive = false;
        };
    }, []);

    const weekCount = isMobileViewport ? WEEKS_MOBILE : WEEKS_DESKTOP;

    const heading = (
        <h2 className={styles.heading}>
            {showPrompt && (
                <span className={styles.prompt} aria-hidden="true">
                    ${' '}
                </span>
            )}
            기여 활동
        </h2>
    );

    /*
     * 실패해도 섹션 자체를 숨기지 않습니다. 사라지면 레이아웃이 튀고,
     * 재방문 시 "원래 없던 것"으로 오해됩니다(§5-5).
     */
    if (state.status === 'failed') {
        return (
            <section className={styles.section}>
                {heading}
                <p className={styles.caption}>🌱 자라나라 잔디 잔디</p>

                <div className={styles.panel}>
                    <p className={styles.error_title}>기여 활동을 불러오지 못했어요</p>
                    <p className={styles.error_description}>잠시 후 다시 시도해 주세요.</p>
                    <a
                        className={styles.error_action}
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub에서 보기 (새 창)"
                    >
                        GitHub에서 보기 <span aria-hidden="true">↗</span>
                    </a>
                </div>
            </section>
        );
    }

    if (state.status === 'loading') {
        return (
            <section className={styles.section}>
                {heading}
                <p className={styles.caption}>🌱 자라나라 잔디 잔디</p>

                <div className={styles.panel}>
                    {/* 텍스트 없는 스켈레톤. `불러오는 중…` 을 쓰지 않습니다(§6.4) */}
                    <div className={styles.skeleton} data-weeks={weekCount} />
                </div>
            </section>
        );
    }

    const { data } = state;
    const weeks = data.weeks.slice(-weekCount);

    const summary =
        data.lastActiveDate === null
            ? `최근 1년 ${data.total}회`
            : `최근 1년 ${data.total}회 · 마지막 활동 ${formatDisplayDate(data.lastActiveDate)}`;

    const gridLabel =
        data.lastActiveDate === null
            ? `최근 1년 기여 활동 ${data.total}회`
            : `최근 1년 기여 활동 ${data.total}회, 마지막 활동 ${formatSpokenDate(data.lastActiveDate)}`;

    return (
        <section className={styles.section}>
            {heading}
            <p className={styles.caption}>🌱 자라나라 잔디 잔디</p>

            <div className={styles.panel}>
                {isMobileViewport && <p className={styles.range_label}>최근 16주</p>}

                {/*
                 * 격자 전체가 하나의 이미지입니다. 셀 371개를 낱개로 읽히면
                 * 소음이라 안쪽은 전부 aria-hidden 이고, 수치는 aria-label 이
                 * 담습니다 — 요약만으로는 시각 사용자와 정보량이 달라집니다.
                 */}
                <div className={styles.grid_frame} role="img" aria-label={gridLabel}>
                    <div className={styles.grid} aria-hidden="true">
                        {weeks.map(week => (
                            <div className={styles.week} key={week.start}>
                                {week.days.map((level, dayIndex) => (
                                    <div
                                        className={styles.cell}
                                        key={`${week.start}-${dayIndex}`}
                                        data-level={level}
                                        /*
                                         * 날짜만 씁니다. days[i] 는 레벨 0~4 이지
                                         * 횟수가 아니라서 `N회` 라고 쓰면 거짓이
                                         * 됩니다(§5-2 데이터 계약).
                                         */
                                        title={formatDisplayDate(shiftDate(week.start, dayIndex))}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.footer}>
                    <p className={styles.summary}>{summary}</p>

                    <div className={styles.legend} aria-hidden="true">
                        <span>적음</span>
                        <div className={styles.legend_cells}>
                            {LEVELS.map(level => (
                                <div
                                    className={styles.legend_cell}
                                    key={level}
                                    data-level={level}
                                />
                            ))}
                        </div>
                        <span>많음</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** 주 시작일(`YYYY-MM-DD`)에서 n일 뒤 날짜. UTC 로 계산해 시간대 밀림을 막습니다 */
function shiftDate(start: string, offsetDays: number): string {
    const date = new Date(`${start}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offsetDays);

    return date.toISOString().slice(0, 10);
}

export default ContributionGraph;
