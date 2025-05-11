import styles from './GlobalNavigationBar.module.css';
import logo from '../../assets/images/memoji.png';
import { useNavigate } from 'react-router-dom';

function GlobalNavigationBar(){
    const navigate = useNavigate();
    return (
        <nav className={styles.nav}>
            <div className={styles.nav_container}>
                <div className={styles.left_container}>
                    <div onClick={() => navigate('/')} className={styles.title_container}>
                        <div className={styles.logo}>
                            <img src={logo} alt="logo" />
                        </div>
                        <span>Seobisback's Blog</span>
                    </div>
                </div>
                <div className={styles.right_container}>
                    <ul className={styles.menu_list}>
                        <li onClick={() => navigate('/')}>Home</li>
                        <li onClick={() => navigate('/about')}>About</li>
                        <li onClick={() => navigate('/contact')}>Contact</li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}

export default GlobalNavigationBar;