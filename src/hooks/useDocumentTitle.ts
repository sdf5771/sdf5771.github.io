import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveDocumentTitle } from '../utils/documentTitle';

/**
 * 🔴 라우트별 `<title>` 의 정본은 **`src/utils/documentTitle.ts` 의
 *    `resolveDocumentTitle`** 입니다. 빌드타임 프리렌더가 74개 HTML 의 제목을
 *    같은 함수로 만들기 때문에(product.md §14-5 R-5) react 의존이 없는 파일에
 *    두어야 했습니다. 문구를 여기나 프리렌더 쪽에 다시 적지 마세요.
 */

/**
 * 라우트가 바뀔 때 `document.title` 을 갱신합니다.
 *
 * SPA 는 문서를 새로 불러오지 않으므로 아무것도 하지 않으면 첫 진입의 제목이
 * 끝까지 남습니다. 스크린리더는 페이지 전환을 제목으로 알리고 사용자는 탭·기록·
 * 북마크에서 제목으로 화면을 구분하므로 **접근성 필수 항목**입니다
 * (§10 체크리스트 · WRITING_GUIDE §7.4).
 *
 * 프리렌더된 HTML 이 이미 정답 제목을 담고 있어도 이 훅은 필요합니다 —
 * SPA 안에서의 화면 전환은 문서를 새로 불러오지 않습니다.
 */
function useDocumentTitle(): void {
    const { pathname, search } = useLocation();

    useEffect(() => {
        document.title = resolveDocumentTitle(pathname, search);
    }, [pathname, search]);
}

export default useDocumentTitle;
