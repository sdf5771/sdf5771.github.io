import { Link } from 'react-router-dom';
import styles from './WorkRow.module.css';
import WorkGlyph from './WorkGlyph';
import WorkStack from './WorkStack';
import type { WorkMetadata } from '../../types';
import { HAS_ANY_WORK_DETAIL, WORK_TYPE_LABEL } from '../../data/works';
import { WORKS_PATH } from '../../constants/site';
import { formatWorkPeriod } from '../../utils/workMeta';

/**
 * 작업 목록의 한 행.
 * 명세: docs/handoff-step7-works.md §5-2 · §5-3 · §4-2 · §12-2
 *
 * 🔴 **STEP 4 의 `PostRow` 를 재사용하지 않습니다 — 형제 컴포넌트입니다**(§5-0).
 *
 * | 축 | `PostRow` (`/posts`) | 이 컴포넌트 |
 * |---|---|---|
 * | 컨테이너 | 행 전체가 하나의 `<a>` | `<li>`. 링크는 제목에만, **없을 수도 있음** |
 * | 슬롯 | `96px 1fr 216px` (썸네일·본문·메타) | `96px 1fr`. 우측 메타 열 없음 |
 * | 요약 | **제거됨** (41편 중 40편이 기계 추출 파편) | **필수** — 유일한 판단 재료 |
 * | 그룹 | 없음(페이지네이션) | 연도 그룹 |
 *
 * 구조가 다릅니다. `PostRow` 를 파라미터화하면 조건 분기가 컴포넌트를 지배합니다.
 * 공유하는 것은 **토큰과 상태 규칙**(호버 배경·스트레치 링크·포커스 링)뿐입니다.
 *
 * 🔴 요약을 빼지 않습니다. 글 목록은 뺐지만 작업은 **썸네일이 0장이고 제목이
 *    익명화**되어 요약이 유일한 판단 재료입니다. 같은 규칙을 기계적으로 옮기면
 *    안 되는 지점입니다(§3-3).
 */

/**
 * 🔴 이 화면의 핵심 장치 — **상세 보유 건수에 따른 3분기**(§4-2).
 *
 * | 상태 | 행의 모습 |
 * |---|---|
 * | ① 상세 0건 (초기 릴리스 · **기본 시나리오**) | 액션 줄 없음 · `기록 준비 중` 없음 · 레일 균질 → **15행이 완전히 같음** |
 * | ② 혼재 | 3중 단서(골드 레일 · 상시 `→` · `기록 준비 중`) |
 * | ③ 전부 | 전 항목 골드 레일 + 제목 링크 + `→` |
 *
 * ①에서 **`기록 준비 중` 을 렌더하지 않는 것**이 결정적입니다. 15번 반복되면
 * "고장" 보다 나쁜 "미완성" 으로 읽힙니다(§2-5). 상세가 하나도 없으면 어떤 행에도
 * 링크 어포던스가 없으므로 *"왜 이건 안 눌리지"* 가 원리적으로 발생하지 않습니다.
 *
 * 🔴 `aria-disabled` 는 반려됐습니다(§4-1). 링크가 포커스는 받으면서 아무 데도
 *    가지 않으면 키보드 사용자가 15번 탭해서 15번 아무 일도 겪지 않게 됩니다.
 *    **상세가 없으면 `<a>` 를 아예 렌더하지 않습니다** — 제목이 평문 `<h3>` 이고
 *    포커스 불가이며 접근성 트리에 링크가 없습니다.
 */
function WorkRow({ work }: { work: WorkMetadata }) {
    const period = formatWorkPeriod(work.start, work.end);
    const typeLabel = WORK_TYPE_LABEL[work.type];

    /* 혼재 상태에서만 "이 행은 왜 안 눌리는가" 를 말해 줍니다 */
    const isPendingNoticeVisible = HAS_ANY_WORK_DETAIL && !work.hasBody;

    return (
        <li className={styles.row} data-has-detail={work.hasBody ? 'true' : undefined}>
            {/* 좌측 2px 레일. 색 단독 전달이 아니라 `→`·텍스트와 병기됩니다(§7.5) */}
            <span className={styles.rail} aria-hidden="true" />

            {/*
             * 🔴 모바일(≤767px)에서는 CSS 가 이 슬롯을 숨깁니다(§7-2).
             *    358px 그래픽이 가용 346px 을 12px 넘겨 `<body>` 가로 스크롤을
             *    만들고, 72px × 15 = 1,080px 를 정보 0 으로 더합니다.
             *    장식(`aria-hidden`)이라 빼도 정보 손실이 0 입니다.
             */}
            <WorkGlyph className={styles.graphic} slug={work.slug} stackCount={work.stack.length} />

            <div className={styles.body}>
                {/*
                 * 메타 줄 — 유형 · 기간 · 역할.
                 * 🔴 유형을 **테두리 배지로 만들지 않습니다**(§5-3). 별도 줄이면
                 *    행이 31px 높아지고, 15건이면 뷰포트 절반을 더 씁니다.
                 * 🔴 서체가 갈립니다: 기간은 라틴이라 GalmuriMono11 11px,
                 *    유형·역할은 한글이라 Pretendard 12px(§10-1 11번).
                 */}
                <p className={styles.meta}>
                    <span className={styles.type}>{typeLabel}</span>
                    <span className={styles.separator} aria-hidden="true">
                        ·
                    </span>
                    <span className={styles.period}>{period.months}</span>
                    {period.isOngoing && (
                        <span className={styles.ongoing}>
                            {/* 색 단독 전달 금지 — 점 옆에 텍스트가 반드시 옵니다(§7.5) */}
                            <span className={styles.ongoing_dot} aria-hidden="true" />
                            진행 중
                        </span>
                    )}
                    <span className={styles.separator} aria-hidden="true">
                        ·
                    </span>
                    <span className={styles.role}>{work.role}</span>
                    {/*
                     * 🔴 `org` 를 여기 붙이지 마세요(§13-1 안 A). 목록이 연도
                     *    내림차순이라 항목별 회사명은 **소속 전환 시점을 그대로
                     *    역산**시킵니다.
                     */}
                </p>

                <h3 className={styles.heading}>
                    {work.hasBody ? (
                        /*
                         * 🔴 링크는 **제목만** 감쌉니다. 접근 가능한 이름이 곧 작업
                         *    제목이 되어 WRITING_GUIDE §7.2 를 완전히 충족합니다.
                         *    행 전체 클릭은 CSS 의 `.link::after` 스트레치가 맡습니다.
                         *
                         * 🔴 `자세히 보기 →` 를 쓰지 않습니다(§2-5). §7.2 가 `자세히`
                         *    를 명시 금지하고, 15행에 같은 텍스트가 반복되면
                         *    스크린리더 링크 목록에 목적지를 알 수 없는 항목이
                         *    15개 쌓입니다.
                         */
                        <Link className={styles.link} to={`${WORKS_PATH}/${work.slug}`}>
                            {work.title}
                            {/* 상시 표시입니다 — 호버로 등장하지 않습니다(§4-2 ②) */}
                            <span className={styles.arrow} aria-hidden="true">
                                →
                            </span>
                        </Link>
                    ) : (
                        work.title
                    )}
                </h3>

                {/*
                 * 🔴 `summary` 는 15건 전부 비어 있습니다(저자만 쓸 수 있는 값).
                 *    빈 문자열을 그대로 렌더하면 행에 정체불명의 빈 줄이 남으므로
                 *    **줄 자체를 렌더하지 않습니다.**
                 */}
                {work.summary && <p className={styles.summary}>{work.summary}</p>}

                <div className={styles.footer}>
                    <WorkStack stack={work.stack} />

                    <div className={styles.status}>
                        {work.relatedPost && (
                            <Link
                                className={styles.related}
                                to={`/posts/${work.relatedPost}`}
                                /* 15행에 같은 문구가 반복될 수 있어 이름에 작업명을 넣습니다(§7.3) */
                                aria-label={`${work.title} 관련 글 보기`}
                            >
                                관련 글 보기
                            </Link>
                        )}

                        {work.links.map(link => (
                            <a
                                key={link.url}
                                className={styles.external}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${link.label} (새 창)`}
                            >
                                {link.label}
                                <span aria-hidden="true"> ↗</span>
                            </a>
                        ))}

                        {isPendingNoticeVisible && (
                            <span className={styles.pending}>기록 준비 중</span>
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
}

export default WorkRow;
