import { useMemo } from 'react';
import styles from './WorkGlyph.module.css';
import { createLcg, hashSeed } from '../../utils/glyphSeed';

/**
 * 작업 목록·상세의 생성 그래픽 — `variant="work"`.
 * 명세: docs/handoff-step7-works.md §9 (요구 R1~R9 는 STEP 4 §6-3 소유)
 *
 * 왜 이미지가 아닌가 (사용자 확정 · product.md §13-5 리스크 5)
 * -----------------------------------------------------------
 * **스크린샷은 익명화가 불가능합니다.** 제목을 `대형 보험사 …` 로 익명화해 놓고
 * 옆에 실제 화면 캡처를 붙이면 익명화가 그 자리에서 무효가 됩니다. 그래서 고객사
 * 화면은 쓰지 않고, **15건 전량**을 생성 그래픽으로 통일합니다 — 3건만 실사진을
 * 쓰면 그 셋만 진짜로 보이고 나머지 12건이 "자리 못 채운 칸" 으로 읽힙니다.
 *
 * 🔴 `PostGlyph` 와 **같은 조형 언어, 다른 배열 규칙**입니다(§2-3).
 *
 * | | `PostGlyph` (글 41편) | 이 컴포넌트 (작업 15건) |
 * |---|---|---|
 * | 조형 | 자유 좌표 성좌 — 점 + 직선 | **격자 정렬 + 직각 배선(맨해튼)** |
 * | 시드 | `slug` | `slug` (같은 해시 · `utils/glyphSeed`) |
 * | 노드 수 | 태그 수 | **스택 수** → `clamp(3, n, 9)` |
 * | 노드 색 | `--color-cat-*` (카테고리) | **`--color-accent-text` 단일** |
 * | 배선 색 | `--color-border-interactive` | **동일** |
 *
 * 나란히 놓으면 "같은 집안, 다른 종류" 로 읽힙니다 — 색이 두 화면을 가르는 축
 * (카테고리색 = 글 / 골드 = 작업), 조형이 두 번째 축입니다.
 *
 * 🔴 **유형(업무/개인·팀)으로 색을 나누지 않습니다**(§2-3 반려).
 *    시안은 개인·팀에 라일락(`--color-status-accent`)을 썼는데 그 값은
 *    `--color-cat-study` 와 **동일**합니다 — 글 목록에서 라일락 타일은 `Study`
 *    카테고리를 뜻하므로, 같은 색이 두 화면에서 다른 것을 의미하게 됩니다.
 *    게다가 유형은 메타 줄의 텍스트가 이미 말하고 있어 색은 정보를 더하지 않습니다.
 *
 * 🔴 **인라인 SVG 1노드**(R7). 시안 방식(격자 9 + 배선 2(n−1) + 노드 n 을 전부
 *    `<span>`)이면 스택 13개짜리 행 하나가 46노드, 15행이면 690노드입니다.
 */

/** 6열 × 3행 = 18칸. 시안의 상한 18은 96×64 에서 격자가 꽉 차 형태가 사라집니다 */
const COLUMNS = 6;
const ROWS = 3;

const WIDTH = 96;
const HEIGHT = 64;

/** 셀 중심 간격. 가장자리에 반 칸씩 여백이 남게 (n+1) 로 나눕니다 */
const COLUMN_STEP = WIDTH / (COLUMNS + 1); // 13.71
const ROW_STEP = HEIGHT / (ROWS + 1); // 16

/** R4 — 96×64 에서 판독 가능한 최소 크기(3px)를 넘습니다 */
const NODE_SIZE = 4.8;

/** 🔴 시안 1.5px → 2px 상향(§9-2 R4). 1.5px 은 96×64 에서 사라집니다 */
const WIRE_WIDTH = 2;

const MIN_NODES = 3;
const MAX_NODES = 9;

interface Cell {
    column: number;
    row: number;
}

/**
 * 18칸 중 `count` 칸을 **비복원 추출**합니다.
 *
 * 부분 Fisher–Yates 입니다. 중복을 뽑고 버리는 방식(rejection)은 `count` 가 9로
 * 커지면 반복 횟수가 불안정해지고, 그건 결정론과 무관하게 그냥 느립니다.
 */
function pickCells(seed: number, count: number): Cell[] {
    const next = createLcg(seed);
    const pool: Cell[] = [];

    for (let column = 0; column < COLUMNS; column += 1) {
        for (let row = 0; row < ROWS; row += 1) {
            pool.push({ column, row });
        }
    }

    for (let index = 0; index < count; index += 1) {
        const swap = index + (next() % (pool.length - index));
        [pool[index], pool[swap]] = [pool[swap], pool[index]];
    }

    return pool.slice(0, count);
}

interface WorkGlyphProps {
    /** 결정론의 씨앗. 15건 전부 고유하고 빌드마다 같습니다 */
    slug: string;
    /** 스택 개수. 0(미기입)이어도 하한 3개가 그려져 타일이 비지 않습니다 */
    stackCount: number;
    className?: string;
}

function WorkGlyph({ slug, stackCount, className }: WorkGlyphProps) {
    const nodes = useMemo(() => {
        const count = Math.min(Math.max(stackCount, MIN_NODES), MAX_NODES);

        return (
            pickCells(hashSeed(slug), count)
                /*
                 * 🔴 **열 오름차순 → 같은 열이면 행 오름차순**(§9-2).
                 *    배선이 좌→우로 흐르게 하는 유일한 장치입니다. 정렬하지 않으면
                 *    직각 배선이 앞뒤로 되돌아가 격자가 아니라 낙서로 보입니다.
                 */
                .sort((a, b) => a.column - b.column || a.row - b.row)
                .map(cell => ({
                    x: (cell.column + 1) * COLUMN_STEP,
                    y: (cell.row + 1) * ROW_STEP,
                }))
        );
    }, [slug, stackCount]);

    /*
     * 맨해튼 라우팅 — 인접 두 점을 **수평 → 수직** 2구간으로 잇습니다.
     * `H`/`V` 만 쓰므로 대각선이 한 번도 나오지 않고, 그게 글 쪽 자유 성좌와
     * 이 타일을 가르는 조형입니다.
     */
    const wire = nodes
        .map((node, index) =>
            index === 0 ? `M${node.x} ${node.y}` : `H${node.x}V${node.y}`,
        )
        .join('');

    /* 6개의 세로선 + 3개의 가로선 = 격자 9선 */
    const columnLines = Array.from({ length: COLUMNS }, (_, index) => (index + 1) * COLUMN_STEP);
    const rowLines = Array.from({ length: ROWS }, (_, index) => (index + 1) * ROW_STEP);

    return (
        <svg
            className={className ? `${styles.glyph} ${className}` : styles.glyph}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            width={WIDTH}
            height={HEIGHT}
            /* 옆에 작업 제목이 이미 있습니다. 읽으면 제목이 두 번 낭독됩니다(R6) */
            aria-hidden="true"
            role="presentation"
            /* 빠뜨리면 구 Edge 계열에서 SVG 가 탭 순서에 들어갑니다 */
            focusable="false"
        >
            {/*
             * 배경 격자. 🔴 색은 **CSS 변수로만** 넣습니다 — JS 에 하드코딩하면
             * 테마 전환이 깨집니다. SVG 는 DOM 에 인라인이라 var() 가 그대로
             * 해석됩니다(canvas 와 달리 getComputedStyle 이 필요 없습니다).
             */}
            <g stroke="var(--color-border-subtle)" strokeWidth={1}>
                {columnLines.map(x => (
                    <line key={`c${x}`} x1={x} y1={0} x2={x} y2={HEIGHT} />
                ))}
                {rowLines.map(y => (
                    <line key={`r${y}`} x1={0} y1={y} x2={WIDTH} y2={y} />
                ))}
            </g>

            <path
                d={wire}
                fill="none"
                stroke="var(--color-border-interactive)"
                strokeWidth={WIRE_WIDTH}
                strokeLinecap="square"
                strokeLinejoin="miter"
            />

            <g fill="var(--color-accent-text)">
                {nodes.map(node => (
                    <rect
                        key={`${node.x}-${node.y}`}
                        x={node.x - NODE_SIZE / 2}
                        y={node.y - NODE_SIZE / 2}
                        width={NODE_SIZE}
                        height={NODE_SIZE}
                        rx={1}
                    />
                ))}
            </g>
        </svg>
    );
}

export default WorkGlyph;
