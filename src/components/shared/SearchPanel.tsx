import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SearchPanel.module.css';
import SearchIcon from './SearchIcon';
import type { SearchRequest } from '../shell';
import {
    SEARCH_EMPTY_DESCRIPTION_MOBILE,
    SEARCH_EMPTY_TITLE,
    SEARCH_INITIAL_HINT,
    SEARCH_PLACEHOLDER,
    SEARCH_POPULAR_TAGS,
    SEARCH_POPULAR_TAGS_TITLE,
    SEARCH_SCOPE_HINT,
} from '../../constants/search';
import { useOverlayBehavior, useSearchMatchCount } from '../../hooks';
import { TOTAL_POST_COUNT } from '../../data/posts';
import { buildSearchResultPath } from '../../utils/postListQuery';

interface SearchPanelProps {
    id: string;
    /** 셸의 검색 열기 요청. null 이면 닫힌 상태입니다 */
    request: SearchRequest | null;
    onClose: () => void;
    /**
     * 전체화면 모달로 열렸는가(≤767px).
     * 768~1023px 에서는 헤더 아래 전폭 행이라 모달이 아닙니다 — 작은 행에 포커스를
     * 가두면 오히려 방해가 되므로 트랩·스크롤 락을 걸지 않습니다.
     */
    isModal: boolean;
}

/**
 * 1024px 미만 검색 UI.
 * 768~1023px: 헤더 아래 전폭 행 / ≤767px: 전체화면 오버레이.
 * 두 형태를 한 컴포넌트로 두고 CSS 미디어쿼리로만 바꿉니다.
 *
 * 여기는 다른 화면에서의 **진입로**입니다(§2-3). 결과를 나열하지 않고 개수만
 * 말한 뒤, 확정되면 `/posts?q=<검색어>` 로 넘깁니다 — 결과 화면은 하나입니다.
 * 이동하면 라우트가 바뀌므로 ShellProvider 가 이 오버레이를 자동으로 닫습니다.
 */
function SearchPanel({ id, request, onClose, isModal }: SearchPanelProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const matchCount = useSearchMatchCount(query);
    const isOpen = request !== null;
    const containerRef = useOverlayBehavior<HTMLDivElement>({
        isOpen,
        onClose,
        isModal,
        returnFocusTo: request?.returnFocusTo,
    });

    /*
     * 요청이 새로 들어올 때마다(= id 가 바뀔 때마다) 입력을 맞춥니다.
     * 이미 열려 있을 때 openSearch() 를 다시 부르면 새 오버레이를 만들지 않고
     * 여기서 재포커스만 합니다. query 가 오면 채운 뒤 전체 선택해서 사용자가
     * 바로 덮어쓸 수 있게 둡니다(§6-4a).
     */
    const requestId = request?.id;
    const requestQuery = request?.query;
    useEffect(() => {
        if (requestId === undefined) {
            return;
        }

        const input = inputRef.current;
        if (!input) {
            return;
        }

        if (requestQuery !== undefined) {
            /*
             * DOM 값을 먼저 맞추고 상태를 같은 값으로 올립니다.
             * setQuery 만 하면 리렌더 전이라 select() 가 빈 문자열을 잡습니다.
             * 두 값이 같으므로 다음 렌더에서 어긋나지 않습니다.
             */
            input.value = requestQuery;
            setQuery(requestQuery);
        }

        input.focus();
        if (requestQuery) {
            input.select();
        }
    }, [requestId, requestQuery]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className={styles.panel}
            id={id}
            ref={containerRef}
            role={isModal ? 'dialog' : undefined}
            aria-modal={isModal ? true : undefined}
            aria-label="검색"
        >
            <form
                className={styles.bar}
                role="search"
                onSubmit={event => {
                    event.preventDefault();

                    if (!query.trim()) {
                        return;
                    }

                    navigate(buildSearchResultPath(query));
                }}
            >
                <SearchIcon className={styles.icon} />
                <input
                    className={styles.input}
                    ref={inputRef}
                    type="search"
                    value={query}
                    aria-label={SEARCH_PLACEHOLDER}
                    placeholder={SEARCH_PLACEHOLDER}
                    autoComplete="off"
                    data-autofocus
                    onChange={event => setQuery(event.target.value)}
                />
                <button
                    className={styles.close}
                    type="button"
                    onClick={onClose}
                    aria-label="검색 닫기"
                >
                    {/* `✕`(U+2715)는 Galmuri 에 없습니다. `×`(U+00D7) 는 형태가 거의 같고 라틴-1 이라 안전합니다(§4-7) */}
                    <span aria-hidden="true">×</span>
                </button>
            </form>

            <div className={styles.body}>
                <p className={styles.scope}>{SEARCH_SCOPE_HINT}</p>

                <section className={styles.tags}>
                    <h2 className={styles.tags_title}>{SEARCH_POPULAR_TAGS_TITLE}</h2>
                    <ul className={styles.tag_list}>
                        {SEARCH_POPULAR_TAGS.map(tag => (
                            <li key={tag.label}>
                                {/*
                                 * 누르면 그 태그를 **검색어로 채웁니다**(§5-3).
                                 * 바로 이동시키지 않는 이유: 태그는 출발점이지
                                 * 목적지가 아니라, 사용자가 거기서 단어를 더 붙이거나
                                 * 지우는 일이 흔합니다. 확정은 제출(Enter)이 합니다.
                                 */}
                                <button
                                    className={styles.tag}
                                    type="button"
                                    onClick={() => {
                                        setQuery(tag.label);
                                        inputRef.current?.focus();
                                    }}
                                >
                                    {tag.label}
                                    <span className={styles.tag_count}>{tag.count}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                {/*
                  * `role="status"` 를 걷어냈습니다 — 내용이 타이핑마다 바뀌는데
                  * 라이브 영역이면 글자를 칠 때마다 낭독이 끊깁니다. 결과 수 알림은
                  * 목록 화면의 디바운스된 aria-live 영역이 담당합니다(§9-4).
                  */}
                <div className={styles.result}>
                    {!query.trim() ? (
                        <p className={styles.empty_description}>{SEARCH_INITIAL_HINT}</p>
                    ) : matchCount > 0 ? (
                        <p className={styles.empty_description}>
                            {`${matchCount}개 일치 · 전체 ${TOTAL_POST_COUNT}개 중`}
                        </p>
                    ) : (
                        <>
                            <p className={styles.empty_title}>{SEARCH_EMPTY_TITLE}</p>
                            <p className={styles.empty_description}>
                                {SEARCH_EMPTY_DESCRIPTION_MOBILE}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SearchPanel;
