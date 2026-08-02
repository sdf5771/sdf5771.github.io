import { Link } from 'react-router-dom';
import styles from './TagChipList.module.css';
import { INDEXED_TAGS } from '../../data/tags';
import { TAG_INDEX_PATH } from '../../constants/site';

/**
 * 노출 개수 **6개**. 시안은 8개였습니다.
 * 인지 부하를 줄이고, `전체 태그 보기` 가 27종 전체 경로를 이미 제공합니다(§7-2 3).
 */
const CHIP_LIMIT = 6;

/**
 * `자주 쓰는 태그` 칩 줄 — `/tags/:tag` 상단.
 * 명세: docs/handoff-step6-tags-archive.md §7-2 · §5-4
 *
 * 🔴 라벨 없는 칩 줄은 무엇인지 알 수 없습니다(시안 수정 2). `자주 쓰는 태그` 는
 *    STEP 1 §6-4·§9 가 이미 확정한 문구이고 같은 데이터(빈도 상위)를 씁니다.
 *
 * **왜 「관련 태그」가 아닌가** — 공동 출현을 실측했습니다. `Python` → `CodingTest`
 * **1종뿐**, `CodingTest` → `Python` **1종뿐**, `Hooks` → `React` **1종뿐**입니다.
 * 가장 큰 태그 두 개에서 칩이 하나만 나옵니다. 반대로 `AR`·`WebXR` 은 14종이
 * 나오는데 전부 같은 한 글에서 나온 것입니다. **41편 규모에서 공동 출현은 정보가
 * 아닙니다.** 빈도 상위 고정이 실데이터에서 유일하게 항상 채워지는 규칙입니다.
 *
 * 여기 칩은 **전부 링크**입니다 — 인덱스 27종에서만 뽑으므로 §5-2 의 링크/평문
 * 구분이 발생하지 않습니다. 1회성 태그 페이지에서도 이 줄이 유일한 탈출로라
 * 그대로 노출합니다(§4-3).
 */
function TagChipList({ currentSlug }: { currentSlug: string }) {
    const chips = INDEXED_TAGS.filter(tag => tag.slug !== currentSlug).slice(0, CHIP_LIMIT);

    if (chips.length === 0) {
        return null;
    }

    return (
        <nav className={styles.root} aria-label="자주 쓰는 태그">
            <p className={styles.label}>자주 쓰는 태그</p>

            <ul className={styles.chips}>
                {chips.map(tag => (
                    <li key={tag.slug}>
                        <Link
                            className={styles.chip}
                            to={`${TAG_INDEX_PATH}/${tag.slug}`}
                            aria-label={`${tag.name} 태그, 글 ${tag.count}편`}
                        >
                            <span className={styles.hash} aria-hidden="true">
                                #
                            </span>
                            <span aria-hidden="true">{tag.name}</span>
                            <span className={styles.count} aria-hidden="true">
                                {tag.count}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default TagChipList;
