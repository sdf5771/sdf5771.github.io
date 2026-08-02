import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import styles from './DotConstellation.module.css';
import { useMediaMatch } from '../../hooks';
import { MEDIA_MOBILE } from '../../styles/breakpoints';

/**
 * 404 도트 성좌.
 * 명세: docs/handoff-step5-404-about.md §4-3 · §4-4 · §8
 *
 * 조형의 뜻: 홈 히어로가 "이어져 있음"(41편이 별, 태그 공유가 연결선)이라면
 * 이 화면은 같은 문법으로 **"끊어짐"**을 말합니다. 별 하나가 성좌에서 떨어져
 * 나가고, 원래 자리에는 빈 윤곽만 남습니다.
 *
 * canvas 가 아니라 **SVG** 입니다(§8-1). 요소가 45개뿐이고, CSS 의
 * prefers-reduced-motion 과 테마 토큰(var())이 그대로 먹으며, 접근성이
 * `aria-hidden` 한 줄로 끝납니다. canvas 였다면 rAF 수명주기·matchMedia 구독·
 * 테마 전환 시 색 재읽기를 전부 직접 해야 합니다.
 */

/** 5칸 × 7칸 비트맵. 시안 원문 `GLYPHS` */
const GLYPHS: Record<string, number[][]> = {
    '4': [
        [1, 0, 0, 1, 0],
        [1, 0, 0, 1, 0],
        [1, 0, 0, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 1, 0],
    ],
    '0': [
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
    ],
};

const CHARS = ['4', '0', '4'];

const GLYPH_COLUMNS = 5;
const GLYPH_ROWS = 7;
/** 자간 2칸. 1칸이 아닙니다 — 글자를 시각적으로 분리하는 역할도 겸합니다 */
const GLYPH_GAP_COLUMNS = 2;

/** 셀 피치. 20 = --space-5, 12 = --space-3 으로 4px 스케일에 정확히 얹힙니다 */
const CELL_DESKTOP = 20;
const CELL_MOBILE = 12;

/**
 * 이탈한 별의 원래 자리 — 마지막 `4`의 4행·5열(0-인덱스).
 * 가로 획의 오른쪽 끝이자 전체 격자의 마지막 열이라, 우상향으로 빠져나갈 때
 * 다른 글자를 가로지르지 않습니다.
 */
const LOST = { glyph: 2, row: 3, column: 4 };

/** 이탈 방향 단위벡터 — 우상향 */
const LOST_DIRECTION = { x: 0.8, y: -0.6 };

/*
 * 이탈 별의 **정지 위치**. 0(원래 자리)으로 멈추면 별이 격자로 돌아가
 * "끊어진 연결"이 깨집니다(§8-2).
 *
 * 🔴 값이 아니라 **공식이 명세**입니다 (handoff-step1-shell.md §14-1a A).
 *
 *      가시 간격 = 중심거리 D − (r₁ + r₂) ≥ 10px
 *
 * 10px 의 근거: 점선이 "끊어진 연결"로 읽히려면 대시 2개 + 사이 간격(6px)이
 * 필요하고, 양 끝이 원에 닿지 않게 2px 씩(4px) 더합니다.
 * 시안 원문의 `drift = 0.6` 은 데스크톱에서 D = 12px, r₁+r₂ = 13px 이라
 * 가시 간격이 **−1px** — 점선이 가려진 게 아니라 **두 원이 겹쳐** 있었습니다.
 *
 * 그래서 상수를 두지 않고 cell 과 반지름에서 매번 계산합니다.
 * 데스크톱(cell 20): (6 + 7 + 11) / 20 = **1.2**  → D 24px, 가시 간격 11px
 * 모바일  (cell 12): (3.6 + 4.2 + 11) / 12 ≈ **1.57** → D 18.8px, 가시 간격 11px
 * 반지름을 줄이지 않는 이유: 13px 은 별이 "별"로 읽히는 최소 크기에 가깝고,
 * 위치는 조정해도 조형이 약해지지 않습니다.
 */
const MIN_VISIBLE_GAP = 10;
/** 반지름 배율이 조금 바뀌어도 공식이 깨지지 않게 두는 여유 */
const GAP_MARGIN = 1;

const DRIFT_AMPLITUDE = 0.42;

interface Point {
    x: number;
    y: number;
}

interface Segment {
    from: Point;
    to: Point;
}

/** SVG 좌표에 소수점이 길게 붙지 않도록 */
function round(value: number): number {
    return Math.round(value * 100) / 100;
}

function buildScene(cell: number) {
    const totalColumns =
        GLYPH_COLUMNS * CHARS.length + GLYPH_GAP_COLUMNS * (CHARS.length - 1); // 19

    /* 글리프 박스를 원점에 두고 우측에만 1.5칸 여백 — 이탈 별이 들어갈 자리 */
    const width = round(totalColumns * cell + cell * 1.5);
    const height = round(GLYPH_ROWS * cell);

    const center = (glyph: number, row: number, column: number): Point => ({
        x: round((glyph * (GLYPH_COLUMNS + GLYPH_GAP_COLUMNS) + column) * cell + cell / 2),
        y: round(row * cell + cell / 2),
    });

    const dots: Point[] = [];
    const segments: Segment[] = [];

    CHARS.forEach((char, glyph) => {
        const grid = GLYPHS[char];

        for (let row = 0; row < GLYPH_ROWS; row += 1) {
            for (let column = 0; column < GLYPH_COLUMNS; column += 1) {
                if (!grid[row][column]) {
                    continue;
                }

                const from = center(glyph, row, column);

                const isLost =
                    glyph === LOST.glyph && row === LOST.row && column === LOST.column;
                if (!isLost) {
                    dots.push(from);
                }

                /*
                 * 격자 이웃 연결 — 오른쪽·아래 두 방향, **같은 글자 안에서만**.
                 * 이 선이 「성좌」 조형의 본체입니다. 도트만 찍으면 점 무리이고,
                 * 이웃 연결이 있어야 별자리로 읽힙니다.
                 */
                if (column + 1 < GLYPH_COLUMNS && grid[row][column + 1]) {
                    segments.push({ from, to: center(glyph, row, column + 1) });
                }
                if (row + 1 < GLYPH_ROWS && grid[row + 1][column]) {
                    segments.push({ from, to: center(glyph, row + 1, column) });
                }
            }
        }
    });

    const dotRadius = round(cell * 0.3);
    const starRadius = round(cell * 0.35);

    /* 위 공식으로 정지 위치를 뽑습니다. 저감 모션은 애니메이션이 없어 이 자리에
       그대로 멈추므로, 가장 잘 읽혀야 하는 상태가 곧 이 값입니다(§4-4 조건 4) */
    const driftRest = (dotRadius + starRadius + MIN_VISIBLE_GAP + GAP_MARGIN) / cell;

    const lostSlot = center(LOST.glyph, LOST.row, LOST.column);
    const star: Point = {
        x: round(lostSlot.x + LOST_DIRECTION.x * driftRest * cell),
        y: round(lostSlot.y + LOST_DIRECTION.y * driftRest * cell),
    };

    return {
        width,
        height,
        dots,
        segments,
        lostSlot,
        star,
        dotRadius,
        starRadius,
        /* 표류 애니메이션의 진폭. 정지 위치를 기준으로 ± 로 흔듭니다 */
        driftX: round(LOST_DIRECTION.x * DRIFT_AMPLITUDE * cell),
        driftY: round(LOST_DIRECTION.y * DRIFT_AMPLITUDE * cell),
    };
}

function DotConstellation() {
    const isMobileViewport = useMediaMatch(MEDIA_MOBILE);
    const cell = isMobileViewport ? CELL_MOBILE : CELL_DESKTOP;

    /*
     * viewBox 가 뷰포트마다 다릅니다(410×140 / 246×84). 하나를 CSS 로 스케일하면
     * 셀 20/12 라는 원문 의도가 재현되지 않으므로, <svg> 를 두 벌 두는 대신
     * cell 을 변수로 받아 좌표를 계산합니다.
     */
    const scene = useMemo(() => buildScene(cell), [cell]);

    const gridStrokeWidth = isMobileViewport ? 0.75 : 1;
    const accentStrokeWidth = isMobileViewport ? 1.5 : 2;
    const brokenDashArray = isMobileViewport ? '3 4' : '4 6';

    return (
        <svg
            className={styles.constellation}
            /* 바로 아래 h1 이 상황을 이미 말합니다. 스크린리더가 "404"를 따로
               읽으면 음성 채널에만 에러 코드가 생깁니다(§2-① 조건 2) */
            aria-hidden="true"
            /* 빠뜨리면 구 Edge 계열에서 SVG 가 탭 순서에 들어갑니다 */
            focusable="false"
            viewBox={`0 0 ${scene.width} ${scene.height}`}
            /* viewBox 와 폭을 같은 값에서 뽑아 둘이 어긋날 수 없게 합니다 */
            style={{ width: `min(${scene.width}px, 84vw)` }}
        >
            {/*
             * 🟠 명세(§4-3)는 격자 연결선도 --color-hero-link-weak 이라고 적었지만
             *    그 값이 다크에서 rgba(230,165,54,.11) 이라 1px 선이 배경에 묻혀
             *    **화면에서 완전히 사라집니다.** 그러면 같은 §4-3 이 못 박은
             *    "도트만 찍으면 점 무리이고, 이웃 연결이 있어야 별자리로 읽힙니다"가
             *    성립하지 않습니다. 실제로 브라우저에서 확인했습니다.
             *
             *    새 토큰을 만들지 않고 **바로 옆 단계인 -strong 으로만** 올립니다.
             *    부수 효과로 「이어져 있는 선(strong)」과 「끊어진 선(weak)」의 세기가
             *    갈려 §4-4 가 요구하는 대비가 오히려 분명해집니다.
             *    → web-design 확인 필요. 되돌리려면 이 한 단어만 바꾸면 됩니다.
             */}
            <g
                className={styles.grid_links}
                stroke="var(--color-hero-link-strong)"
                strokeWidth={gridStrokeWidth}
            >
                {scene.segments.map(segment => (
                    <line
                        key={`${segment.from.x},${segment.from.y}-${segment.to.x},${segment.to.y}`}
                        x1={segment.from.x}
                        y1={segment.from.y}
                        x2={segment.to.x}
                        y2={segment.to.y}
                    />
                ))}
            </g>

            {/* 끊어진 연결선 — 화면에서 유일하게 끊어진 선입니다 */}
            <line
                className={styles.broken_link}
                x1={scene.lostSlot.x}
                y1={scene.lostSlot.y}
                x2={scene.star.x}
                y2={scene.star.y}
                stroke="var(--color-hero-link-weak)"
                strokeWidth={accentStrokeWidth}
                strokeDasharray={brokenDashArray}
                strokeLinecap="round"
            />

            {/*
             * 빈 자리 윤곽 — **정지 상태 성립의 필요조건**입니다(§4-4).
             * 도트를 그냥 지우면 "빠졌다"는 사실 자체가 사라집니다. 특히 이 자리가
             * `4`의 가로 획 끝이라, 윤곽이 없으면 짧아진 획이 원래 모양처럼 보입니다.
             *
             * 색은 `--color-border-interactive` 입니다(web-design 판정, M-1).
             * `--color-border-strong` 은 대비가 라이트 1.40 / 다크 1.58 뿐이라
             * "반드시 지각되어야 하는 경계"를 감당하지 못했습니다
             * (interactive: 라이트 3.78 / 다크 4.32). 새 토큰은 만들지 않습니다.
             * 골드 별이 그 두 배쯤 되어 **별이 주인공, 윤곽은 명확하되 종속**이라는
             * 위계도 그대로입니다.
             */}
            <circle
                cx={scene.lostSlot.x}
                cy={scene.lostSlot.y}
                r={scene.dotRadius}
                fill="none"
                stroke="var(--color-border-interactive)"
                strokeWidth={accentStrokeWidth}
            />

            <g fill="var(--color-text-muted)">
                {scene.dots.map((dot, index) => (
                    <circle
                        key={`${dot.x},${dot.y}`}
                        className={styles.dot}
                        cx={dot.x}
                        cy={dot.y}
                        r={scene.dotRadius}
                        /* 반짝임 시작점을 흩어 한꺼번에 깜빡이지 않게 합니다.
                           음수 지연이라 끝나는 시점은 예산 안에 그대로 있습니다 */
                        style={{ '--twinkle-delay': `-${(index % 8) * 0.3}s` } as CSSProperties}
                    />
                ))}
            </g>

            {/*
             * 표류(이동)와 맥동(크기)을 <g> 와 <circle> 로 나눠 겁니다.
             * 한 요소에 둘 다 걸면 두 애니메이션이 같은 transform 속성을 다퉈
             * 나중 것만 남습니다.
             */}
            <g
                className={styles.star_drift}
                style={
                    {
                        '--drift-x': `${scene.driftX}px`,
                        '--drift-y': `${scene.driftY}px`,
                    } as CSSProperties
                }
            >
                <circle
                    className={styles.star}
                    cx={scene.star.x}
                    cy={scene.star.y}
                    r={scene.starRadius}
                    fill="var(--color-accent-text)"
                />
            </g>
        </svg>
    );
}

export default DotConstellation;
