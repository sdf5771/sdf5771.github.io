import styles from './TagStrand.module.css';

interface TagStrandProps {
    /** 마디 수 = **그 태그의 글 편수**. 그 이상을 뜻하지 않습니다 */
    count: number;
}

/**
 * 가닥(strand) — 태그 카드의 빈도 시각화.
 * 명세: docs/handoff-step6-tags-archive.md §2-1 · §2-2
 *
 * 크기 티어는 3단계뿐이라(33px 2종 / 22px 나머지) 정확한 빈도를 말하지 못합니다.
 * 그 자리를 이 가닥과 **옆의 숫자**가 나눠 맡습니다.
 *
 * 🔴 **마디 = 글 편수입니다.** 시안은 *"히어로에서 그 태그가 실제로 잇고 있던
 *    별들의 수와 같다"* 고 적었지만 사실이 아닙니다 — STEP 2 의 연결선 규칙은
 *    "각 글 → 자기보다 이전 중 태그 공유 최근접 1개"라 총 33개이고, 한 태그가
 *    만드는 선의 수는 등장 횟수와 같지 않습니다. 두 화면이 공유하는 것은
 *    **데이터 출처와 조형 언어**이지 수치가 아닙니다(§2-2).
 *
 * 🔴 계수 장치가 아닙니다. 주관적 계수(subitizing)의 한계는 4~7개이고 그 위는
 *    순차 계수라 16마디를 세려면 시선 이동이 16번 필요합니다. 가닥은 **길이·질량
 *    지표**이며, 정확한 수는 항상 옆의 숫자가 담당합니다.
 *
 * 시안 대비 확정 수정 3건
 * ------------------------
 * | # | 시안 | 확정 |
 * |---|---|---|
 * | 1 | 선이 `left:0; right:0` (카드 폭 전체) | **선 폭 = 마디 클러스터 폭.** 컨테이너를 `width: max-content` 로 |
 * | 2 | `background: i < 3 ? node : nodeDim` | **밝기 분기 삭제.** "3" 에 아무 의미가 없는데 신호를 만들어냈습니다 |
 * | 3 | 마디 5px / gap 4px (`9n−4`) | **4px / 3px (`7n−3`)** — `n=16` 이 109px 이라 모바일 span1 콘텐츠 141px 에 23% 여유로 들어갑니다 |
 *
 * 1번이 없으면 `n=2` 인 태그에서 144px 짜리 선 위에 11px 마디 두 개만 얹혀
 * **끊긴 줄·로딩 실패**로 읽힙니다. 인덱스 27종 중 15종이 `n=2` 입니다.
 * 3번의 시안값은 `n=16` 에서 140px 이라 141px 안에 1px 여유뿐이었습니다.
 *
 * DOM 비용: 27장 × 평균 3.4마디 ≈ 120 노드, 최대 카드(Python 16)도 16 노드입니다.
 * 선은 컨테이너의 `::before` 라 노드를 쓰지 않습니다.
 */
function TagStrand({ count }: TagStrandProps) {
    return (
        /* 옆의 숫자가 같은 정보를 이미 정확하게 말합니다. 낭독하면 중복입니다 */
        <span className={styles.strand} aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <span
                    key={index}
                    className={styles.node}
                    /* 지그재그. 마디마다 값이 아니라 **위치만** 교대합니다 */
                    data-offset={index % 2 === 0 ? 'up' : 'down'}
                />
            ))}
        </span>
    );
}

export default TagStrand;
