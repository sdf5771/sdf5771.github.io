/**
 * 작업 메타의 표시 형식.
 * 명세: docs/handoff-step7-works.md §14-1 · WRITING_GUIDE §3.4
 *
 * 🔴 표시 문자열은 **빌드가 아니라 여기서** 만듭니다. 원본은 정렬 가능한
 *    `YYYY-MM` 이고(product.md §13-3), 표기 규칙이 바뀌면 이 파일 한 곳만
 *    고치면 됩니다.
 */

/** `2024-07` → `2024.07`. 🔴 연월까지만 — 정확한 입·퇴사일은 노출하지 않습니다 */
export function formatWorkMonth(month: string): string {
    return month.replace('-', '.');
}

export interface WorkPeriod {
    /** 라틴·숫자·기호뿐이라 GalmuriMono11 11px 이 규칙을 통과합니다 */
    months: string;
    /** `end` 가 비어 있는가. 표시 문구 `진행 중` 은 한글이라 Pretendard 입니다 */
    isOngoing: boolean;
}

/**
 * 기간 표기.
 *
 * | 데이터 | 표시 |
 * |---|---|
 * | `2024-07` ~ `2024-08` | `2024.07 – 2024.08` |
 * | `2024-07` ~ `2024-07` | `2024.07` — 같은 달이면 한 번만 |
 * | `2025-07` ~ (없음) | `2025.07 –` + `진행 중` |
 *
 * 구분자는 **엔 대시(–, U+2013)** 입니다(§3.4). 하이픈이 아닙니다.
 */
export function formatWorkPeriod(start: string, end: string): WorkPeriod {
    const from = formatWorkMonth(start);

    if (!end) {
        return { months: `${from} –`, isOngoing: true };
    }

    if (end === start) {
        return { months: from, isOngoing: false };
    }

    return { months: `${from} – ${formatWorkMonth(end)}`, isOngoing: false };
}
