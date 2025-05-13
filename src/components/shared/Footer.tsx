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
                        <span className={styles.title}>My Socials</span>
                        <ul>
                            <li>
                                <a href="/">
                                    Github
                                </a>
                            </li>
                            <li>
                                <a href="/">
                                    Instagram
                                </a>
                            </li>
                            <li>
                                <a href="/">
                                    Facebook
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className={styles.list}>
                        <span className={styles.title}>title</span>
                        <ul>
                            <li>
                                <a href="/">
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="/">
                                    Home
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className={styles.list}>
                        <span className={styles.title}>Contacts</span>
                        <ul>
                            <li>
                                <a href="/">
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