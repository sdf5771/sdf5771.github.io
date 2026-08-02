import styles from './WorkYearSection.module.css';
import WorkRow from './WorkRow';
import type { WorkYearGroup } from '../../data/works';
import { workYearHeadingId } from '../../data/works';

/**
 * 연도 그룹 하나 — 좌측 연도 축 + 우측 행 스트림.
 * 명세: docs/handoff-step7-works.md §3 · §5-1 · §12-2
 *
 * 🔴 이 구조를 택한 이유는 **항목 수 편차 8:1** 입니다(2024:8 / 2022:1).
 *    카드 그리드(3열)로 그리면 2024 는 나머지 2칸, 2022 는 나머지 2칸이 빈 칸으로
 *    남고, 1건 그룹을 전폭으로 늘리면 그 항목만 특별해집니다. **행 스트림은
 *    항목 수가 리듬을 바꾸지 않는 유일한 구조**입니다(§2-1).
 *
 * 확정 6규칙이 이 컴포넌트에 어떻게 들어가 있는지:
 *
 * | # | 규칙 | 구현 |
 * |:--:|---|---|
 * | 1 | 연도 헤더의 시각적 무게가 항목 수와 무관 | 33px 고정. 항목 수와 무관 |
 * | 2 | 항목 수를 헤더에 명시 | `2024 · 8건` — **헤딩 안**에 넣어 스크린리더가 그룹 크기를 즉시 압니다 |
 * | 3 | 그룹 간 여백 일정 | `margin-bottom: --space-7` 고정 |
 * | 4 | 1건 그룹이 미완성으로 보이지 않을 것 | 행 스트림이라 빈 칸이 원리적으로 없음 |
 * | 5 | 빈 연도 헤더 금지 | 그룹 배열이 **필터된 데이터에서 파생**됩니다(`groupWorksByYear`) |
 * | 6 | 8건 그룹 스크롤 피로 방지 | 연도 축 sticky — **위치 계산은 CSS 주석 참조** |
 *
 * 🔴 수량사는 **`건`** 입니다(WRITING_GUIDE §3.4, 2026-08-02 정정).
 *    글은 `편`, 태그·페이지는 `개`, 작업은 `건` 입니다. 명세 §14-1 이 `개` 로
 *    적은 것은 가이드 정정 이전 판이라 가이드가 우선합니다.
 */
function WorkYearSection({ group }: { group: WorkYearGroup }) {
    const headingId = workYearHeadingId(group.year);

    return (
        <section className={styles.section} aria-labelledby={headingId}>
            <div className={styles.axis}>
                <div className={styles.axis_inner}>
                    {/*
                     * `2024` 는 숫자라 Galmuri11 33px 이 규칙을 통과합니다.
                     * `8건` 은 한글이 섞여 Pretendard 12px 입니다(§10-1 8번).
                     */}
                    <h2 className={styles.year} id={headingId}>
                        {group.year}
                        <span className={styles.count}>{` · ${group.works.length}건`}</span>
                    </h2>
                </div>
            </div>

            <ul className={styles.stream}>
                {group.works.map(work => (
                    <WorkRow key={work.slug} work={work} />
                ))}
            </ul>
        </section>
    );
}

export default WorkYearSection;
