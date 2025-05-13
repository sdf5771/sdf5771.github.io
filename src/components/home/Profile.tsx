import styles from './Profile.module.css';

function Profile() {
    return (
        <div className={styles.profile_root}>
            <div className={styles.info_container}>
                <div className={styles.info_wrapper}>
                    <div className={styles.name_container}>
                        <span className={styles.name}>Seobisback</span>
                        <span className={styles.tag}>코.딩.좋.아?</span>
                    </div>
                    <div className={styles.image_container}>
                        <img src="https://avatars.githubusercontent.com/sdf5771" alt="github profile" />
                    </div>
                </div>
                <div className={styles.vertical_divider} />
                <div className={styles.introduce_wrapper}>
                    <div className={styles.introduce_box}>
                        <span>Frontend 개발자 김섭우입니다.</span>
                    </div>
                    <div className={styles.introduce_box}>
                        <span>더 나은 서비스를 제공하는 방법을 고민해서 개발하는 것을 좋아합니다.</span>
                    </div>
                    <div className={styles.introduce_box}>
                        <span>해당 블로그에는 학습하거나 조사한 내용을 바탕으로 블로그에 기록하고 있습니다.</span>
                    </div>
                </div>
                <div className={styles.vertical_divider} />
                <div className={styles.contact_wrapper}>
                    <div className={styles.title}>
                        <span>Contact & Channel</span>
                    </div>
                    <div className={styles.contact_box}>
                        <span>Github</span>
                        <span> | </span>
                        <a href="https://github.com/sdf5771">https://github.com/sdf5771</a>
                    </div>
                    <div className={styles.contact_box}>
                        <span>Notion</span>
                        <span> | </span>
                        <a href="https://tender-lemongrass-345.notion.site/f8dcc2d59c1045368ed2023ac9327029?pvs=4">Notion Portpolio Link</a>
                    </div>
                    <div className={styles.contact_box}>
                        <span>Blog</span>
                        <span> | </span>
                        <a href="https://sdf5771.github.io">https://sdf5771.github.io</a>
                    </div>
                    <div className={styles.contact_box}>
                        <span>Email</span>
                        <span> | </span>
                        <a href="mailto:seobisback@gmail.com">seobisback@gmail.com</a>
                    </div>
                </div>
            </div>
            <div className={styles.horizontal_divider} />
            <div className={styles.github_chart_container}>
                <div className={styles.chart_title}>
                    <span>🌱 자라나라 <strong>잔디 잔디</strong></span>
                </div>
                <img src="https://ghchart.rshah.org/33333/sdf5771" alt="github chart" />
            </div>
            <div className={styles.horizontal_divider} />
            <div className={styles.stats_container}> 
                <div className={styles.stats_title}>
                    <span>🏅 Stats</span> 
                </div>
                <div className={styles.stats_wrapper}> 
                    <div className={styles.stats_box}>
                        <img src="https://github-readme-stats.vercel.app/api/top-langs?username=sdf5771&show_icons=true&locale=en&layout=compact" alt="sdf5771" />
                        <img src="https://github-readme-stats.vercel.app/api?username=sdf5771&show_icons=true&theme=tokyonight&locale=en" alt="sdf5771" />
                    </div>
                    <div className={styles.trophy_box}>
                        <img src="https://github-profile-trophy.vercel.app/?username=sdf5771&theme=dark_lover" alt="github trophy" />
                    </div>
                </div> 
            </div>
        </div>
    );
}

export default Profile;