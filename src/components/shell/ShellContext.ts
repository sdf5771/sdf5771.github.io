import { createContext } from 'react';

export interface OpenSearchOptions {
    /** 입력에 미리 채울 검색어. 채운 뒤 전체 선택 상태로 둡니다 */
    query?: string;
    /** 닫을 때 포커스를 돌려줄 요소. 생략 시 호출 시점 document.activeElement */
    returnFocusTo?: HTMLElement | null;
}

/**
 * 전역 셸의 공개 API.
 * 404 의 `검색으로 찾기` 처럼 **셸 밖의 화면이 검색 UI 를 열어야 하는 경우**를 위해
 * 있습니다. 이게 없으면 화면마다 검색 UI 를 중복 구현하게 됩니다.
 * 명세: docs/handoff-step1-shell.md §6-4a
 *
 * ⚠️ 범위: 이 API 는 **UI 를 여닫는 것만** 책임집니다. 실제 필터링은 STEP 4 소관입니다.
 */
export interface ShellApi {
    openSearch(options?: OpenSearchOptions): void;
    closeSearch(): void;
    readonly isSearchOpen: boolean;
}

/**
 * 검색 열기 요청 한 건. 셸 내부(헤더)에서만 씁니다.
 *
 * 열림/닫힘을 boolean 이 아니라 요청 객체로 두는 이유는 **이미 열려 있을 때의
 * 재호출**을 구분하기 위해서입니다. id 만 올라가면 헤더는 새 오버레이를 만들지
 * 않고 입력에 다시 포커스를 줍니다(§6-4a 동작 계약).
 */
export interface SearchRequest {
    /** 호출할 때마다 1 씩 증가 */
    id: number;
    /** 미리 채울 검색어 */
    query?: string;
    /** 닫을 때 포커스를 돌려줄 요소 */
    returnFocusTo: HTMLElement | null;
}

export interface ShellContextValue extends ShellApi {
    searchRequest: SearchRequest | null;
}

export const ShellContext = createContext<ShellContextValue | null>(null);
