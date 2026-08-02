import { Link } from 'react-router-dom';
import styles from './ArchiveRow.module.css';
import type { PostMetadata } from '../../types';
import { formatArchiveDate } from '../../data/archive';
import { formatReadingMinutes } from '../../utils/postMeta';

/**
 * 연도별 보기의 한 행.
 * 명세: docs/handoff-step6-tags-archive.md §8-1 · §8-2 · §8-3
 *
 * 🔴 **STEP 4 의 `PostRow` 를 재사용하지 않습니다 — 별도 컴포넌트입니다.**
 *
 * | 축 | `PostRow` (`/posts`·`/tags/:tag`) | 이 컴포넌트 |
 * |---|---|---|
 * | 좌측 슬롯 | 96×64 생성 그래픽 | **날짜 `MM.DD`** |
 * | 날짜 | `2023.04.13` | **`04.13`** (연도는 섹션 헤더가 담당) |
 * | 태그 칩 | 3개 + `+N` | **없음** |
 * | 읽기 시간 | 표시 | **데스크톱만** |
 * | NEW 배지 | 있음(현재 0건) | **없음** |
 * | 행 높이 | 92~102px | 약 62~75px |
 *
 * **공통 슬롯이 하나도 없습니다.** prop 으로 흡수하면 `showThumbnail`·`showTags`·
 * `showReadingTime`·`dateFormat`·`showNewBadge` 다섯 분기가 한 컴포넌트에 쌓이고,
 * 그중 어떤 조합도 실제로는 쓰이지 않습니다. 공유하는 것은 **토큰과 상태 규칙**
 * (호버 배경·좌측 카테고리 바·포커스 링·스트레치 링크)이지 컴포넌트가 아닙니다.
 * §1-1 R-3 과 같은 판정입니다.
 *
 * 🔴 **NEW 배지를 두지 않습니다**(§9-3). 배지는 *날짜순이 아닌 목록에서 최신 글을
 *    골라내는* 장치인데, 연도별 목록에서는 첫 섹션 첫 행이 곧 최신 글이라 정보가
 *    완전히 중복됩니다. 게다가 `NEW` 하나가 2025년 섹션에만 붙으면 "2025년만
 *    활성" 이라는 인상을 만들어 브리프가 피하라고 한 바로 그 효과를 냅니다.
 */
function ArchiveRow({ post }: { post: PostMetadata }) {
    const readingMinutes = formatReadingMinutes(post.readingMinutes);

    return (
        <li className={styles.row} data-category={post.category}>
            {/*
             * `04.13` 은 숫자·기호뿐이라 GalmuriMono11 11px 이 규칙을 통과합니다.
             *
             * 🔴 **`aria-hidden` 을 걸지 마세요.** 이 화면의 주 과업이 "언제 무엇을
             *    썼는가" 인데, 감추면 보조기술 사용자가 듣는 것은 `제목 · 카테고리 ·
             *    읽기 시간` 뿐이고 월·일이 통째로 사라집니다(연도는 섹션 헤딩에만
             *    있습니다). §10-2 의 aria-hidden 목록은 장식 기호 `▸ ▾ # ● →` 뿐이고
             *    날짜는 거기 없습니다. 비교 대상인 `PostRow` 도 날짜를 노출합니다.
             */}
            <span className={styles.date}>{formatArchiveDate(post.date)}</span>

            {/*
             * 링크는 **제목만** 감쌉니다. 행 전체를 <a> 로 감싸면 접근 가능한
             * 이름에 날짜·카테고리·읽기 시간이 섞여 들어가 스크린리더의 링크
             * 목록에서 글을 구분할 수 없습니다. 행 전체 클릭은 CSS 의
             * `.link::after` 스트레치가 맡습니다(STEP 4 §10-2 와 같은 구조).
             */}
            <h3 className={styles.heading}>
                <Link className={styles.link} to={`/posts/${post.slug}`}>
                    {post.title}
                </Link>
            </h3>

            <p className={styles.meta}>
                {/* 카테고리는 색 점 + 텍스트 라벨 병기. 색 단독 전달 금지(WRITING_GUIDE §7.5) */}
                <span className={styles.category}>
                    <span className={styles.category_dot} aria-hidden="true" />
                    {post.category}
                </span>

                {/*
                 * 읽기 시간은 **모바일에서 표시하지 않습니다**(§8-2). 41편 중 17편이
                 * `1분` 이라 정보량이 낮고, 좁은 폭에서는 제목이 우선입니다.
                 * 숨기는 것은 CSS 가 합니다 — JS 로 뷰포트를 읽으면 첫 렌더가
                 * 어긋납니다. `분` 이 한글이라 서체는 Pretendard 12px 입니다.
                 */}
                {readingMinutes && (
                    <span className={styles.reading}>{readingMinutes}</span>
                )}
            </p>
        </li>
    );
}

export default ArchiveRow;
