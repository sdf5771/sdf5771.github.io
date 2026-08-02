import { Link } from 'react-router-dom';
import styles from './PostFilters.module.css';
import { POST_LIST_PATH } from '../../constants/site';

interface AppliedConditionsProps {
    /** 화면에 보이는 검색어. 비어 있으면 검색 조건 없음 */
    query: string;
    category: string | null;
    /** 검색어만 지운 주소 (카테고리·정렬은 유지) */
    clearQueryHref: string;
    /** 카테고리만 푼 주소 */
    clearCategoryHref: string;
}

/**
 * 「적용된 조건」 바.
 * 명세: docs/handoff-step4-list.md §8-2
 *
 * 조건이 1개 이상일 때만 목록 헤더 위에 나옵니다.
 *
 * 🔴 **정렬은 조건 칩으로 넣지 않습니다.** 정렬은 결과 집합을 바꾸지 않으므로
 *    "걸러진 상태"가 아니고, 세그먼트 컨트롤에 이미 표시돼 있습니다.
 *
 * 🔴 이 바는 **빈 상태에서도 유지**합니다. `Activity` + `python` → 0건 같은
 *    조합에서 조건을 하나씩 푸는 것이 가장 빠른 복구 경로이고, 실제로는 이 바가
 *    그 조합의 **진짜 복구 경로**입니다.
 */
function AppliedConditions({
    query,
    category,
    clearQueryHref,
    clearCategoryHref,
}: AppliedConditionsProps) {
    const hasQuery = query.trim().length > 0;

    if (!hasQuery && !category) {
        return null;
    }

    return (
        <div className={styles.applied}>
            <span className={styles.applied_label}>적용된 조건</span>

            <ul className={styles.applied_list}>
                {category && (
                    <li className={styles.applied_item}>
                        <span>{`카테고리 ${category}`}</span>
                        <Link
                            className={styles.applied_clear}
                            to={clearCategoryHref}
                            aria-label="카테고리 필터 해제"
                        >
                            {/* `✕`(U+2715)는 Galmuri 에 없습니다. `×`(U+00D7)는 형태가 거의 같고 라틴-1 이라 안전합니다 */}
                            <span aria-hidden="true">×</span>
                        </Link>
                    </li>
                )}

                {hasQuery && (
                    <li className={styles.applied_item}>
                        {/* 곧은 따옴표로 통일합니다 (WRITING_GUIDE §3.2) */}
                        <span>{`검색 "${query.trim()}"`}</span>
                        <Link
                            className={styles.applied_clear}
                            to={clearQueryHref}
                            aria-label="검색어 지우기"
                        >
                            <span aria-hidden="true">×</span>
                        </Link>
                    </li>
                )}
            </ul>

            {/* 전부 해제 — q·category·sort·page 를 모두 되돌립니다 */}
            <Link className={styles.applied_reset} to={POST_LIST_PATH}>
                필터 초기화
            </Link>
        </div>
    );
}

export default AppliedConditions;
