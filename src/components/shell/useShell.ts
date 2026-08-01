import { useContext } from 'react';
import { ShellContext } from './ShellContext';
import type { ShellApi, ShellContextValue } from './ShellContext';

/** 셸 내부(헤더)에서만 쓰는 원본 값. 요청 객체까지 함께 봅니다. */
export function useShellContext(): ShellContextValue {
    const value = useContext(ShellContext);

    if (!value) {
        throw new Error('셸 API 는 ShellProvider 안에서만 쓸 수 있습니다.');
    }

    return value;
}

/**
 * 화면에서 전역 셸을 다루는 공개 훅.
 *
 *   const { openSearch } = useShell();
 *   <button onClick={() => openSearch()}>검색으로 찾기</button>
 *   // 실패한 검색어를 들고 열기
 *   openSearch({ query: keyword });
 *
 * `isSearchOpen` 은 **API 로 연 상태**를 가리킵니다. 데스크톱에서 사용자가 헤더
 * 입력을 직접 클릭한 경우는 포함하지 않습니다 — 그건 셸이 아니라 입력 자신의 상태입니다.
 */
export function useShell(): ShellApi {
    return useShellContext();
}
