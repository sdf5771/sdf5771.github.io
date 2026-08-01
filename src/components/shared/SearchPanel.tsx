import { useState } from 'react';
import styles from './SearchPanel.module.css';
import {
    SEARCH_EMPTY_DESCRIPTION_MOBILE,
    SEARCH_EMPTY_TITLE,
    SEARCH_INITIAL_HINT,
    SEARCH_PLACEHOLDER,
    SEARCH_POPULAR_TAGS,
    SEARCH_POPULAR_TAGS_TITLE,
    SEARCH_SCOPE_HINT,
} from '../../constants/search';
import { useOverlayBehavior } from '../../hooks';

interface SearchPanelProps {
    id: string;
    isOpen: boolean;
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
 * ⚠️ **UI 껍데기입니다.** 실제 필터는 STEP 4에서 글 목록과 함께 붙습니다.
 */
function SearchPanel({ id, isOpen, onClose, isModal }: SearchPanelProps) {
    const [query, setQuery] = useState('');
    const containerRef = useOverlayBehavior<HTMLDivElement>({ isOpen, onClose, isModal });

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
            <div className={styles.bar}>
                <span className={styles.icon} aria-hidden="true">
                    ⌕
                </span>
                <input
                    className={styles.input}
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
                    <span aria-hidden="true">✕</span>
                </button>
            </div>

            <div className={styles.body}>
                <p className={styles.scope}>{SEARCH_SCOPE_HINT}</p>

                <section className={styles.tags}>
                    <h2 className={styles.tags_title}>{SEARCH_POPULAR_TAGS_TITLE}</h2>
                    <ul className={styles.tag_list}>
                        {SEARCH_POPULAR_TAGS.map(tag => (
                            <li key={tag.label}>
                                {/*
                                 * 아직 필터가 없어 눌러도 결과가 바뀌지 않습니다.
                                 * 동작하지 않는 컨트롤을 활성처럼 보이면 안 되므로
                                 * disabled 로 두고, STEP 4에서 필터와 함께 살립니다.
                                 */}
                                <button className={styles.tag} type="button" disabled>
                                    {tag.label}
                                    <span className={styles.tag_count}>{tag.count}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <div className={styles.result} role="status">
                    {query ? (
                        <>
                            <p className={styles.empty_title}>{SEARCH_EMPTY_TITLE}</p>
                            <p className={styles.empty_description}>
                                {SEARCH_EMPTY_DESCRIPTION_MOBILE}
                            </p>
                        </>
                    ) : (
                        <p className={styles.empty_description}>{SEARCH_INITIAL_HINT}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SearchPanel;
