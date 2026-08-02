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

/**
 * 홈 `<title>`. 홈만 사이트명이 앞에 옵니다 (WRITING_GUIDE §6.13)
 *
 * 🔴 부제에 이름을 넣지 않습니다. 워드마크가 이미 `Seobisback` 을 담고 있어
 *    `… — Software Engineer Seobisback` 이면 한 제목에 같은 단어가 두 번 나옵니다.
 *    부제는 직함만 맡습니다.
 */
export const HOME_TITLE = `${WORDMARK_TEXT} — Software Engineer`;

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
    /**
     * 이 경로가 **App.tsx 에 실재하는가.**
     * 🔴 라우트를 추가하는 STEP 에서 이 값도 함께 true 로 바꾸세요.
     */
    isRouteReady: boolean;
}

/**
 * 내비 인벤토리.
 *
 * 이 배열은 **확정된 내비 인벤토리**이고, 실제로 그릴 항목은 아래
 * `AVAILABLE_NAV_ITEMS` 입니다. 아직 라우트가 없는 항목을 그대로 링크로 두면
 * 내비를 눌렀는데 404 가 뜹니다 — 내비는 화면을 여는 물건이라, 열 화면이 없으면
 * 보여 주지 않는 편이 정직합니다.
 *
 * 🔴 `작업` 의 노출 조건은 **항목 4건 이상**이었습니다(STEP 1 §12 미결 2번).
 *    STEP 7 에서 15건이 생겨 조건을 충족했으므로 `isRouteReady: true` 입니다.
 *    상세(`/works/<slug>`)가 0건인 것은 조건과 무관합니다 — 목록만으로 화면이
 *    성립하는 것이 이 STEP 의 전제입니다(handoff-step7-works.md §4-2 ①).
 */
export const NAV_ITEMS: NavItem[] = [
    { label: '홈', path: '/', isRouteReady: true },
    /* STEP 4 */
    { label: '글', path: '/posts', activePaths: ['/post'], isRouteReady: true },
    /* STEP 7 */
    { label: '작업', path: '/works', isRouteReady: true },
    /* STEP 6 */
    { label: '태그', path: '/tags', isRouteReady: true },
    { label: '소개', path: '/about', isRouteReady: true },
];

/** 지금 실제로 열리는 내비 항목만. 헤더·드로어가 공통으로 씁니다 */
export const AVAILABLE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter(item => item.isRouteReady);

/** 글 목록 경로. 404 의 회복 경로가 이 경로의 준비 여부를 보고 노출을 정합니다 */
export const POST_LIST_PATH = '/posts';

export const IS_POST_LIST_READY: boolean = NAV_ITEMS.some(
    item => item.path === POST_LIST_PATH && item.isRouteReady,
);

/**
 * 작업 목록 경로 (STEP 7).
 *
 * 🔴 화면 이름은 **`작업`** 입니다. WRITING_GUIDE §9 용어집이 `Works`·`포트폴리오`
 *    를 "쓰지 않는 표기" 로 지정했습니다 — URL `/works` 만 영문입니다.
 */
export const WORKS_PATH = '/works';

export const WORKS_LABEL = '작업';

/**
 * `/works` 라우트가 실재하는가.
 *
 * 404 화면의 문맥 분기(§6-5)가 이 값을 봅니다 — 라우트가 없는데 `작업 목록으로`
 * 버튼을 그리면 404 에서 404 로 보내는 이탈 경로가 됩니다.
 */
export const IS_WORKS_ROUTE_READY: boolean = NAV_ITEMS.some(
    item => item.path === WORKS_PATH && item.isRouteReady,
);

/** 태그 인덱스 경로 (STEP 6) */
export const TAG_INDEX_PATH = '/tags';

/**
 * `/tags` 라우트가 실재하는가.
 *
 * 🔴 이 값이 **글 상세 태그의 모양까지** 정합니다. 확정 규칙이 「링크되는 태그는
 *    칩(배경 + 테두리), 링크 안 되는 태그는 평문」이라(§5-2), 라우트가 없으면
 *    칩이 하나도 없는 것이 맞습니다. 없는 곳으로 보내는 칩은 404 로 가는
 *    함정이고, 404 화면이 회복 경로를 감추는 것과 같은 이유입니다.
 */
export const IS_TAG_ROUTE_READY: boolean = NAV_ITEMS.some(
    item => item.path === TAG_INDEX_PATH && item.isRouteReady,
);

/** 태그별 목록 → 인덱스로 돌아가는 링크. 1회성 태그 페이지의 유일한 탈출로입니다 */
export const TAG_INDEX_LINK_LABEL = '전체 태그 보기';

/**
 * 연도별 보기 경로 (STEP 6).
 *
 * 🔴 GNB 4항목에 **없습니다.** 진입 경로는 `/posts` 목록 헤더 우측의 텍스트 링크
 *    하나입니다(§1-1). GNB 인벤토리는 STEP 1 확정이라 건드리지 않습니다.
 */
export const ARCHIVE_PATH = '/archive';

/**
 * 화면 이름은 **`연도별 보기`** 입니다.
 * 🔴 WRITING_GUIDE §9 용어집이 `아카이브` 를 "쓰지 않는 표기"로 지정했습니다.
 *    UI 라벨·aria-label·`<title>` 어디에도 쓰지 마세요. URL `/archive` 는 UI
 *    라벨이 아니므로 그대로 둡니다.
 */
export const ARCHIVE_LABEL = '연도별 보기';

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

export const GITHUB_URL = 'https://github.com/sdf5771';
export const EMAIL_URL = 'mailto:seobisback@gmail.com';

/**
 * 이력서. **Notion 링크입니다 — PDF 를 리포에 올리지 않습니다.**
 * 이 리포는 public 이라 한 번 올린 PDF 는 git 히스토리에 영구히 남습니다.
 */
export const RESUME_URL =
    'https://tender-lemongrass-345.notion.site/f8dcc2d59c1045368ed2023ac9327029?pvs=4';

/**
 * 푸터·드로어의 연락처 3개. Instagram · Facebook · Qualk 는 제거됐습니다(§6-5).
 *
 * 🔴 셋 중 `이메일 보내기` 만 라벨이 긴 것은 실수가 아닙니다.
 *    `GitHub`·`Notion` 은 **제품 고유명**이라 영어 그대로 둡니다(§3.3 예외).
 *    반면 `mailto:` 는 페이지 이동이 아니라 **메일 앱을 여는 동작**이라 결과의
 *    성격 자체가 다릅니다. 그 비대칭을 라벨에 드러내 누르기 전에 알 수 있게
 *    합니다. 소개 화면의 ABOUT_CONTACT_LINKS 와도 같은 문구입니다.
 *
 * ⚠️ handoff-step1-shell.md §6-5 는 `GitHub · Notion · Email` 로 지정했지만
 *    그 명세가 오류였고 web-design 이 정정했습니다. 셋을 나란히 맞추겠다고
 *    `Email` 로 되돌리지 마세요.
 */
export const CONTACT_LINKS: ContactLink[] = [
    { label: 'GitHub', href: GITHUB_URL },
    { label: 'Notion', href: RESUME_URL },
    { label: '이메일 보내기', href: EMAIL_URL },
];

/**
 * 소개 화면의 연락처 — **GitHub · Email 2종.** 푸터(3종)와 다른 것이 정상입니다.
 *
 * Notion 을 뺀 이유: ① Notion 링크는 포트폴리오/이력서이지 **연락 수단이 아닙니다**
 * ② 소개 화면 하단의 `이력서 보기 ↗` 가 같은 곳으로 가므로 한 화면에 같은 목적지가
 * 두 개가 됩니다 ③ WRITING_GUIDE §5.2 가 이력서를 "About 하단의 보조 링크로만"
 * 두라고 요구하는데, 연락처 카드에 두면 페이지 중단에 하나 더 생깁니다.
 * 근거: handoff-step5-404-about.md §7-4
 */
/*
 * 라벨은 **동사로 끝냅니다**(WRITING_GUIDE §6.1-1 — 명사 단독 금지).
 * 같은 화면의 `이력서 보기 ↗` 와 규격이 갈리지 않게 맞췄고, 영어 UI 라벨
 * `Email` 은 §3.3 예외(워드마크·카테고리 원본값·코드/경로) 어디에도 없어
 * §5.2 가 쓰는 `이메일` 로 바꿨습니다.
 * 이 라벨이 곧 aria-label 의 앞부분입니다 — 보이는 텍스트로 시작해야
 * 음성 제어에서 이름이 맞습니다(§7.3-1).
 */
export const ABOUT_CONTACT_LINKS: ContactLink[] = [
    { label: 'GitHub 프로필 보기', href: GITHUB_URL },
    { label: '이메일 보내기', href: EMAIL_URL },
];
