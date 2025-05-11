import styles from './Home.module.css';
import PostList from '../../components/shared/PostList';

function Home(){

    return (
        <main className={styles.main}>
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