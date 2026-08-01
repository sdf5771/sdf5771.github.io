import { Routes, Route } from 'react-router-dom';
import styles from './App.module.css';
import { Home, Post } from './routes';
import { GlobalNavigationBar, Footer } from './components/shared';
import { ShellProvider } from './components/shell';
import { useDocumentTitle } from './hooks';

/**
 * 전역 셸. 헤더·푸터는 화면마다 두지 않고 여기서 한 번만 렌더합니다.
 *
 * 화면 안에 두면 안 되는 이유가 두 가지 있습니다.
 *  1. <header> 가 <main> 안에 들어가 랜드마크 구조가 어긋납니다.
 *  2. 기존 화면의 래퍼가 overflow-x: hidden 을 갖고 있어, 그 안에서는
 *     position: sticky 가 동작하지 않습니다(스크롤 컨테이너가 되어 버림).
 */
function App() {
    /* SPA 는 문서를 다시 불러오지 않으므로 제목을 셸이 직접 갱신합니다(§10) */
    useDocumentTitle();

    return (
        /* 화면이 openSearch() 로 헤더의 검색 UI 를 열 수 있게 합니다(§6-4a) */
        <ShellProvider>
            <div className={styles.shell}>
                <GlobalNavigationBar />
                <main className={styles.main} id="main">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/post" element={<Post />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </ShellProvider>
    );
}

export default App;
