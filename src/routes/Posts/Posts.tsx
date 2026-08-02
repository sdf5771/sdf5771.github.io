import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import styles from './Posts.module.css';
import {
    AppliedConditions,
    CategoryChips,
    PostListEmpty,
    PostRow,
    SortSegment,
} from '../../components/posts';
import { Pagination, SearchIcon } from '../../components/shared';
import { CATEGORY_NAMES, POST_SEARCH_INDEX, TOTAL_POST_COUNT } from '../../data/posts';
import { POST_LIST_PATH } from '../../constants/site';
import { SEARCH_PLACEHOLDER, SEARCH_SCOPE_HINT } from '../../constants/search';
import { matchesTokens, tokenizeQuery } from '../../utils/postSearch';
import {
    buildPostListSearch,
    clampPage,
    parsePostListQuery,
    sortPosts,
    POSTS_PER_PAGE,
} from '../../utils/postListQuery';
import type { PostListQuery, PostSortOrder } from '../../utils/postListQuery';

/**
 * 🔴 디바운스는 **URL 쓰기에만** 겁니다.
 *
 * 필터 계산에는 걸지 않습니다 — 41건 × 4필드는 마이크로초 단위이고, 지연을
 * 넣으면 반응만 둔해집니다. 이 250ms 의 목적은 성능이 아니라 **히스토리 오염
 * 방지**입니다: `push` 였다면 `r`·`re`·`rea`·`reac`·`react` 5개가 쌓여 뒤로가기를
 * 다섯 번 눌러야 빠져나옵니다(§4-3).
 */
const SEARCH_URL_DEBOUNCE_MS = 250;

const SORT_LABEL: Record<PostSortOrder, string> = {
    latest: '최신순',
    oldest: '오래된순',
};

/**
 * 목록 헤더 문구 (§8-3 · STEP 1 §9 확정 카피).
 *
 * | 조건 | 문구 |
 * |---|---|
 * | 없음 | `최신순 · 전체 41편` |
 * | 카테고리만 | `최신순 · Study 30편` |
 * | 검색만 | `"react" · 14편 일치 · 전체 41편 중` |
 * | 검색 + 카테고리 | `"react" · Study · 9편 일치 · 전체 41편 중` |
 *
 * 검색 시 분모(`전체 41편 중`)를 보여 주는 편이 "얼마나 좁혀졌는가"를 알려 줍니다.
 * 따옴표는 곧은 따옴표입니다 (WRITING_GUIDE §3.2).
 *
 * 🔴 단위는 `개` 가 아니라 `편` 입니다 — WRITING_GUIDE §3.4 가 2026-08-02 에
 *    뒤집혔습니다. 수량사는 세는 대상을 따르고, 여기서 세는 것은 **글**입니다.
 */
function buildResultSummary(
    query: string,
    category: string | null,
    sort: PostSortOrder,
    count: number,
): string {
    const trimmed = query.trim();

    if (!trimmed) {
        return `${SORT_LABEL[sort]} · ${category ?? '전체'} ${count}편`;
    }

    const scope = category ? `"${trimmed}" · ${category}` : `"${trimmed}"`;
    return `${scope} · ${count}편 일치 · 전체 ${TOTAL_POST_COUNT}편 중`;
}

function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 글 목록 `/posts`.
 * 명세: docs/handoff-step4-list.md (토큰·셸은 docs/handoff-step1-shell.md 가 최종 권위)
 *
 * 주 과업: **41개를 훑어 목표한 글 하나에 도달한다.** 성공 조건은 셋뿐이고
 * 나머지 결정은 전부 여기서 파생됩니다.
 *   1. 훑기 — 한 화면에 최대한 많은 글이, 서로 구별되는 형태로
 *   2. 걸러내기 — 검색·카테고리·정렬이 즉시 반응하고 **지금 무엇이 걸려 있는지** 항상 보임
 *   3. 되찾기 — 그 상태가 **URL 에 남아** 공유·뒤로가기·새로고침에서 복원됨
 *
 * 3번은 이 프로젝트의 1순위 과제(딥링크 복구)와 같은 요구입니다. 목록만 상태가
 * 휘발되면 같은 사이트 안에서 원칙이 갈립니다.
 */
function Posts() {
    const location = useLocation();
    const navigate = useNavigate();
    const navigationType = useNavigationType();

    const params = useMemo(
        () => parsePostListQuery(location.search, CATEGORY_NAMES),
        [location.search],
    );

    /* 화면에 보이는 검색어. 필터는 이 값으로 **즉시** 계산합니다 */
    const [inputValue, setInputValue] = useState(params.q);
    /* URL 에 실제로 쓴 검색어. aria-live 발화와 조건 바도 이 값을 기준으로 합니다 */
    const [committedQuery, setCommittedQuery] = useState(params.q);
    /*
     * 🔴 우리가 마지막으로 URL 에 쓴 검색어. 없으면 아래 두 효과가 서로를 덮습니다.
     *    - 우리가 쓴 값이 URL 에서 되돌아왔을 때(에코) 입력을 다시 세팅하면,
     *      그 사이 사용자가 더 친 글자가 지워집니다.
     *    - 반대로 뒤로가기처럼 **밖에서** 바뀐 값은 반드시 입력에 반영해야 합니다.
     *    두 경우를 구분하는 유일한 방법이 "내가 쓴 값인가"입니다.
     */
    const writtenQueryRef = useRef(params.q);

    /* URL → 입력 (뒤로가기·헤더 검색에서의 진입·링크·최초 로드) */
    useEffect(() => {
        if (params.q === writtenQueryRef.current) {
            return;
        }

        writtenQueryRef.current = params.q;
        setInputValue(params.q);
        setCommittedQuery(params.q);
    }, [params.q]);

    /* 입력 → URL (250ms). 실제 주소 쓰기는 아래 정규화 효과가 한 곳에서 합니다 */
    useEffect(() => {
        if (inputValue === committedQuery) {
            return;
        }

        const timer = window.setTimeout(() => {
            writtenQueryRef.current = inputValue;
            setCommittedQuery(inputValue);
        }, SEARCH_URL_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [inputValue, committedQuery]);

    /* ---------------------------------------------------------------
     * 파생 — 표시목록 = 정렬( 카테고리필터( 검색필터( 전체 41개 ) ) )
     * 검색과 카테고리는 AND 입니다. 정렬은 결과 집합에만 작용합니다(§3-5).
     * ------------------------------------------------------------- */
    const tokens = useMemo(() => tokenizeQuery(inputValue), [inputValue]);

    const filtered = useMemo(
        () =>
            POST_SEARCH_INDEX.filter(
                entry =>
                    matchesTokens(entry.haystack, tokens) &&
                    (params.category === null || entry.post.category === params.category),
            ).map(entry => entry.post),
        [tokens, params.category],
    );

    const sorted = useMemo(() => sortPosts(filtered, params.sort), [filtered, params.sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / POSTS_PER_PAGE));

    /*
     * 검색어가 아직 URL 에 반영되지 않은 250ms 동안은 1페이지를 봅니다.
     * 조건이 하나라도 바뀌면 page 는 1로 돌아갑니다(§4-3) — 그 규칙을 화면에서
     * 먼저 적용해, URL 이 따라오기 전에 결과가 엉뚱한 페이지로 보이지 않게 합니다.
     */
    const isQueryPending = inputValue !== params.q;
    /*
     * 🔴 클램프는 **렌더 이후가 아니라 여기서** 합니다. `?page=99` 로 들어와
     *    빈 목록이 한 프레임 그려진 뒤 고쳐지면 깜빡임이 보입니다(§4-4).
     */
    const currentPage = clampPage(isQueryPending ? 1 : params.page, totalPages);

    const visiblePosts = useMemo(
        () => sorted.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE),
        [sorted, currentPage],
    );

    /* ---------------------------------------------------------------
     * URL 정규화 — 한 곳에서만 주소를 씁니다
     * ------------------------------------------------------------- */
    const canonicalSearch = useMemo(
        () =>
            buildPostListSearch(location.search, {
                q: committedQuery,
                category: params.category,
                sort: params.sort,
                /* 검색어가 막 바뀐 순간에는 페이지를 1로 되돌립니다 */
                page: committedQuery !== params.q ? 1 : currentPage,
            }),
        [location.search, committedQuery, params.category, params.sort, params.q, currentPage],
    );

    useEffect(() => {
        if (canonicalSearch === location.search) {
            return;
        }

        /*
         * `replace` 입니다. 타이핑·잘못된 파라미터 교정은 **사용자가 한 일이
         * 아니므로** 히스토리에 남기지 않습니다. 칩·정렬·페이지는 링크라
         * 기본 동작인 `push` 로 쌓입니다(§4-3).
         */
        navigate({ search: canonicalSearch }, { replace: true });
    }, [canonicalSearch, location.search, navigate]);

    /* ---------------------------------------------------------------
     * 주소 만들기 — 조건이 바뀌면 page 는 1로
     * ------------------------------------------------------------- */
    const hrefFor = (patch: Partial<PostListQuery>): string => {
        const next: PostListQuery = {
            q: committedQuery,
            category: params.category,
            sort: params.sort,
            page: 1,
            ...patch,
        };

        return `${POST_LIST_PATH}${buildPostListSearch(location.search, next)}`;
    };

    /* ---------------------------------------------------------------
     * 스크롤 (§4-5)
     * 페이지·카테고리·정렬 변경은 목록 헤더 상단으로. **검색어 변경은 이동하지
     * 않습니다** — 타이핑 중 화면이 뛰면 입력이 방해받습니다.
     * 뒤로가기(POP)는 브라우저 기본 복원에 맡깁니다.
     * ------------------------------------------------------------- */
    const listHeaderRef = useRef<HTMLDivElement>(null);
    const scrollKeyRef = useRef<string | null>(null);

    useEffect(() => {
        const key = `${params.category}|${params.sort}|${params.page}`;
        const previous = scrollKeyRef.current;
        scrollKeyRef.current = key;

        /* 최초 마운트에서는 스크롤하지 않습니다 */
        if (previous === null || previous === key) {
            return;
        }

        if (navigationType !== 'PUSH') {
            return;
        }

        listHeaderRef.current?.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start',
        });
    }, [params.category, params.sort, params.page, navigationType]);

    /* ---------------------------------------------------------------
     * 결과 수 알림 (§9-4)
     * 저감 모드에서는 목록 재진입 애니메이션이 사라지고, 스크린리더 사용자는
     * 애초에 그 신호를 받은 적이 없습니다. 그 자리를 이 영역이 메웁니다.
     *
     * `committedQuery` 로 계산하므로 **타이핑마다 발화되지 않습니다** —
     * URL 쓰기와 같은 250ms 디바운스를 자연히 공유합니다.
     * ------------------------------------------------------------- */
    const committedTokens = useMemo(() => tokenizeQuery(committedQuery), [committedQuery]);

    const committedCount = useMemo(
        () =>
            POST_SEARCH_INDEX.filter(
                entry =>
                    matchesTokens(entry.haystack, committedTokens) &&
                    (params.category === null || entry.post.category === params.category),
            ).length,
        [committedTokens, params.category],
    );

    const searchHintId = 'post-search-scope';
    const summary = buildResultSummary(inputValue, params.category, params.sort, sorted.length);
    const announcement = buildResultSummary(
        committedQuery,
        params.category,
        params.sort,
        committedCount,
    );

    return (
        <div className={styles.root}>
            <div className={styles.inner}>
                <h1 className={styles.title}>글</h1>

                <form
                    className={styles.search}
                    role="search"
                    onSubmit={event => {
                        /*
                         * 이미 실시간으로 반영되고 있어 제출할 곳이 없습니다.
                         * 막지 않으면 폼이 페이지를 다시 불러 SPA 상태가 날아갑니다.
                         */
                        event.preventDefault();
                    }}
                >
                    <div className={styles.search_field}>
                        <SearchIcon className={styles.search_icon} />
                        <input
                            className={styles.search_input}
                            type="search"
                            value={inputValue}
                            aria-label="검색"
                            aria-describedby={searchHintId}
                            placeholder={SEARCH_PLACEHOLDER}
                            autoComplete="off"
                            onChange={event => setInputValue(event.target.value)}
                            onKeyDown={event => {
                                /* type="search" 의 기본 동작과 같습니다. 제어 입력이라 직접 처리합니다 */
                                if (event.key === 'Escape' && inputValue) {
                                    event.preventDefault();
                                    setInputValue('');
                                }
                            }}
                        />
                    </div>

                    {/*
                     * 검색 범위를 **항상** 노출합니다. 본문이 대상이 아니라는 사실을
                     * 사용자가 알 방법이 이것뿐입니다. `description` 은 41편 중 1편뿐이라
                     * 안내 문구에 넣지 않습니다 — 공짜로 포함하되 광고하지 않습니다(§3-1).
                     */}
                    <p className={styles.search_scope} id={searchHintId}>
                        {SEARCH_SCOPE_HINT}
                    </p>
                </form>

                <div className={styles.controls}>
                    <CategoryChips
                        selected={params.category}
                        buildHref={category => hrefFor({ category })}
                    />
                    <SortSegment
                        selected={params.sort}
                        buildHref={sort => hrefFor({ sort })}
                    />
                </div>

                <AppliedConditions
                    query={committedQuery}
                    category={params.category}
                    clearQueryHref={hrefFor({ q: '' })}
                    clearCategoryHref={hrefFor({ category: null })}
                />

                <div className={styles.list_header} ref={listHeaderRef}>
                    <p className={styles.summary}>
                        {/* `➜`(U+279C)는 Galmuri 서브셋에 없습니다. `▸`(U+25B8)로 통일합니다 (STEP 1 §4-7) */}
                        <span className={styles.prompt} aria-hidden="true">
                            ▸
                        </span>
                        {summary}
                    </p>

                    {totalPages > 1 && (
                        <p className={styles.progress}>{`${currentPage} / ${totalPages}`}</p>
                    )}
                </div>

                {/*
                 * 🔴 눈에 보이는 헤더와 분리된 알림 영역입니다.
                 *    헤더 자체를 aria-live 로 만들면 즉시 갱신되는 결과 수가
                 *    **타이핑마다** 낭독을 끊습니다. 여기는 committedQuery 기준이라
                 *    사용자가 입력을 멈춘 뒤 한 번만 발화합니다.
                 *    `▸` 같은 장식 기호는 이 영역에 넣지 않습니다(WRITING_GUIDE §7.4).
                 */}
                <div className="sr-only" aria-live="polite" aria-atomic="true">
                    {announcement}
                </div>

                {visiblePosts.length > 0 ? (
                    <ul
                        className={styles.list}
                        /*
                         * key 를 바꿔 목록이 갈릴 때마다 재진입 애니메이션이 돕니다.
                         * "목록이 바뀌었다"의 유일한 시각 신호이고, 저감 모드에서는
                         * CSS 가 이 애니메이션을 제거합니다(§9-1 1번).
                         */
                        key={`${inputValue}|${params.category}|${params.sort}|${currentPage}`}
                    >
                        {visiblePosts.map(post => (
                            <PostRow key={post.slug} post={post} tokens={tokens} />
                        ))}
                    </ul>
                ) : (
                    <PostListEmpty
                        hasQuery={inputValue.trim().length > 0}
                        clearQueryHref={hrefFor({ q: '' })}
                    />
                )}

                {visiblePosts.length > 0 && (
                    <div className={styles.pagination}>
                        <Pagination
                            currentPage={currentPage}
                            totalPage={totalPages}
                            buildHref={page => hrefFor({ page })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Posts;
