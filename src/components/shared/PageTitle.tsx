import styles from './PageTitle.module.css';
import { useEffect, useRef } from 'react';

export default function PageTitle({ title }: { title: string }) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            const text = title;
            for (let i = 0; i < text.length; i++) {
                setTimeout(() => {
                    titleRef.current!.textContent = text.slice(0, i + 1);
                }, i * 100);
            }
        }, 1500);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [title]);

    return (
        <div className={styles.title}>
            <h1 ref={titleRef}>{title.slice(0, 1)}</h1>
        </div>
    )
}