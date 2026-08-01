/**
 * 사이트 전역에서 쓰는 확정 문구·링크.
 * 노출 텍스트는 docs/WRITING_GUIDE.md 기준이며, 확정본은 handoff-step1-shell.md §9 입니다.
 * 새 문구를 여기서 지어내지 마세요.
 */

/**
 * 워드마크 표기. **바뀔 수 있으므로 이 객체가 유일한 정의처입니다.**
 * 여기 한 곳만 고치면 헤더·푸터·aria-label 이 함께 바뀝니다.
 * 문자열을 컴포넌트에 직접 적지 마세요.
 */
export const WORDMARK = {
    /** --color-text-primary 로 렌더 */
    base: 'Seobisback',
    /** --color-accent-text 로 렌더 */
    accent: '.log',
} as const;

/** 스크린리더·aria-label·document.title 용 단일 문자열 */
export const WORDMARK_TEXT = `${WORDMARK.base}${WORDMARK.accent}`;

/** 홈 `<title>`. 홈만 사이트명이 앞에 옵니다 (WRITING_GUIDE §6.13) */
export const HOME_TITLE = `${WORDMARK_TEXT} — 프론트엔드 개발자 김섭우`;

/** 홈이 아닌 화면의 `<title>` 꼬리표. 구분자는 `·` 고정입니다 */
const TITLE_SUFFIX = ` · ${WORDMARK_TEXT}`;

/** 검색 결과에서 잘리지 않는 길이 (WRITING_GUIDE §5 표) */
const TITLE_MAX_LENGTH = 60;

/**
 * `<글 제목> · Seobisback.log` 형태의 페이지 제목을 만듭니다.
 * 60자를 넘으면 **사이트명은 두고 앞쪽 이름만** 줄입니다 — 어느 사이트의 글인지가
 * 검색 결과에서 먼저 사라지면 안 됩니다(WRITING_GUIDE §6.13).
 */
export function buildPageTitle(name: string): string {
    const room = TITLE_MAX_LENGTH - TITLE_SUFFIX.length;
    const trimmed = name.length > room ? `${name.slice(0, room - 1)}…` : name;

    return `${trimmed}${TITLE_SUFFIX}`;
}

/** 라우트가 없는 주소에서 쓰는 이름 */
export const NOT_FOUND_TITLE_NAME = '찾을 수 없는 페이지';

export const SITE_DESCRIPTION = '공부하거나 조사한 내용을 기록합니다.';

export const COPYRIGHT = '© 2026 Seobisback';

export interface NavItem {
    label: string;
    path: string;
    /** 이 항목을 활성으로 볼 추가 경로. 예: 글 상세(/post)도 `글` 항목이 활성 */
    activePaths?: string[];
}

/**
 * 내비 4항목. `작업`은 작업 항목이 4건 이상 준비된 뒤 노출합니다(STEP 7).
 * ⚠️ 홈(/)을 제외한 3개 라우트는 아직 App.tsx 에 없습니다 — STEP 2~7 에서 추가됩니다.
 */
export const NAV_ITEMS: NavItem[] = [
    { label: '홈', path: '/' },
    { label: '글', path: '/posts', activePaths: ['/post'] },
    { label: '태그', path: '/tags' },
    { label: '소개', path: '/about' },
];

/** 현재 경로가 이 내비 항목에 속하는가 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
    if (item.path === '/') {
        return pathname === '/';
    }

    const candidates = [item.path, ...(item.activePaths ?? [])];
    return candidates.some(
        candidate => pathname === candidate || pathname.startsWith(`${candidate}/`),
    );
}

export interface ContactLink {
    label: string;
    href: string;
}

/** GitHub · Notion · Email 3개만. Instagram · Facebook · Qualk 는 제거됐습니다(§6-5). */
export const CONTACT_LINKS: ContactLink[] = [
    { label: 'GitHub', href: 'https://github.com/sdf5771' },
    {
        label: 'Notion',
        href: 'https://tender-lemongrass-345.notion.site/f8dcc2d59c1045368ed2023ac9327029?pvs=4',
    },
    { label: 'Email', href: 'mailto:seobisback@gmail.com' },
];
