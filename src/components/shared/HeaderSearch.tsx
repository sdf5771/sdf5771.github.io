import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HeaderSearch.module.css';
import SearchIcon from './SearchIcon';
import type { SearchRequest } from '../shell';
import {
    SEARCH_EMPTY_DESCRIPTION_DESKTOP,
    SEARCH_EMPTY_TITLE,
    SEARCH_INITIAL_HINT,
    SEARCH_PLACEHOLDER,
} from '../../constants/search';
import { TOTAL_POST_COUNT } from '../../data/posts';
import { buildSearchResultPath } from '../../utils/postListQuery';
import { useSearchMatchCount } from '../../hooks';

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
 * **입력 지점 2개 / 결과 화면 1개** (§2-3). 여기는 다른 화면에서의 **진입로**라
 * 결과를 나열하지 않고 개수만 말한 뒤, 확정되면 `/posts?q=<검색어>` 로 넘깁니다.
 * 결과를 보며 조건을 조금씩 고치는 작업은 목록 화면의 인라인 입력이 맡습니다 —
 * 헤더에도 결과 목록을 그리면 같은 화면이 두 벌이 되고, 어느 쪽이 정본인지
 * 갈립니다.
 */
function HeaderSearch({ request, onClose }: HeaderSearchProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    /* 직전 요청. 닫힐 때 어디로 포커스를 돌려줄지는 그 요청이 알고 있습니다 */
    const previousRequestRef = useRef<SearchRequest | null>(null);

    const panelId = 'header-search-panel';
    /* 결과를 나열하지 않고 개수만 씁니다 — 실제 검색 로직과 같은 규칙입니다 */
    const matchCount = useSearchMatchCount(query);

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
        <form
            className={styles.search}
            role="search"
            onSubmit={event => {
                event.preventDefault();

                if (!query.trim()) {
                    return;
                }

                /* 결과 화면은 하나입니다. 값을 들고 목록으로 넘깁니다(§2-3) */
                navigate(buildSearchResultPath(query));
                onClose();
            }}
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

            {/*
              * `role="status"` 를 걷어냈습니다. 이제 내용이 **타이핑마다** 바뀌는데
              * 라이브 영역이면 글자를 칠 때마다 낭독이 끊깁니다. 결과 수 알림은
              * 목록 화면의 디바운스된 aria-live 영역이 담당합니다(§9-4).
              */}
            {isFocused && (
                <div className={styles.panel} id={panelId}>
                    {!query.trim() ? (
                        <p className={styles.hint}>{SEARCH_INITIAL_HINT}</p>
                    ) : matchCount > 0 ? (
                        /* STEP 1 §9 확정 카피 — 분모가 있어야 얼마나 좁혀졌는지 보입니다 */
                        <p className={styles.hint}>
                            {`${matchCount}개 일치 · 전체 ${TOTAL_POST_COUNT}개 중`}
                        </p>
                    ) : (
                        <>
                            <p className={styles.empty_title}>{SEARCH_EMPTY_TITLE}</p>
                            <p className={styles.empty_description}>
                                {SEARCH_EMPTY_DESCRIPTION_DESKTOP}
                            </p>
                        </>
                    )}
                </div>
            )}
        </form>
    );
}

export default HeaderSearch;
