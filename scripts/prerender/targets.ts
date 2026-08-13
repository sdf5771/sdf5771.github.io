/**
 * 프리렌더 대상 목록 — **여기가 유일한 정의처입니다**(product.md §14-5 R-2).
 *
 * 🔴 프리렌더할 HTML 과 sitemap 의 `<loc>` 이 **같은 배열 하나**에서 나옵니다.
 *    두 곳에 적으면 조용히 갈립니다(lessons L15). 규칙은 한 줄입니다 —
 *    **「HTTP 200 으로 서빙되는 정본 URL 만 넣는다.」**
 *
 * 🔴 개수를 손으로 유지하지 않습니다. 세 JSON(`posts-data` · `tags-data` ·
 *    `works-data`)에서 생성하므로 글·태그·작업이 늘면 대상도 자동으로 늡니다(R-1).
 *    2026-08-13 기준 74개 = 단일 6 + 글 41 + 태그 27 + 작업 상세 0.
 */

import { POSTS } from '../../src/data/posts';
import { ALL_TAGS } from '../../src/data/tags';
import { WORKS } from '../../src/data/works';
import type { TagSummary } from '../../src/utils/tags';
import { TAG_INDEX_MIN_COUNT } from '../../src/utils/tags';
import { resolveDocumentTitle } from '../../src/utils/documentTitle';
import { ROUTE_DESCRIPTIONS, buildPostDescriptions, buildTagDescription } from './description';

/* ------------------------------------------------------------------ *
 * 🔴 태그 술어 — 판정이 바뀌면 **이 블록만** 고칩니다
 * ------------------------------------------------------------------ */

/**
 * 프리렌더할 태그의 최소 등장 횟수.
 *
 * 지금은 인덱스 노출 문턱(`TAG_INDEX_MIN_COUNT` = 2)과 같은 값이라 27종이
 * 대상입니다. **일부러 별도 상수로 둡니다** — 「인덱스에 링크를 거는가」와
 * 「HTML 을 굽고 sitemap 에 싣는가」는 다른 결정이고, 둘 중 하나만 바뀌는 날이
 * 옵니다. 그날 고칠 곳이 여기 한 줄이어야 합니다.
 *
 * 2026-08-13 판정(PM): **`count>=2` 27종 유지.** 문턱을 올려도 중복 태그 페이지는
 * 사라지지 않습니다 — `count==3` 인 `Google`·`Web` 도 같은 글 3편을 가리킵니다.
 * 원인은 2부작 2편이 태그를 15개씩 달아 그중 12개를 독점한 데이터 사실이고,
 * 프리렌더 범위로 고칠 수 있는 문제가 아닙니다.
 */
const PRERENDER_TAG_MIN_COUNT = TAG_INDEX_MIN_COUNT;

/**
 * 🔴 **프리렌더 대상 태그를 고르는 유일한 술어입니다.** 목록을 하드코딩하지
 *    마세요 — 태그 판정이 바뀌면 PM 이 이 함수 하나만 고쳐 끝나야 합니다.
 *
 * 🔴 여기에 `noindex` 분기를 만들지 마세요. 프리렌더 산출물의 `noindex` 허용치는
 *    **예외 없이 0** 입니다(R-9). "이 12개는 되고 나머지는 안 됨" 이 되는 순간
 *    손으로 유지하는 목록이 생기고, 틀렸을 때 빌드가 알려주지 못합니다.
 *    대상에서 빼는 것과 `noindex` 를 붙이는 것은 다른 일이고, 우리는 앞의 것만 합니다.
 */
export function shouldPrerenderTag(tag: TagSummary): boolean {
    return tag.count >= PRERENDER_TAG_MIN_COUNT;
}

/* ------------------------------------------------------------------ *
 * 대상 모델
 * ------------------------------------------------------------------ */

export interface PrerenderTarget {
    /**
     * 정본 경로. **후행 슬래시를 붙이지 않습니다**(홈 `/` 만 예외).
     * canonical · `og:url` · sitemap `<loc>` · 파일 경로가 전부 이 값에서 나오므로
     * 표기가 갈릴 수 없습니다(R-12).
     */
    path: string;
    title: string;
    description: string;
    /** 글 상세만 `article`. 나머지는 목록·인덱스라 `website` 입니다 */
    ogType: 'website' | 'article';
    /** sitemap `<lastmod>`. 글은 발행일, 그 외는 빌드일(R-12) */
    lastmod: string;
}

function toTarget(
    path: string,
    description: string,
    lastmod: string,
    ogType: 'website' | 'article' = 'website',
): PrerenderTarget {
    return {
        path,
        /*
         * 🔴 `<title>` 을 여기에 다시 적지 않습니다. 라우트별 제목의 정본은
         *    `resolveDocumentTitle` 이고(R-5 · WRITING_GUIDE §6.13), 문구를 두 곳에
         *    적으면 탭 제목과 공유 카드 제목이 조용히 갈립니다.
         */
        title: resolveDocumentTitle(path, ''),
        description,
        ogType,
        lastmod,
    };
}

/**
 * 프리렌더 · sitemap 이 함께 쓰는 대상 배열.
 * 순서는 「단일 → 글 → 태그 → 작업 상세」로 고정입니다 — 빌드마다 흔들리면
 * sitemap diff 를 읽을 수 없습니다.
 */
export function collectPrerenderTargets(buildDate: string): PrerenderTarget[] {
    const postDescriptions = new Map(
        buildPostDescriptions(POSTS).map(entry => [entry.slug, entry.text]),
    );

    const targets: PrerenderTarget[] = [
        toTarget('/', ROUTE_DESCRIPTIONS.home, buildDate),
        toTarget('/posts', ROUTE_DESCRIPTIONS.posts, buildDate),
        toTarget('/about', ROUTE_DESCRIPTIONS.about, buildDate),
        toTarget('/tags', ROUTE_DESCRIPTIONS.tags, buildDate),
        toTarget('/archive', ROUTE_DESCRIPTIONS.archive, buildDate),
        toTarget('/works', ROUTE_DESCRIPTIONS.works, buildDate),
    ];

    for (const post of POSTS) {
        targets.push(
            toTarget(
                `/posts/${post.slug}`,
                postDescriptions.get(post.slug) ?? '',
                post.date,
                'article',
            ),
        );
    }

    for (const tag of ALL_TAGS.filter(shouldPrerenderTag)) {
        targets.push(toTarget(`/tags/${tag.slug}`, buildTagDescription(tag), buildDate));
    }

    /*
     * 작업 상세는 `hasBody === true` 인 것만입니다 — 지금은 0건이라 대상이
     * 없습니다(§14-2). 본문이 없는 15건은 화면이 404 이므로 프리렌더하면
     * 404 계약을 깨뜨립니다(R-11).
     *
     * 🔴 첫 상세가 생기면 **빌드가 멈춥니다.** description 규격이 아직 없기
     *    때문이고(§6.13c-1 「규격 보류」), 없는 규격을 여기서 지어내는 것보다
     *    멈추는 편이 낫습니다.
     */
    for (const work of WORKS.filter(item => item.hasBody)) {
        throw new Error(
            `[prerender] 작업 상세 "${work.slug}" 의 meta description 규격이 없습니다.\n` +
                '   → WRITING_GUIDE §6.13c-1 이 `hasBody=true` 0건을 이유로 규격을 보류했습니다.\n' +
                '     web-design 에 규격을 요청한 뒤 이 자리에서 대상으로 만드세요.\n' +
                '     문구를 여기서 지어내지 마십시오.',
        );
    }

    return targets;
}
