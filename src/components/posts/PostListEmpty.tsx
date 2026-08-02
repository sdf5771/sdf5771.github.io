import { Link } from 'react-router-dom';
import styles from './PostListEmpty.module.css';
import SearchIcon from '../shared/SearchIcon';
import { POST_LIST_PATH } from '../../constants/site';
import {
    FILTER_EMPTY_DESCRIPTION,
    FILTER_EMPTY_TITLE,
    SEARCH_EMPTY_DESCRIPTION_DESKTOP,
    SEARCH_EMPTY_TITLE,
} from '../../constants/search';

interface PostListEmptyProps {
    /** 검색어가 걸려 있는가. 카테고리 유무와 무관하게 이 값이 분기를 정합니다 */
    hasQuery: boolean;
    /** 검색어만 지운 주소 (카테고리·정렬 유지) */
    clearQueryHref: string;
}

/**
 * 결과 0건.
 * 명세: docs/handoff-step4-list.md §8-4 / WRITING_GUIDE §6.2
 *
 * 분기는 **검색어 유무**로만 나눕니다. `Activity` + `python` 처럼 검색과
 * 카테고리가 겹쳐 0건이 된 경우에도 **검색 쪽 문구**를 씁니다 — 사용자의 마지막
 * 행동이 검색이기 때문입니다. 카테고리를 푸는 경로는 위에 남아 있는
 * 「적용된 조건」 바가 담당합니다.
 *
 * 두 번째 분기(`검색어 없음 + 카테고리`)는 현재 데이터에서 **발생하지 않습니다**
 * (Study 30 / Survey 9 / Activity 2 전부 ≥1). 그래도 코드로 남깁니다 —
 * 카테고리가 늘거나 글이 옮겨 가면 언제든 도달하고, 분기가 없으면 검색어가
 * 없는데 "검색어를 지우세요"라고 말하게 됩니다.
 *
 * 🔴 **액션이 항상 1개 이상** 있습니다. 액션 없는 빈 상태는 가이드 위반입니다.
 * 🔴 사과하지 않습니다. `죄송합니다`·`Oops!` 는 사용자 잘못이 아닌 상황에서
 *    감정 부담만 줍니다(§6.2).
 */
function PostListEmpty({ hasQuery, clearQueryHref }: PostListEmptyProps) {
    return (
        <div className={styles.empty}>
            {hasQuery ? (
                /* `⌕`(U+2315)는 Galmuri 에 없어 CSS 도트 아이콘을 씁니다(STEP 1 §4-7) */
                <SearchIcon className={styles.icon} />
            ) : (
                /* `⊘`(U+2298)도 없습니다. `○`(U+25CB)는 서브셋에 있습니다 */
                <span className={styles.glyph} aria-hidden="true">
                    ○
                </span>
            )}

            <p className={styles.title}>{hasQuery ? SEARCH_EMPTY_TITLE : FILTER_EMPTY_TITLE}</p>

            <p className={styles.description}>
                {hasQuery ? SEARCH_EMPTY_DESCRIPTION_DESKTOP : FILTER_EMPTY_DESCRIPTION}
            </p>

            <div className={styles.actions}>
                {hasQuery ? (
                    <>
                        <Link
                            className={`${styles.action} ${styles.action_primary}`}
                            to={clearQueryHref}
                        >
                            검색어 지우기
                        </Link>
                        <Link className={styles.action} to={POST_LIST_PATH}>
                            전체 글 보기
                        </Link>
                    </>
                ) : (
                    <Link
                        className={`${styles.action} ${styles.action_primary}`}
                        to={POST_LIST_PATH}
                    >
                        필터 초기화
                    </Link>
                )}
            </div>
        </div>
    );
}

export default PostListEmpty;
