import styles from './GlobalNavigationBar.module.css';
import logo from '../../assets/images/memoji.png';

function GlobalNavigationBar(){
    return (
        <nav className={styles.nav}>
            <div className={styles.nav_container}>
                <div className={styles.left_container}>
                    <div className={styles.title_container}>
                        <div className={styles.logo}>
                            <img src={logo} alt="logo" />
                        </div>
                        <span>Seobisback's Blog</span>
                    </div>
                </div>
                <div className={styles.right_container}>

                </div>
            </div>
        </nav>
    )
}

export default GlobalNavigationBar;