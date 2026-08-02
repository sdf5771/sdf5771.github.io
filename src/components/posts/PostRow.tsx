import { Link } from 'react-router-dom';
import styles from './PostRow.module.css';
import PostGlyph from './PostGlyph';
import HighlightedText from './HighlightedText';
import type { PostMetadata } from '../../types';
import { hasTokenMatch, orderKeywordsForQuery } from '../../utils/postSearch';
import { formatPostDate, formatReadingMinutes, isNewPost } from '../../utils/postMeta';
import { toTagSlug } from '../../utils/tags';

/** 노출 태그 3개 + `+N` (WRITING_GUIDE §6.8). 3개 초과 글은 41편 중 9편, 최대 `+12` */
const VISIBLE_TAG_COUNT = 3;

/**
 * 현재 태그를 노출 3개 안으로 끌어올립니다 (STEP 6 §7-1 ① 부수 규칙).
 *
 * 검색어 승격(`orderKeywordsForQuery`)과 **같은 규칙, 다른 트리거**입니다.
 * `slug` 가 없으면(= `/posts`) 입력을 그대로 돌려주므로 기존 화면의 순서는
 * 한 글자도 바뀌지 않습니다.
 */
function orderKeywordsForCurrentTag(
    keywords: readonly string[],
    slug: string | undefined,
): string[] {
    if (!slug) {
        return [...keywords];
    }

    const matched: string[] = [];
    const rest: string[] = [];

    for (const keyword of keywords) {
        (toTagSlug(keyword) === slug ? matched : rest).push(keyword);
    }

    return [...matched, ...rest];
}

interface PostRowProps {
    post: PostMetadata;
    /** 검색어 토큰. 제목·태그·카테고리 강조와 태그 승격에 씁니다 */
    tokens: readonly string[];
    /**
     * 제목 헤딩 레벨.
     *
     * 목록 화면(`/posts`)은 `h1 글` 아래 바로 행이 오므로 2 입니다.
     * 홈은 `h1 김섭우 → h2 최근 글 → 행` 이라 3 이어야 합니다 — 2 로 두면
     * 스크린리더의 헤딩 목록에서 「최근 글」 섹션 경계가 사라지고, 행 제목이
     * 「읽어볼 만한 글」과 같은 층에 놓입니다.
     */
    headingLevel?: 2 | 3;
    /**
     * 🔴 `/tags/:tag` 전용 — **지금 보고 있는 태그**의 slug.
     * 명세: docs/handoff-step6-tags-archive.md §7-1 ①
     *
     * 해당 칩에 검색어 일치 태그와 **완전히 같은 시각 처리**를 겁니다(트리거만
     * 다릅니다). 그리고 §3-6 규칙 3(숨은 일치 태그 승격)을 함께 적용해 **노출
     * 3개 밖에 있으면 앞으로 끌어올립니다** — 없으면 `/tags/naver` 에서 태그
     * 15개짜리 글의 노출 3개에 `Naver` 가 안 보여 "왜 이 글이 여기 있나"가 됩니다.
     */
    highlightTagSlug?: string;
    /**
     * 96×64 생성 그래픽 슬롯을 렌더할지.
     *
     * ⚠️ **모바일 제거는 CSS 가 이미 합니다**(PostRow.module.css ≤767px).
     *    JS 로 뷰포트를 읽어 분기하면 첫 렌더가 항상 데스크톱 기준이라 슬롯이
     *    한 프레임 그려졌다 사라지고, 프리렌더 HTML 과도 어긋납니다.
     *    이 prop 은 **뷰포트와 무관하게** 슬롯 자체를 쓰지 않는 호출부를 위한
     *    것이며, 기본값은 STEP 4 확정대로 `true` 입니다.
     */
    showThumbnail?: boolean;
}

/**
 * 글 목록의 한 행.
 * 명세: docs/handoff-step4-list.md §5-1 · §5-3 · §10-2
 *
 * 카드가 아니라 행인 이유 (전부 실측)
 * -----------------------------------
 *  - 요약(description)이 **41편 중 1편**뿐입니다. 카드의 설명 블록은 40편에서
 *    `객체 Object 타입 원시 타입을 제외한 모든 것` 같은 자동 추출 파편이 됩니다.
 *  - 제목 최장 96자. 카드 폭(약 353px)에서는 7행이라 클램프로 잘리는데, 행은
 *    제목에 740px 를 몰아줄 수 있어 **96자가 2행에 전부 들어갑니다.**
 *  - 20개가 한 화면 흐름에 담깁니다. 카드 3열은 같은 높이에 9개입니다.
 *
 * 🔴 행에 요약을 넣지 않습니다. 40/41 이 기계 추출 파편이라 신뢰할 수 없는
 *    정보를 매 행에 노출하게 되고, 행 높이가 102 → 92px 로 내려갑니다.
 *    요약은 글 상세(STEP 3)와 홈 선별 카드(STEP 2)에서만 씁니다.
 */
function PostRow({
    post,
    tokens,
    headingLevel = 2,
    highlightTagSlug,
    showThumbnail = true,
}: PostRowProps) {
    /*
     * 🔴 일치한 태그를 앞으로 끌어올립니다. `browser`·`hooks` 는 결과 3건 전부
     *    제목에 일치 문자열이 없어 **태그가 유일한 근거**인데, 그게 4번째 이후에
     *    있으면 그 행은 영구히 이유 불명이 됩니다(§3-6).
     *
     * 태그 페이지에서는 트리거가 검색어가 아니라 **현재 태그**입니다. 같은 규칙을
     * slug 기준으로 한 번 더 겁니다 — `keywords[i]` 와 `tagSlugs[i]` 는 빌드가
     * 길이·순서를 보장합니다(STEP 6 §3-6①).
     */
    const orderedKeywords = orderKeywordsForCurrentTag(
        orderKeywordsForQuery(post.keywords, tokens),
        highlightTagSlug,
    );
    const visibleKeywords = orderedKeywords.slice(0, VISIBLE_TAG_COUNT);
    const hiddenCount = orderedKeywords.length - visibleKeywords.length;

    /** 이 원문 표기가 지금 보고 있는 태그인가. 원문이 아니라 slug 로 비교합니다 */
    const isCurrentTag = (keyword: string): boolean =>
        highlightTagSlug !== undefined && toTagSlug(keyword) === highlightTagSlug;

    const isCategoryMatched = hasTokenMatch(post.category, tokens);
    const isNew = isNewPost(post.date);
    const Heading = headingLevel === 3 ? 'h3' : 'h2';

    return (
        <li className={styles.row} data-category={post.category}>
            {/* 데스크톱·태블릿 전용. 모바일에서는 좌측 3px 카테고리 바가 대신합니다 */}
            {showThumbnail && (
                <PostGlyph className={styles.glyph} slug={post.slug} category={post.category} />
            )}

            <div className={styles.body}>
                <Heading className={styles.heading}>
                    {/*
                     * 🔴 링크는 **제목만** 감쌉니다. 행 전체를 <a> 로 감싸면
                     *    접근 가능한 이름에 카테고리·날짜·읽기 시간·태그가 전부
                     *    섞여 들어가, 스크린리더의 링크 목록에서 글을 구분할 수
                     *    없게 됩니다(§10-2 — 이름은 글 제목이어야 합니다).
                     *    행 전체를 누를 수 있게 하는 것은 아래 ::after 가 맡습니다
                     *    (PostRow.module.css `.link::after`).
                     *
                     * 경로는 `/posts/<slug>` 입니다. 구 경로 `/post?id=` 는
                     * 프로덕션에서 404 를 반환하며 리다이렉트로만 남아 있습니다.
                     */}
                    <Link className={styles.link} to={`/posts/${post.slug}`}>
                        {/*
                         * NEW 는 실제 정보이므로 낭독되게 둡니다(aria-hidden 아님).
                         * 지금은 한 편도 해당하지 않으며, **배지가 없는 상태가 기본
                         * 레이아웃**입니다 — 자리를 미리 비워 두지 않습니다(§8-7).
                         */}
                        {isNew && <span className={styles.badge}>NEW</span>}
                        <HighlightedText text={post.title} tokens={tokens} />
                    </Link>
                </Heading>

                {orderedKeywords.length > 0 && (
                    <ul className={styles.tags}>
                        {visibleKeywords.map(keyword => (
                            <li
                                key={keyword}
                                className={styles.tag}
                                /*
                                 * 🔴 행 안의 태그 칩은 `/posts`·`/tags/:tag` 모두
                                 *    **영구히 `<span>`** 입니다(STEP 6 §7-3 — STEP 4
                                 *    §14-4 의 미결 항목을 여기서 종결합니다).
                                 *    행 전체가 `<a>` 라 중첩 링크는 무효 HTML 이고,
                                 *    행 링크를 풀어 개별 링크로 만들면 탭 스톱이
                                 *    16행 기준 80개가 됩니다. 태그 이동은 `/tags`
                                 *    인덱스와 상단 `자주 쓰는 태그` 칩이 전담합니다.
                                 *    커서·호버 효과를 주지 마세요.
                                 */
                                data-matched={
                                    hasTokenMatch(keyword, tokens) || isCurrentTag(keyword)
                                        ? 'true'
                                        : undefined
                                }
                            >
                                <span className={styles.tag_hash} aria-hidden="true">
                                    #
                                </span>
                                <HighlightedText text={keyword} tokens={tokens} />
                            </li>
                        ))}

                        {hiddenCount > 0 && (
                            <li className={styles.tag_more}>
                                {/* 보이는 텍스트(`+12`)만으로는 뜻이 안 통해 이름을 따로 줍니다 */}
                                <span aria-hidden="true">{`+${hiddenCount}`}</span>
                                <span className="sr-only">{`태그 ${hiddenCount}개 더 보기`}</span>
                            </li>
                        )}
                    </ul>
                )}
            </div>

            {/* 형식 고정: 카테고리 · 날짜 · 읽기 시간 (WRITING_GUIDE §6.7). 저자 표시 금지 */}
            <p className={styles.meta}>
                <span className={styles.category} data-matched={isCategoryMatched ? 'true' : undefined}>
                    {/* 카테고리는 색 점 + 텍스트 라벨 병기. 색 단독 전달 금지(§7.5) */}
                    <span className={styles.category_dot} aria-hidden="true" />
                    <HighlightedText text={post.category} tokens={tokens} />
                </span>

                {/*
                 * 읽기 시간이 비면(값 누락) `·` 구분자까지 함께 빠집니다 —
                 * `2023.04.13 · ` 처럼 꼬리가 남으면 안 됩니다(postMeta.ts 주석)
                 */}
                <span className={styles.meta_detail}>
                    {[formatPostDate(post.date), formatReadingMinutes(post.readingMinutes)]
                        .filter(Boolean)
                        .join(' · ')}
                </span>

                {/* 호버 시 나타나는 장식. 방향만 말하고 정보는 없습니다 */}
                <span className={styles.arrow} aria-hidden="true">
                    →
                </span>
            </p>
        </li>
    );
}

export default PostRow;
