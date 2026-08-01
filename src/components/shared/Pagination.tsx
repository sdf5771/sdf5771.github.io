import { Link } from 'react-router-dom';
import styles from './Pagination.module.css';

/** 이 수를 넘으면 번호를 생략(`1 … 4 [5] 6 … 12`)해야 합니다. 현재 최대 3페이지라 미발동 */
const ELLIPSIS_THRESHOLD = 8;

interface PaginationProps {
    currentPage: number;
    totalPage: number;
    /**
     * 🔴 `urlPath` 하나가 아니라 **주소를 만드는 함수**를 받습니다.
     *
     * 이전 구현은 `${urlPath}?page=N` 이라 `q`·`category`·`sort` 를 **전부
     * 날렸습니다.** `/posts?q=react&category=Study` 에서 2페이지를 누르면
     * `/posts?page=2` 로 가서 필터가 통째로 풀립니다. 주소를 만드는 책임을
     * 호출부로 옮기면 그 화면이 아는 나머지 조건이 자연히 보존됩니다.
     */
    buildHref: (page: number) => string;
}

/**
 * 번호 페이지네이션.
 * 명세: docs/handoff-step4-list.md §7 / WRITING_GUIDE §6.9
 *
 * 무한 스크롤·더보기가 아닌 이유: ① 상태가 URL 에 남아야 하고 ② "어디까지
 * 봤는지"가 아카이브 탐색의 핵심이며 ③ 무한 스크롤은 글 상세에 들어갔다 돌아올 때
 * 스크롤 복원이 어렵고 푸터(연락처)에 영구히 도달하지 못합니다.
 *
 * 🔴 `<button>` + `navigate()` 가 아니라 `<a href>` 입니다. URL 이 곧 상태이므로
 *    링크가 사실에 맞고, 가운데 클릭·새 탭 열기·주소 복사가 공짜로 됩니다.
 *    크롤러도 페이지를 따라갈 수 있습니다.
 *
 * ⚠️ `<<`·`>>`(첫/마지막)는 **제거**했습니다. 3페이지에서 `이전`·`1`·`2`·`3`·`다음`과
 *    목적지가 겹쳐 잉여입니다. 8페이지를 넘으면 번호 생략과 함께 되살리세요.
 */
function Pagination({ currentPage, totalPage, buildHref }: PaginationProps) {
    /* 1페이지 이하이면 페이저 전체를 렌더하지 않습니다 */
    if (totalPage <= 1) {
        return null;
    }

    if (totalPage > ELLIPSIS_THRESHOLD) {
        /*
         * 지금은 도달하지 않지만, 글이 늘어 여기에 닿으면 페이저가 가로로
         * 넘칩니다. 조용히 깨지느니 눈에 띄게 둡니다.
         */
        console.warn(
            `[Pagination] 페이지가 ${totalPage}개입니다. 번호 생략 규칙(1 … 4 [5] 6 … 12)을 구현하세요.`,
        );
    }

    const isFirst = currentPage <= 1;
    const isLast = currentPage >= totalPage;

    return (
        <nav className={styles.pagination} aria-label="페이지 이동">
            {/*
             * 비활성 이전/다음은 요소를 남기되 링크로 만들지 않습니다.
             * 사라지면 1페이지와 2페이지에서 컨트롤 위치가 어긋나 눈이 다시 찾아야 합니다.
             */}
            {isFirst ? (
                <span className={`${styles.control} ${styles.control_prev} ${styles.disabled}`} aria-disabled="true">
                    <span aria-hidden="true">←</span> 이전
                </span>
            ) : (
                <Link
                    className={`${styles.control} ${styles.control_prev}`}
                    to={buildHref(currentPage - 1)}
                    aria-label="이전 페이지"
                >
                    <span aria-hidden="true">←</span> 이전
                </Link>
            )}

            <ul className={styles.pages}>
                {Array.from({ length: totalPage }, (_, index) => index + 1).map(page => (
                    <li key={page}>
                        <Link
                            className={styles.page}
                            to={buildHref(page)}
                            aria-label={`${page}페이지로 이동`}
                            aria-current={page === currentPage ? 'page' : undefined}
                        >
                            {page}
                        </Link>
                    </li>
                ))}
            </ul>

            {isLast ? (
                <span className={`${styles.control} ${styles.control_next} ${styles.disabled}`} aria-disabled="true">
                    다음 <span aria-hidden="true">→</span>
                </span>
            ) : (
                <Link
                    className={`${styles.control} ${styles.control_next}`}
                    to={buildHref(currentPage + 1)}
                    aria-label="다음 페이지"
                >
                    다음 <span aria-hidden="true">→</span>
                </Link>
            )}

            {/* 현재 / 전체 (WRITING_GUIDE §6.9). 목록 헤더 우측에도 같은 값이 있습니다 */}
            <p className={styles.progress}>{`${currentPage} / ${totalPage}`}</p>
        </nav>
    );
}

export default Pagination;
