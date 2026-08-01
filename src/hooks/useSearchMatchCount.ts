import { useMemo } from 'react';
import { POST_SEARCH_INDEX } from '../data/posts';
import { matchesTokens, tokenizeQuery } from '../utils/postSearch';

/**
 * 이 검색어에 맞는 글이 몇 개인가.
 *
 * 헤더 전역 검색(데스크톱 인라인 · 모바일 오버레이)이 **결과를 나열하지 않고
 * 개수만** 말하기 위해 씁니다. 결과 화면은 `/posts` 하나이고 헤더는 진입로일
 * 뿐이라, 여기에 결과 목록을 그리면 같은 화면이 두 벌이 됩니다(§2-3).
 *
 * 41건 × 4필드라 메모이제이션 없이도 마이크로초 단위지만, 렌더마다 배열을
 * 새로 도는 것을 막아 둡니다.
 */
function useSearchMatchCount(query: string): number {
    return useMemo(() => {
        const tokens = tokenizeQuery(query);

        if (tokens.length === 0) {
            return 0;
        }

        return POST_SEARCH_INDEX.filter(entry => matchesTokens(entry.haystack, tokens)).length;
    }, [query]);
}

export default useSearchMatchCount;
