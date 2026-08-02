import { Link } from 'react-router-dom';
import styles from './TagCard.module.css';
import TagStrand from './TagStrand';
import { TAG_INDEX_PATH } from '../../constants/site';
import type { TagSummary } from '../../utils/tags';

/** 크기 티어 경계. 카드 크기는 3단계뿐이고 정확한 빈도는 가닥·숫자가 맡습니다 */
const LARGE_TIER_MIN = 10;
const MEDIUM_TIER_MIN = 5;

function tierOf(count: number): 'large' | 'medium' | 'small' {
    if (count >= LARGE_TIER_MIN) {
        return 'large';
    }

    return count >= MEDIUM_TIER_MIN ? 'medium' : 'small';
}

/**
 * 태그 인덱스의 카드 한 장.
 * 명세: docs/handoff-step6-tags-archive.md §6-1 · §10-2
 *
 * | 티어 | 조건 | 열 | 이름 크기 |
 * |---|---|:--:|---|
 * | 대 | `count ≥ 10` (2종) | `span 2` | 33px |
 * | 중 | `count ≥ 5` (3종) | `span 2` | 22px |
 * | 소 | 그 외 (22종) | `span 1` | 22px |
 *
 * 태그명은 실데이터가 **전부 라틴**이라 Galmuri11 22/33px 이 픽셀 서체 규칙
 * (STEP 1 §3-3a)을 통과합니다. 수는 GalmuriMono11 **11px** 입니다 — 숫자뿐이라
 * 통과하며, 시안의 12px 은 11의 정수배가 아니라 위반입니다(§9-2 12번).
 */
function TagCard({ tag }: { tag: TagSummary }) {
    return (
        <li className={styles.cell} data-tier={tierOf(tag.count)}>
            <Link
                className={styles.card}
                to={`${TAG_INDEX_PATH}/${tag.slug}`}
                /*
                 * 🔴 **보이는 텍스트로 시작**합니다(WRITING_GUIDE §7.3).
                 *    `#` 와 가닥은 aria-hidden 이라 이름이 없으면 접근 가능한
                 *    이름이 `React 14` 가 되어 14가 무엇인지 알 수 없습니다.
                 *    수량사는 세는 대상을 따릅니다 — 여기서 세는 것은 글이라 `편`.
                 */
                aria-label={`${tag.name} 태그, 글 ${tag.count}편`}
            >
                <span className={styles.head}>
                    <span className={styles.name}>
                        <span className={styles.hash} aria-hidden="true">
                            #
                        </span>
                        {tag.name}
                    </span>
                    <span className={styles.count} aria-hidden="true">
                        {tag.count}
                    </span>
                </span>

                <TagStrand count={tag.count} />
            </Link>
        </li>
    );
}

export default TagCard;
