/**
 * 글 메타 정보의 표시 규격.
 * 명세: docs/WRITING_GUIDE.md §3.4 · §6.7 / docs/handoff-step4-list.md §5-1 · §8-7
 *
 * 형식은 `카테고리 · 날짜 · 읽기 시간` 으로 **고정**입니다. 화면마다 순서를
 * 바꾸지 않습니다. 저자는 표시하지 않습니다 — 41편 모두 같은 저자라 정보량이 0
 * 이고, 그 자리를 읽기 시간이 씁니다.
 */

/** `2023-04-13` → `2023.04.13`. 앞자리 0 을 유지합니다(§3.4) */
export function formatPostDate(date: string): string {
    return date.split('-').join('.');
}

/**
 * `6분`. `약 6분`·`6 min read` 를 쓰지 않습니다(§3.4)
 *
 * ⚠️ 값이 없거나 유한수가 아니면 **빈 문자열**을 돌려줍니다. 그대로 템플릿에
 *    넣으면 화면에 `undefined분` 이 그려집니다 — 호출부는 빈 문자열일 때
 *    항목 자체를 렌더하지 않습니다. 최솟값은 1분입니다(0분은 표시하지 않음).
 */
export function formatReadingMinutes(minutes: number | undefined | null): string {
    if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
        return '';
    }

    return `${Math.round(minutes)}분`;
}

/** 발행 후 며칠까지 새 글로 볼 것인가 */
const NEW_POST_DAYS = 14;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 발행 14일 이내인가(§3.4 · §8-7).
 *
 * ⚠️ **지금은 한 편도 해당하지 않습니다.** 최신 글이 2025-05-26 이라 오늘
 *    기준으로 이미 1년이 넘었습니다. 시안은 배지를 보이게 하려고 기준일을
 *    임의로 심었지만 프로덕션에서는 그렇게 하지 않습니다 — **배지가 없는 상태가
 *    기본 레이아웃**이고, 자리를 미리 비워 두지 않습니다(41행 전부에 빈 공간이
 *    생깁니다). 발행을 재개하면 자연히 나타납니다.
 */
export function isNewPost(date: string, now: Date = new Date()): boolean {
    const published = new Date(date);

    if (Number.isNaN(published.getTime())) {
        return false;
    }

    return now.getTime() - published.getTime() <= NEW_POST_DAYS * MILLISECONDS_PER_DAY;
}
