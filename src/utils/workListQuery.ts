/**
 * `/works` 의 URL 쿼리 계약 — 파싱·정규화·직렬화.
 * 명세: docs/handoff-step7-works.md §5-7 (STEP 4 §4 와 같은 원칙)
 *
 * **URL 이 상태입니다.** 필터 칩은 `<a>` 이고 클릭이 곧 내비게이션이라
 * 가운데 클릭·새 탭·주소 복사가 공짜로 따라옵니다.
 */

import type { WorkType } from '../types';
import { WORKS_PATH } from '../constants/site';

/** 이 화면이 소유하는 키. 나머지(UTM 등)는 건드리지 않고 보존합니다 */
const OWNED_KEYS = new Set(['type']);

/**
 * URL → 상태. **잘못된 값에서 빈 화면이 되면 안 됩니다.**
 *
 * | 입력 | 처리 |
 * |---|---|
 * | `?type=work` · `?type=personal` | 그대로 |
 * | `?type=foo` · `?type=` · 없음 | `null`(= 전체). 호출부가 `/works` 로 replace 정규화 |
 *
 * 🔴 대소문자를 관용하지 않습니다. `category` 와 달리 `type` 은 **사용자에게
 *    보이는 표기가 아니라 내부 열거값**이고, 정본이 하나여야 정규화가 한 방향으로
 *    수렴합니다. `?type=Work` 는 알 수 없는 값 → 전체로 떨어집니다.
 */
export function parseWorkType(search: string): WorkType | null {
    const raw = new URLSearchParams(search).get('type');
    return raw === 'work' || raw === 'personal' ? raw : null;
}

/**
 * 상태 → URL. **기본값(전체)은 키 자체를 뺍니다** — `/works?type=` 이 아니라
 * `/works` 가 정규형입니다.
 */
export function buildWorkListSearch(currentSearch: string, type: WorkType | null): string {
    const parts: string[] = [];

    for (const [key, value] of new URLSearchParams(currentSearch)) {
        if (OWNED_KEYS.has(key)) {
            continue;
        }

        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    if (type) {
        parts.push(`type=${type}`);
    }

    return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/** 필터 칩의 `href`. 목록 경로와 쿼리를 한 곳에서 만듭니다 */
export function buildWorkListPath(currentSearch: string, type: WorkType | null): string {
    return `${WORKS_PATH}${buildWorkListSearch(currentSearch, type)}`;
}

/**
 * 헤더 경로 줄 에코 — `~/works` / `~/works?type=work` (§5-7).
 * 실제 상태와 동기화되어야 하므로 파싱 결과가 아니라 **정규화된 쿼리**를 씁니다.
 */
export function workTerminalPath(search: string): string {
    return `~/works${buildWorkListSearch('', parseWorkType(search))}`;
}
