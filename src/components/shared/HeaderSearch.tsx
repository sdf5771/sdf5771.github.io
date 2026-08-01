import { useEffect, useRef, useState } from 'react';
import styles from './HeaderSearch.module.css';
import SearchIcon from './SearchIcon';
import type { SearchRequest } from '../shell';
import {
    SEARCH_EMPTY_DESCRIPTION_DESKTOP,
    SEARCH_EMPTY_TITLE,
    SEARCH_INITIAL_HINT,
    SEARCH_PLACEHOLDER,
} from '../../constants/search';

interface HeaderSearchProps {
    /** 셸의 검색 열기 요청. 데스크톱 구간에서만 전달됩니다 */
    request: SearchRequest | null;
    /** 셸 상태를 닫힘으로 되돌립니다 */
    onClose: () => void;
}

/**
 * 데스크톱(≥1024px) 인라인 검색.
 * 250px → 포커스 시 320px 로 확장되고, 결과는 입력 아래 드롭다운으로 나옵니다.
 *
 * ⚠️ **UI 껍데기입니다.** 실제 필터는 STEP 4에서 글 목록과 함께 붙습니다.
 *    지금은 도달 가능한 두 상태(빈 입력 = 초기 안내 / 입력 있음 = 0건)만 그립니다.
 */
function HeaderSearch({ request, onClose }: HeaderSearchProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    /* 직전 요청. 닫힐 때 어디로 포커스를 돌려줄지는 그 요청이 알고 있습니다 */
    const previousRequestRef = useRef<SearchRequest | null>(null);

    const panelId = 'header-search-panel';

    /*
     * 데스크톱에서 openSearch() 는 "인라인 입력을 펴고 포커스" 를 뜻합니다(§6-4a).
     * 새 오버레이를 만들 필요가 없어서 여기서 입력만 맞추면 됩니다.
     */
    useEffect(() => {
        const previous = previousRequestRef.current;
        previousRequestRef.current = request;

        const input = inputRef.current;
        if (!input) {
            return;
        }

        if (request) {
            if (request.query !== undefined) {
                // DOM 을 먼저 맞춰야 select() 가 갱신된 값을 잡습니다
                input.value = request.query;
                setQuery(request.query);
            }

            setIsFocused(true);
            input.focus();
            if (request.query) {
                input.select();
            }
            return;
        }

        /*
         * 닫힘 — 포커스가 아직 이 입력에 있을 때만 되돌립니다.
         * 사용자가 다른 곳을 눌러 빠져나간 경우(blur 로 닫힌 경우)에는 포커스를
         * 빼앗아 오면 안 됩니다.
         */
        if (previous && document.activeElement === input) {
            const target = previous.returnFocusTo;
            if (target?.isConnected) {
                target.focus();
            } else {
                input.blur();
            }
        }
    }, [request]);

    return (
        <div
            className={styles.search}
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsFocused(false);
                    onClose();
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

                        if (request) {
                            /* 셸이 연 상태 — 포커스 복귀까지 위 effect 가 처리합니다 */
                            onClose();
                            return;
                        }

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
