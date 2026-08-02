/**
 * 작업물 스키마.
 * 명세: docs/handoff-step7-works.md §15-2 · agent-log/product.md §13-3
 *
 * 🔴 **`PostMetadata` 와 한 타입으로 묶지 마세요.** 글에는 카테고리·태그·읽기
 *    시간이 필요하고 작업에는 기간·역할·스택이 필요합니다. 한 스키마로 묶으면
 *    양쪽 다 선택 필드투성이가 되고, 그 순간 "작업물이 글 목록에 새어 들어가지
 *    않는다" 는 물리적 보장이 타입 수준에서 무너집니다(product.md §13-3).
 */
export interface WorkMetadata {
    /**
     * URL 정본 slug. **파일명 = slug** 입니다(글과 달리 날짜 접두가 없습니다).
     * 규칙 W1(`[a-z0-9-]`)·W3(고객사 실명 금지)·W5(≤40자)는 빌드가 검증합니다.
     */
    slug: string;
    /** 익명 표기안(product.md §13-5). 실측 최장 37자 → 목록에서 2행 클램프 */
    title: string;
    /** `YYYY-MM`. **정렬·연도 그룹핑의 유일한 근거**입니다 */
    start: string;
    /** `YYYY-MM`. **빈 문자열이면 `진행 중`** 으로 표시합니다 */
    end: string;
    /** 필터 · URL `?type=` */
    type: WorkType;
    /** 한국어. `프론트엔드 개발` · `개발 리드` 등 (WRITING_GUIDE §3.3 — 영어 라벨 금지) */
    role: string;
    /**
     * 소속.
     *
     * 🔴 **스키마에는 남기되 목록·상세 어디에서도 렌더하지 않습니다**
     *    (handoff-step7-works.md §13-1 안 A). 목록이 연도 내림차순이라 항목별
     *    회사명을 표기하면 **소속 전환 시점이 그대로 역산**되고, 그건 "정확한
     *    입·퇴사일을 쓰지 않는다" 는 원칙을 우회로 침해합니다.
     */
    org: string;
    /** 실측 0~13개. 5개(모바일 3개) 초과분은 `+N` 뒤로 접힙니다 */
    stack: string[];
    /**
     * 60~90자 한 문장. **행에서 유일한 판단 재료**입니다(썸네일 0장 · 제목 익명화).
     *
     * 🔴 **저자만 쓸 수 있는 필드라 지금은 15건 전부 비어 있습니다.**
     *    비어 있으면 요약 줄 자체를 렌더하지 않습니다 — 빈 문자열이 그대로
     *    나가면 행에 정체불명의 빈 줄이 남습니다.
     */
    summary: string;
    links: WorkLink[];
    /** 관련 글 slug. 있으면 행·상세에 `관련 글 보기` 가 붙습니다 */
    relatedPost: string;
    /**
     * `public/_works/<slug>.md` 에 **렌더할 본문이 있는가.** 빌드가 판정합니다.
     *
     * 🔴 이 플래그 하나가 세 가지를 정합니다(§4-4).
     *    ① `/works/<slug>` 라우트의 존재 여부 (false 면 404)
     *    ② 목록 행의 제목이 링크인가 평문인가
     *    ③ 골드 레일·`→`·`기록 준비 중` 3중 단서의 표시 여부
     *    본문 문자열은 목록에 싣지 않습니다 — 상세에서 fetch 합니다.
     */
    hasBody: boolean;
}

export type WorkType = 'work' | 'personal';

export interface WorkLink {
    label: string;
    url: string;
}
