import { useEffect, useMemo } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import styles from './Tags.module.css';
import { TagCard } from '../../components/tags';
import { SortSegment } from '../../components/posts';
import { INDEXED_TAGS } from '../../data/tags';
import { TAG_INDEX_PATH } from '../../constants/site';
import {
    buildTagIndexSearch,
    parseTagIndexSort,
    type TagIndexSort,
} from '../../utils/tagListQuery';

/**
 * 정렬 옵션 — 시안의 티어 필터 칩 5개(`전체`/`10회 이상`/`5~9회`/`3~4회`/`2회`)를
 * **대체**합니다(§2-1b).
 *
 * 필터가 반려된 이유는 넷입니다. ①`10회 이상` 이 2장, `5~9회` 가 3장이라 6열
 * 그리드의 83%가 빈칸이 됩니다 ②주 과업이 "무엇을 다루는지 **한 화면에**" 인데
 * 필터는 그 한 화면을 지웁니다 ③27종은 데스크톱 6열 6행에 전부 들어가 줄일
 * 목록 자체가 없습니다 ④상태 표면이 `?tier=` 만큼 늘어 딥링크·프리렌더가
 * 5배가 됩니다.
 *
 * 정렬은 **항상 27장 전부**를 보여줍니다. 필터가 아니라서 화면이 비지 않습니다.
 */
const TAG_SORT_OPTIONS: ReadonlyArray<{ value: TagIndexSort; label: string }> = [
    { value: 'count', label: '빈도순' },
    { value: 'name', label: '이름순' },
];

/**
 * 태그 인덱스 `/tags`.
 * 명세: docs/handoff-step6-tags-archive.md §6 (토큰·셸은 handoff-step1-shell.md 가 최종 권위)
 *
 * 주 과업: **이 블로그가 무엇을 다루는지 한 화면에서 파악하고, 관심 있는 주제의
 * 글 목록으로 들어간다.**
 *
 * 🔴 수록 목록을 코드에 적지 않습니다. `tags-data.json` 에서 `count >= 2` 로
 *    거릅니다 — 시안의 `TAGS` 27종은 실데이터와 거의 다릅니다(`Zustand`·
 *    `Storybook`·`A11y`·`HTML`·`CSS`·`Git` 은 아예 없고 `AI`·`Chrome`·`JWT` 는
 *    1회성이며, 실제 2회 이상인 `Android XR`·`Vision Pro`·`AR`·`VR` 등 14종은
 *    빠져 있습니다). 데이터에서 파생시키면 이런 어긋남이 원천적으로 불가능합니다.
 */
function Tags() {
    const location = useLocation();
    const navigate = useNavigate();
    const sort = parseTagIndexSort(location.search);

    /*
     * URL 정규화 — 기본값은 키 자체를 뺍니다. `/tags?sort=count` 가 아니라
     * `/tags` 가 정규형입니다(§2-1b). `replace` 인 이유는 이 교정이 **사용자가
     * 한 일이 아니기 때문**입니다 — 히스토리에 남기면 뒤로가기가 같은 화면을
     * 두 번 거칩니다.
     */
    const canonicalSearch = buildTagIndexSearch(location.search, sort);

    useEffect(() => {
        if (canonicalSearch !== location.search) {
            navigate({ search: canonicalSearch }, { replace: true });
        }
    }, [canonicalSearch, location.search, navigate]);

    const tags = useMemo(() => {
        /* 빈도순은 빌드가 이미 `count` DESC → `slug` ASC 로 써 둔 순서 그대로입니다 */
        if (sort === 'count') {
            return INDEXED_TAGS;
        }

        /*
         * 이름순도 **결정론적이어야** 합니다. 대표 표기는 대소문자가 섞여 있어
         * (`CodingTest`·`Android XR`) 로케일 비교가 흔들릴 수 있으므로 slug 를
         * 2차 키로 둡니다. 두 정렬 모두 27장 전부를 냅니다 — 한 장도 사라지지
         * 않는 것이 필터가 아니라 정렬이라는 뜻입니다.
         */
        return [...INDEXED_TAGS].sort(
            (a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase()) ||
                a.slug.localeCompare(b.slug),
        );
    }, [sort]);

    const buildHref = (next: TagIndexSort): string =>
        `${TAG_INDEX_PATH}${buildTagIndexSearch(location.search, next)}`;

    /*
     * `/tags/` (후행 슬래시) → `/tags`. React Router 는 둘을 같은 라우트로 보지만
     * 주소는 그대로 남아 같은 화면에 URL 이 두 개 생깁니다(§4-2). 정규형은 하나입니다.
     */
    if (location.pathname !== TAG_INDEX_PATH) {
        return <Navigate to={`${TAG_INDEX_PATH}${location.search}`} replace />;
    }

    return (
        <div className={styles.root}>
            <div className={styles.inner}>
                <h1 className={styles.title}>태그</h1>

                {/*
                 * 🔴 27 을 문자열에 박지 않습니다. 글이 늘면 그 순간 틀립니다.
                 *    수량사는 세는 대상을 따릅니다 — 여기서 세는 것은 **태그**라
                 *    `개` 입니다(WRITING_GUIDE §3.4).
                 */}
                <p className={styles.description}>
                    {`2번 이상 등장한 태그 ${INDEXED_TAGS.length}개입니다.`}
                </p>

                {/*
                 * 🔴 시안은 `한 번만 쓰인 37종은…` 이었습니다. 숫자를 빼는 것이
                 *    확정입니다 — 36이라는 수는 사용자에게 의미가 없고, 숫자가
                 *    없으면 데이터가 바뀌어도 이 문장이 틀리지 않습니다(§2-3 수정 3).
                 *    그 태그들의 페이지가 **없다는 뜻이 아닙니다** — 존재하되
                 *    인덱스에 오르지 않을 뿐입니다(§4-2).
                 */}
                <p className={styles.note}>
                    한 번만 쓰인 태그는 글 안에 남아 있지만 여기서는 생략했습니다.
                </p>

                <div className={styles.controls}>
                    <SortSegment options={TAG_SORT_OPTIONS} selected={sort} buildHref={buildHref} />
                </div>

                {/*
                 * 빈 상태 분기를 만들지 않습니다 — 27종은 빌드 시 고정입니다(§6-4).
                 * 로딩·로드 실패 분기도 없습니다: 데이터가 번들에 들어 있어
                 * 비동기 단계 자체가 존재하지 않습니다(data/tags.ts).
                 */}
                <ul className={styles.grid}>
                    {tags.map(tag => (
                        <TagCard key={tag.slug} tag={tag} />
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Tags;
