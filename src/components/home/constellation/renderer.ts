/**
 * 별자리 히어로 — canvas 2D 렌더러.
 * 명세: docs/handoff-step2-home.md §3-4 · §3-6 · §4-2
 *
 * 🔴 **외부 라이브러리를 쓰지 않습니다.** three.js·d3·particles 류는 금지이고
 *    (§3-6 번들 예산 ≤ 10KB gzip), 여기서 필요한 것은 원·선·그라데이션뿐입니다.
 *
 * 🔴 **canvas 는 CSS 변수를 자동으로 읽지 못합니다.** 색은 마운트 시·테마 전환
 *    시 `getComputedStyle` 로 읽어 캐시합니다. JS 에 하드코딩하면 테마 전환이
 *    그 자리에서 깨집니다(STEP 1 §3-1).
 */

import type { ConstellationLayout, ConstellationStar } from './layout';

/* ------------------------------------------------------------
 * 팔레트
 * ---------------------------------------------------------- */

export interface HeroPalette {
    bgBase: string;
    bgRaised: string;
    rule: string;
    orbit: string;
    linkStrong: string;
    linkWeak: string;
    bloomAlpha: number;
    textMuted: string;
    latest: string;
    category: Record<string, string>;
    fallback: string;
}

function readVariable(styles: CSSStyleDeclaration, name: string): string {
    return styles.getPropertyValue(name).trim();
}

/**
 * 토큰을 한 번에 읽어 옵니다. `getComputedStyle` 은 값을 읽을 때마다 스타일
 * 재계산을 유발할 수 있으므로 프레임 안에서 부르지 않습니다.
 */
export function readHeroPalette(theme: 'light' | 'dark'): HeroPalette {
    const styles = getComputedStyle(document.documentElement);

    return {
        bgBase: readVariable(styles, '--color-bg-base'),
        bgRaised: readVariable(styles, '--color-bg-raised'),
        rule: readVariable(styles, '--color-hero-rule'),
        orbit: readVariable(styles, '--color-hero-orbit'),
        linkStrong: readVariable(styles, '--color-hero-link-strong'),
        linkWeak: readVariable(styles, '--color-hero-link-weak'),
        bloomAlpha: Number(readVariable(styles, '--hero-bloom-alpha')) || 0.3,
        textMuted: readVariable(styles, '--color-text-muted'),
        /*
         * 최신 별. 다크는 `--color-accent-hover`(#ffd770), 라이트는
         * `--color-accent-text`(#7d5c0e). 🔴 `accent-fill` 을 쓰면 라이트에서
         * 2.14:1 로 무너집니다 — 배경 위 골드는 항상 accent-text 입니다.
         */
        latest: readVariable(
            styles,
            theme === 'dark' ? '--color-accent-hover' : '--color-accent-text',
        ),
        category: {
            Study: readVariable(styles, '--color-cat-study'),
            Survey: readVariable(styles, '--color-cat-survey'),
            Activity: readVariable(styles, '--color-cat-activity'),
        },
        fallback: readVariable(styles, '--color-accent-text'),
    };
}

function starColor(palette: HeroPalette, star: ConstellationStar): string {
    return palette.category[star.category] ?? palette.fallback;
}

/* ------------------------------------------------------------
 * 스프라이트 — 다크 블룸 전용
 * ------------------------------------------------------------
 * 🔴 시안은 별 하나마다 매 프레임 `createRadialGradient` 를 불렀습니다.
 *    41개 × 60fps = **초당 2,460개** 그라데이션 객체이고, 전부 GC 대상입니다.
 *    블룸을 (카테고리 3색 + 골드) × (반지름 8단계) = **32장**으로 미리 그려 두고
 *    프레임마다 `drawImage` 만 합니다.
 *
 * ⚠️ 스프라이트로 굽는 것은 **블룸(부드러운 번짐)뿐**입니다. 별의 중심 원은
 *    프레임마다 `arc()` 로 그립니다 — 값싸고, 무엇보다 반지름 41단계가 8단계로
 *    양자화되지 않습니다. §3-4 의 "41단계 균등" 계약이 스프라이트 때문에
 *    깨지면 안 됩니다.
 * ---------------------------------------------------------- */

/** 반지름 양자화 단계. 최신 11편(rec ≥ 0.75)이 정확히 상위 2단계에 떨어집니다 */
const SPRITE_STEPS = 8;

/** 일반 별의 블룸 반경 배수 */
const BLOOM_SCALE = 3;

/** 최신 별의 블룸 반경 배수 — 다른 별의 2.3배(§3-4) */
const LATEST_BLOOM_SCALE = 7;

const MAX_RADIUS = 5;

export interface SpriteSheet {
    /** `색|단계` → 굽힌 블룸 */
    bloom: Map<string, HTMLCanvasElement>;
    devicePixelRatio: number;
}

export function bloomStep(recency: number): number {
    return Math.min(SPRITE_STEPS - 1, Math.floor(recency * SPRITE_STEPS));
}

function bloomRadiusOfStep(step: number): number {
    /* 단계의 가운데 recency 로 대표 반지름을 잡습니다 */
    const recency = (step + 0.5) / SPRITE_STEPS;
    return (1.8 + recency * 3.2) * BLOOM_SCALE;
}

function bakeBloom(color: string, radius: number, alpha: number, dpr: number): HTMLCanvasElement {
    const size = Math.ceil(radius * 2 * dpr);
    const sprite = document.createElement('canvas');
    sprite.width = size;
    sprite.height = size;

    const context = sprite.getContext('2d');
    if (!context) {
        return sprite;
    }

    context.scale(dpr, dpr);
    const center = radius;
    const gradient = context.createRadialGradient(center, center, 0, center, center, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');

    context.globalAlpha = alpha;
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fill();

    return sprite;
}

/**
 * 32장을 **레이아웃당 1회** 굽습니다. 메모리 32 × 64×64 RGBA ≈ 393KB.
 * 라이트 모드는 블룸이 없으므로(형태로 최신성을 말합니다) 최신 별의 헤일로
 * 한 장만 굽습니다.
 */
export function createSpriteSheet(
    palette: HeroPalette,
    theme: 'light' | 'dark',
    devicePixelRatio: number,
): SpriteSheet {
    const bloom = new Map<string, HTMLCanvasElement>();

    const colors =
        theme === 'dark'
            ? [...Object.values(palette.category), palette.latest]
            : [palette.latest];

    for (const color of colors) {
        if (theme === 'dark') {
            for (let step = 0; step < SPRITE_STEPS; step += 1) {
                bloom.set(
                    `${color}|${step}`,
                    bakeBloom(color, bloomRadiusOfStep(step), palette.bloomAlpha, devicePixelRatio),
                );
            }
        }
    }

    /* 최신 별의 큰 블룸/헤일로는 라이트·다크 공통으로 한 장 더 */
    bloom.set(
        'latest',
        bakeBloom(
            palette.latest,
            MAX_RADIUS * (theme === 'dark' ? LATEST_BLOOM_SCALE : 4.2),
            palette.bloomAlpha,
            devicePixelRatio,
        ),
    );

    return { bloom, devicePixelRatio };
}

function drawSprite(
    context: CanvasRenderingContext2D,
    sprite: HTMLCanvasElement,
    x: number,
    y: number,
    dpr: number,
): void {
    const size = sprite.width / dpr;
    context.drawImage(sprite, x - size / 2, y - size / 2, size, size);
}

/* ------------------------------------------------------------
 * 프레임
 * ---------------------------------------------------------- */

export interface FrameState {
    /** 연결선 그리기 연출 0..1. 저감 모션이면 항상 1 */
    linkProgress: number;
    /** 드리프트·맥동 진폭 0..1. 저감 모션이면 항상 0 */
    amplitude: number;
    /** 애니메이션 경과 시간(초) */
    time: number;
    /** 포인터 패럴랙스 오프셋(px) */
    parallaxX: number;
    parallaxY: number;
    /** 호버·포커스로 강조된 별 */
    activeIndex: number | null;
}

/** 라이트에서 채운 원이 되는 하한 — 상위 11편(§3-4) */
const FILLED_RECENCY = 0.75;

/** 속 빈 원의 반지름 하한. 없으면 최고참 별이 페이퍼 위에서 사라집니다 */
const HOLLOW_MIN_RADIUS = 2.2;

/** 드리프트 진폭(px) */
const DRIFT_AMPLITUDE = 1.1;

/** 최신 별 맥동 폭 */
const PULSE_AMPLITUDE = 0.18;

/** 호버 시 반지름 배수 */
const HOVER_SCALE = 1.7;

function driftOffset(star: ConstellationStar, state: FrameState): number {
    if (state.amplitude === 0) {
        return 0;
    }

    /* 위상은 index 에서 뽑습니다 — 별마다 다르되 새로고침해도 같습니다 */
    return Math.sin(state.time * 0.6 + star.index * 1.7) * DRIFT_AMPLITUDE * state.amplitude;
}

function drawBackground(
    context: CanvasRenderingContext2D,
    palette: HeroPalette,
    theme: 'light' | 'dark',
    width: number,
    height: number,
    backgroundGradient: CanvasGradient | null,
): void {
    if (theme === 'dark' && backgroundGradient) {
        context.fillStyle = backgroundGradient;
        context.fillRect(0, 0, width, height);
        return;
    }

    /* 라이트는 "페이퍼 위 천체 도표" — 단색 바탕 + 괘선 + 궤도 타원(§3-4) */
    context.fillStyle = palette.bgBase;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = palette.rule;
    context.lineWidth = 1;
    context.beginPath();
    for (let x = 56; x < width; x += 56) {
        context.moveTo(x + 0.5, 0);
        context.lineTo(x + 0.5, height);
    }
    for (let y = 56; y < height; y += 56) {
        context.moveTo(0, y + 0.5);
        context.lineTo(width, y + 0.5);
    }
    context.stroke();

    context.strokeStyle = palette.orbit;
    context.beginPath();
    context.ellipse(width * 0.62, height * 0.52, width * 0.34, height * 0.36, 0, 0, Math.PI * 2);
    context.stroke();
}

/**
 * 다크 배경 방사 그라데이션. **레이아웃당 1회**만 만듭니다 —
 * 프레임마다 만들면 별 블룸을 스프라이트로 뺀 의미가 없습니다.
 */
export function createBackgroundGradient(
    context: CanvasRenderingContext2D,
    palette: HeroPalette,
    width: number,
    height: number,
): CanvasGradient {
    const gradient = context.createRadialGradient(
        width * 0.62,
        height * 0.42,
        0,
        width * 0.62,
        height * 0.42,
        width * 0.7,
    );
    gradient.addColorStop(0, palette.bgRaised);
    gradient.addColorStop(1, palette.bgBase);

    return gradient;
}

export interface DrawOptions {
    context: CanvasRenderingContext2D;
    layout: ConstellationLayout;
    palette: HeroPalette;
    sprites: SpriteSheet;
    theme: 'light' | 'dark';
    width: number;
    height: number;
    backgroundGradient: CanvasGradient | null;
    state: FrameState;
    /** 연도 눈금을 그릴 y. 없으면 그리지 않습니다(sm 밴드) */
    tickBaseline: number | null;
}

export function drawConstellation({
    context,
    layout,
    palette,
    sprites,
    theme,
    width,
    height,
    backgroundGradient,
    state,
    tickBaseline,
}: DrawOptions): void {
    const { stars, links, yearTicks } = layout;
    const dpr = sprites.devicePixelRatio;

    context.clearRect(0, 0, width, height);
    drawBackground(context, palette, theme, width, height, backgroundGradient);

    if (tickBaseline !== null) {
        context.save();
        context.globalAlpha = theme === 'dark' ? 0.45 : 0.55;
        context.strokeStyle = palette.textMuted;
        context.fillStyle = palette.textMuted;
        context.lineWidth = 1;
        context.font = '11px ui-monospace, monospace';
        context.textAlign = 'center';
        context.textBaseline = 'top';

        for (const tick of yearTicks) {
            context.beginPath();
            context.moveTo(Math.round(tick.x) + 0.5, tickBaseline);
            context.lineTo(Math.round(tick.x) + 0.5, tickBaseline + 6);
            context.stroke();
            context.fillText(tick.label, tick.x, tickBaseline + 9);
        }
        context.restore();
    }

    /* 별과 선만 패럴랙스로 움직입니다. 배경·눈금은 고정입니다 */
    context.save();
    context.translate(state.parallaxX, state.parallaxY);

    /* --- 연결선 --- */
    const drawnLinks = state.linkProgress * links.length;
    context.lineCap = 'round';

    links.forEach((link, index) => {
        const local = Math.min(1, Math.max(0, drawnLinks - index));
        if (local <= 0) {
            return;
        }

        const from = stars[link.from];
        const to = stars[link.to];
        const fromY = from.y + driftOffset(from, state);
        const toY = to.y + driftOffset(to, state);

        context.strokeStyle = link.weight >= 2 ? palette.linkStrong : palette.linkWeak;
        context.lineWidth =
            link.weight >= 2 ? (theme === 'dark' ? 1 : 0.8) : theme === 'dark' ? 0.7 : 0.6;

        context.beginPath();
        context.moveTo(from.x, fromY);
        context.lineTo(from.x + (to.x - from.x) * local, fromY + (toY - fromY) * local);
        context.stroke();
    });

    /* --- 별 --- */
    for (const star of stars) {
        const isLatest = star.rank === 0;
        const isActive = state.activeIndex === star.index;
        const y = star.y + driftOffset(star, state);
        const color = starColor(palette, star);

        const pulse =
            isLatest && state.amplitude > 0
                ? 1 + Math.sin(state.time * 2) * PULSE_AMPLITUDE * state.amplitude
                : 1;
        const radius = star.radius * pulse * (isActive ? HOVER_SCALE : 1);

        if (isLatest) {
            const sprite = sprites.bloom.get('latest');
            if (sprite) {
                drawSprite(context, sprite, star.x, y, dpr);
            }
        } else if (theme === 'dark') {
            const sprite = sprites.bloom.get(`${color}|${bloomStep(star.recency)}`);
            if (sprite) {
                context.globalAlpha = star.alpha;
                drawSprite(context, sprite, star.x, y, dpr);
                context.globalAlpha = 1;
            }
        }

        context.globalAlpha = star.alpha;

        if (isLatest) {
            /* 🔴 색만으로는 최신 별을 구분할 수 없습니다 — 다크에서 골드가
               Survey 카테고리 색과 같은 값이고 실제로 최신 글이 Survey 입니다.
               가장 큰 반지름 + 큰 블룸 + 링, 그리고 화면의 텍스트 라벨이
               색 외의 단서 셋을 만듭니다(§3-4). */
            context.fillStyle = palette.latest;
            context.beginPath();
            context.arc(star.x, y, radius + (theme === 'light' ? 0.6 : 0), 0, Math.PI * 2);
            context.fill();

            context.globalAlpha = 1;
            context.lineWidth = 1;
            context.strokeStyle = palette.latest;
            context.beginPath();
            context.arc(star.x, y, radius + 3, 0, Math.PI * 2);
            context.stroke();
        } else if (theme === 'light' && star.recency < FILLED_RECENCY) {
            /* 라이트는 밝기가 아니라 **형태**로 최신성을 말합니다(§3-4 M4).
               하한이 없으면 최고참 별이 1.8px 속 빈 원이 되어 사라집니다 */
            context.lineWidth = 1.2;
            context.strokeStyle = color;
            context.beginPath();
            context.arc(star.x, y, Math.max(HOLLOW_MIN_RADIUS, radius), 0, Math.PI * 2);
            context.stroke();
        } else {
            context.fillStyle = color;
            context.beginPath();
            context.arc(star.x, y, radius, 0, Math.PI * 2);
            context.fill();
        }

        if (isActive && !isLatest) {
            context.globalAlpha = 1;
            context.lineWidth = 1;
            context.strokeStyle = palette.latest;
            context.beginPath();
            context.arc(star.x, y, radius + 3, 0, Math.PI * 2);
            context.stroke();
        }

        context.globalAlpha = 1;
    }

    context.restore();
}

/**
 * 포인터에서 가장 가까운 별. 히트 반경 밖이면 `null`.
 *
 * ⚠️ 터치 기기에서는 **부르지 않습니다.** 별 사이 최소 간격이 sm 에서 11px 이라
 *    개별 별을 탭 대상으로 만들면 `--tap-min` 44px 에 4배 미달합니다(§3-5).
 */
export function findNearestStar(
    stars: readonly ConstellationStar[],
    x: number,
    y: number,
    hitRadius: number,
): ConstellationStar | null {
    let nearest: ConstellationStar | null = null;
    let best = hitRadius;

    for (const star of stars) {
        const distance = Math.hypot(star.x - x, star.y - y);
        if (distance <= best) {
            best = distance;
            nearest = star;
        }
    }

    return nearest;
}
