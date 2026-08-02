import { useMemo } from 'react';
import styles from './PostGlyph.module.css';
import { hashSeed } from '../../utils/glyphSeed';

/**
 * 글 목록의 96×64 썸네일 슬롯 — **생성 그래픽**입니다.
 * 명세: docs/handoff-step4-list.md §6 (요구사항 R1~R10)
 *
 * 왜 실제 이미지를 쓰지 않는가 (사용자 확정)
 * ------------------------------------------
 * 썸네일이 있는 글은 24/41 이고, 그중 **의도적으로 만든 것은 1장**입니다.
 * 나머지 23장은 `generatePostsData` 가 이미지 폴더의 **첫 파일**을 집은 것이라
 * `browser01.png`·`10.jpeg` 같은 임의 본문 스크린샷입니다. 96×64 로 줄이면
 * 판독 불가능한 색 얼룩이 되고, 행마다 무작위로 다른 얼룩이 놓이면 이 화면의
 * 주 과업(41개를 훑기)을 **방해**합니다. 1페이지 전송량도 3.76 MB → 0 이 됩니다.
 *
 * 조형 — 404 도트 성좌·홈 별자리와 같은 언어
 * -------------------------------------------
 * 점을 찍고 이웃을 잇습니다. `DotConstellation` 과 같은 문법이고, 여기서는
 * 타일 크기에 맞춘 파라미터(열당 점 하나 = 항상 가로로 퍼짐)를 씁니다.
 *
 * | R  | 요구 | 이 구현 |
 * |----|------|---------|
 * | R1 | 결정론적 | `slug` 해시만 씁니다. 난수·시간 의존 없음 |
 * | R2 | 입력은 글 데이터 | `slug`(파일명 유래) + `category` |
 * | R3 | 색은 `--color-cat-*` 파생 | 점 색이 행의 카테고리 점과 같은 색입니다 |
 * | R4 | 96×64 에서 판독 | 셀 16px, 점 지름 6px(반지름 3) — 최소 3px 충족 |
 * | R5 | 연결선 대비 ≥ 3:1 | `--color-border-interactive`(라이트 3.78 / 다크 4.32). 시안값 `rgba(23,28,43,.22)` 는 1.58:1 로 **반려**됐습니다 |
 * | R6 | 장식 | `aria-hidden` + `focusable="false"`. 옆에 제목이 이미 있습니다 |
 * | R7 | 인라인 SVG 1노드 | 20행 × SVG 1개. 시안의 span 11개 방식이면 220 노드 |
 * | R8 | 애니메이션 없음 | 20개가 동시에 움직이면 훑기를 방해합니다 |
 * | R9 | 고정 aspect box | viewBox 고정 + CSS 비율 → CLS 0 |
 *
 * ⚠️ 배경·연결선 토큰(`--color-constellation-bg` 등)은 **STEP 2(홈 히어로) 소유**로
 *    아직 없습니다. 그때까지 기존 토큰만 소비하며, 토큰이 생기면 이 파일에서
 *    `--color-bg-raised` / `--color-border-interactive` 두 곳만 바꾸면 됩니다.
 */

const COLUMNS = 6;
const ROWS = 4;
const CELL = 16;

const WIDTH = COLUMNS * CELL; // 96
const HEIGHT = ROWS * CELL; // 64

const DOT_RADIUS = 3;
/** 시작점 하나만 크게 — 타일마다 "어디서 시작하는 성좌인가"가 달라 보입니다 */
const LEAD_DOT_RADIUS = 4.5;

/**
 * 카테고리 → 색 토큰. 행의 카테고리 점·라벨과 **같은 색**이라 행 안에서 정보가
 * 겹쳐 보강됩니다(R3). 모르는 카테고리는 액센트로 떨어집니다 — 카테고리가
 * 늘어도 타일이 비지 않습니다.
 */
const CATEGORY_COLOR: Record<string, string> = {
    Study: 'var(--color-cat-study)',
    Survey: 'var(--color-cat-survey)',
    Activity: 'var(--color-cat-activity)',
};

interface Point {
    x: number;
    y: number;
}

/**
 * 열마다 점 하나. 항상 가로로 고르게 퍼져 96×64 에서 성좌로 읽히고,
 * 세로 위치 4가지 × 6열 = 4,096가지라 41편이 서로 겹치지 않습니다.
 */
function buildPoints(seed: number): Point[] {
    const points: Point[] = [];
    let state = seed;

    for (let column = 0; column < COLUMNS; column += 1) {
        /* 열마다 해시를 한 번 더 돌려 이웃 열의 값과 상관이 생기지 않게 합니다 */
        state = Math.imul(state ^ (state >>> 15), 0x2545f491) >>> 0;
        const row = state % ROWS;

        points.push({
            x: column * CELL + CELL / 2,
            y: row * CELL + CELL / 2,
        });
    }

    return points;
}

interface PostGlyphProps {
    /** 결정론의 씨앗. 41편 전부 고유하고 빌드마다 같습니다 */
    slug: string;
    category: string;
    className?: string;
}

function PostGlyph({ slug, category, className }: PostGlyphProps) {
    /*
     * 씨앗 해시는 `utils/glyphSeed` 로 옮겼습니다 — 작업 목록의 `WorkGlyph` 가
     * **같은 해시**를 써야 두 화면 56개 타일이 한 시스템으로 남습니다(STEP 7 §9-1).
     * 동작은 이전과 한 비트도 다르지 않습니다.
     */
    const points = useMemo(() => buildPoints(hashSeed(slug)), [slug]);

    const dotColor = CATEGORY_COLOR[category] ?? 'var(--color-accent-text)';
    const polyline = points.map(point => `${point.x},${point.y}`).join(' ');

    return (
        <svg
            className={className ? `${styles.glyph} ${className}` : styles.glyph}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            width={WIDTH}
            height={HEIGHT}
            /* 옆에 글 제목이 이미 있습니다. 읽으면 제목이 두 번 낭독됩니다(R6) */
            aria-hidden="true"
            role="presentation"
            /* 빠뜨리면 구 Edge 계열에서 SVG 가 탭 순서에 들어갑니다 */
            focusable="false"
        >
            {/* 연결선 — 점만 찍으면 점 무리이고, 이어야 성좌로 읽힙니다 */}
            <polyline
                points={polyline}
                fill="none"
                stroke="var(--color-border-interactive)"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {points.map((point, index) => (
                <circle
                    key={`${point.x}-${point.y}`}
                    cx={point.x}
                    cy={point.y}
                    r={index === 0 ? LEAD_DOT_RADIUS : DOT_RADIUS}
                    fill={dotColor}
                />
            ))}
        </svg>
    );
}

export default PostGlyph;
