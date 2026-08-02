import { POSTS } from './posts';
import type { PostMetadata } from '../types';

/**
 * 연도별 보기 `/archive` 의 데이터.
 * 명세: docs/handoff-step6-tags-archive.md §8-4 · §8-7
 *
 * 🔴 **연도 목록을 하드코딩하지 않습니다.** 시안의
 *    `const YEARS = ['2025','2024','2023','2022']` 를 그대로 옮기면 2026년 글을
 *    발행해도 섹션이 생기지 않습니다. 사용자가 발행 재개 예정이라 이건 곧
 *    현실이 되는 버그입니다(§14-13).
 */

export interface ArchiveYear {
    /** `2023`. 섹션 id·앵커(`#year-2023`)의 근거이기도 합니다 */
    year: string;
    posts: readonly PostMetadata[];
}

/**
 * 연도 내림차순(2025 → 2022), 섹션 안은 `POSTS` 순서 그대로입니다.
 *
 * `POSTS` 는 빌드가 **date DESC · 동률이면 slug ASC** 로 써 둔 배열입니다
 * (`generatePostsData`). 여기서 다시 정렬하지 않습니다 — 규칙이 두 곳이 되면
 * 조용히 갈립니다.
 *
 * 🔴 타이브레이커가 왜 필요한가: 2023년에만 같은 날짜가 6쌍 있습니다
 *    (`04-13` 에 5편, `02-26`·`01-10` 에 각 4편). 날짜만으로 정렬하면 순서가
 *    파일시스템 읽기 순서에 의존해 빌드마다 흔들립니다.
 *
 * 정렬 옵션·필터·페이지네이션을 **제공하지 않습니다**(§1-1 R-1). 하나라도 넣는
 * 순간 `/archive` 는 `/posts?sort=oldest` 의 열화판이 됩니다.
 */
export const ARCHIVE_YEARS: readonly ArchiveYear[] = (() => {
    const buckets = new Map<string, PostMetadata[]>();

    for (const post of POSTS) {
        /* 날짜는 고정폭 ISO(`2023-04-13`)입니다. Date 로 파싱하면 타임존이 끼어듭니다 */
        const year = post.date.slice(0, 4);

        if (!year) {
            continue;
        }

        const bucket = buckets.get(year);

        if (bucket) {
            bucket.push(post);
            continue;
        }

        buckets.set(year, [post]);
    }

    return [...buckets]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([year, posts]) => ({ year, posts }));
})();

/** `2022년 12월부터 쓴 글 41편입니다.` 의 앞부분. 가장 오래된 글에서 파생합니다 */
export const ARCHIVE_FIRST_POST_DATE: string = POSTS.length > 0 ? POSTS[POSTS.length - 1].date : '';

/**
 * 연도 섹션 헤딩의 `id` = 앵커 목적지(`#year-2023`).
 *
 * 연도 칩과 섹션 헤딩이 **같은 함수**로 문자열을 만듭니다. 한쪽만 고치면
 * 링크가 조용히 아무 데도 가지 않게 되고, 그건 눌러 보기 전까지 드러나지
 * 않습니다(§8-5).
 */
export function yearSectionId(year: string): string {
    return `year-${year}`;
}

/** `2023-04-13` → `04.13`. 연도는 섹션 헤더가 담당하므로 행에서는 뺍니다(§8-3) */
export function formatArchiveDate(date: string): string {
    return date.slice(5).split('-').join('.');
}
