import styles from './Home.module.css';
import { GlobalNavigationBar, PostList } from '../../components/shared';
import { useEffect, useRef } from 'react';

function Home(){
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const text = 'Hello World!';
            for (let i = 0; i < text.length; i++) {
                setTimeout(() => {
                    titleRef.current!.textContent = text.slice(0, i + 1);
                }, i * 100);
            }
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    return (
        <main className={styles.main}>
            <GlobalNavigationBar />
            <section>
                <header>
                    <div className={styles.title}>
                        <h1 ref={titleRef}>H</h1>
                    </div>
                    <div className={styles.description}>
                        <p>
                            공부하는 기술, 경험에 대한 이야기를 정리해요.
                        </p>
                    </div>
                </header>
                <div className={styles.post_list}>
                    <PostList />
                </div>
            </section>
        </main>
    )
}

export default Home;