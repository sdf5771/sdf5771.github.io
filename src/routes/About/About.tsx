import { useMemo } from 'react';
import styles from './About.module.css';
import memoji from '../../assets/images/memoji.png';
import postsData from '../../../public/posts-data.json';
import { ContributionGraph } from '../../components/shared';
import { ABOUT_CONTACT_LINKS, EMAIL_URL, RESUME_URL } from '../../constants/site';
import { useMediaMatch } from '../../hooks';
import { MEDIA_MOBILE } from '../../styles/breakpoints';
import { rankTags } from '../../utils/tags';

/**
 * 소개(About).
 * 명세: docs/handoff-step5-404-about.md §7
 *
 * 사용자가 여기서 하려는 일: 이 사람이 무엇을 하는 사람인지 **검증 가능한
 * 정보로** 확인하고, 필요하면 연락한다.
 *
 * 🔴 「자기소개 → 기여 활동」 순서를 바꾸지 마세요. 자기소개의
 *    `요즘은 … 들여다보고 있습니다` 가 최신 글(2025.05.26)과 어긋나 보일 수
 *    있는데, **바로 아래 기여 활동이 "지금도 활동 중"의 증거**가 되어 그 리스크를
 *    흡수합니다. 그 배치가 장치입니다(§7-2).
 *
 * 🚫 이 화면에 넣지 않는 것: `OPEN TO WORK` · 이력서 다운로드 버튼 ·
 *    자기 신고 수치(`React Lv.9`) · 전화번호 · 증명사진 · 학력.
 */

/**
 * 노출 태그 6개.
 *
 * 🔴 **동점 그룹 중간에서 자르지 않습니다.** 7위부터 6개가 전부 3회 동점이라
 *    그 안에서 자르면 임의 선택이 됩니다. 6개가 그 규칙을 만족하는 최대 집합입니다.
 *    (`Front-end` → `Frontend` 병합으로 Frontend 가 4회가 된 것이 전제입니다.)
 */
const TOP_TAG_COUNT = 6;

const AVATAR_SIZE_DESKTOP = 120;
const AVATAR_SIZE_MOBILE = 80;

function About() {
    const isMobileViewport = useMediaMatch(MEDIA_MOBILE);
    const topTags = useMemo(() => rankTags(postsData).slice(0, TOP_TAG_COUNT), []);

    const avatarSize = isMobileViewport ? AVATAR_SIZE_MOBILE : AVATAR_SIZE_DESKTOP;

    return (
        <div className={styles.root}>
            <div className={styles.inner}>
                <h1 className={styles.title}>소개</h1>

                <section className={styles.intro}>
                    {/*
                     * 바로 옆에 `프론트엔드 개발자 김섭우입니다` 가 있으므로 alt 는
                     * 비웁니다. memoji 일러스트의 외형 설명은 정보량이 0 입니다.
                     * width/height **속성**이 있어야 로드 전에 자리가 잡혀 CLS 가 0 입니다
                     * (CSS width 만으로는 예약 공간이 안 잡힙니다).
                     * loading="lazy" 를 걸지 않습니다 — 첫 화면 요소라 오히려 늦어집니다.
                     */}
                    <img
                        className={styles.avatar}
                        src={memoji}
                        alt=""
                        aria-hidden="true"
                        width={avatarSize}
                        height={avatarSize}
                        decoding="async"
                    />

                    {/* 의미 단위가 달라 <p> 3개로 둡니다. 한 덩어리로 합치지 않습니다 */}
                    <div className={styles.intro_text}>
                        <p>프론트엔드 개발자 김섭우입니다.</p>
                        <p>
                            더 나은 서비스를 만드는 방법을 고민하고, 공부하거나 조사한 내용을
                            여기에 남깁니다.
                        </p>
                        <p>
                            요즘은 브라우저에서 돌아가는 AI API와 렌더링 성능을 주로 들여다보고
                            있습니다.
                        </p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.heading}>
                        <span className={styles.prompt} aria-hidden="true">
                            ${' '}
                        </span>
                        자주 쓴 태그
                    </h2>

                    {/*
                     * 이 문장이 **필수**입니다. 없으면 `Python 16개` 의 16 이 실력
                     * 점수로 오독되어 WRITING_GUIDE §5.3(자기 신고 수치 금지) 위반과
                     * 구별되지 않습니다. 수치가 무엇인지 밝히는 문장을 칩과 **같은
                     * 블록**에 두라는 §5.3 신설 조항도 여기서 충족합니다.
                     * 41 도 하드코딩하지 않습니다 — 글이 늘면 이 문장 자체가 거짓이
                     * 됩니다. 글을 세는 단위는 `개` 입니다(§3.4, `편`은 내부 문서 전용).
                     */}
                    <p className={styles.section_note}>
                        글 {postsData.length}개에 가장 많이 붙은 태그입니다. 이 블로그에 쓴
                        글에서 각 태그가 등장한 횟수입니다.
                    </p>

                    <ul className={styles.chips}>
                        {topTags.map(tag => (
                            /*
                             * 🔴 <a> 가 아니라 <li>+<span> 입니다.
                             * 태그 페이지 `/tags/<태그>` 는 P1(STEP 6)이고 STEP 4 의
                             * 태그 필터 URL 도 아직 없습니다. 목적지가 없는 상태에서
                             * <a> 로 두면 죽은 링크가 됩니다 — 그게 최악입니다.
                             * 둘 중 하나가 나오면 여기만 <Link> 로 바꾸세요.
                             */
                            <li className={styles.chip} key={tag.label}>
                                {/*
                                 * 단위 `개` 를 붙입니다(§3.4). 맨숫자 `Python 16` 은
                                 * §5.3 의 ❌ 예시(`React Lv.9`)와 형태가 같아, 개수가
                                 * 아니라 자기 신고 등급으로 읽힙니다.
                                 * §5.3 의 ✅ 대체안인 「해당 태그 글로 연결」은 목적지
                                 * (`/tags/<태그>`)가 아직 없어 STEP 6 소관입니다.
                                 */}
                                <span aria-hidden="true">
                                    {tag.label} {tag.count}개
                                </span>
                                {/* 화면 표기(`Python 16개`)만으로는 16 이 무엇인지 음성에서 알 수 없습니다 */}
                                <span className="sr-only">
                                    {tag.label} 태그 글 {tag.count}개
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className={styles.section}>
                    <ContributionGraph showPrompt />
                </section>

                <section className={styles.section}>
                    <h2 className={styles.heading}>
                        <span className={styles.prompt} aria-hidden="true">
                            ${' '}
                        </span>
                        연락처
                    </h2>

                    <ul className={styles.contacts}>
                        {ABOUT_CONTACT_LINKS.map(link => {
                            const isExternal = link.href !== EMAIL_URL;

                            return (
                                <li key={link.label}>
                                    <a
                                        className={styles.contact_card}
                                        href={link.href}
                                        {...(isExternal
                                            ? {
                                                  target: '_blank',
                                                  rel: 'noopener noreferrer',
                                                  /* 🔴 보이는 텍스트로 시작해야 음성
                                                     제어에서 이름이 맞습니다(§7.3-1).
                                                     라벨 자체가 이미 동사로 끝나므로
                                                     여기서는 `(새 창)` 만 덧붙입니다 */
                                                  'aria-label': `${link.label} (새 창)`,
                                              }
                                            : {})}
                                    >
                                        {link.label}
                                        {isExternal && <span aria-hidden="true"> ↗</span>}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                {/*
                 * 이 사이트 전체에서 구직과 관련된 **유일한 요소**입니다.
                 * 상단·CTA 자리로 올리지 마세요. 버튼 배경·보더를 붙이지도 않습니다.
                 */}
                <p className={styles.resume}>
                    <a
                        className={styles.resume_link}
                        href={RESUME_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="이력서 보기 (새 창)"
                    >
                        이력서 보기 <span aria-hidden="true">↗</span>
                    </a>
                </p>
            </div>
        </div>
    );
}

export default About;
