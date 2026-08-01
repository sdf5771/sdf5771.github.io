import styles from './Footer.module.css';
import Wordmark from './Wordmark';
import { CONTACT_LINKS, COPYRIGHT, SITE_DESCRIPTION, WORDMARK_TEXT } from '../../constants/site';

function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <div className={styles.identity}>
                    <Wordmark className={styles.wordmark} />
                    <p className={styles.description}>{SITE_DESCRIPTION}</p>
                </div>

                <nav className={styles.contacts} aria-label={`${WORDMARK_TEXT} 연락처`}>
                    <ul className={styles.contact_list}>
                        {CONTACT_LINKS.map(link => (
                            <li key={link.label}>
                                <a className={styles.contact_link} href={link.href}>
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <p className={styles.copyright}>{COPYRIGHT}</p>
            </div>
        </footer>
    );
}

export default Footer;
