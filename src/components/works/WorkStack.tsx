import { useId, useState } from 'react';
import styles from './WorkStack.module.css';

/**
 * 기술 스택 칩 + `+N` 펼치기.
 * 명세: docs/handoff-step7-works.md §5-4 · §7-1 · §12-2
 *
 * 실측 분포는 0~13개입니다(13개짜리가 1건, 원본에 스택이 없는 사이드 3건이 0개).
 * **접힘 상태가 1행 고정**이라 3개짜리와 13개짜리가 같은 행 높이를 갖습니다 —
 * 그게 8건 그룹과 1건 그룹이 같은 페이지에 놓여도 리듬이 안 깨지는 이유입니다.
 *
 * 🔴 **펼치면 실제로 13개가 보여야 합니다**(§13 1번). 시안은 컨테이너에
 *    `height:24px; overflow:hidden` 을 걸어 둔 채 배열만 넘겨서, `+8` 을 눌러도
 *    화면이 그대로였습니다. 13개 총폭 ≈1,047px > 콘텐츠 폭 844px 이라 펼치면
 *    **반드시 2행**이 됩니다 → 펼침 시 높이 고정을 해제하고 wrap 을 허용합니다.
 *
 * 🔴 노출 개수가 데스크톱 5 / 모바일 3 으로 **다릅니다.** 분기는 전부 CSS 가
 *    합니다 — JS 로 뷰포트를 읽으면 첫 렌더가 항상 데스크톱 기준이라 칩이 두 개
 *    그려졌다 사라지고, 프리렌더 HTML 과도 어긋납니다(PostRow 와 같은 판정).
 *    그래서 칩은 **전부 DOM 에 있고** 보이는 개수만 CSS 가 정합니다.
 *
 * 🔴 칩은 **링크가 아닙니다**(`<span>`). 기술별 필터·태그 페이지가 없습니다.
 *    커서·호버 효과를 주지 마세요 — 눌리는 것처럼 보이면 안 됩니다.
 */

/** 접힘 상태 노출 개수. CSS 의 `:nth-child` 경계와 **반드시 같아야 합니다** */
const VISIBLE_DESKTOP = 5;
const VISIBLE_MOBILE = 3;

function WorkStack({ stack }: { stack: readonly string[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const listId = useId();

    /* 스택이 비면(사이드 3건) 줄 자체를 렌더하지 않습니다 — 빈 칩 줄은 정보가 없습니다 */
    if (stack.length === 0) {
        return null;
    }

    const hiddenDesktop = Math.max(0, stack.length - VISIBLE_DESKTOP);
    const hiddenMobile = Math.max(0, stack.length - VISIBLE_MOBILE);

    return (
        <div className={styles.wrap}>
            <ul className={styles.list} id={listId} data-expanded={isExpanded ? 'true' : undefined}>
                {stack.map(item => (
                    /*
                     * 스택명은 전부 라틴이라 GalmuriMono11 11px 이 픽셀 서체 규칙을
                     * 통과합니다(STEP 1 §3-3a). 한글 스택명이 생기면 서체를
                     * Pretendard 로 내려야 합니다.
                     */
                    <li key={item} className={styles.chip}>
                        {item}
                    </li>
                ))}
            </ul>

            {hiddenMobile > 0 && (
                <button
                    className={styles.more}
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={listId}
                    /* 데스크톱에서 숨길 항목이 없으면 버튼도 없습니다 — CSS 가 판정합니다 */
                    data-desktop-hidden={hiddenDesktop > 0 ? 'true' : 'false'}
                    onClick={() => setIsExpanded(current => !current)}
                >
                    {isExpanded ? (
                        /* `접기` 는 한글이라 Pretendard 12px 입니다(§10-1 15번) */
                        <span className={styles.label}>접기</span>
                    ) : (
                        <>
                            {/*
                             * 보이는 텍스트(`+8`)만으로는 뜻이 통하지 않아 이름을 따로
                             * 줍니다(WRITING_GUIDE §6.8 준용). 데스크톱·모바일에서
                             * 숨는 개수가 다르므로 **이름도 함께 갈립니다** — 한쪽은
                             * `display: none` 이라 접근 가능한 이름 계산에서 빠집니다.
                             */}
                            <span className={styles.count_desktop} aria-hidden="true">
                                {`+${hiddenDesktop}`}
                            </span>
                            <span className={styles.count_mobile} aria-hidden="true">
                                {`+${hiddenMobile}`}
                            </span>
                            <span className={`sr-only ${styles.name_desktop}`}>
                                {`기술 ${hiddenDesktop}개 더 보기`}
                            </span>
                            <span className={`sr-only ${styles.name_mobile}`}>
                                {`기술 ${hiddenMobile}개 더 보기`}
                            </span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

export default WorkStack;
