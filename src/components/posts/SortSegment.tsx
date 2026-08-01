import { Link } from 'react-router-dom';
import styles from './PostFilters.module.css';
import type { PostSortOrder } from '../../utils/postListQuery';

const SORT_OPTIONS: Array<{ value: PostSortOrder; label: string }> = [
    { value: 'latest', label: '최신순' },
    { value: 'oldest', label: '오래된순' },
];

interface SortSegmentProps {
    selected: PostSortOrder;
    buildHref: (sort: PostSortOrder) => string;
}

/**
 * 정렬 — **2분할 세그먼트**.
 * 명세: docs/handoff-step4-list.md §2-4
 *
 * 시안의 회전 토글(`최신순` 라벨 + 화살표 180° 회전)은 **반려**됐습니다.
 * 라벨 `최신순` 이 현재 상태인지 누르면 될 상태인지 알 수 없고, 결과를 예고하게
 * 고치면(`오래된순으로 정렬`) 이번엔 "화면에 보이는 텍스트로 시작" 규칙과
 * 충돌합니다. 충돌이 토글 형태 자체에서 나오므로 **두 선택지를 모두 보여주는**
 * 세그먼트로 바꿉니다. 현재 상태가 곧 선택 표시라 모호성이 사라지고,
 * 부수적으로 180° 회전 모션이 없어져 저감 대상도 하나 줄어듭니다.
 *
 * ⚠️ 명세 §10-2 는 `role="radiogroup"` + `role="radio"` 를 적었지만 **채택하지
 *    않았습니다.** 라디오 그룹은 화살표 키 이동(로빙 tabindex)을 전제하는 역할이라,
 *    링크에 role 만 얹으면 보조기술이 약속한 조작법이 실제로는 동작하지 않습니다.
 *    또 role 을 덮어쓰면 "링크"라는 안내가 사라져 새 탭 열기 같은 링크 관용도
 *    감춰집니다. 여기서는 URL 이 곧 상태이므로 **링크 + `aria-current`** 가
 *    사실에 맞고, 그룹 이름은 `role="group"` 으로 유지합니다.
 */
function SortSegment({ selected, buildHref }: SortSegmentProps) {
    return (
        <div className={styles.segment} role="group" aria-label="정렬">
            {SORT_OPTIONS.map(option => (
                <Link
                    key={option.value}
                    className={styles.segment_option}
                    to={buildHref(option.value)}
                    aria-current={selected === option.value ? 'true' : undefined}
                >
                    {option.label}
                </Link>
            ))}
        </div>
    );
}

export default SortSegment;
