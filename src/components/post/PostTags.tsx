import { useState } from 'react';
import styles from './PostTags.module.css';
import { POSTS } from '../../data/posts';
import { rankTags } from '../../utils/tags';
import { NAV_ITEMS } from '../../constants/site';

/**
 * 글 태그 — 최대 3개 + `+N`.
 * 명세: docs/handoff-step3-post.md §4-4 · WRITING_GUIDE §6.8
 *
 * 실데이터 최대 **15개**(2편)입니다.
 */

const VISIBLE_LIMIT = 3;

/**
 * `/tags` 라우트가 실재하는가. 지금은 `false` 입니다(STEP 6 소관).
 *
 * 🔴 이 값이 태그의 **모양까지** 정합니다. 확정 규칙이 「링크되는 태그는 칩
 *    (배경 + 테두리), 링크 안 되는 태그는 평문」이라, 라우트가 없으면 칩이
 *    하나도 없는 것이 맞습니다. 없는 곳으로 보내는 칩은 404 로 가는 함정이고,
 *    404 화면이 회복 경로를 감추는 것과 같은 이유입니다(NotFound.tsx).
 *    STEP 6 에서 site.ts 의 `isRouteReady` 만 true 로 바꾸면 살아납니다.
 */
const IS_TAG_ROUTE_READY: boolean =
    NAV_ITEMS.find(item => item.path === '/tags')?.isRouteReady ?? false;

/**
 * 2편 이상에서 쓰인 태그만 링크 대상입니다.
 *
 * 🔴 **1회성 태그가 37종**입니다(product.md §⑦). 그 태그로 이동하면 글이 딱
 *    한 편 있는 목록이 나오는데, 그건 사용자가 방금 보던 글입니다 — 누를 이유가
 *    없는 링크입니다. 모듈 로드 시 한 번 집계합니다.
 */
const LINKABLE_TAGS = new Set(
    rankTags(POSTS)
        .filter(tag => tag.count >= 2)
        .map(tag => tag.label),
);

function isTagLinkable(tag: string): boolean {
    return IS_TAG_ROUTE_READY && LINKABLE_TAGS.has(tag);
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
                     * 🔴 링크가 아닌 태그는 `<span>` 이고 호버 커서를 바꾸지
                     *    않습니다. 그리고 **모양으로 구분**합니다 — 커서에만
                     *    의존하면 터치 기기에서 눌러 보기 전까지 알 수 없습니다.
                     * 태그 문자열은 글에 적힌 **원문 그대로**입니다(대소문자 변경 금지).
                     */}
                    <span className={styles.tag} data-linkable={isTagLinkable(tag) ? 'true' : undefined}>
                        {/* `#` 는 장식입니다 */}
                        <span className={styles.hash} aria-hidden="true">
                            #
                        </span>
                        {tag}
                    </span>
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
