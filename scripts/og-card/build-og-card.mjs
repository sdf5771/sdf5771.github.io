/**
 * STEP 8 OG 공유 카드 — 캡처용 HTML 생성기
 *
 * `STEP8 OG Card.dc.html` 시안의 **첫 번째 아트보드(1200×630) 하나만** 옮긴 것입니다.
 * 시안에 함께 있던 300px·200px 축소 복제본 · 메신저 배치 시뮬레이션 ·
 * 정사각 크롭 미리보기 · 제목 슬롯 토글은 전부 web-design 의 검증용 참고물이라
 * 캡처 대상이 아니며 여기에 옮기지 않았습니다.
 *
 * 산출: scripts/og-card/og-card.html
 *
 * ── 재현 절차 (일회성. devDependency 를 추가하지 마세요) ─────────────────
 *   1) node scripts/og-card/build-og-card.mjs
 *   2) python3 -m http.server 8791 --bind 127.0.0.1      # 저장소 루트에서
 *        └ file:// 로 열면 크롬이 @font-face 를 교차 출처로 막아 폴백 서체가 됩니다.
 *   3) npx -y playwright@1.52.0 screenshot \
 *        --viewport-size=1200,630 \
 *        --wait-for-selector="body[data-fonts=ready]" \
 *        --wait-for-timeout=1500 \
 *        "http://127.0.0.1:8791/scripts/og-card/og-card.html" \
 *        public/og/default.png
 *        └ 버전을 1.52.0 으로 고정한 이유: playwright@latest 는 chromium-1234 를
 *          요구해 300MB 를 새로 받습니다. 1.52.0 은 이미 캐시된 chromium-1169 를 씁니다.
 *        └ screenshot CLI 는 deviceScaleFactor 를 항상 1 로 씁니다(플래그 없음).
 *          Retina 에서 수동 캡처하면 2400×1260 이 나오니 이 경로를 쓰세요.
 *        └ omitBackground 기본값 false → 배경 불투명(RGB, 알파 채널 없음).
 *   4) 검증: file public/og/default.png  → `1200 x 630, 8-bit/color RGB`
 *          300KB 를 넘으면 npx -y oxipng -o4 public/og/default.png
 * ─────────────────────────────────────────────────────────────────────
 *
 * 🔴 이 파일이 별 좌표·연결선의 정본입니다.
 *    시안은 런타임에 JS 로 별을 그리지만 여기서는 **정적 마크업으로 펼쳐서** 씁니다.
 *    캡처 결과가 스크립트 실행 타이밍에 좌우되지 않게 하기 위해서입니다.
 *
 * 근거: docs/handoff-step8-og.md · 시안 원문 아트보드 발췌
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'og-card.html')

export const W = 1200
export const H = 630

/** 중앙 텍스트 대역 — 별·연결선이 침범하면 안 되는 영역 (판단 노트 ①) */
export const SAFE_BAND = { x1: 200, y1: 118, x2: 1000, y2: 600 }

/** 별 — [x, y, 지름, goldFlag]. 좌표는 1200×630 기준 좌상단 기점. */
export const STARS = [
  [58, 116, 12, 0], [146, 208, 10, 0], [92, 322, 14, 0], [168, 436, 10, 0], [56, 524, 12, 0],
  [300, 66, 12, 0], [432, 104, 10, 0], [560, 56, 14, 0], [700, 100, 12, 0], [842, 62, 10, 0],
  [1016, 128, 14, 0], [1092, 220, 12, 0], [1032, 338, 10, 0], [1128, 442, 12, 0], [1016, 522, 14, 0],
  [378, 606, 10, 0], [620, 608, 12, 0], [762, 604, 10, 0],
  [186, 150, 14, 1], [1048, 566, 12, 1],
  [1046, 92, 24, 2],
]

/** 연결선 — 별 인덱스 쌍. 상단 호와 좌우 가장자리를 잇고, 화면 밖으로 흘러도 무방합니다. */
export const PAIRS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
  [10, 11], [11, 12], [12, 13], [13, 14],
  [4, 15], [15, 16], [16, 17], [17, 14],
  [18, 5], [1, 18], [20, 9], [20, 10], [19, 14],
]

const starColor = (flag) =>
  flag === 2 ? '#ffd770' : flag === 1 ? '#e6a536' : '#f4ecd2'

const starGlow = (flag) =>
  flag === 2
    ? '0 0 46px 14px rgba(255,215,112,.30)'
    : flag === 1
      ? '0 0 20px 4px rgba(230,165,54,.22)'
      : 'none'

/** 연결선 기하 — 두 별의 **중심**을 잇습니다(좌상단이 아님). */
export function link(a, b) {
  const ax = a[0] + a[2] / 2
  const ay = a[1] + a[2] / 2
  const bx = b[0] + b[2] / 2
  const by = b[1] + b[2] / 2
  const dx = bx - ax
  const dy = by - ay
  return {
    ax,
    ay,
    bx,
    by,
    w: Math.round(Math.sqrt(dx * dx + dy * dy)),
    rot: Math.round((Math.atan2(dy, dx) * 1800) / Math.PI) / 10,
    color: a[3] > 0 || b[3] > 0 ? 'rgba(230,165,54,.34)' : 'rgba(244,236,210,.16)',
  }
}

/**
 * 격자 60px.
 * 원문 주석의 마지막 값 표기(`y … 570`)는 60px 등차수열에 없는 값이라
 * 세로선 규칙(`x < 1200` → 60…1140)과 같은 형태인 `y < 630` → 60…600 으로 맞췄습니다.
 * 알파 0.035 순수 장식이라 어느 쪽이든 육안 차이가 없습니다.
 */
const gridLines = () => {
  const out = []
  for (let x = 60; x < W; x += 60) {
    out.push(
      `<span aria-hidden="true" style="position:absolute;top:0;bottom:0;left:${x}px;width:1px;background:rgba(230,165,54,.035)"></span>`,
    )
  }
  for (let y = 60; y < H; y += 60) {
    out.push(
      `<span aria-hidden="true" style="position:absolute;left:0;right:0;top:${y}px;height:1px;background:rgba(230,165,54,.035)"></span>`,
    )
  }
  return out.join('\n    ')
}

const linkLines = () =>
  PAIRS.map(([i, j]) => {
    const { ax, ay, w, rot, color } = link(STARS[i], STARS[j])
    return `<span aria-hidden="true" style="position:absolute;left:${ax}px;top:${ay}px;width:${w}px;height:1px;background:${color};transform-origin:0 0;transform:rotate(${rot}deg)"></span>`
  }).join('\n    ')

const starDots = () =>
  STARS.map(([x, y, d, flag]) => {
    const glow = starGlow(flag)
    return `<span aria-hidden="true" style="position:absolute;left:${x}px;top:${y}px;width:${d}px;height:${d}px;border-radius:999px;background:${starColor(flag)};box-shadow:${glow}"></span>`
  }).join('\n    ')

/** 기본 카드의 제목. 글별 카드는 이 문자열만 교체합니다 (핸드오프 §3-1). */
const TITLE = '프론트엔드 개발자 김섭우'

const html = `<meta charset="utf-8" />
<title>Seobisback.log — OG Card 1200x630</title>
<!--
  ⚠️ 이 파일은 생성물입니다. 직접 고치지 말고 build-og-card.mjs 를 고치세요.

  외부 의존이 하나도 없어야 캡처가 재현됩니다 — 시안의 CDN 폰트를
  src/assets/fonts 의 로컬 서브셋으로 교체했습니다. 네트워크가 끊긴 상태에서도
  같은 PNG 가 나와야 합니다.
-->
<style>
  @font-face {
    font-family: 'Galmuri11';
    src: url('../../src/assets/fonts/Galmuri11-subset.woff2') format('woff2');
    font-weight: 400;
    font-display: block;
  }
  @font-face {
    font-family: 'GalmuriMono11';
    src: url('../../src/assets/fonts/GalmuriMono11-subset.woff2') format('woff2');
    font-weight: 400;
    font-display: block;
  }
  @font-face {
    font-family: 'Pretendard';
    src: url('../../src/assets/fonts/Pretendard-Bold.woff2') format('woff2');
    font-weight: 700;
    font-display: block;
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #0a0f1c; }

  /*
    🔴 지우지 마세요. 픽셀 서체의 안티에일리어싱을 끄는 설정입니다.
    빠지면 도트 가장자리가 회색으로 번진 PNG 가 나오고, 그 순간 이 카드가
    픽셀 서체를 쓰는 이유가 사라집니다. (docs/handoff-step8-og.md §2-2 필수조건 3)
  */
  #artboard, #artboard * {
    -webkit-font-smoothing: none;
    font-smooth: never;
  }
  /* 정지 이미지입니다 — 애니메이션·전환이 캡처 타이밍에 끼어들지 않게 못박습니다. */
  #artboard *, #artboard *::before, #artboard *::after {
    animation: none !important;
    transition: none !important;
  }
</style>

<div id="artboard" style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a0f1c">
    ${gridLines()}

    ${linkLines()}

    ${starDots()}

    <div id="text-block" style="position:absolute;left:0;right:0;top:118px;display:flex;flex-direction:column;align-items:center">
      <div style="width:max-content">
        <div id="wordmark-1" style="font-family:'Galmuri11',sans-serif;font-size:99px;line-height:1;color:#f4ecd2">Seobisback</div>
        <div id="wordmark-2" style="font-family:'Galmuri11',sans-serif;font-size:99px;line-height:1;color:#e6a536;text-align:right;margin-top:4px">.log</div>
      </div>

      <span id="rule" aria-hidden="true" style="display:block;width:132px;height:3px;background:#e6a536;margin-top:26px"></span>

      <!-- ★ 제목 슬롯 ★ 글별 카드는 이 안의 텍스트만 교체합니다 (핸드오프 §3-1).
           높이 168px 은 시안 마크업 정본입니다 — 핸드오프 §1-5 의 172px 은 오기입니다. -->
      <div id="title-slot" style="width:1000px;height:168px;margin-top:22px;display:flex;align-items:flex-start;justify-content:center">
        <div id="title" style="font-family:'Pretendard',sans-serif;font-weight:700;font-size:62px;line-height:1.3;color:#f4ecd2;text-align:center;letter-spacing:-0.01em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${TITLE}</div>
      </div>
    </div>

    <!-- 도메인 — 우선순위 4순위. 22px(11×2)입니다. 26px 은 11 의 정수배가 아니라
         비트맵 격자가 어긋나 도트가 뭉갭니다 (핸드오프 §1-2). -->
    <div id="domain" style="position:absolute;left:0;right:0;bottom:34px;text-align:center;font-family:'GalmuriMono11',monospace;font-size:22px;color:#7f8aa8">sdf5771.github.io</div>
</div>

<script>
  /*
    캡처 스크립트가 이 플래그를 기다립니다. 폰트가 준비되기 전에 찍으면
    폴백 서체로 굳은 PNG 가 나오는데, 그건 눈으로 봐야 알아채는 종류의 사고입니다.
    플래그가 안 붙으면 캡처가 성공하는 대신 실패하도록 설계했습니다.
  */
  document.fonts.ready.then(function () {
    document.body.setAttribute('data-fonts', 'ready')
  })
</script>
`

mkdirSync(HERE, { recursive: true })
writeFileSync(OUT, html, 'utf8')
console.log(`✅ ${OUT} (별 ${STARS.length} · 연결선 ${PAIRS.length})`)
