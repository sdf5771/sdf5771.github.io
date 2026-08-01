import postsData from '../../public/posts-data.json';
import type { PostMetadata } from '../types';
import { buildSearchHaystack } from '../utils/postSearch';

/**
 * 🔴 글 데이터의 **유일한 런타임 진입점입니다.**
 *
 * 왜 이 파일이 생겼는가 (코드 리뷰 Y-3)
 * -------------------------------------
 * 직전까지 `posts-data.json` 이 두 경로로 실렸습니다.
 *   ① 번들 import — Post.tsx · About.tsx · useDocumentTitle · useTerminalPath
 *   ② 런타임 fetch — usePosts (`fetch('/posts-data.json')`)
 * 같은 데이터에 경로가 둘이면 한쪽만 규칙을 얻었을 때 조용히 어긋납니다.
 * slug 사고(`postSlug.ts` 주석)가 정확히 그 형태였습니다. **하나로 통일합니다.**
 *
 * 왜 fetch 가 아니라 번들 import 를 남겼는가
 * ------------------------------------------
 *  - 15KB(gzip 2.9KB)라 번들에 넣어도 요청 하나가 줄어드는 쪽이 이득입니다.
 *  - `Post.tsx` 는 slug 로 글을 **동기적으로** 찾아 없으면 404 를 그립니다.
 *    fetch 로 바꾸면 모든 글 화면에 로딩 단계가 새로 생기고, 404 판정이
 *    한 프레임 늦어집니다. 반대로 import 로 통일하면 목록 화면에서 로딩·실패
 *    상태 자체가 사라집니다.
 *  - Vite 는 같은 모듈을 한 번만 번들에 넣으므로 소비처가 늘어도 크기는 그대로입니다.
 *
 * ⚠️ 남은 것: `public/posts-data.json` 은 여전히 `dist/` 로 복사됩니다.
 *    빌드(`generatePostsData`)의 산출물이자 `scripts/spa-fallback-plugin.ts` 의
 *    입력이라 위치를 옮기려면 그 두 곳을 함께 고쳐야 하고, 지금 배포 중인
 *    `/posts-data.json` URL 이 사라집니다. **런타임 경로는 하나**가 됐으므로
 *    어긋날 여지는 없어졌고, 파일 이동은 별도 건으로 남깁니다.
 *
 * 🔴 앞으로 `posts-data.json` 을 직접 import 하거나 fetch 하지 마세요.
 *    글 데이터가 필요하면 이 모듈에서 가져갑니다.
 */
export const POSTS: readonly PostMetadata[] = postsData as PostMetadata[];

/** 전체 글 수. 검색 결과 헤더의 분모(`전체 41개 중`)가 이 값입니다 */
export const TOTAL_POST_COUNT = POSTS.length;

export interface PostSearchEntry {
    post: PostMetadata;
    /** 정규화된 검색 대상 문자열. 41건이라 모듈 로드 시 한 번 만들어 둡니다 */
    haystack: string;
}

/**
 * 검색 색인. 제목·태그·카테고리·description 4필드만입니다 — **본문은 없습니다.**
 * 본문을 넣으면 데이터가 15KB → 380~570KB 로 25~40배가 됩니다
 * (docs/handoff-step4-list.md §3-1).
 */
export const POST_SEARCH_INDEX: readonly PostSearchEntry[] = POSTS.map(post => ({
    post,
    haystack: buildSearchHaystack(post),
}));

export interface CategorySummary {
    /** 저장된 대소문자 그대로(`Study`·`Survey`·`Activity`). URL 값도 이 표기입니다 */
    name: string;
    count: number;
}

/**
 * 카테고리와 글 수.
 *
 * 🔴 이 값은 **항상 전체 기준 고정값**입니다. 검색어를 넣어도 바뀌지 않습니다(§3-5).
 *    배지가 요동치면 "이 칩을 누르면 몇 개가 나오는가" 가 아니라 "지금 몇 개인가"가
 *    되어 칩이 필터 선택지가 아니라 결과 표시로 변질됩니다. 현재 결과 수는
 *    목록 헤더가 이미 말합니다.
 *
 * 순서는 글 수 내림차순, 동수면 이름 오름차순입니다. 이름을 배열에 적어 두면
 * 카테고리가 늘었을 때 조용히 빠집니다.
 */
export const CATEGORY_SUMMARIES: readonly CategorySummary[] = (() => {
    const counts = new Map<string, number>();

    for (const post of POSTS) {
        if (!post.category) {
            continue;
        }
        counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
    }

    return [...counts]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([name, count]) => ({ name, count }));
})();

export const CATEGORY_NAMES: readonly string[] = CATEGORY_SUMMARIES.map(item => item.name);

export interface PostNeighbors {
    /** 더 **오래된** 글. 최고(最古) 글에서는 `null` */
    previous: PostMetadata | null;
    /** 더 **최신** 글. 최신 글에서는 `null` */
    next: PostMetadata | null;
}

/** slug → POSTS 배열 인덱스. 41건이라 모듈 로드 시 한 번 만들어 둡니다 */
const SLUG_INDEX = new Map(POSTS.map((post, index) => [post.slug, index]));

/**
 * 이전 / 다음 글 — docs/handoff-step3-post.md §10-2.
 *
 * ```
 * 정렬:  date DESC, 동률이면 slug ASC   ← 빌드(generatePostsData)가 이 순서로 씁니다
 * 이전 글 = 배열에서 바로 다음 항목 (더 오래된 글)
 * 다음 글 = 배열에서 바로 앞 항목   (더 최신 글)
 * ```
 *
 * 🔴 **같은 카테고리 안에서 잇지 않습니다.** `Activity` 는 2편뿐이라 그 둘이
 *    서로의 유일한 이웃이 되고 나머지 39편과의 연결이 끊깁니다.
 *
 * 🔴 정렬 순서의 정의처는 **빌드**입니다. 동일 날짜가 8개 날짜에 걸쳐 있어
 *    (`2023-04-13` 만 5편) 타이브레이커 없이는 배열 순서가 파일시스템 순서에
 *    의존합니다. 여기서 다시 정렬하면 규칙이 두 곳이 되므로 하지 않습니다.
 *
 * `이전 글` 이 더 오래된 글인 것은 블로그 관례이고, 목록 정렬(최신순)·
 * 브레드크럼과 방향이 일관됩니다.
 */
export function getPostNeighbors(slug: string): PostNeighbors {
    const index = SLUG_INDEX.get(slug);

    if (index === undefined) {
        return { previous: null, next: null };
    }

    return {
        previous: POSTS[index + 1] ?? null,
        next: index > 0 ? POSTS[index - 1] : null,
    };
}
