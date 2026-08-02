/**
 * 별자리 히어로 — **좌표 계산만 하는 순수 모듈**입니다.
 * 명세: docs/handoff-step2-home.md §3-2 · §3-3 · §3-4
 *
 * 🔴 이 파일에 DOM·canvas·React 가 없습니다. 입력이 같으면 출력이 **비트 단위로
 *    같습니다.** `Math.random` 도, `Date.now` 도 쓰지 않습니다 — 새로고침할 때마다
 *    별이 옮겨 다니면 이 그래픽은 "데이터를 그린 것"이 아니라 "장식"이 됩니다.
 *    그래서 계산과 렌더를 갈라 놓았고, 계산 쪽은 node 에서 그대로 돌려 검증합니다.
 *
 * 시안의 계산식 4개를 실데이터로 검증하고 교체한 결과입니다. 실제 41편은
 * 2022-12~2023-04 다섯 달에 33편(80%)이 몰려 있어, 시안이 전제한 "고른 분포"가
 * 성립하지 않습니다(§8-1).
 */

/** 계산에 필요한 글 정보. `posts-data.json` 의 부분집합입니다 */
export interface ConstellationPost {
    slug: string;
    title: string;
    /** `YYYY-MM-DD` */
    date: string;
    category: string;
    keywords: string[];
}

export interface ConstellationStar {
    /** 오름차순(오래된 → 최신) 배열에서의 위치. 연결선이 이 값을 가리킵니다 */
    index: number;
    slug: string;
    title: string;
    date: string;
    category: string;
    /** 0 = 가장 최근 글, N-1 = 가장 오래된 글 */
    rank: number;
    /** `1 - rank/(N-1)`. 1.0 이 최신 */
    recency: number;
    radius: number;
    alpha: number;
    x: number;
    y: number;
    /** 분리 패스 이전의 이상 x. 연도 눈금·이탈 상한이 이 값을 씁니다 */
    idealX: number;
}

export interface ConstellationLink {
    /** 더 오래된 쪽(오름차순 인덱스) */
    from: number;
    /** 더 최신 쪽 */
    to: number;
    /** 공유 태그 수. 2 이상이면 강한 연결입니다 */
    weight: number;
}

export interface YearTick {
    label: string;
    x: number;
}

export interface ConstellationLayout {
    stars: ConstellationStar[];
    links: ConstellationLink[];
    yearTicks: YearTick[];
}

export interface PlotBox {
    width: number;
    height: number;
    padLeft: number;
    padRight: number;
    padTop: number;
    padBottom: number;
    /** 이웃 별 사이 최소 간격 목표. bp 별 실측값은 §3-2 (4) */
    minSeparation: number;
}

/* ------------------------------------------------------------
 * 공통
 * ---------------------------------------------------------- */

/**
 * FNV-1a 32비트. 암호 강도가 필요한 자리가 아니고 **같은 slug 가 언제나 같은
 * 수를 내는 것**만 필요합니다. `PostGlyph`·`DotConstellation` 과 같은 함수입니다.
 */
function hashString(value: string): number {
    let hash = 0x811c9dc5;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        /* imul 이 없으면 32비트를 넘어가며 정밀도가 깨져 결정론이 무너집니다 */
        hash = Math.imul(hash, 0x01000193);
    }

    return hash >>> 0;
}

/** 0 이상 1 미만. 지터 시드입니다 */
function hashUnit(value: string): number {
    return (hashString(value) % 1000) / 1000;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/**
 * 태그 정규화 — **표시에는 쓰지 않습니다.** 그룹 계산 전용입니다(§6.8 "원문 그대로").
 * 실데이터의 표기 흔들림을 흡수합니다: `Javascript`/`JavaScript`,
 * `Frontend`/`Front-end`.
 */
export function normalizeTag(tag: string): string {
    return tag.toLowerCase().replace(/[-\s]/g, '');
}

const MILLISECONDS_PER_DAY = 86_400_000;

/** `YYYY-MM-DD` 를 UTC 로 읽습니다. 로컬 파싱은 시간대에 따라 하루가 밀립니다 */
function toDayNumber(date: string): number {
    return Math.floor(Date.parse(`${date}T00:00:00Z`) / MILLISECONDS_PER_DAY);
}

/* ------------------------------------------------------------
 * 모델 — 뷰포트와 무관한 부분
 * ---------------------------------------------------------- */

/**
 * y 밴드. 0 = 위, 1 = 아래.
 *
 * 🔴 시안의 하드코딩 우선순위 배열(`['Python','React',…]`)을 쓰지 않습니다 —
 *    글이 늘면 손으로 고쳐야 하고, 고치는 순간 배치가 통째로 바뀝니다.
 *    대신 "전체에서 가장 많이 쓰인 태그" 를 데이터에서 뽑습니다.
 */
const BAND: Record<string, number> = {
    python: 0.8,
    javascript: 0.63,
    react: 0.46,
    frontend: 0.3,
};

/** 밴드에 이름이 없는 태그 */
const BAND_FALLBACK = 0.3;

/** 컨퍼런스·회고는 최상단 별도 궤도. 2편뿐이라 의도적으로 외따로 보입니다(§8-6) */
const BAND_ACTIVITY = 0.14;

/** slug 해시 지터의 진폭(밴드 좌표 기준) */
const BAND_JITTER = 0.13;

/**
 * 인접 발행 간격의 상한(일). **21일을 바꾸지 마세요.**
 *
 * 선형 시간축이면 41개 중 32개가 좌측 150px 안에 겹칩니다. 간격을 21일에서
 * 잘라 누적하면 죽은 시간만 압축되고 순서·근접성은 보존됩니다 — 총 스팬
 * 882일이 229단위가 되고, 좌측 밀집은 32 → 17개로 내려갑니다.
 * 7~45일 범위를 실험한 결과이며, 바꾸려면 §11-1 수치를 다시 재야 합니다.
 */
const GAP_CAP_DAYS = 21;

/** 분리 패스에서 별이 이상 x 로부터 벗어날 수 있는 한계(px) */
const MAX_X_DRIFT = 28;

/** 완화 반복 횟수. 820쌍 × 24회 = 19,680 거리 계산 ≈ 0.3~0.8ms, 레이아웃당 1회 */
const RELAX_ITERATIONS = 24;

/** x 성분 감쇠. 1.0 이면 시간 순서가 흐트러집니다 */
const RELAX_X_DAMPING = 0.55;

export interface ConstellationModel {
    /** 오름차순(오래된 → 최신), 동점은 slug 오름차순 */
    posts: ConstellationPost[];
    /** 0..1 압축 시간축 위치 */
    axis: number[];
    /** 0..1 밴드 좌표(지터 포함) */
    band: number[];
    links: ConstellationLink[];
    /** 연도 → 오름차순 인덱스. 그 해 첫 글 */
    yearFirstIndex: Map<string, number>;
}

/**
 * 뷰포트와 무관한 계산을 한 번만 해 둡니다. 리사이즈해도 이 값은 그대로입니다.
 */
export function buildConstellationModel(input: readonly ConstellationPost[]): ConstellationModel {
    /* 🔴 같은 날짜가 8쌍 있습니다(2023-01-10 에만 4편). 타이브레이커 없이는
       배열 순서가 파일시스템 순서에 의존해 배치가 빌드마다 달라집니다 */
    const posts = [...input].sort((a, b) =>
        a.date === b.date ? a.slug.localeCompare(b.slug) : a.date.localeCompare(b.date),
    );
    const count = posts.length;

    /* --- 전체 태그 빈도. primaryTag 판정의 근거입니다 --- */
    const tagCounts = new Map<string, number>();
    const normalizedTags = posts.map(post => {
        const tags = new Set(post.keywords.map(normalizeTag));
        for (const tag of tags) {
            tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
        return tags;
    });

    /* --- x: 압축 시간축 (§3-2 (2)) --- */
    const cumulative: number[] = [0];
    for (let index = 1; index < count; index += 1) {
        const gap = toDayNumber(posts[index].date) - toDayNumber(posts[index - 1].date);
        cumulative[index] = cumulative[index - 1] + Math.min(Math.max(gap, 0), GAP_CAP_DAYS);
    }
    const span = cumulative[count - 1] || 1;
    const axis = cumulative.map(value => value / span);

    /* --- y: 최빈 태그 밴드 + slug 해시 지터 (§3-2 (3)) --- */
    const band = posts.map((post, index) => {
        let primary = '';
        let primaryCount = -1;

        for (const tag of normalizedTags[index]) {
            const tagCount = tagCounts.get(tag) ?? 0;
            /* 동점이면 사전순 — 순서가 흔들리면 y 가 흔들립니다 */
            if (tagCount > primaryCount || (tagCount === primaryCount && tag < primary)) {
                primary = tag;
                primaryCount = tagCount;
            }
        }

        const base = post.category === 'Activity' ? BAND_ACTIVITY : BAND[primary] ?? BAND_FALLBACK;
        /* 🔴 시드가 slug 라 글이 추가돼도 **기존 별의 y 는 움직이지 않습니다** */
        const jitter = (hashUnit(post.slug) - 0.5) * BAND_JITTER;

        return clamp(base + jitter, 0.02, 0.98);
    });

    /* --- 연결선 (§3-3) --- */
    const links: ConstellationLink[] = [];
    for (let index = 1; index < count; index += 1) {
        for (let previous = index - 1; previous >= 0; previous -= 1) {
            let shared = 0;
            for (const tag of normalizedTags[index]) {
                if (normalizedTags[previous].has(tag)) {
                    shared += 1;
                }
            }

            if (shared > 0) {
                /* 항상 **과거 쪽**을 향하므로 선이 계보처럼 읽히고 교차가 적습니다 */
                links.push({ from: previous, to: index, weight: shared });
                break;
            }
        }
    }

    /* --- 연도 눈금 (§3-4) --- */
    const yearFirstIndex = new Map<string, number>();
    posts.forEach((post, index) => {
        const year = post.date.slice(0, 4);
        if (!yearFirstIndex.has(year)) {
            yearFirstIndex.set(year, index);
        }
    });

    return { posts, axis, band, links, yearFirstIndex };
}

/* ------------------------------------------------------------
 * 배치 — 뷰포트가 정해진 뒤
 * ---------------------------------------------------------- */

/**
 * 라벨을 그릴 연도.
 * 2022 는 좌측 끝에 붙어 잘리므로 생략합니다(§3-4).
 */
const TICK_YEARS = ['2023', '2024', '2025'];

/**
 * 결정론적 분리 패스(§3-2 (4)).
 *
 * 이상 좌표만으로는 같은 날짜 8쌍이 **완전히 겹칩니다**(간격 0px). 완화를
 * 레이아웃당 **1회** 실행합니다 — 매 프레임이 아닙니다. 실측 수렴값은
 * xl 16.00 / lg 15.00 / md 14.00 / sm 10.97px 입니다.
 */
export function layoutConstellation(
    model: ConstellationModel,
    box: PlotBox,
): ConstellationLayout {
    const { posts, axis, band, links } = model;
    const count = posts.length;

    const plotWidth = Math.max(1, box.width - box.padLeft - box.padRight);
    const plotHeight = Math.max(1, box.height - box.padTop - box.padBottom);

    const idealX = axis.map(value => box.padLeft + value * plotWidth);
    const idealY = band.map(value => box.padTop + value * plotHeight);

    const xs = idealX.slice();
    const ys = idealY.slice();

    for (let iteration = 0; iteration < RELAX_ITERATIONS; iteration += 1) {
        for (let a = 0; a < count; a += 1) {
            for (let b = a + 1; b < count; b += 1) {
                let dx = xs[b] - xs[a];
                let dy = ys[b] - ys[a];
                let distance = Math.hypot(dx, dy);

                if (distance < 1e-6) {
                    /* 완전 중첩이면 **고정 방향**으로 밉니다. 난수를 쓰면 결정론이 깨집니다 */
                    dx = 0.6;
                    dy = -0.8;
                    distance = 1;
                }

                if (distance >= box.minSeparation) {
                    continue;
                }

                const push = (box.minSeparation - distance) / 2;
                const ux = dx / distance;
                const uy = dy / distance;

                xs[a] -= ux * push * RELAX_X_DAMPING;
                ys[a] -= uy * push;
                xs[b] += ux * push * RELAX_X_DAMPING;
                ys[b] += uy * push;
            }
        }

        for (let index = 0; index < count; index += 1) {
            /* 🔴 x 이탈 상한이 있어야 연도 눈금과 별 위치가 어긋나지 않습니다 */
            xs[index] = clamp(
                xs[index],
                Math.max(box.padLeft, idealX[index] - MAX_X_DRIFT),
                Math.min(box.width - box.padRight, idealX[index] + MAX_X_DRIFT),
            );
            ys[index] = clamp(ys[index], box.padTop, box.height - box.padBottom);
        }
    }

    const stars: ConstellationStar[] = posts.map((post, index) => {
        const rank = count - 1 - index;
        /* 🔴 날짜가 아니라 **발행 순위**입니다. 시안의 `pow(선형시간, 1.6)` 은
           33편의 반지름을 1.66~1.74px 로 붙여 계단을 없앱니다(§3-4) */
        const recency = count > 1 ? 1 - rank / (count - 1) : 1;

        return {
            index,
            slug: post.slug,
            title: post.title,
            date: post.date,
            category: post.category,
            rank,
            recency,
            radius: 1.8 + recency * 3.2,
            alpha: 0.42 + recency * 0.58,
            x: xs[index],
            y: ys[index],
            idealX: idealX[index],
        };
    });

    const yearTicks: YearTick[] = [];
    for (const year of TICK_YEARS) {
        const index = model.yearFirstIndex.get(year);
        if (index !== undefined) {
            /* 별 위치가 아니라 **축 위치**입니다 — 분리 패스의 영향을 받지 않습니다 */
            yearTicks.push({ label: year, x: idealX[index] });
        }
    }

    return { stars, links, yearTicks };
}

/** 검증용 — 임의의 두 별 사이 최소 거리 */
export function minimumSeparation(stars: readonly ConstellationStar[]): number {
    let minimum = Infinity;

    for (let a = 0; a < stars.length; a += 1) {
        for (let b = a + 1; b < stars.length; b += 1) {
            minimum = Math.min(minimum, Math.hypot(stars[b].x - stars[a].x, stars[b].y - stars[a].y));
        }
    }

    return minimum;
}
