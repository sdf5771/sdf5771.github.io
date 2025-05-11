import styles from './Home.module.css';
import { GlobalNavigationBar, PostList } from '../../components/shared';

function Home(){

    return (
        <main className={styles.main}>
            <GlobalNavigationBar />
            <section>
                <header>
                    <div>
                        <h1>Home</h1>
                    </div>
                </header>
                <div>
                    <PostList />
                </div>
            </section>
        </main>
    )
}

export default Home;