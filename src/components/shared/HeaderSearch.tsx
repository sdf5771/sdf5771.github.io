import { useRef, useState } from 'react';
import styles from './HeaderSearch.module.css';
import SearchIcon from './SearchIcon';
import {
    SEARCH_EMPTY_DESCRIPTION_DESKTOP,
    SEARCH_EMPTY_TITLE,
    SEARCH_INITIAL_HINT,
    SEARCH_PLACEHOLDER,
} from '../../constants/search';

/**
 * 데스크톱(≥1024px) 인라인 검색.
 * 250px → 포커스 시 320px 로 확장되고, 결과는 입력 아래 드롭다운으로 나옵니다.
 *
 * ⚠️ **UI 껍데기입니다.** 실제 필터는 STEP 4에서 글 목록과 함께 붙습니다.
 *    지금은 도달 가능한 두 상태(빈 입력 = 초기 안내 / 입력 있음 = 0건)만 그립니다.
 */
function HeaderSearch() {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const panelId = 'header-search-panel';

    return (
        <div
            className={styles.search}
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsFocused(false);
                }
            }}
        >
            <div className={styles.field}>
                <SearchIcon className={styles.icon} />
                <input
                    className={styles.input}
                    ref={inputRef}
                    type="search"
                    value={query}
                    /* 헤더의 ⌘K 핸들러가 이 입력을 찾습니다 */
                    data-header-search-input
                    /* 플레이스홀더와 같은 확정 문구를 접근 가능한 이름으로도 씁니다 */
                    aria-label={SEARCH_PLACEHOLDER}
                    placeholder={SEARCH_PLACEHOLDER}
                    autoComplete="off"
                    aria-expanded={isFocused}
                    aria-controls={panelId}
                    onChange={event => setQuery(event.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={event => {
                        if (event.key !== 'Escape') {
                            return;
                        }

                        if (query) {
                            setQuery('');
                            return;
                        }

                        setIsFocused(false);
                        inputRef.current?.blur();
                    }}
                />
                <kbd className={styles.shortcut} aria-hidden="true">
                    ⌘K
                </kbd>
            </div>

            {isFocused && (
                <div className={styles.panel} id={panelId} role="status">
                    {query ? (
                        <>
                            <p className={styles.empty_title}>{SEARCH_EMPTY_TITLE}</p>
                            <p className={styles.empty_description}>
                                {SEARCH_EMPTY_DESCRIPTION_DESKTOP}
                            </p>
                        </>
                    ) : (
                        <p className={styles.hint}>{SEARCH_INITIAL_HINT}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default HeaderSearch;
