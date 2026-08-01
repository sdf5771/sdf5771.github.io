import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ShellContext } from './ShellContext';
import type { OpenSearchOptions, SearchRequest } from './ShellContext';

/**
 * 전역 셸의 상태 보관소. Provider 는 App 레벨에 둡니다(헤더·푸터가 이미 그 자리에 있음).
 *
 * 테마와 같은 이유로 zustand 가 아니라 Context 입니다 — 값이 요청 객체 하나이고
 * 갱신 빈도가 극히 낮습니다(사용자가 검색을 열 때만).
 * 명세: docs/handoff-step1-shell.md §6-4a
 */
function ShellProvider({ children }: { children: ReactNode }) {
    const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
    const { pathname, search } = useLocation();

    const openSearch = useCallback((options?: OpenSearchOptions) => {
        setSearchRequest(previous => ({
            id: (previous?.id ?? 0) + 1,
            query: options?.query,
            /*
             * 우선순위: 명시된 값 > 이미 열려 있다면 처음 잡아 둔 값 > 호출 시점 포커스.
             * 가운데 항이 없으면 열린 상태에서 재호출했을 때 검색 입력 자신이
             * 복귀 대상이 되어 버립니다.
             */
            returnFocusTo:
                options?.returnFocusTo ??
                previous?.returnFocusTo ??
                (document.activeElement as HTMLElement | null),
        }));
    }, []);

    const closeSearch = useCallback(() => setSearchRequest(null), []);

    /*
     * 라우트가 바뀌면 자동으로 닫습니다.
     * 404 에서 검색 → 결과 클릭 → 글로 이동했는데 오버레이가 남아 있으면 안 됩니다.
     * 첫 마운트에서는 이미 null 이라 React 가 갱신을 건너뜁니다.
     *
     * location.key 가 아니라 pathname·search 를 봅니다 — 라우터 밖에서 일어난
     * 히스토리 조작에서는 key 가 그대로일 수 있습니다.
     */
    useEffect(() => {
        setSearchRequest(null);
    }, [pathname, search]);

    const value = useMemo(
        () => ({
            searchRequest,
            isSearchOpen: searchRequest !== null,
            openSearch,
            closeSearch,
        }),
        [searchRequest, openSearch, closeSearch],
    );

    return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export default ShellProvider;
