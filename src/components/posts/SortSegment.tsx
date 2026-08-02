import { Link } from 'react-router-dom';
import styles from './PostFilters.module.css';

export interface SegmentOption<T extends string> {
    value: T;
    label: string;
}

interface SortSegmentProps<T extends string> {
    /** 정확히 **2개**를 전제로 한 조형입니다. 3개 이상이면 칩 줄이 맞습니다 */
    options: readonly SegmentOption<T>[];
    selected: T;
    buildHref: (value: T) => string;
    /** 그룹 이름. `/tags` 도 `/tags/:tag` 도 정렬이라 기본값이 그대로 맞습니다 */
    label?: string;
}

/**
 * 정렬 — **2분할 세그먼트**.
 * 명세: docs/handoff-step4-list.md §2-4 · docs/handoff-step6-tags-archive.md §2-1b
 *
 * 시안의 회전 토글(`최신순` 라벨 + 화살표 180° 회전)은 **반려**됐습니다.
 * 라벨 `최신순` 이 현재 상태인지 누르면 될 상태인지 알 수 없고, 결과를 예고하게
 * 고치면(`오래된순으로 정렬`) 이번엔 "화면에 보이는 텍스트로 시작" 규칙과
 * 충돌합니다. 충돌이 토글 형태 자체에서 나오므로 **두 선택지를 모두 보여주는**
 * 세그먼트로 바꿉니다. 현재 상태가 곧 선택 표시라 모호성이 사라지고,
 * 부수적으로 180° 회전 모션이 없어져 저감 대상도 하나 줄어듭니다.
 *
 * 🔴 세 화면이 **이 컴포넌트 하나**를 씁니다. `/posts`·`/tags/:tag` 는
 *    `최신순`/`오래된순`, `/tags` 는 `빈도순`/`이름순` 입니다. 값의 타입만 다르고
 *    조형·상태 규칙·접근성 계약이 같아서 복제할 이유가 없습니다.
 *    STEP 6 시안의 티어 필터 칩(`전체`/`10회 이상`/…)은 반려됐습니다 —
 *    `10회 이상` 이 2장이라 6열 그리드의 83%가 빈칸이 되고, 주 과업("무엇을
 *    다루는지 **한 화면에**")과 정반대입니다. 정렬은 화면을 비우지 않습니다.
 *
 * ⚠️ 명세 §10-2 는 `role="radiogroup"` + `role="radio"` 를 적었지만 **채택하지
 *    않았습니다.** 라디오 그룹은 화살표 키 이동(로빙 tabindex)을 전제하는 역할이라,
 *    링크에 role 만 얹으면 보조기술이 약속한 조작법이 실제로는 동작하지 않습니다.
 *    또 role 을 덮어쓰면 "링크"라는 안내가 사라져 새 탭 열기 같은 링크 관용도
 *    감춰집니다. 여기서는 URL 이 곧 상태이므로 **링크 + `aria-current`** 가
 *    사실에 맞고, 그룹 이름은 `role="group"` 으로 유지합니다.
 */
function SortSegment<T extends string>({
    options,
    selected,
    buildHref,
    label = '정렬',
}: SortSegmentProps<T>) {
    return (
        <div className={styles.segment} role="group" aria-label={label}>
            {options.map(option => (
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
