import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
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
import { ARCHIVE_LABEL, ARCHIVE_PATH, POST_LIST_PATH } from '../../constants/site';
import {
    SEARCH_PLACEHOLDER,
    SEARCH_SCOPE_HINT,
    SEARCH_SUBMIT_LABEL,
} from '../../constants/search';
import { matchesTokens, tokenizeQuery } from '../../utils/postSearch';
import {
    buildPostListSearch,
    clampPage,
    parsePostListQuery,
    sortPosts,
    POST_SORT_OPTIONS,
    POSTS_PER_PAGE,
} from '../../utils/postListQuery';
import type { PostListQuery, PostSortOrder } from '../../utils/postListQuery';

/**
 * 목록 헤더가 쓰는 정렬 라벨. 🔴 문자열을 여기 다시 적지 않습니다 —
 * 세그먼트 컨트롤과 헤더 에코가 다른 말을 하면 안 되므로 정의처는
 * `POST_SORT_OPTIONS` 하나입니다.
 */
const SORT_LABEL = Object.fromEntries(
    POST_SORT_OPTIONS.map(option => [option.value, option.label]),
) as Record<PostSortOrder, string>;

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
 *
 * 🔴 **검색은 커밋 기반입니다**(§3-8, 2026-08-02 정정).
 *    타이핑은 입력창의 글자만 바꾸고 목록·조건 바·헤더 요약·URL·스크린리더
 *    안내는 아무것도 바꾸지 않습니다. **URL 의 `q` 가 유일한 진실의 원천**이고
 *    그 여섯이 전부 거기서 파생되므로 타이밍을 맞추는 코드가 필요 없습니다.
 *    헤더 ⌘K(`HeaderSearch` · `SearchPanel`)는 처음부터 이 방식이었고, 이
 *    화면만 어긋나 있었습니다 — 이건 새 방식의 도입이 아니라 정합입니다.
 */
function Posts() {
    const location = useLocation();
    const navigate = useNavigate();
    const navigationType = useNavigationType();

    const params = useMemo(
        () => parsePostListQuery(location.search, CATEGORY_NAMES),
        [location.search],
    );

    /*
     * 🔴 입력창의 글자, **그것뿐**입니다(§3-8-1).
     *
     * 목록·조건 바·헤더 요약·`aria-live` 는 이 값을 보지 않습니다. 전부 URL 의
     * `q` 하나에서 파생되고, 이 값은 사용자가 **커밋할 때**(Enter·검색 버튼·
     * 입력 비우기)만 그리로 넘어갑니다. `committedQuery` 같은 중간 state 를
     * 두지 않는 이유가 이것입니다 — 같은 사실을 두 곳에 두면 어긋나고, 직전
     * 구현의 250ms 창이 정확히 그 어긋남이었습니다(리스트는 14편인데 조건
     * 바는 "검색 없음").
     */
    const [inputValue, setInputValue] = useState(params.q);
    /*
     * 🔴 우리가 마지막으로 URL 에 쓴 검색어. 없으면 아래 효과가 커밋을 덮습니다.
     *    - 우리가 쓴 값이 URL 에서 되돌아왔을 때(에코) 입력을 다시 세팅하면,
     *      커밋 직후 사용자가 이어서 친 글자가 지워집니다.
     *    - 반대로 뒤로가기처럼 **밖에서** 바뀐 값은 반드시 입력에 반영해야 합니다.
     *    두 경우를 구분하는 유일한 방법이 "내가 쓴 값인가"입니다(§3-8-5).
     */
    const writtenQueryRef = useRef(params.q);

    /*
     * URL → 입력 (뒤로가기·헤더 ⌘K 진입·공유 링크·최초 로드).
     *
     * 뒤로가기가 **미확정 입력을 이깁니다.** 히스토리 이동은 사용자가 명시적으로
     * 요청한 것이고, 결과 화면(`q=react`)과 입력창(`reactq`)이 다르면 입력창이
     * 거짓말을 합니다. 입력창은 "URL 의 편집 중인 사본"이라 원본이 바뀌면 새로
     * 뜹니다(§3-8-5).
     */
    useEffect(() => {
        if (params.q === writtenQueryRef.current) {
            return;
        }

        writtenQueryRef.current = params.q;
        setInputValue(params.q);
    }, [params.q]);

    /* ---------------------------------------------------------------
     * 파생 — 표시목록 = 정렬( 카테고리필터( 검색필터( 전체 41개 ) ) )
     * 검색과 카테고리는 AND 입니다. 정렬은 결과 집합에만 작용합니다(§3-5).
     *
     * 🔴 입력은 **URL 의 `q` 뿐**입니다(§3-7). 하이라이트 토큰도 같은 값에서
     *    뽑습니다 — 결과와 강조가 다른 값을 보면 안 됩니다.
     * ------------------------------------------------------------- */
    const tokens = useMemo(() => tokenizeQuery(params.q), [params.q]);

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
     * 🔴 클램프는 **렌더 이후가 아니라 여기서** 합니다. `?page=99` 로 들어와
     *    빈 목록이 한 프레임 그려진 뒤 고쳐지면 깜빡임이 보입니다(§4-4).
     *
     * 직전 구현의 `isQueryPending` 임시 클램프는 제거했습니다 — 입력과 `q` 가
     * 갈리는 250ms 창이 없어져 존재 이유가 사라졌습니다(§13-1).
     */
    const currentPage = clampPage(params.page, totalPages);

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
                q: params.q,
                category: params.category,
                sort: params.sort,
                page: currentPage,
            }),
        [location.search, params.q, params.category, params.sort, currentPage],
    );

    useEffect(() => {
        if (canonicalSearch === location.search) {
            return;
        }

        /*
         * `replace` 입니다. 여기서 하는 일은 **잘못된 파라미터 교정뿐**이고
         * (`?page=99` → 3, `?category=study` → `Study`, `?q=` 제거) 사용자가 한
         * 일이 아니므로 히스토리에 남기지 않습니다. 검색 실행·칩·정렬·페이지는
         * 명시적 조작이라 `push` 로 쌓입니다(§4-3).
         */
        navigate({ search: canonicalSearch }, { replace: true });
    }, [canonicalSearch, location.search, navigate]);

    /* ---------------------------------------------------------------
     * 주소 만들기 — 조건이 바뀌면 page 는 1로
     * ------------------------------------------------------------- */
    const hrefFor = (patch: Partial<PostListQuery>): string => {
        const next: PostListQuery = {
            q: params.q,
            category: params.category,
            sort: params.sort,
            page: 1,
            ...patch,
        };

        return `${POST_LIST_PATH}${buildPostListSearch(location.search, next)}`;
    };

    /* ---------------------------------------------------------------
     * 🔴 커밋 — 검색을 실행하는 **유일한** 경로 (§3-8-2)
     * -------------------------------------------------------------
     * 트리거는 셋뿐입니다: 폼 제출(Enter)·검색 버튼·입력 비우기.
     * blur 와 디바운스 자동 커밋은 반려입니다 — 전자는 검색 버튼을 누르러
     * 입력을 벗어나는 순간 이중 실행이고, 후자는 그게 곧 라이브 필터입니다.
     * ------------------------------------------------------------- */
    const commitSearch = (nextQuery: string) => {
        /* 조건이 바뀌면 page 는 1로(§4-3). 카테고리·정렬은 그대로 둡니다 */
        const search = buildPostListSearch(location.search, {
            q: nextQuery,
            category: params.category,
            sort: params.sort,
            page: 1,
        });

        /*
         * 공백뿐인 검색어는 URL 에서 키가 통째로 빠지므로(§4-2), 되돌아올 `q` 는
         * 빈 문자열입니다. 그 값을 적어 둬야 위 URL→입력 효과가 "내가 쓴 값"으로
         * 알아봅니다.
         */
        writtenQueryRef.current = nextQuery.trim() ? nextQuery : '';

        /*
         * 실행은 `push` 입니다 — 카테고리·정렬·페이지와 같은 등급의 명시적
         * 조작이고, 뒤로가기 1회로 직전 검색어(또는 전체 목록)로 돌아갑니다.
         * 단 **같은 검색어를 다시 실행**하면 결과가 같은데 히스토리만 늘어나므로
         * `replace` 입니다(§4-3).
         */
        navigate({ search }, { replace: search === location.search });
    };

    /*
     * 입력 변경. 🔴 **비우는 순간만** 커밋합니다(§3-8-4).
     *
     * 「지우기」는 부분 입력이 아니라 그 자체로 완결된 명시 행동이라 확정할 것이
     * 남아 있지 않습니다. 빈 상태의 `검색어 지우기` 액션이 이미 Enter 없이 즉시
     * 전체로 돌아가는데, 같은 결과에 두 가지 조작 규칙을 둘 수는 없습니다.
     * 공백만 남은 경우도 빈 것으로 취급합니다(§3-2 트림 규칙과 동일).
     */
    const handleInputChange = (value: string) => {
        setInputValue(value);

        if (!value.trim() && params.q) {
            commitSearch('');
        }
    };

    /* ---------------------------------------------------------------
     * 🔴 스크롤 (§4-5 · §4-6-3) — 클램프를 없애는 게 아니라 **목적지를 뺏습니다**
     * -------------------------------------------------------------
     * 결과가 줄면 문서가 짧아지고, 문서 높이가 `scrollY + innerHeight` 아래로
     * 내려가면 브라우저가 스크롤을 강제로 끌어올립니다. `scrollTo` 를 한 번도
     * 부르지 않아도 화면이 튀고(모바일 실측 −1,224px), 이동량은 *결과가 얼마나
     * 줄었는지*가 아니라 *사용자가 어디를 보고 있었는지*로 정해집니다. 매번
     * 크기가 다른 이동은 피드백이 아니라 잡음입니다.
     *
     * 🔴 **`useLayoutEffect` 이고 순서가 전부입니다.** 페인트 전에 우리가 먼저
     *    목적지를 지시하면 브라우저 클램프가 **같은 방향·같은 목적지**가 되어
     *    하나의 이동으로 보입니다. 순서가 뒤집히면 클램프가 먼저 튀고 그 위에
     *    우리 스크롤이 겹쳐 화면이 **두 번** 움직입니다.
     *
     * 검색 실행은 카테고리·정렬과 **구별할 이유가 없는 명시적 조작**이므로 같은
     * 키를 씁니다 — `q` 를 추가하는 것이 이 장치의 최소 형태입니다(§13-1).
     * 타이핑은 `q` 를 건드리지 않으니 여기에 걸리지 않습니다.
     * 뒤로가기(POP)는 브라우저 기본 복원에 맡깁니다.
     * ------------------------------------------------------------- */
    const listHeaderRef = useRef<HTMLDivElement>(null);
    const scrollKeyRef = useRef<string | null>(null);

    useLayoutEffect(() => {
        const key = `${params.q}|${params.category}|${params.sort}|${params.page}`;
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
    }, [params.q, params.category, params.sort, params.page, navigationType]);

    const searchHintId = 'post-search-scope';
    /*
     * 목록 헤더 요약과 `aria-live` 안내가 **같은 문자열**입니다.
     * 둘 다 URL 의 `q` 에서 파생되므로 결과 목록·조건 바와 자연히 같은 렌더에
     * 반영됩니다 — 타이밍을 맞추는 코드가 따로 필요 없고, 낭독은 **실행당 1회**
     * 입니다(§8-2a · §9-4). 디바운스는 라이브 필터가 만든 문제를 덮으려던
     * 장치였고, 그 문제가 없어졌습니다.
     */
    const summary = buildResultSummary(params.q, params.category, params.sort, sorted.length);

    return (
        <div className={styles.root}>
            <div className={styles.inner}>
                <h1 className={styles.title}>글</h1>

                {/*
                 * 🔴 **네이티브 폼 제출이 검색을 실행합니다**(§3-8-2).
                 *
                 * `onKeyDown` 으로 Enter 를 직접 잡지 마세요 — IME 조합 중의
                 * Enter(한글 확정)까지 삼켜 한국어 검색이 깨집니다. 이 사이트는
                 * 한국어 사이트이고, `<form>` 은 스크린리더에 검색 landmark 로도
                 * 노출됩니다.
                 */}
                <form
                    className={styles.search}
                    role="search"
                    onSubmit={event => {
                        /* 막지 않으면 폼이 페이지를 다시 불러 SPA 상태가 날아갑니다 */
                        event.preventDefault();
                        commitSearch(inputValue);
                    }}
                >
                    <div className={styles.search_row}>
                        <div className={styles.search_field}>
                            <SearchIcon className={styles.search_icon} />
                            <input
                                className={styles.search_input}
                                type="search"
                                /*
                                 * iOS·Android 키보드의 실행 키가 `검색` 으로 바뀝니다.
                                 * `type="search"` 단독으로는 보장되지 않습니다(§3-8-2).
                                 */
                                enterKeyHint="search"
                                value={inputValue}
                                aria-label="검색"
                                aria-describedby={searchHintId}
                                placeholder={SEARCH_PLACEHOLDER}
                                autoComplete="off"
                                onChange={event => handleInputChange(event.target.value)}
                                onKeyDown={event => {
                                    /*
                                     * 🔴 Enter 는 **잡지 않습니다.** 폼 제출에 맡깁니다 —
                                     *    여기서 가로채면 IME 조합 중 Enter(한글 확정)까지
                                     *    삼켜 한국어 검색이 깨집니다(§3-8-2).
                                     *
                                     * Escape 만 처리합니다. `type="search"` 의 기본 동작과
                                     * 같지만 제어 입력이라 직접 해야 합니다. 단 **조합 중
                                     * Escape 는 IME 취소**라 여기서 가로채면 조합만 물리려던
                                     * 사용자의 입력이 통째로 날아갑니다.
                                     */
                                    if (event.nativeEvent.isComposing) {
                                        return;
                                    }

                                    if (event.key === 'Escape' && inputValue) {
                                        event.preventDefault();
                                        /* 🔴 지워지는 즉시 전체 목록으로 갑니다(§3-8-4) */
                                        handleInputChange('');
                                    }
                                }}
                            />
                        </div>

                        {/*
                         * 🔴 `disabled` 상태를 만들지 않습니다(§3-8-3).
                         *    입력이 비었을 때 눌리면 `q` 를 지우고 전체 목록으로
                         *    가므로 **항상 유효한 동작**이고, 비활성으로 두면
                         *    "왜 안 눌리는지"를 알려줄 자리가 없습니다.
                         *
                         * 주 액션 색(`--color-accent-fill`)이 아닌 이유: 이 화면의
                         * 주 과업은 "글로 들어가는 것"이지 "검색 버튼을 누르는 것"이
                         * 아니고, 골드 채움은 빈 상태의 `검색어 지우기` 가 씁니다.
                         */}
                        <button className={styles.search_submit} type="submit">
                            {SEARCH_SUBMIT_LABEL}
                        </button>
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
                        options={POST_SORT_OPTIONS}
                        selected={params.sort}
                        buildHref={sort => hrefFor({ sort })}
                    />
                </div>

                {/*
                 * 🔴 **자리를 상시 예약하지 않습니다**(§8-2a). 조건 바는 `q` 뿐
                 *    아니라 카테고리로도 나타나므로, 예약하면 조건이 하나도 없는
                 *    기본 화면(41편) 상단에 68px 빈 띠가 늘 남습니다. mount 는
                 *    검색 실행과 같은 프레임이고 그 프레임에 위 명시 스크롤이
                 *    함께 일어나 독립된 튐으로 읽히지 않습니다.
                 *    높이 진입 애니메이션도 넣지 마세요 — 68px 가 한 번에 들어오는
                 *    편이 여러 프레임에 걸쳐 밀려 내려오는 것보다 방해가 적습니다.
                 */}
                <AppliedConditions
                    query={params.q}
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

                    <div className={styles.list_header_end}>
                        {totalPages > 1 && (
                            <p className={styles.progress}>{`${currentPage} / ${totalPages}`}</p>
                        )}

                        {/*
                         * `/archive` 로 가는 **유일한 진입 경로**입니다.
                         * GNB 4항목은 STEP 1 확정이라 늘리지 않습니다
                         * (docs/handoff-step6-tags-archive.md §1-1).
                         *
                         * 🔴 이 링크가 두 화면의 역할 분담을 그대로 말합니다 —
                         *    `/posts` 는 조건을 걸어 하나를 찾는 곳이고,
                         *    `/archive` 는 조건 없이 전체를 시기 순서로 훑는 곳입니다.
                         *    그래서 `/posts` 에 연도 필터를 넣지 않습니다(R-2).
                         */}
                        <Link className={styles.archive_link} to={ARCHIVE_PATH}>
                            {ARCHIVE_LABEL}
                        </Link>
                    </div>
                </div>

                {/*
                 * 🔴 눈에 보이는 헤더와 분리된 알림 영역입니다. 헤더 자체를
                 *    aria-live 로 만들면 낭독이 결과 수 갱신마다 끊깁니다.
                 *    `▸` 같은 장식 기호는 이 영역에 넣지 않습니다(WRITING_GUIDE §7.4).
                 */}
                <div className="sr-only" aria-live="polite" aria-atomic="true">
                    {summary}
                </div>

                {/*
                 * 🔴 결과 슬롯 (§4-6-4) — `<ul>`·빈 상태·페이저를 **함께** 감쌉니다.
                 *
                 * 셋이 형제로 있으면 각자 높이를 갖고, 교체할 때 그 차이가 그대로
                 * 문서 높이 변화가 됩니다. 페이저까지 안에 넣는 이유는 0건에서
                 * 통째로 사라져(약 72px) 그 소실분을 예약이 못 잡기 때문입니다.
                 * 하한만 공유하고 상한은 공유하지 않습니다 — 「검색 세션 동안 직전
                 * 높이를 유지」하면 14편 뒤의 0건과 처음부터의 0건이 다르게 보이고,
                 * 화면은 URL 만 보고 결정돼야 합니다(§4-1).
                 */}
                <div className={styles.results}>
                    {visiblePosts.length > 0 ? (
                        <ul
                            className={styles.list}
                            /*
                             * 재진입 애니메이션은 "목록이 바뀌었다"의 **유일한 시각
                             * 신호**라 목록이 바뀐 경우에만 재생돼야 합니다(§9-1 1번).
                             *
                             * 🔴 `inputValue` 를 넣지 마세요. 직전 구현이 그랬고,
                             *    결과가 하나도 안 바뀌어도 글자마다 `<ul>` 이
                             *    재마운트돼 6px 깜빡임이 재생됐습니다. 신호가 아무
                             *    때나 켜지면 신호가 아닙니다. `q` 는 커밋에서만
                             *    바뀌므로 자연히 **실행당 1회**가 됩니다.
                             */
                            key={`${params.q}|${params.category}|${params.sort}|${currentPage}`}
                        >
                            {visiblePosts.map(post => (
                                <PostRow key={post.slug} post={post} tokens={tokens} />
                            ))}
                        </ul>
                    ) : (
                        <PostListEmpty
                            hasQuery={params.q.trim().length > 0}
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
        </div>
    );
}

export default Posts;
