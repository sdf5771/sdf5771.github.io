import styles from './Footer.module.css';

function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.list_container}>
                <div className={styles.info_container}>
                    <span className={styles.title}>Seobisback</span>
                    <span className={styles.description}>
                        공부하는 기술, 경험에 대한 이야기를 정리해요.
                    </span>
                </div>
                <div className={styles.lists}>
                    <div className={styles.list}>
                        <span className={styles.title}>Channels</span>
                        <ul>
                            <li>
                                <a href="https://github.com/sdf5771">
                                    Github
                                </a>
                            </li>
                            <li>
                                <a href="https://www.instagram.com/real_seobisback/">
                                    Instagram
                                </a>
                            </li>
                            <li>
                                <a href="https://www.facebook.com/profile.php?id=100004827672196">
                                    Facebook
                                </a>
                            </li>
                            <li>
                                <a href="https://tender-lemongrass-345.notion.site/f8dcc2d59c1045368ed2023ac9327029?pvs=4">
                                    Notion
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className={styles.list}>
                        <span className={styles.title}>Services</span>
                        <ul>
                            <li>
                                <a href="https://sdf5771.github.io">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a href="https://www.qualk.co.kr/">
                                    Qualk
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className={styles.list}>
                        <span className={styles.title}>Contacts</span>
                        <ul>
                            <li>
                                <a href="mailto:seobisback@gmail.com">
                                    Email
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className={styles.copyright}>
                <span>
                    Copyright 2025. Seobisback. All rights reserved.
                </span>
            </div>
        </footer>
    )
}

export default Footer;