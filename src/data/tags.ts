import tagsData from '../../public/tags-data.json';
import { POSTS } from './posts';
import type { PostMetadata } from '../types';
import { TAG_INDEX_MIN_COUNT, type TagSummary } from '../utils/tags';

/**
 * 🔴 태그 데이터의 **유일한 런타임 진입점입니다.**
 * 명세: docs/handoff-step6-tags-archive.md §3-6② · §4-1
 *
 * 정의처는 빌드(`generatePostsData.ts`)입니다. 여기서 다시 집계하지 마세요 —
 * 빌드가 만든 slug 와 런타임 집계가 갈리면 "검색으로는 찾히는데 태그 페이지에는
 * 없는" 태그가 생깁니다(§3-2).
 *
 * `posts-data.json` 과 같은 이유로 fetch 가 아니라 **번들 import** 입니다
 * (2.9 KB · gzip 0.7 KB). 태그 페이지가 slug 로 태그를 **동기적으로** 찾아
 * 없으면 404 를 그려야 해서, fetch 로 바꾸면 404 판정이 한 프레임 늦습니다.
 */
export const ALL_TAGS: readonly TagSummary[] = tagsData as TagSummary[];

/** slug → 요약. 62종이라 모듈 로드 시 한 번 만들어 둡니다 */
const TAG_BY_SLUG = new Map(ALL_TAGS.map(tag => [tag.slug, tag]));

/**
 * 🔴 **존재**와 **노출**은 다릅니다(§4-1).
 *
 * | 개념 | 규칙 | 대상 |
 * |---|---|---|
 * | 존재(페이지가 렌더되는가) | 데이터에 slug 가 있으면 | **62종 전부** |
 * | 노출(인덱스에 오르고 링크가 걸리는가) | 2회 이상 | **27종** |
 *
 * 데이터에 있는데 404 를 주는 것은 거짓말입니다. `/tags/ai` 는 인덱스에 없지만
 * 글 1편짜리 목록으로 정상 렌더됩니다. 임계값이 나중에 바뀌어도 URL 이 깨지지
 * 않는 것도 같은 판단에서 나옵니다.
 */
export function findTag(slug: string): TagSummary | null {
    return TAG_BY_SLUG.get(slug) ?? null;
}

/**
 * 인덱스에 오르는 태그 — **2회 이상 27종**.
 * 정렬은 빌드가 정한 `count` 내림차순 → `slug` 오름차순 그대로입니다.
 */
export const INDEXED_TAGS: readonly TagSummary[] = ALL_TAGS.filter(
    tag => tag.count >= TAG_INDEX_MIN_COUNT,
);

/**
 * 링크를 걸어도 되는 slug 집합. 글 상세의 태그 줄이 **칩 / 평문**을 가르는
 * 기준입니다(§5-2) — 인덱스에 없는 태그로 보내면 되돌아올 길이 없습니다.
 */
export const LINKABLE_TAG_SLUGS: ReadonlySet<string> = new Set(
    INDEXED_TAGS.map(tag => tag.slug),
);

/**
 * 그 태그의 글. `posts-data.json` 의 `tagSlugs` 를 그대로 보므로 런타임 정규화가
 * 없습니다. 반환 순서는 `POSTS` 의 순서(date DESC · slug ASC)입니다 —
 * 호출부가 `sortPosts` 로 최종 정렬합니다.
 */
export function getPostsByTagSlug(slug: string): PostMetadata[] {
    return POSTS.filter(post => post.tagSlugs.includes(slug));
}
