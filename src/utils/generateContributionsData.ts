import fs from 'fs';
import path from 'path';
import type { ContributionWeek, Contributions } from './contributions';

/**
 * 기여 활동(잔디) 데이터 생성 — `public/contributions.json`.
 * 계약: `src/utils/contributions.ts` (정본) · docs/handoff-step5-404-about.md §5-2
 *
 * 🔴 이 스크립트는 **`npm run build` 에 들어 있지 않습니다.** 배포 워크플로
 *    (`.github/workflows/deploy.yml`)의 별도 단계에서만 돌립니다. 빌드에 묶으면
 *    로컬에서 `npm run build` 할 때마다 GitHub 을 때리고, 오프라인이거나
 *    레이트리밋에 걸리면 빌드가 멈춥니다.
 *
 * 왜 커밋하지 않고 배포 때 만드는가
 * ---------------------------------
 * 원안은 "워크플로가 주 1회 `contributions.json` 을 커밋"이었는데, 그러면
 * **`GITHUB_TOKEN` 이 만든 커밋은 다른 워크플로를 트리거하지 않는다**는 Actions
 * 의 무한루프 방지 동작에 걸립니다. 커밋은 되는데 `deploy.yml` 이 돌지 않아
 * 사람이 다음에 push 할 때까지 사이트는 옛 데이터를 봅니다.
 * 그래서 `deploy.yml` 빌드 단계에서 만들어 `dist/` 에 실어 보내고, 같은
 * 워크플로에 `schedule:` 을 달아 주 1회 재배포합니다. 커밋이 없으니 그 함정이
 * 원천적으로 사라지고 리포 히스토리도 늘지 않습니다.
 *
 * 왜 GraphQL 이 아니라 공개 HTML 인가
 * -----------------------------------
 * `contributionsCollection` GraphQL 은 사용자 기여 스코프가 필요해
 * **기본 `GITHUB_TOKEN` 으로 조회되지 않습니다** — PAT 를 만들어 사용자가
 * 시크릿에 등록해야 합니다. `https://github.com/users/<id>/contributions` 는
 * 프로필 잔디가 쓰는 **토큰 없이 열리는 공개 조각**이고, `data-level` 로
 * **GitHub 이 계산한 4분위 레벨(0~4)** 을 그대로 줍니다. 계약이 요구하는
 * "4분위 계산은 생성 측 책임" 이 이걸로 충족됩니다.
 *
 * 🔴 공개 HTML 이라 **마크업이 바뀌면 조용히 깨질 수 있습니다.** 그래서 아래
 *    파싱은 실패를 삼키지 않고 전부 던지고, 계약 위반이면 파일을 쓰지 않습니다.
 *    파일이 없으면 화면은 원래의 회복 카드로 돌아갑니다 — **배포는 그대로
 *    성공합니다.** 잔디 하나 때문에 사이트 전체가 못 나가면 안 됩니다.
 */

/** 잔디 주인. `ContributionGraph` 의 GITHUB_URL 과 같은 계정이어야 합니다 */
const GITHUB_USERNAME = 'sdf5771';

/** 프로필 잔디가 쓰는 공개 조각. 토큰·쿠키 없이 200 을 줍니다 */
const SOURCE_URL = `https://github.com/users/${GITHUB_USERNAME}/contributions`;

const OUTPUT_PATH = 'public/contributions.json';

/** 계약: 정확히 53개(52주 + 진행 중인 주) */
const WEEK_COUNT = 53;

const DAYS_PER_WEEK = 7;
const MAX_LEVEL = 4;

const REQUEST_TIMEOUT_MS = 15_000;

/** 첫 시도 실패 뒤 재시도 간격. 일시적인 5xx·타임아웃을 흡수하는 정도만 */
const RETRY_DELAYS_MS = [2_000, 5_000];

interface ContributionDay {
    /** `YYYY-MM-DD` */
    date: string;
    /** GitHub 이 계산한 레벨 0~4 */
    level: number;
}

/* ------------------------------------------------------------
 * 날짜 — 전부 UTC 로 계산합니다
 * ------------------------------------------------------------
 * `new Date('2026-07-26')` 는 UTC 자정으로 해석되는데 로컬 게터로 읽으면
 * 시간대에 따라 하루가 밀립니다. CI(UTC)에서는 맞고 KST 로컬에서만 틀리는
 * 종류의 버그라 특히 늦게 발견됩니다.
 * ---------------------------------------------------------- */

function toUtcDate(date: string): Date {
    return new Date(`${date}T00:00:00Z`);
}

function shiftDate(date: string, offsetDays: number): string {
    const shifted = toUtcDate(date);
    shifted.setUTCDate(shifted.getUTCDate() + offsetDays);

    return shifted.toISOString().slice(0, 10);
}

/** 0=일요일 */
function dayOfWeek(date: string): number {
    return toUtcDate(date).getUTCDay();
}

/* ------------------------------------------------------------
 * 가져오기
 * ---------------------------------------------------------- */

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchContributionsHtml(): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
        if (attempt > 0) {
            await delay(RETRY_DELAYS_MS[attempt - 1]);
            console.log(`  ↻ 재시도 ${attempt}/${RETRY_DELAYS_MS.length}`);
        }

        try {
            const response = await fetch(SOURCE_URL, {
                headers: { accept: 'text/html' },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });

            if (!response.ok) {
                throw new Error(`${SOURCE_URL} → HTTP ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/* ------------------------------------------------------------
 * 파싱
 * ---------------------------------------------------------- */

/**
 * 잔디 칸 하나하나. `<td class="ContributionCalendar-day" data-date data-level>` 입니다.
 *
 * 여는 태그를 통째로 잡은 뒤 속성을 따로 뽑습니다 — **속성 순서에 기대지 않기
 * 위해서**입니다(현재 마크업은 `data-level` 이 `class` 보다 앞에 옵니다).
 * 주 위치도 `id="contribution-day-component-<요일>-<주>"` 를 믿지 않고 **날짜에서
 * 직접 계산**합니다. 그쪽이 규격이 아니라 구현 세부입니다.
 */
function parseDays(html: string): ContributionDay[] {
    const dayCells = html.matchAll(
        /<td[^>]*\bclass="[^"]*\bContributionCalendar-day\b[^"]*"[^>]*>/g,
    );

    const days: ContributionDay[] = [];

    for (const [tag] of dayCells) {
        const date = /\bdata-date="(\d{4}-\d{2}-\d{2})"/.exec(tag)?.[1];
        const level = /\bdata-level="(\d+)"/.exec(tag)?.[1];

        if (date === undefined || level === undefined) {
            throw new Error(`잔디 칸에 data-date·data-level 이 없습니다: ${tag}`);
        }

        days.push({ date, level: Number(level) });
    }

    if (days.length === 0) {
        throw new Error(
            'ContributionCalendar-day 칸을 하나도 찾지 못했습니다 — 마크업이 바뀌었을 수 있습니다',
        );
    }

    return days;
}

/**
 * `3,270 contributions in the last year` 의 숫자.
 * GitHub 프로필이 보여 주는 값과 같아야 하므로 칸 합계가 아니라 이 문구를 씁니다
 * (칸 격자는 표시 범위가 조금 좁아 합계가 미세하게 다릅니다).
 */
function parseTotal(html: string): number {
    const matched = /([\d,]+)\s*contributions?\s*in the last year/.exec(html);

    if (!matched) {
        throw new Error('총 기여 횟수 문구를 찾지 못했습니다 — 마크업이 바뀌었을 수 있습니다');
    }

    return Number(matched[1].replace(/,/g, ''));
}

/**
 * 칸들을 주 단위로 묶습니다. 격자의 첫 주·마지막 주는 칸이 모자란 채로 오므로
 * (오늘이 수요일이면 마지막 주에 4칸이 없습니다) **0 으로 채운 7칸**에서 시작해
 * 있는 칸만 덮어씁니다 — 계약이 요구하는 `null 금지`가 여기서 지켜집니다.
 */
function toWeeks(days: ContributionDay[]): ContributionWeek[] {
    const byStart = new Map<string, number[]>();

    for (const day of days) {
        const weekday = dayOfWeek(day.date);
        const start = shiftDate(day.date, -weekday);

        let week = byStart.get(start);

        if (!week) {
            week = new Array<number>(DAYS_PER_WEEK).fill(0);
            byStart.set(start, week);
        }

        week[weekday] = day.level;
    }

    return [...byStart.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([start, levels]) => ({ start, days: levels }));
}

/* ------------------------------------------------------------
 * 계약 단언 — 여기서 걸리면 파일을 쓰지 않습니다
 * ------------------------------------------------------------
 * 컴포넌트는 `weeks.slice(-52)` 한 것을 그대로 그립니다. 주가 모자라거나 요일이
 * 밀린 JSON 은 에러 없이 **틀린 잔디**를 그리므로, 배포 전에 여기서 막습니다.
 * ---------------------------------------------------------- */

function assertContract(data: Contributions): void {
    const { weeks } = data;

    if (weeks.length !== WEEK_COUNT) {
        throw new Error(`weeks 가 ${WEEK_COUNT}개가 아닙니다: ${weeks.length}개`);
    }

    weeks.forEach((week, index) => {
        if (dayOfWeek(week.start) !== 0) {
            throw new Error(`weeks[${index}].start 가 일요일이 아닙니다: ${week.start}`);
        }

        if (week.days.length !== DAYS_PER_WEEK) {
            throw new Error(
                `weeks[${index}].days 가 ${DAYS_PER_WEEK}칸이 아닙니다: ${week.days.length}칸`,
            );
        }

        const invalid = week.days.find(
            level => !Number.isInteger(level) || level < 0 || level > MAX_LEVEL,
        );

        if (invalid !== undefined) {
            throw new Error(`weeks[${index}].days 에 0~${MAX_LEVEL} 밖의 값: ${invalid}`);
        }

        /* 오래된 주 → 최근 주, 빠짐없이 7일 간격 */
        if (index > 0 && shiftDate(weeks[index - 1].start, DAYS_PER_WEEK) !== week.start) {
            throw new Error(
                `주가 연속되지 않습니다: ${weeks[index - 1].start} 다음이 ${week.start}`,
            );
        }
    });

    if (!Number.isInteger(data.total) || data.total < 0) {
        throw new Error(`total 이 0 이상의 정수가 아닙니다: ${data.total}`);
    }

    /* 계약: lastActiveDate 가 null 인 것과 total 이 0 인 것은 같은 말입니다 */
    if ((data.lastActiveDate === null) !== (data.total === 0)) {
        throw new Error(
            `total 과 lastActiveDate 가 어긋납니다: total=${data.total}, lastActiveDate=${data.lastActiveDate}`,
        );
    }
}

/* ------------------------------------------------------------
 * 실행
 * ---------------------------------------------------------- */

async function generateContributionsData(): Promise<Contributions> {
    const html = await fetchContributionsHtml();

    const days = parseDays(html);
    const weeks = toWeeks(days);

    /*
     * 마지막 활동일은 **레벨에서** 찾습니다. 레벨 0 은 곧 기여 0회라
     * (툴팁 문구까지 대조해 확인) 툴팁을 따로 파싱할 이유가 없고,
     * 파싱 대상이 적을수록 마크업 변경에 덜 부서집니다.
     */
    const lastActiveDate = days
        .filter(day => day.level > 0)
        .reduce<string | null>(
            (latest, day) => (latest === null || day.date > latest ? day.date : latest),
            null,
        );

    /*
     * 격자에 활동이 하나도 없으면 total 도 0 으로 봅니다. 문구의 `최근 1년` 범위가
     * 격자보다 며칠 넓어서 이론상 "총계는 있는데 격자는 비어 있는" 상태가 나올 수
     * 있는데, 그대로 두면 `N회` 옆에 빈 잔디가 그려지고 계약(total===0 ⟺ null)도
     * 깨집니다.
     */
    const total = lastActiveDate === null ? 0 : parseTotal(html);

    return {
        generatedAt: new Date().toISOString().slice(0, 10),
        total,
        lastActiveDate,
        weeks,
    };
}

/*
 * 🔴 실패해도 **종료 코드는 0** 입니다. 이 단계가 빌드를 세우면 잔디 하나 때문에
 *    사이트 전체가 배포되지 않습니다. 파일을 쓰지 않고 넘어가면 화면은 이미
 *    준비된 회복 카드(`기여 활동을 불러오지 못했어요`)를 그립니다.
 *    실패는 CI 로그에 남으므로 조용하지도 않습니다.
 */
try {
    const data = await generateContributionsData();

    assertContract(data);

    fs.writeFileSync(
        path.join(process.cwd(), OUTPUT_PATH),
        JSON.stringify(data, null, 2),
    );

    console.log(
        `✅ ${OUTPUT_PATH} — ${data.weeks.length}주 · 최근 1년 ${data.total}회 · ` +
            `마지막 활동 ${data.lastActiveDate ?? '없음'}`,
    );
} catch (error) {
    console.warn(
        `⚠️ 기여 활동 데이터를 만들지 못했습니다 — ${OUTPUT_PATH} 없이 진행합니다.\n` +
            `   화면은 회복 카드로 폴백합니다. 원인: ${
                error instanceof Error ? error.message : String(error)
            }`,
    );
}
