/**
 * 태그 집계.
 * 명세: docs/handoff-step5-404-about.md §7-3
 *
 * 🔴 빈도를 화면에 적어 넣지 마세요. 글이 늘면 그 순간 틀립니다.
 *    `posts-data.json` 에서 집계합니다.
 */

export interface RankedTag {
    label: string;
    count: number;
}

/**
 * 태그를 **빈도 내림차순**, 동점이면 **태그명 사전순(대소문자 무시) 오름차순**으로.
 *
 * 타이브레이커가 없으면 동점 그룹의 순서가 빌드마다 흔들립니다.
 * 현재 데이터에는 3회 동점이 6개나 있어 실제로 흔들립니다.
 */
export function rankTags(posts: readonly { keywords: string[] }[]): RankedTag[] {
    const counts = new Map<string, number>();

    for (const post of posts) {
        for (const tag of post.keywords) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
    }

    return [...counts]
        .sort((a, b) => b[1] - a[1] || a[0].toLowerCase().localeCompare(b[0].toLowerCase()))
        .map(([label, count]) => ({ label, count }));
}
