/**
 * 태그 정규화 · slug · 집계 — **이 파일이 유일한 정의처입니다.**
 * 명세: docs/handoff-step6-tags-archive.md §3
 *
 * 🔴 정규화의 소유는 **빌드**입니다(`generatePostsData.ts`).
 *    이 파일의 함수를 빌드와 런타임이 **같이** 씁니다. 두 곳이 각자 정규화하면
 *    "검색으로는 찾히는데 태그 페이지에는 없는" 태그가 생깁니다(§3-2).
 */

import { normalizeSearchText } from './postSearch';

export interface RankedTag {
    label: string;
    count: number;
}

/**
 * 매칭·집계용 정규화 키.
 *
 * ```
 * NFC → trim → 내부 연속 공백 1칸 → 소문자
 * ```
 *
 * 🔴 **검색(STEP 4 §3-2)이 쓰는 `normalizeSearchText` 와 같은 함수입니다.**
 *    별칭으로 두는 이유는 호출부에서 의도가 드러나게 하기 위해서일 뿐이고,
 *    규칙을 여기서 다시 쓰지 않습니다 — 두 규칙이 갈리는 순간이 사고입니다.
 */
export function normalizeTag(value: string): string {
    return normalizeSearchText(value);
}

/**
 * URL 용 slug — `Android XR` → `android-xr` (§3-3).
 *
 * ```
 * normalizeTag → 공백을 '-' 로 → 연속 '-' 축약 → 앞뒤 '-' 제거
 * ```
 *
 * **원문 표기를 URL 에 쓰지 않습니다.** ①`/tags/Android%20XR` 은 프리렌더·배포
 * 스크립트의 파일 경로에 공백을 밀어 넣고 ②`/tags/Javascript` 와
 * `/tags/JavaScript` 가 서로 다른 URL 이 되어 같은 목록이 두 주소로 존재하며
 * ③대소문자 오타에 취약합니다.
 *
 * 실측(41편 · 고유 62종): 특수문자는 **공백 8종과 하이픈 1종(`Front-end`)뿐**이라
 * `encodeURIComponent` 가 필요한 문자가 slug 에 남지 않습니다. slug 충돌 0건.
 *
 * 멱등입니다 — `toTagSlug(toTagSlug(x)) === toTagSlug(x)`. `/tags/:tag` 의
 * 정규형 리다이렉트가 되돌아오지 않는 근거입니다.
 */
export function toTagSlug(value: string): string {
    return normalizeTag(value)
        .replace(/ /g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * 인덱스에 오르는 최소 등장 횟수.
 *
 * 3회로 올리면 인덱스가 12종으로 줄고 `NextJS`·`SEO`·`WebXR` 처럼 **실제로 서로
 * 다른 두 글**을 잇는 태그까지 사라집니다(§2-3). 2회를 유지하되, 결과 화면에서
 * 두 행이 구별되게 만드는 것(모바일 썸네일 제거)이 전제 조건입니다.
 */
export const TAG_INDEX_MIN_COUNT = 2;

export interface TagSummary {
    /** URL 에 쓰는 정규형. `tags-data.json` 의 정렬 타이브레이커이기도 합니다 */
    slug: string;
    /** 화면에 쓰는 **대표 표기**(§3-4). 그 정규화 키의 원문 중 최빈 표기 */
    name: string;
    count: number;
}

/**
 * 태그 집계 — 빌드가 `public/tags-data.json` 을 만들 때 쓰는 함수입니다.
 *
 * **대표 표기 선정**: 최빈 표기, 동률이면 더 최근 글의 표기.
 * `posts` 는 **date DESC 로 이미 정렬된 배열**이어야 합니다 — 이 함수는 앞에서
 * 본 표기를 더 최근 것으로 봅니다(정렬 규칙은 generatePostsData 가 소유).
 *
 * 인덱스는 같은 태그를 두 줄로 낼 수 없으므로 대표 표기가 불가피합니다.
 * WRITING_GUIDE §6.8 의 "원문 그대로"는 **글 단위 표시** 규칙이라 집계 화면에는
 * 적용되지 않습니다(§3-4).
 *
 * 정렬: `count` 내림차순 → `slug` 오름차순. **결정론적이어야** 프리렌더된 HTML 과
 * 하이드레이션 결과가 어긋나지 않습니다.
 */
export function summarizeTags(posts: readonly { keywords: string[] }[]): TagSummary[] {
    interface Bucket {
        slug: string;
        count: number;
        /** 원문 표기 → 등장 횟수. 삽입 순서가 곧 최신순입니다 */
        forms: Map<string, number>;
    }

    const buckets = new Map<string, Bucket>();

    for (const post of posts) {
        const keywords = Array.isArray(post?.keywords) ? post.keywords : [];

        for (const keyword of keywords) {
            const key = normalizeTag(keyword);

            if (!key) {
                continue;
            }

            let bucket = buckets.get(key);

            if (!bucket) {
                bucket = { slug: toTagSlug(keyword), count: 0, forms: new Map() };
                buckets.set(key, bucket);
            }

            bucket.count += 1;
            bucket.forms.set(keyword, (bucket.forms.get(keyword) ?? 0) + 1);
        }
    }

    return [...buckets.values()]
        .map(bucket => ({
            slug: bucket.slug,
            /*
             * 최빈 표기. 동률에서는 **먼저 들어온 것**이 남는데, 입력이 최신순이라
             * 그게 곧 "가장 최근 글의 표기"입니다(§3-4).
             */
            name: [...bucket.forms].reduce((best, current) =>
                current[1] > best[1] ? current : best,
            )[0],
            count: bucket.count,
        }))
        .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

/**
 * 태그를 **빈도 내림차순**, 동점이면 **태그명 사전순(대소문자 무시) 오름차순**으로.
 * 명세: docs/handoff-step5-404-about.md §7-3
 *
 * 🔴 빈도를 화면에 적어 넣지 마세요. 글이 늘면 그 순간 틀립니다.
 *
 * ⚠️ 이쪽은 **원문 표기 단위** 집계입니다(소개 화면의 `다루는 기술` 칩 전용).
 *    태그 페이지·인덱스는 정규화 키 단위인 `summarizeTags` 를 씁니다.
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
