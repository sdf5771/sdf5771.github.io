import { forwardRef } from 'react';
import styles from './ArchiveYearSection.module.css';
import ArchiveRow from './ArchiveRow';
import { yearSectionId, type ArchiveYear } from '../../data/archive';

function yearListId(year: string): string {
    return `${yearSectionId(year)}-list`;
}

interface ArchiveYearSectionProps {
    section: ArchiveYear;
    isExpanded: boolean;
    onToggle: () => void;
}

/**
 * 연도 섹션 하나.
 * 명세: docs/handoff-step6-tags-archive.md §2-4 · §8-1 · §8-7 · §11-2
 *
 * 🔴 **전 연도 기본 펼침입니다.** 시안의 "모바일에서 2023년만 기본 접힘" 은
 *    반려됐습니다 — 2023을 접으면 모바일 첫 화면에 41편 중 12편(29%)만 남고,
 *    유일하게 조밀한 해가 사라져 *"최근 2년이 비었다"* 는 인상을 오히려
 *    강화합니다. 브리프가 피하라고 한 바로 그 효과입니다. 게다가 같은 URL 이
 *    기기별로 다른 화면을 냅니다. 전량 펼침은 모바일에서 약 3,400px = 4.0화면
 *    이라 블로그 아카이브로는 정상 범위입니다.
 *
 * 접기는 **제공은 합니다** — 위치 상실 대책은 접기가 아니라 **sticky 연도 헤더**
 * 입니다(CSS). 2023년 29행을 스크롤하는 내내 `2023 · 29편` 이 상단에 붙어 있습니다.
 *
 * 🔴 접힌 섹션의 행은 **DOM 에서 제거**합니다(`display: none` 이 아니라 언마운트).
 *    접힌 29행이 탭 순서에 남으면 Tab 을 스물아홉 번 눌러야 다음 섹션에
 *    도달합니다(§10-4).
 *
 * 🔴 접기 표시는 **회전이 아니라 문자 교체**입니다(`▾` ↔ `▸`, §11-2).
 *    회전을 쓰지 않으면 `prefers-reduced-motion` 분기 자체가 필요 없어집니다 —
 *    모션이 없으므로 저감할 것도 없습니다. 두 글리프 모두 Galmuri 서브셋에
 *    존재함이 확인됐습니다(§9-2a).
 */
const ArchiveYearSection = forwardRef<HTMLHeadingElement, ArchiveYearSectionProps>(
    function ArchiveYearSection({ section, isExpanded, onToggle }, ref) {
        const headingId = yearSectionId(section.year);
        const listId = yearListId(section.year);

        return (
            /*
             * 🔴 `overflow: hidden` 을 걸지 마십시오. 시안의 섹션 카드가 그랬는데,
             *    그러면 안쪽 sticky 헤더가 동작하지 않습니다. 라운드는 헤더가
             *    직접 갖습니다(§2-4).
             */
            <section className={styles.section} aria-labelledby={headingId}>
                {/*
                 * 🔴 `id` 는 **헤딩 하나만** 갖습니다. 섹션에도 같은 id 를 주면
                 *    문서에 중복 id 가 생겨 `aria-labelledby` 가 어느 쪽을 가리키는지
                 *    미정의가 됩니다. 앵커(`#year-2023`)도 이 헤딩으로 착지하고,
                 *    sticky 요소라도 스크롤 목적지는 정상 흐름상의 위치입니다.
                 *
                 * 스크롤 목적지이자 포커스 목적지입니다. 앵커로 점프했을 때
                 * 여기로 포커스를 옮기지 않으면, 저감 모드에서 스크롤이 즉시
                 * 점프할 때 어디로 갔는지 알 수 없습니다(§11-4).
                 */}
                <h2 className={styles.heading} id={headingId} ref={ref} tabIndex={-1}>
                    <button
                        className={styles.toggle}
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={listId}
                        onClick={onToggle}
                    >
                        {/* 33px — 숫자라 픽셀 서체 규칙을 통과합니다 */}
                        <span className={styles.year}>{section.year}</span>
                        {/*
                         * 구분자는 `·` 입니다. 시안은 `2023` | `29개` 로 분리했습니다.
                         * `개` 가 한글이라 픽셀 서체를 쓸 수 없어 Pretendard 13px 이고,
                         * 세는 대상이 글이므로 수량사는 `편` 입니다(WRITING_GUIDE §3.4).
                         */}
                        <span className={styles.count}>{`· ${section.posts.length}편`}</span>
                        {/* 상태는 aria-expanded 가 나릅니다. 이 글리프는 장식입니다 */}
                        <span className={styles.marker} aria-hidden="true">
                            {isExpanded ? '▾' : '▸'}
                        </span>
                    </button>
                </h2>

                {isExpanded && (
                    <ul className={styles.list} id={listId}>
                        {section.posts.map(post => (
                            <ArchiveRow key={post.slug} post={post} />
                        ))}
                    </ul>
                )}
            </section>
        );
    },
);

export default ArchiveYearSection;
