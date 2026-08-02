import { Link } from 'react-router-dom';
import styles from './PostFilters.module.css';
import { CATEGORY_SUMMARIES, TOTAL_POST_COUNT } from '../../data/posts';

/** 비율 막대 최대폭. 칩 내부 상수라 토큰화 가치가 없고, --space-8 배수에 맞춥니다 */
const RATIO_BAR_MAX_WIDTH = 32;

interface CategoryChipsProps {
    /** 현재 선택된 카테고리. `null` 이면 `전체` */
    selected: string | null;
    /** 이 카테고리로 거를 때의 링크. `null` 은 전체 */
    buildHref: (category: string | null) => string;
}

/**
 * 카테고리 필터 칩.
 * 명세: docs/handoff-step4-list.md §2-5 · §3-5 · §5-2 · §10-2
 *
 * 🔴 개수 배지는 **항상 전체 기준 고정값**입니다. 검색어에 따라 바뀌지 않습니다.
 *    요동치면 "이 칩을 누르면 몇 개가 나오는가"가 아니라 "지금 몇 개인가"가 되어
 *    칩이 **필터 선택지가 아니라 결과 표시**로 변질됩니다. 현재 결과 수는
 *    목록 헤더가 이미 말합니다(§3-5).
 *
 * 버튼이 아니라 링크인 이유: URL 이 곧 상태이므로(§4) 링크가 자연스럽고,
 * 가운데 클릭·새 탭 열기·주소 복사가 공짜로 됩니다.
 */
function CategoryChips({ selected, buildHref }: CategoryChipsProps) {
    const maxCount = Math.max(...CATEGORY_SUMMARIES.map(item => item.count), 1);

    return (
        <ul className={styles.chips}>
            <li>
                <Link
                    className={styles.chip}
                    to={buildHref(null)}
                    aria-current={selected === null ? 'true' : undefined}
                    aria-label={`전체 카테고리로 거르기, 글 ${TOTAL_POST_COUNT}편`}
                >
                    <span aria-hidden="true">전체</span>
                    <span className={styles.chip_count} aria-hidden="true">
                        {TOTAL_POST_COUNT}
                    </span>
                </Link>
            </li>

            {CATEGORY_SUMMARIES.map(category => (
                <li key={category.name}>
                    <Link
                        className={styles.chip}
                        to={buildHref(category.name)}
                        aria-current={selected === category.name ? 'true' : undefined}
                        aria-label={`${category.name} 카테고리로 거르기, 글 ${category.count}편`}
                    >
                        <span aria-hidden="true">{category.name}</span>
                        <span className={styles.chip_count} aria-hidden="true">
                            {category.count}
                        </span>
                        {/*
                         * 비율 막대. `Activity 2` 는 숫자만으로는 편차가 안 읽히는데
                         * 막대가 3px 로 남아 "거의 없다"가 한눈에 보입니다.
                         * 개수는 텍스트로 이미 있으므로 색·길이 단독 전달이 아닙니다(§7.5).
                         */}
                        <span
                            className={styles.chip_ratio}
                            aria-hidden="true"
                            style={{
                                width: `${Math.max(
                                    3,
                                    Math.round((category.count / maxCount) * RATIO_BAR_MAX_WIDTH),
                                )}px`,
                            }}
                        />
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export default CategoryChips;
