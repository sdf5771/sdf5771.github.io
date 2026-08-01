import { Link, useLocation } from 'react-router-dom';
import styles from './NotFound.module.css';
import DotConstellation from './DotConstellation';
import { useShell } from '../../components/shell';
import { IS_POST_LIST_READY, POST_LIST_PATH } from '../../constants/site';
import { safeDisplayPath } from '../../utils/url';

/**
 * 404 화면.
 * 명세: docs/handoff-step5-404-about.md §4
 *
 * 사용자가 여기서 하려는 일: 잘못된 링크로 들어왔다는 걸 이해하고,
 * **이탈하지 않고** 원래 찾던 글이나 목록으로 간다.
 *
 * 낭독 순서를 h1 → 설명 → 홈으로 → 글 목록 → 검색으로 두는 것이 의도입니다.
 * 실패 상황에서는 회복 경로가 가장 먼저 들려야 합니다. 그래픽과 경로 장식은
 * aria-hidden 이라 읽히지 않습니다.
 */
function NotFound() {
    const { pathname, search } = useLocation();
    const { openSearch } = useShell();

    /*
     * 이 사이트에서 **유일하게 임의 외부 입력이 화면에 들어가는 자리**입니다.
     * 디코드 실패·제어문자·길이 상한을 safeDisplayPath 가 처리하고, 여기서는
     * 반드시 React 텍스트 노드로만 렌더합니다.
     * 🔴 이 컴포넌트에서 dangerouslySetInnerHTML 을 쓰지 마세요 — React 의 자동
     *    이스케이프가 XSS 를 막는 유일한 근거입니다.
     */
    const displayPath = safeDisplayPath(pathname, search);

    return (
        <div className={styles.root}>
            <div className={styles.inner}>
                <DotConstellation />

                <h1 className={styles.title}>이 경로에는 아무것도 없어요</h1>

                <p className={styles.description}>
                    주소가 바뀌었거나, 처음부터 없던 페이지예요.
                </p>

                {/* 줄 전체가 장식입니다. h1·설명이 이미 상황을 전달합니다 */}
                <p className={styles.path_line} aria-hidden="true">
                    <span className={styles.prompt}>▸ ~ cd </span>
                    <span className={styles.path}>{displayPath}</span>
                </p>

                {/* 랜드마크 이름은 명사구 4~10자, 역할 단어 금지 (WRITING_GUIDE §7.3a) */}
                <nav className={styles.actions} aria-label="돌아가기">
                    {/* 이동이므로 <a>(Link) 입니다 */}
                    <Link className={`${styles.button} ${styles.button_primary}`} to="/">
                        홈으로
                    </Link>

                    {/*
                     * 🔴 **회복 경로는 회복시켜야 합니다.**
                     * `/posts` 는 STEP 4 에서 구현되어 **지금은 살아 있습니다** —
                     * site.ts 의 `isRouteReady` 가 true 라 이 버튼이 노출됩니다.
                     *
                     * 가드를 남겨 두는 이유: 404 에서 404 로 보내는 버튼은 회복
                     * 경로가 아니라 이탈 경로입니다. 라우트가 다시 내려가면
                     * (`isRouteReady: false`) 버튼도 함께 사라져야 하고, 그때
                     * 홈으로·검색으로 찾기 두 경로가 회복 수단으로 남습니다.
                     */}
                    {IS_POST_LIST_READY && (
                        <Link className={styles.button} to={POST_LIST_PATH}>
                            글 목록으로
                        </Link>
                    )}
                </nav>

                {/*
                 * 오버레이를 여는 **동작**이므로 <button> 입니다.
                 * 404 는 검색 UI 를 새로 만들지 않습니다 — 전역 셸이 이미 가진 것을
                 * 열기만 합니다(§6-2). 뷰포트에 따라 인라인 입력 포커스 / 전폭 행 /
                 * 전체화면 오버레이로 갈리는 분기는 셸이 알아서 합니다.
                 */}
                <button
                    className={styles.search_link}
                    type="button"
                    onClick={() => openSearch()}
                >
                    검색으로 찾기
                </button>
            </div>
        </div>
    );
}

export default NotFound;
