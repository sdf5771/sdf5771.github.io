import { Link } from 'react-router-dom';
import styles from './WorkTypeFilter.module.css';
import type { WorkType } from '../../types';
import { WORK_TYPE_OPTIONS } from '../../data/works';

/**
 * 유형 필터 — `전체` / `업무` / `개인·팀`.
 * 명세: docs/handoff-step7-works.md §5-5 · §5-7 · §12-2
 *
 * 🔴 칩은 **`<button>` 이 아니라 `<a>`(Link)** 입니다. URL 이 상태이므로 클릭이
 *    곧 내비게이션이고, 가운데 클릭·새 탭·주소 복사·뒤로 가기가 공짜로 따라옵니다
 *    (STEP 4 §4 와 같은 계약).
 *
 * 🔴 활성 표시는 `aria-current="true"` 입니다. `aria-pressed` 는 토글 버튼의
 *    것이고 이건 링크입니다.
 */
function WorkTypeFilter({
    selected,
    buildHref,
}: {
    selected: WorkType | null;
    buildHref: (type: WorkType | null) => string;
}) {
    return (
        /* 랜드마크 이름은 명사구, 역할 단어 금지 (WRITING_GUIDE §7.3a) */
        <nav className={styles.nav} aria-label="유형 필터">
            <ul className={styles.list}>
                {WORK_TYPE_OPTIONS.map(option => {
                    const isActive = option.value === selected;

                    return (
                        <li key={option.label}>
                            <Link
                                className={styles.chip}
                                to={buildHref(option.value)}
                                aria-current={isActive ? 'true' : undefined}
                                /*
                                 * 보이는 텍스트로 시작해야 음성 제어에서 이름이
                                 * 맞습니다(§7.3-1). 수량사는 작업이므로 `건`
                                 * 입니다(WRITING_GUIDE §3.4).
                                 */
                                aria-label={
                                    option.value === null
                                        ? `${option.label} 작업 보기, ${option.count}건`
                                        : `${option.label} 작업만 보기, ${option.count}건`
                                }
                            >
                                <span className={styles.dot} aria-hidden="true" />
                                <span className={styles.label}>{option.label}</span>
                                {/*
                                 * 🔴 개수는 **전체 기준 고정값**입니다(§5-5).
                                 *    필터를 걸어도 다른 칩의 숫자가 바뀌지 않습니다 —
                                 *    바뀌면 칩이 선택지가 아니라 결과 표시가 됩니다.
                                 *    aria-label 이 이미 개수를 말하므로 여기는
                                 *    중복 낭독을 막습니다.
                                 */}
                                <span className={styles.count} aria-hidden="true">
                                    {option.count}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default WorkTypeFilter;
