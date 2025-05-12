import styles from './Home.module.css';
import { GlobalNavigationBar, PostList, PageTitle, Footer } from '../../components/shared';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Profile } from '../../components/home';

function Home(){
    const location = useLocation();
    const [page, setPage] = useState<number>(1);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const pageQuery = searchParams.get('page');
        if(pageQuery){
            setPage(parseInt(pageQuery));
        } else {
            setPage(1);
        }
    }, [location.search])

    return (
        <main className={styles.main}>
            <GlobalNavigationBar />
            <section>
                <header>
                    <PageTitle title="Hello World!" />
                    <div className={styles.description}>
                        <p>
                            공부하는 기술, 경험에 대한 이야기를 정리해요.
                        </p>
                    </div>
                </header>
                <div className={styles.profile_container}>
                    <div className={styles.profile_title}>
                        <h2>Profile</h2>
                    </div>
                    <Profile />
                </div>
                <div className={styles.post_container}>
                    <div className={styles.post_title}>
                        <h2>Posts</h2>
                    </div>
                    <div className={styles.post_list}>
                        <PostList pagination={{ page: page, limit: 6 }} urlPath={`/`} />
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    )
}

export default Home;