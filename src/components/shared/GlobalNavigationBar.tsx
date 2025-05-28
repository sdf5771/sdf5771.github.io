import styles from './GlobalNavigationBar.module.css';
import logo from '../../assets/images/memoji.png';
import { useNavigate } from 'react-router-dom';
import { ResponsiveMobile, ResponsiveTabletPC, ResponsivePC } from './ResponsiveWrapper';
import { useState } from 'react';
function GlobalNavigationBar(){
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    return (
        <nav className={`${styles.nav} ${isOpen ? styles.active : ''}`}>
            <div className={styles.nav_container}>
                <div className={styles.left_container}>
                    <div onClick={() => navigate('/')} className={styles.title_container}>
                        <div className={styles.logo}>
                            <img src={logo} alt="logo" />
                        </div>
                        <span>Seobisback's Blog</span>
                    </div>
                </div>
                <ResponsivePC>
                    <div className={styles.right_container}>
                        <ul className={styles.menu_list}>
                            <li onClick={() => navigate('/')}>Home</li>
                            <li onClick={() => alert('😅 Oops! This Page is under construction.')}>Works</li>
                            <li onClick={() => alert('😅 Oops! This Feature is under construction.')}>Search</li>
                        </ul>
                    </div>
                </ResponsivePC>
                <ResponsiveTabletPC>
                    <div className={styles.right_container}>
                        <ul className={styles.menu_list}>
                            <li onClick={() => navigate('/')}>Home</li>
                            <li onClick={() => alert('😅 Oops! This Page is under construction.')}>Works</li>
                            <li onClick={() => alert('😅 Oops! This Feature is under construction.')}>Search</li>
                        </ul>
                    </div>
                </ResponsiveTabletPC>
                <ResponsiveMobile>
                    <div className={styles.right_container}>
                        <a 
                            className={`${styles.menu_trigger} ${isOpen ? styles.active : ''}`} 
                            href="#" 
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                event.preventDefault();
                                setIsOpen(prev => !prev);
                                
                            }}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </a>
                    </div>
                    <ul className={`${styles.menu_list_mobile} ${isOpen ? styles.active : ''}`}>
                        <li onClick={() => {
                            navigate('/')
                            setIsOpen(false)
                        }}>Home</li>
                        <li onClick={() => alert('😅 Oops! This Page is under construction.')}>Works</li>
                        <li onClick={() => alert('😅 Oops! This Feature is under construction.')}>Search</li>
                    </ul>
                </ResponsiveMobile>
            </div>
        </nav>
    )
}

export default GlobalNavigationBar;