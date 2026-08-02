import { useEffect, useMemo } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './TagPosts.module.css';
import NotFound from '../NotFound/NotFound';
import { PostRow, SortSegment } from '../../components/posts';
import { TagChipList } from '../../components/tags';
import { Pagination } from '../../components/shared';
import { findTag, getPostsByTagSlug } from '../../data/tags';
import { TAG_INDEX_LINK_LABEL, TAG_INDEX_PATH } from '../../constants/site';
import { safeDecodeURIComponent } from '../../utils/url';
import { toTagSlug } from '../../utils/tags';
import {
    clampPage,
    sortPosts,
    POST_SORT_OPTIONS,
    POSTS_PER_PAGE,
    type PostSortOrder,
} from '../../utils/postListQuery';
import { buildTagPostsSearch, parseTagPostsQuery } from '../../utils/tagListQuery';

/** 행 안에서 검색어 강조를 하지 않습니다. 이 화면에는 검색이 없습니다 */
const NO_TOKENS: readonly string[] = [];

/**
 * 태그별 목록 `/tags/:tag`.
 * 명세: docs/handoff-step6-tags-archive.md §7
 *
 * 주 과업: **한 주제로 묶인 글들을 훑어 그중 하나에 도달한다.**
 *
 * 🔴 행 컴포넌트를 **복제하지 않습니다.** STEP 4 의 `PostRow` 에 prop 두 개
 *    (`highlightTagSlug`·`showThumbnail`)를 더한 것이 전부입니다(§7-1).
 *    시안 B 는 STEP 4 가 제거·반려한 요소 두 개(모바일 썸네일 슬롯 · 정렬 회전
 *    토글)를 되살려 놨는데, 둘 다 다시 되돌렸습니다.
 *
 * 🔴 모바일 썸네일 제거는 **이 화면의 성립 조건**입니다(§7-4).
 *    인덱스 27종 중 12종이 같은 두 글(`2025-03-13`/`2025-03-14`)만 갖고 있고,
 *    그 두 글은 제목 앞 61자(609px)와 태그 15개가 완전히 같습니다. 썸네일을
 *    유지하면 모바일 제목 폭이 270px 이라 2행 예산이 540px < 609px 이 되어
 *    **12개 태그 페이지에서 두 행이 글자 하나 다르지 않게** 보입니다.
 *    썸네일이 없으면 358px × 2행 = 716px 로 구별됩니다.
 */
function TagPosts() {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    /*
     * 🔴 정규화는 **렌더 이후가 아니라 라우트 파싱 단계에서** 합니다(§4-2).
     *    잘못된 대소문자로 들어와 빈 목록이 한 프레임 그려졌다 고쳐지면
     *    깜빡임이 보입니다. `safeDecode` 여야 `%ZZ` 같은 잘못된 인코딩이
     *    렌더 도중 URIError 로 트리를 죽이지 않습니다.
     */
    const raw = safeDecodeURIComponent(params.tag ?? '');
    const slug = toTagSlug(raw);

    const query = parseTagPostsQuery(location.search);
    const tag = slug ? findTag(slug) : null;

    const matched = useMemo(() => (tag ? getPostsByTagSlug(tag.slug) : []), [tag]);

    /*
     * 🔴 타이브레이커 `[date, slug]` 가 `/posts` 보다 **더** 중요합니다(§7-6).
     *    Python 은 16편 중 13편(81%), CodingTest 는 9편 중 7편(78%)이 같은 날짜를
     *    공유합니다. 페이저가 없어 중복·누락은 안 생기지만, 타이브레이커가 없으면
     *    순서가 `posts-data.json` 의 생성 순서에 의존해 빌드마다 흔들리고
     *    프리렌더된 HTML 과 하이드레이션 결과가 어긋납니다.
     */
    const sorted = useMemo(() => sortPosts(matched, query.sort), [matched, query.sort]);

    /*
     * 페이저는 **지금 데이터에서 절대 렌더되지 않습니다** — 최대 태그가 Python
     * 16편이라 20편/페이지에 못 미칩니다. 시안의 `1 / 1 · 전체 14개` 줄은
     * 정보량이 0인데 자리를 차지해 삭제했고, **분기는 남깁니다**(§7-5).
     */
    const totalPages = Math.max(1, Math.ceil(sorted.length / POSTS_PER_PAGE));
    const currentPage = clampPage(query.page, totalPages);

    const visiblePosts = useMemo(
        () => sorted.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE),
        [sorted, currentPage],
    );

    /*
     * URL 정규화 — 기본값(`sort=latest`·`page=1`)은 키 자체를 뺍니다.
     * `page` 는 지금 데이터에서 항상 1로 클램프되므로 `?page=99` 로 들어와도
     * 주소에서 사라집니다(§7-5). slug 리다이렉트가 걸린 상태에서는 건너뜁니다 —
     * 두 개의 주소 쓰기가 겹치면 히스토리가 꼬입니다.
     */
    const canonicalSearch = buildTagPostsSearch(location.search, {
        sort: query.sort,
        page: currentPage,
    });

    const shouldCanonicalize =
        tag !== null && slug === raw && canonicalSearch !== location.search;

    useEffect(() => {
        if (shouldCanonicalize) {
            navigate({ search: canonicalSearch }, { replace: true });
        }
    }, [shouldCanonicalize, canonicalSearch, navigate]);

    /* 빈 slug 는 인덱스로. 리다이렉트는 전부 replace 입니다 — 사용자가 한 일이 아닙니다 */
    if (!slug) {
        return <Navigate to={TAG_INDEX_PATH} replace />;
    }

    /*
     * `/tags/Android%20XR`·`/tags/REACT` → `/tags/android-xr`·`/tags/react`.
     * `toTagSlug` 는 멱등이라 착지한 주소가 이 분기에 다시 걸리지 않습니다.
     */
    if (slug !== raw) {
        return <Navigate to={`${TAG_INDEX_PATH}/${slug}${location.search}`} replace />;
    }

    /* 데이터에 없는 태그만 404 입니다. 1회성 태그는 여기 걸리지 않습니다(§4-2) */
    if (!tag) {
        return <NotFound />;
    }

    const buildHref = (patch: { sort?: PostSortOrder; page?: number }): string => {
        /* 정렬이 바뀌면 페이지는 1로 — STEP 4 §4-3 과 같은 규칙 */
        const next = { sort: query.sort, page: 1, ...patch };
        return `${TAG_INDEX_PATH}/${tag.slug}${buildTagPostsSearch(location.search, next)}`;
    };

    return (
        <div className={styles.root}>
            <div className={styles.inner}>
                {/*
                 * `#React 글 14편`. `#` 는 액센트 색 장식이고, `글 N편` 은 한 단계
                 * 작은 픽셀 크기(22px)입니다 — 22px 이상이라 한글이 있어도 픽셀
                 * 서체를 쓸 수 있습니다(STEP 1 §3-3a).
                 * 표기는 **대표 표기**입니다(§3-4) — 인덱스는 같은 태그를 두 줄로
                 * 낼 수 없어 최빈 표기 하나를 고릅니다.
                 */}
                <h1 className={styles.title}>
                    <span className={styles.hash} aria-hidden="true">
                        #
                    </span>
                    {tag.name}
                    <span className={styles.title_count}>{` 글 ${sorted.length}편`}</span>
                </h1>

                <div className={styles.chips}>
                    <TagChipList currentSlug={tag.slug} />
                </div>

                {/*
                 * 🔴 시안의 헤드라인 `➜ 최신순 · 14개 표시` 는 **줄 자체를 삭제**
                 *    했습니다(§7-2 수정 4). h1 이 이미 `#React 글 14편` 이라 같은
                 *    수를 두 번 쓰는 셈이고, `➜ …` 줄은 `/posts` 에서 검색·필터의
                 *    에코라는 역할이 있었는데 이 화면엔 검색도 필터도 없습니다.
                 */}
                <div className={styles.controls}>
                    <SortSegment
                        options={POST_SORT_OPTIONS}
                        selected={query.sort}
                        buildHref={sort => buildHref({ sort })}
                    />
                </div>

                {/*
                 * 빈 상태 분기를 만들지 않습니다 — 태그가 데이터에 있다는 것은
                 * 글이 최소 1편 있다는 뜻입니다(§7-8 4번).
                 */}
                <ul className={styles.list}>
                    {visiblePosts.map(post => (
                        <PostRow
                            key={post.slug}
                            post={post}
                            tokens={NO_TOKENS}
                            /* 현재 태그 칩을 액센트 처리하고 노출 3개 안으로 끌어올립니다 */
                            highlightTagSlug={tag.slug}
                        />
                    ))}
                </ul>

                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <Pagination
                            currentPage={currentPage}
                            totalPage={totalPages}
                            buildHref={page => buildHref({ page })}
                        />
                    </div>
                )}

                {/*
                 * 🔴 시안은 이 버튼을 h1 과 같은 줄 우상단에 뒀습니다. 아래로
                 *    옮깁니다 — 사용자는 들어온 직후가 아니라 **다 훑은 뒤** 다른
                 *    태그를 찾습니다. h1 옆에 나가는 문을 두면 위계가 뒤집힙니다.
                 *    서체도 Galmuri11 11px(한글 3중 위반)에서 Pretendard 15px 로
                 *    바뀌었습니다(§7-2 수정 1 · STEP 1 §6-7).
                 *    1회성 태그 페이지에서는 이 링크가 인덱스로 가는 유일한 길입니다.
                 */}
                <Link className={styles.index_link} to={TAG_INDEX_PATH}>
                    {TAG_INDEX_LINK_LABEL}
                </Link>
            </div>
        </div>
    );
}

export default TagPosts;
