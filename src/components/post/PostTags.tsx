import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PostTags.module.css';
import { LINKABLE_TAG_SLUGS } from '../../data/tags';
import { toTagSlug } from '../../utils/tags';
import { IS_TAG_ROUTE_READY, TAG_INDEX_PATH } from '../../constants/site';

/**
 * 글 태그 — 최대 3개 + `+N`.
 * 명세: docs/handoff-step3-post.md §4-4 · docs/handoff-step6-tags-archive.md §5
 *       · WRITING_GUIDE §6.8
 *
 * 실데이터 최대 **15개**(2편)입니다.
 *
 * 🔴 링크되는 태그와 안 되는 태그를 **모양으로 구분**합니다(STEP 6 §5-2).
 *
 * | | 링크(2회 이상) | 비링크(1회성) |
 * |---|---|---|
 * | 요소 | `<a href="/tags/<slug>">` | `<span>` |
 * | 배경·테두리 | 있음 (칩) | **없음** (평문) |
 * | 호버 | 배경·테두리·글자색 전환 | **없음.** 커서도 바꾸지 않음 |
 *
 * 현행 STEP 3 계약은 두 태그를 「호버 시 커서 모양」 하나로만 갈랐습니다.
 * **정지 상태에서는 구분이 불가능하고, 터치 기기에는 호버 자체가 없습니다.**
 * 실측하면 **29%의 글에서 링크·비링크가 섞이고, 24%는 노출되는 앞 3개 안에서
 * 섞이며, 10%(4편)는 태그 줄 전체가 안 눌립니다.** 일부만 눌리는 칩 줄은
 * 고장으로 읽힙니다.
 *
 * 모양으로 나누면 ①사이트 전체에 「칩 = 누를 수 있는 것」이라는 규칙 하나가
 * 생기고 ②배경·테두리의 유무는 색맹·저시력·흑백 인쇄에서도 살아남으며
 * ③정지 상태·터치 기기에서 동작하고 ④"왜 이건 안 눌리나요" 라는 질문 자체가
 * 생기지 않아 추가 카피가 필요 없습니다.
 * (색만 바꾸는 안은 WRITING_GUIDE §7.5 색 단독 의존 금지에 걸립니다.)
 */

const VISIBLE_LIMIT = 3;

/**
 * 링크 대상인가.
 *
 * 판정은 **slug** 로 합니다 — 원문 표기로 비교하면 `Javascript`/`JavaScript` 가
 * 갈려 같은 태그가 어떤 글에서는 칩, 어떤 글에서는 평문이 됩니다.
 *
 * 🔴 `IS_TAG_ROUTE_READY` 가 이 판정의 앞에 있습니다. 라우트가 없으면 칩이
 *    하나도 없는 것이 맞습니다 — 없는 곳으로 보내는 칩은 404 로 가는 함정입니다.
 *
 * 🔴 인덱스에 없는 1회성 태그는 링크하지 않습니다. 그 페이지는 **존재하지만**
 *    (직접 주소를 치면 열립니다, §4-2) 링크로 보내면 사용자를 인덱스로 되돌릴
 *    방법이 없고, 도착해서 보는 글 한 편은 방금 보던 그 글입니다.
 */
function isTagLinkable(tag: string): boolean {
    return IS_TAG_ROUTE_READY && LINKABLE_TAG_SLUGS.has(toTagSlug(tag));
}

export default function PostTags({ tags }: { tags: string[] }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (tags.length === 0) {
        return null;
    }

    const visible = isExpanded ? tags : tags.slice(0, VISIBLE_LIMIT);
    const hiddenCount = tags.length - VISIBLE_LIMIT;

    return (
        <ul className={styles.tags}>
            {visible.map(tag => (
                <li key={tag}>
                    {/*
                     * 태그 문자열은 글에 적힌 **원문 그대로**입니다 —
                     * 대소문자 변경 금지(WRITING_GUIDE §6.8). 인덱스·태그 페이지의
                     * **대표 표기**는 집계 화면에만 적용되는 별개 규칙입니다(§3-4).
                     * 링크 주소만 slug 로 정규화됩니다.
                     */}
                    {isTagLinkable(tag) ? (
                        <Link
                            className={styles.tag}
                            data-linkable="true"
                            to={`${TAG_INDEX_PATH}/${toTagSlug(tag)}`}
                        >
                            <span className={styles.hash} aria-hidden="true">
                                #
                            </span>
                            {tag}
                        </Link>
                    ) : (
                        <span className={styles.tag}>
                            <span className={styles.hash} aria-hidden="true">
                                #
                            </span>
                            {tag}
                        </span>
                    )}
                </li>
            ))}

            {hiddenCount > 0 && (
                <li>
                    <button
                        type="button"
                        className={styles.more}
                        /* 확정 카피 — 펼치기 전 `태그 N개 더 보기`, 펼친 뒤 `접기`(§6.8) */
                        aria-label={isExpanded ? '접기' : `태그 ${hiddenCount}개 더 보기`}
                        aria-expanded={isExpanded}
                        onClick={() => setIsExpanded(current => !current)}
                    >
                        {isExpanded ? '접기' : `+${hiddenCount}`}
                    </button>
                </li>
            )}
        </ul>
    );
}
