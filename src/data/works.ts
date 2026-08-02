import worksData from '../../public/works-data.json';
import type { WorkMetadata, WorkType } from '../types';

/**
 * 🔴 작업 데이터의 **유일한 런타임 진입점입니다.**
 * 명세: docs/handoff-step7-works.md §15 · agent-log/product.md §13-3
 *
 * 🔴 **`data/posts.ts` 와 절대 섞지 마세요.** 산출물이 두 파일로 갈려 있는
 *    이유가 그것입니다 — 검색·태그·RSS·sitemap·이전/다음은 `POSTS` 만 보고,
 *    이 모듈을 import 하는 곳은 `/works` 화면과 셸의 제목·경로뿐입니다.
 *
 * 번들 import 인 이유는 글 쪽과 같습니다(data/posts.ts 주석) — 15건 JSON 은
 * 작고, 상세가 slug 로 항목을 **동기적으로** 찾아 없으면 404 를 그려야 합니다.
 */
export const WORKS: readonly WorkMetadata[] = worksData as WorkMetadata[];

/** 목록 헤더의 분모(`전체 15건`). 필터를 걸어도 바뀌지 않는 값입니다 */
export const TOTAL_WORK_COUNT = WORKS.length;

/**
 * 🔴 상세를 가진 항목이 **하나라도 있는가.**
 *
 * 이 값 하나가 §4-2 의 3분기를 정합니다.
 *  - `false`(초기 릴리스 · 기본 시나리오) → 골드 레일·`→`·`기록 준비 중` 이
 *    **전부 사라져 15행이 균질**해집니다. 어떤 행에도 링크 어포던스가 없으므로
 *    *"왜 이건 안 눌리지"* 가 원리적으로 발생하지 않습니다.
 *  - `true`(혼재) → 3중 단서가 켜집니다.
 *
 * 🔴 `기록 준비 중` 을 무조건 렌더하면 초기 릴리스에서 그 문구가 **15번**
 *    나옵니다. "고장" 보다 나쁜 "미완성" 으로 읽힙니다(§2-5).
 */
export const HAS_ANY_WORK_DETAIL: boolean = WORKS.some(work => work.hasBody);

export interface WorkTypeOption {
    /** `null` 이 전체(= URL 에 `type` 키 없음) */
    value: WorkType | null;
    label: string;
    count: number;
}

/**
 * 필터 3종.
 *
 * 🔴 개수는 **필터와 무관한 전체 기준 고정값**입니다(§5-5). 필터를 걸어도
 *    다른 칩의 숫자가 바뀌지 않습니다 — 바뀌면 칩이 "누르면 몇 개가 나오는가"
 *    가 아니라 "지금 몇 개인가" 가 되어 선택지가 아니라 결과 표시로 변질됩니다.
 *    현재 결과 수는 목록 헤더가 이미 말합니다.
 *
 * 라벨은 WRITING_GUIDE §9 용어집. `Works`·`포트폴리오` 는 쓰지 않습니다.
 */
export const WORK_TYPE_OPTIONS: readonly WorkTypeOption[] = [
    { value: null, label: '전체', count: TOTAL_WORK_COUNT },
    { value: 'work', label: '업무', count: WORKS.filter(work => work.type === 'work').length },
    {
        value: 'personal',
        label: '개인·팀',
        count: WORKS.filter(work => work.type === 'personal').length,
    },
];

/**
 * 유형 라벨. 🔴 문자열을 컴포넌트에 다시 적지 마세요 — 필터 칩과 행 메타 줄이
 * 다른 말을 하면 안 되므로 정의처는 `WORK_TYPE_OPTIONS` 하나입니다.
 */
export const WORK_TYPE_LABEL = Object.fromEntries(
    WORK_TYPE_OPTIONS.filter(option => option.value !== null).map(option => [
        option.value,
        option.label,
    ]),
) as Record<WorkType, string>;

export interface WorkYearGroup {
    year: string;
    works: WorkMetadata[];
}

/**
 * 연도 그룹.
 *
 * 🔴 **연도 목록을 상수로 두고 순회하지 마세요**(§3-1 구현 계약).
 *    `['2025','2024','2023','2022'].map(...)` 은 두 가지를 동시에 깨뜨립니다.
 *      ① `개인·팀` 필터에서 2025·2022 가 통째로 비는데 헤더만 남습니다
 *         (빈 연도 헤더 금지 — 규칙 5)
 *      ② 2026년 작업을 추가해도 그룹이 생기지 않습니다
 *    **전달받은 배열에서 파생**시키면 빈 그룹이 구조적으로 발생할 수 없습니다.
 *
 * 입력은 이미 `start` 내림차순(빌드 정렬)이라 그룹 순서·그룹 내 순서가 그대로
 * 유지됩니다. 여기서 다시 정렬하면 규칙의 정의처가 둘이 됩니다.
 */
export function groupWorksByYear(works: readonly WorkMetadata[]): WorkYearGroup[] {
    const groups: WorkYearGroup[] = [];

    for (const work of works) {
        const year = work.start.slice(0, 4);
        const current = groups[groups.length - 1];

        if (current && current.year === year) {
            current.works.push(work);
            continue;
        }

        groups.push({ year, works: [work] });
    }

    return groups;
}

/** 연도 섹션의 `aria-labelledby` 대상 id */
export function workYearHeadingId(year: string): string {
    return `work-year-${year}`;
}

/**
 * slug → 작업.
 *
 * 🔴 **`hasBody` 를 여기서 보지 않습니다.** 항목의 존재와 상세의 존재는 다른
 *    질문이고, 라우트 판정(§6-5 ③ → 404)은 호출부가 합니다.
 */
export function findWork(slug: string): WorkMetadata | undefined {
    return WORKS.find(work => work.slug === slug);
}
