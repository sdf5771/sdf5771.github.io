import featuredData from '../../public/featured.json';
import { POSTS } from './posts';
import { toPostSlug } from '../utils/postSlug';
import type { PostMetadata } from '../types';

/**
 * 홈 「읽어볼 만한 글」 — 손으로 고른 글과 한 줄 설명.
 * 명세: docs/handoff-step2-home.md §5-3
 *
 * 왜 별도 파일인가
 * ----------------
 * 41편의 **프론트매터를 건드리지 않기** 위해서입니다(product.md §2-3).
 * 그리고 요약(`description`)이 41편 중 1편뿐이라, 카드 설명을 자동 추출로
 * 채우면 40편에서 제목의 앞부분이 제목 바로 아래 한 번 더 나옵니다.
 *
 * 왜 fetch 가 아니라 번들 import 인가
 * -----------------------------------
 * `data/posts.ts` 와 같은 이유입니다 — 데이터 경로가 둘이면 한쪽만 규칙을
 * 얻었을 때 조용히 어긋납니다. 6줄짜리라 번들 비용이 요청 하나보다 쌉니다.
 * 로딩·실패 상태가 아예 생기지 않는 것도 이득입니다.
 */

interface FeaturedEntry {
    slug: string;
    note: string;
}

export interface FeaturedPick {
    post: PostMetadata;
    /** 손으로 쓴 한 줄. "왜 읽을 만한가" 를 말합니다 */
    note: string;
}

const BY_SLUG = new Map(POSTS.map(post => [post.slug, post]));

/**
 * 🔴 slug 는 **정본 규칙**에 한 번 통과시킵니다.
 *
 * `featured.json` 은 사람이 손으로 고치는 파일이고, 41편 중 33편의 파일명에
 * 대문자가 섞여 있습니다. 손으로 적을 때 `2023-07-19-Skeleton-loading` 이라고
 * 쓰기 쉬운데 정본 slug 는 소문자입니다. 정규화하지 않으면 **조용히
 * 건너뛰어져** 「읽어볼 만한 글」이 통째로 사라집니다 — 실패가 화면에
 * 드러나지 않는 종류라 특히 위험합니다.
 */
const ENTRIES: FeaturedEntry[] = (featuredData.picks as FeaturedEntry[]).map(entry => ({
    slug: toPostSlug(entry.slug),
    note: entry.note,
}));

/**
 * 「최근 글」에 이미 나온 글을 빼고 위에서부터 채웁니다.
 *
 * 🔴 **중복 제거가 필수입니다.** product.md 가 지정한 초기 3편은 곧 최신 3편이라
 *    그대로 두면 같은 화면에 같은 글이 두 번 나옵니다(§5-3). 발행이 재개되면
 *    우선순위 상위 3편이 자연히 올라옵니다 — `featured.json` 을 손대지 않아도
 *    됩니다. 이건 우회가 아니라 의도한 동작입니다.
 *
 * 없는 slug 는 **조용히 건너뜁니다.** 에러 화면을 만들지 않습니다.
 */
export function selectFeaturedPicks(
    excludedSlugs: ReadonlySet<string>,
    limit: number,
): FeaturedPick[] {
    const picks: FeaturedPick[] = [];

    for (const entry of ENTRIES) {
        if (picks.length >= limit) {
            break;
        }

        const post = BY_SLUG.get(entry.slug);
        if (!post || excludedSlugs.has(post.slug)) {
            continue;
        }

        picks.push({ post, note: entry.note });
    }

    return picks;
}
