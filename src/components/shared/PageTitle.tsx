import styles from './PageTitle.module.css';
import Typewriter from 'typewriter-effect';

export default function PageTitle({ title }: { title: string }) {

    return (
        <div className={styles.title}>
            <Typewriter
                options={{
                    strings: [title],
                    autoStart: true,
                    loop: true,
                    wrapperClassName: styles.typewriter,
                    cursorClassName: styles.cursor,
                }}
            />
        </div>
    )
}