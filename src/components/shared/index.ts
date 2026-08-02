import GlobalNavigationBar from './GlobalNavigationBar';
import Pagination from './Pagination';
import SearchIcon from './SearchIcon';
import Footer from './Footer';
import Wordmark from './Wordmark';
import ThemeToggle from './ThemeToggle';
import ContributionGraph from './ContributionGraph';
import ErrorBoundary from './ErrorBoundary';

/*
 * ⚠️ `PostList`·`PostCard`·`PageTitle` 이 여기서 빠졌습니다.
 *    셋 다 **구 홈 전용**이었고 STEP 2 가 홈을 전면 교체하면서 사용처가
 *    0 이 됐습니다. `PostCard` 는 명세대로 다시 만들어 `components/home/`
 *    으로 옮겼습니다 — 손으로 쓴 `note` 가 있는 홈 선별 카드에서만
 *    성립하는 형태라 `shared/` 에 둘 이유가 없습니다.
 */
export {
    ContributionGraph,
    ErrorBoundary,
    GlobalNavigationBar,
    Pagination,
    SearchIcon,
    Footer,
    Wordmark,
    ThemeToggle,
};
