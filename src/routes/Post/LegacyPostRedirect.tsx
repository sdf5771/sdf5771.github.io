import { Navigate, useLocation } from 'react-router-dom';
import NotFound from '../NotFound/NotFound';
import { toPostSlug } from '../../utils/postSlug';

/**
 * 구 경로 `/post?id=<slug>` → 신 경로 `/posts/<slug>`.
 * 명세: docs/handoff-step5-404-about.md §4-8
 *
 * 프로덕션에서는 이 경로가 정적 파일로 존재하지 않아 `dist/404.html` 의 인라인
 * 스크립트가 React 마운트 **전에** 리다이렉트를 끝냅니다. 이 컴포넌트는 그
 * 스크립트가 돌지 않는 두 경우를 받습니다.
 *
 *   1. dev 서버 — 어떤 경로든 index.html 을 돌려주므로 404.html 이 관여하지 않습니다
 *   2. SPA 안에서 구 링크를 클릭한 경우 — 서버를 거치지 않습니다
 *
 * `replace` 라서 히스토리에 구 경로가 남지 않습니다. 뒤로 가기가 구 경로로
 * 돌아오면 다시 리다이렉트되어 사용자가 갇힙니다.
 */
function LegacyPostRedirect() {
    const { search } = useLocation();
    const slug = new URLSearchParams(search).get('id');

    /* id 없는 `/post` 는 실재하는 화면이 아닙니다. 홈으로 보내지 않고 404 로 둡니다 */
    if (!slug) {
        return <NotFound />;
    }

    /* 정본 slug 규칙(소문자 + 연속 하이픈 정리)은 toPostSlug 한 곳에만 둡니다 */
    return <Navigate to={`/posts/${toPostSlug(slug)}`} replace />;
}

export default LegacyPostRedirect;
