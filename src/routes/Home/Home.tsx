import { useMemo } from 'react';
import styles from './Home.module.css';
import { ConstellationHero, FeaturedPosts, RecentPosts } from '../../components/home';
import { ContributionGraph } from '../../components/shared';
import { POSTS, TOTAL_POST_COUNT } from '../../data/posts';
import { selectFeaturedPicks } from '../../data/featured';
import { sortPosts } from '../../utils/postListQuery';
import { useMediaMatch } from '../../hooks';
import { MEDIA_DESKTOP } from '../../styles/breakpoints';

/**
 * 홈 `/`.
 * 명세: docs/handoff-step2-home.md (토큰·셸은 docs/handoff-step1-shell.md 가 최종 권위)
 *
 * 주 과업: **처음 온 사람이 30초 안에 "어떤 개발자인지" 와 "읽을 만한 글" 을
 * 파악한다.** 도달해야 하는 것 셋 — ① 이름·직함 ② 글이 몇 편 있고 어떤
 * 주제인지 ③ 지금 읽을 글 하나로 가는 경로.
 *
 * 섹션 순서: 히어로 → 최근 글 → 읽어볼 만한 글 → 기여 활동.
 *
 * 🔴 2트랙은 **위아래**입니다. 「최근 글」이 전폭 행, 「읽어볼 만한 글」이
 *    3열 카드로 **형태가 달라** 성격 차이가 스크롤만으로 읽힙니다(§5-1).
 *    나란히 2열은 96자 제목에서 높이가 어긋나고, 탭 전환은 선별 트랙을
 *    첫 화면에서 감춥니다.
 *
 * ⚠️ 직전 구현(`PostList` + `Profile` + `PageTitle`)은 전면 교체됐습니다.
 *    `Profile` 은 `Notion Portpolio Link` 오타와 `Blog | https://…` 같은
 *    구 디자인 마크업을 갖고 있었고, 홈에서만 쓰였습니다.
 */

/** 「최근 글」 편수 — xl·lg 6편 / md·sm 5편 (§5-2) */
const RECENT_COUNT_DESKTOP = 6;
const RECENT_COUNT_COMPACT = 5;

/** 「읽어볼 만한 글」 최대 편수 */
const FEATURED_COUNT = 3;

function Home() {
    const isDesktopViewport = useMediaMatch(MEDIA_DESKTOP);
    const recentCount = isDesktopViewport ? RECENT_COUNT_DESKTOP : RECENT_COUNT_COMPACT;

    /* 정렬 타이브레이커([date, slug])는 목록 화면·히어로와 **같은 함수**를 씁니다 */
    const recentPosts = useMemo(
        () => sortPosts(POSTS, 'latest').slice(0, recentCount),
        [recentCount],
    );

    /*
     * 🔴 중복 제거는 **실제로 렌더된 「최근 글」** 을 기준으로 합니다.
     *    product.md 가 지정한 초기 3편이 곧 최신 3편이라, 빼지 않으면 같은
     *    화면에 같은 글이 두 번 나옵니다(§5-3).
     *    편수가 bp 마다 다르므로(6 / 5) 기준 집합도 함께 달라집니다.
     */
    const featuredPicks = useMemo(
        () => selectFeaturedPicks(new Set(recentPosts.map(post => post.slug)), FEATURED_COUNT),
        [recentPosts],
    );

    return (
        <div className={styles.root}>
            <ConstellationHero />

            <div className={styles.container}>
                <RecentPosts posts={recentPosts} total={TOTAL_POST_COUNT} />

                <FeaturedPosts picks={featuredPicks} />

                {/*
                 * 소개(About)와 **같은 컴포넌트**입니다. 주 수(52/16)·요약 문구·
                 * 범례를 props 로 열지 않는 이유가 여기 있습니다 — 두 화면에서
                 * 표기가 갈리는 문을 구조적으로 닫아 둔 것입니다.
                 * 홈에서는 `$` 프롬프트를 붙이지 않습니다(소개만 터미널체).
                 *
                 * ⚠️ `public/contributions.json` 은 아직 없습니다. GitHub Actions
                 *    워크플로가 별도 태스크라, 지금은 **실패 상태**(제목 + 안내 +
                 *    `GitHub에서 보기 ↗`)로 렌더됩니다. 의도된 상태입니다.
                 */}
                <div className={styles.activity}>
                    <ContributionGraph />
                </div>
            </div>
        </div>
    );
}

export default Home;
