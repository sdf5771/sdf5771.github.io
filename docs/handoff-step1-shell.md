# 핸드오프 명세 — STEP 1 · 디자인 토큰 + 전역 셸

> web-design → frontend / 2026-08-01
> 근거 시안: Claude Design `STEP1 Foundations.dc.html` (프로젝트 `4a95a040-…260f`)
> **이 문서 하나만 읽고 구현할 수 있게 작성했습니다.** 값이 없어 판단이 필요하면 §12를 보세요.
> 작업 브랜치: **`renewal`** — `main`은 push 즉시 프로덕션 배포되므로 건드리지 마세요.

---

## 1. 범위

**이번 구현 대상**: 디자인 토큰 · 폰트 · 테마 전환 · 전역 셸(헤더 / 모바일 드로어 / 검색 UI / 푸터 / 테마 토글).
**대상 아님**: 홈·글 목록·글 상세 등 개별 화면(STEP 2~7), 검색 **로직**(UI 껍데기만 만들고 결과 연결은 글 목록 화면과 함께).

### 1-1. 🔴 선행 조건 — 이것부터 하세요

`src/global.css`의 아래 두 줄을 **먼저 제거**해야 합니다.

```css
* { font-family: 'Pretendard', sans-serif; font-weight: 400; }
```

이 universal 선택자가 **모든 요소의 서체와 굵기를 덮어씁니다.** 남겨두면 픽셀 서체가 단 한 글자도 적용되지 않습니다.
⚠️ 제거하면 **기존 화면의 굵기가 전부 바뀝니다**(`font-weight: 400` 강제가 사라지므로 `<strong>`·`<h1>` 등이 브라우저 기본 굵기로 돌아옴). 제거 직후 기존 화면 회귀를 한 번 확인하고 넘어가세요.

---

## 2. 시안 대조 결과 — 무엇이 확정이고 무엇을 고쳤나

시안의 인라인 값을 추출해 확정 명세(`agent-log/design.md`)와 한 값씩 대조했습니다.

**결론: 36개 색 토큰 중 34개가 명세와 정확히 일치**했습니다. 아래 4건만 조정합니다.

| # | 항목 | 명세 | 시안 | 판정 | 근거 |
|---|------|------|------|------|------|
| 1 | 라이트 `accent-subtle` | `rgba(230,165,54,.10)` | `rgba(230,165,54,.14)` | ✅ **시안 채택** | .10은 흰 배경 위에서 합성 후 대비 **1.07**, .14도 **1.11**. 둘 다 단독으로는 안 읽히지만 .14가 그나마 형태를 남깁니다 |
| 2 | 라이트 `focus-ring` 글로우 | (미정의) | `rgba(125,92,14,.26)` | ✅ **시안 채택** | `#7d5c0e`의 알파 버전. 다크(.28)와 대칭이고 값이 합리적 |
| 3 | `accent-light` `#f5b94a` | 정의됨 | **없음** | ⚠️ **누락 아님** | 그라데이션 상단 전용이라 STEP 1 범위 밖. 토큰 표에는 포함해 두세요 |
| 4 | 다크 `status-danger` | **미정의** | **없음** | 🔧 **신규 확정 → `#ff6b6b`** | 라이트만 `#c0392b`가 있었습니다. `#ff6b6b`는 `#0a0f1c` 대비 **6.89:1** AA 통과 |

**특히 확인한 3가지 — 전부 시안에 살아 있습니다.**

| 확인 항목 | 결과 |
|---|---|
| 라이트 보정값(액센트 텍스트 `#7d5c0e` / 링크 `#1a6d99` / 카테고리 `#7d5c0e`·`#6b4a86`·`#1b6b33` / 포커스 `#7d5c0e` / 액센트 보더 `#a97213`) | ✅ **전부 그대로 반영** |
| `--color-accent-*` 4역할 분리(fill / onFill / text / border) | ✅ **살아 있음.** 시안이 `aF·aOn·aT·aB`로 분리해 두었고, 라이트에서 `aT`·`aB`만 갈라지는 구조까지 정확 |
| 라이트 3단계 층위를 보더·그림자가 만드는가 | ✅ **"라이트의 함정" 섹션이 이 문제를 정확히 다룹니다.** 밝기만 쓴 카드와 보더+그림자를 쓴 카드를 나란히 비교해 놓았고, 제 분석(상호 대비 1.08~1.09)과 일치 |

> 시안이 명세를 지어내지 않고 그대로 구현했습니다. **아래 토큰 표를 그대로 옮겨 적으면 됩니다.**

---

## 3. 디자인 토큰 전문

`src/styles/tokens.css`를 새로 만들고 아래를 옮겨 적으세요.
`main.tsx`에서 **`initialize.css` 다음, `global.css` 이전**에 import 합니다.

### 3-1. 색

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `--color-bg-base` | `#efece4` | `#0a0f1c` | 페이지 바탕 |
| `--color-bg-surface` | `#f7f5ef` | `#0d1220` | 카드 내부·코드블록·사이드바 |
| `--color-bg-raised` | `#ffffff` | `#161d30` | 헤더·칩·태그 |
| `--color-bg-elevated` | `#ffffff` | `#1f273e` | 플로팅·툴팁·보조 버튼 |
| `--color-bg-overlay` | `rgba(23,28,43,.72)` | `rgba(10,15,28,.78)` | 이미지 위 배지·모달 뒤 |
| `--color-text-primary` | `#171c2b` | `#f4ecd2` | 제목 |
| `--color-text-body` | `#2b3145` | `#cfd5e4` | 본문 장문 |
| `--color-text-secondary` | `#4a5163` | `#b8c0d8` | 보조 |
| `--color-text-muted` | `#5a6072` | `#7f8aa8` | 메타·날짜·경로 |
| `--color-accent-fill` | `#e6a536` | `#e6a536` | 채움 배경 (양 모드 동일) |
| `--color-accent-onFill` | `#1a1206` | `#1a1206` | 채움 위 텍스트 (양 모드 동일) |
| `--color-accent-text` | `#7d5c0e` | `#e6a536` | **배경 위 텍스트·아이콘** |
| `--color-accent-border` | `#a97213` | `#e6a536` | **채움의 경계** |
| `--color-accent-hover` | `#6b4e0b` | `#ffd770` | 호버 |
| `--color-accent-light` | `#f5b94a` | `#f5b94a` | 버튼 그라데이션 상단 |
| `--color-accent-deep` | `#c98a22` | `#c98a22` | 그라데이션 하단·진행바 |
| `--color-accent-subtle` | `rgba(230,165,54,.14)` | `rgba(230,165,54,.10)` | 활성 행·칩 배경 |
| `--color-border-subtle` | `#e4e0d5` | `#1a2033` | 행 구분선 (장식) |
| `--color-border-default` | `#ddd8cc` | `#232a44` | 카드·코드블록 |
| `--color-border-strong` | `#cfc9ba` | `#2d3551` | 섹션 경계 |
| `--color-border-interactive` | `#7d7768` | `#6d7798` | **입력·컨트롤 경계** |
| `--color-status-success` | `#1f7a3a` | `#6fcf7c` | 성공 |
| `--color-status-info` | `#1a6d99` | `#5fb8e6` | 링크·정보 |
| `--color-status-accent` | `#6b4a86` | `#c39ad9` | 강조 |
| `--color-status-danger` | `#c0392b` | `#ff6b6b` | 오류 |
| `--color-cat-survey` | `#7d5c0e` | `#ffd770` | 카테고리 Survey |
| `--color-cat-study` | `#6b4a86` | `#c39ad9` | 카테고리 Study |
| `--color-cat-activity` | `#1b6b33` | `#6fcf7c` | 카테고리 Activity |
| `--color-grass-0` | `#e4dfd2` | `#232a44` | 기여 활동 0단계 |
| `--color-grass-1` | `#f0c060` | `#5c4a18` | 1단계 |
| `--color-grass-2` | `#dd9a24` | `#8f6212` | 2단계 |
| `--color-grass-3` | `#b07713` | `#c98a22` | 3단계 |
| `--color-grass-4` | `#7d5c0e` | `#ffd770` | 4단계 |
| `--color-focus-ring` | `#7d5c0e` | `#ffd770` | 배경 위 포커스 링 |
| `--color-focus-onFill` | `#171c2b` | `#1a1206` | **골드 채움 위 포커스 링** |
| `--color-focus-glow` | `rgba(125,92,14,.26)` | `rgba(230,165,54,.28)` | 포커스 글로우 |

> ⚠️ **`accent-fill`과 `accent-text`를 혼용하지 마세요.** 다크에서는 값이 같아 실수해도 티가 안 나지만, 라이트로 전환하는 순간 골드 텍스트가 **2.14:1**로 무너집니다. "배경 위에 글자·아이콘으로 놓는 골드"는 **항상 `--color-accent-text`** 입니다.

### 3-2. 그림자

| 토큰 | 라이트 | 다크 |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(23,28,43,.10)` | `0 1px 3px rgba(0,0,0,.18)` |
| `--shadow-md` | `0 4px 12px rgba(23,28,43,.14)` | `0 4px 12px rgba(0,0,0,.5)` |
| `--shadow-btn-inset` | `inset 0 1px 0 rgba(255,255,255,.5), inset 0 -2px 0 rgba(23,28,43,.16)` | `inset 0 1px 0 rgba(255,235,170,.5), inset 0 -2px 0 rgba(0,0,0,.28)` |

### 3-3. 타이포 (테마 무관)

**축 A — 픽셀 (Galmuri11). 11의 배수만 사용.**

| 토큰 | 값 | 용도 |
|---|---|---|
| `--fs-pixel-1` | `11px` | 배지 |
| `--fs-pixel-2` | `22px` | 섹션 헤딩 |
| `--fs-pixel-3` | `33px` | 통계 수치 |
| `--fs-pixel-4` | `44px` | 페이지 h1 |
| `--fs-pixel-5` | `55px` | 히어로 |
| `--fs-pixel-6` | `66px` | 특대·404 |

**축 B — 본문/UI (전부 Pretendard)**

| 토큰 | 값 | 서체 | 용도 |
|---|---|---|---|
| `--fs-2xs` | `11px` | **GalmuriMono11** | 라틴·숫자·기호 **전용** 배지 (`NEW`, `41`, `⌘K`) |
| `--fs-xs` | `12px` | **Pretendard** | 메타·날짜·캡션 |
| `--fs-sm` | `13px` | **Pretendard** | 목차·보조 라벨 |
| `--fs-base` | `14px` | Pretendard | UI 기본·내비 라벨 |
| `--fs-md` | `15px` | Pretendard 600 | 목록 제목·버튼 라벨 |
| `--fs-lg` | `16px` | Pretendard | 본문 |
| `--fs-xl` | `18px` | Pretendard | 리드 |
| `--fs-2xl` | `21px` | Pretendard 700 | 카드 제목 |

> 🔴 **2026-08-01 정정.** 이전 판(`--fs-xs`·`--fs-sm`을 GalmuriMono11로 지정)은 **틀렸습니다.** 12px·13px은 11px 그리드의 정수배가 아니라 도트가 뭉개지고, 해당 자리의 텍스트에 한글이 섞입니다. §3-3a의 규칙을 보세요.

### 3-3a. 🔴 픽셀 서체 사용 규칙 (전 화면 공통 — 한 줄)

> ## **픽셀 서체는 11의 정수배에서만 쓰고, 한글에는 22px 이상에서만 쓴다.**
> ## **그 사이(12~21px)의 한글·혼합 텍스트는 전부 Pretendard.**

세 규칙이 동시에 걸린 결과입니다. 우회로가 없습니다.

| 규칙 | 출처 |
|---|---|
| 한글이 들어가는 어떤 텍스트도 **12px 이상** | 접근성 (design.md §2.5) |
| **12px 미만은 어디든 픽셀 금지** | design.md Part II-F5 |
| 픽셀 서체는 **11의 정수배에서만 선명** | Galmuri11이 11px 비트맵 그리드 (Part II-F3) |

**11 < 12** 이므로 한글 + 픽셀의 최소 크기는 **22px**입니다. 메타·라벨에 22px은 쓸 수 없으므로 결론은 하나입니다.

**적용표**

| 서체 | 허용 크기 | 허용 문자 |
|---|---|---|
| `Galmuri11` (디스플레이) | 22 / 33 / 44 / 55 / 66px | **한글 포함 전부** |
| `Galmuri11` | 11px | **라틴·숫자·기호만** |
| `GalmuriMono11` (모노) | **11px 고정** | **라틴·숫자·기호만** |
| `Pretendard` | 12px 이상 자유 | 전부 |

- 22px 미만에서 픽셀 느낌이 필요하면 **크기를 22px로 올리거나, 픽셀을 포기**하는 두 선택지뿐입니다. 중간은 없습니다
- `Galmuri14`(14px 그리드)를 추가하면 14px 한글 픽셀이 가능하지만, **채택하지 않습니다** — 원본 551.6 KB가 추가되고, 11px 그리드와 도트 밀도가 달라 한 화면에서 두 격자가 충돌합니다
- 이 규칙은 **§4-3의 서브셋으로 기술적으로 강제**됩니다 (모노에서 한글 글리프 제거 → 한글은 자동으로 Pretendard 폴백)

행간: `--lh-tight 1.05` · `--lh-heading 1.2` · `--lh-snug 1.45` · `--lh-normal 1.6` · `--lh-relaxed 1.8` · `--lh-mono 2.0`

### 3-4. 스페이싱·라운드·모션·치수

```
--space-1:4  --space-2:8  --space-3:12  --space-4:16  --space-5:20  --space-6:24
--space-7:28 --space-8:32 --space-10:40 --space-12:48 --space-14:56 --space-16:64
--space-px:2

--radius-xs:2  --radius-sm:3  --radius-md:4  --radius-lg:6  --radius-xl:8  --radius-pill:999px

--dur-instant:80ms  --dur-fast:120ms  --dur-base:160ms  --dur-slow:240ms  --dur-slower:340ms
--ease-emphasized: cubic-bezier(.2,.7,.3,1)
--ease-out: ease-out

--container-max:1180px  --container-narrow:920px  --measure-reading:640px
--sidebar-w:312px  --toc-w:176px  --tap-min:44px
--header-h-desktop:48px  --header-h-mobile:52px

--z-base:0 --z-sticky:10 --z-header:100 --z-dropdown:200
--z-overlay:300 --z-modal:400 --z-toast:500 --z-tooltip:600
```

### 3-5. 소비 규칙

- 컴포넌트 `*.module.css`는 **`var()`로만** 값을 씁니다. 원시 hex 금지
- 기존 `--brand-*` 9종은 **전환 기간 동안 별칭으로 유지**하고, 전 화면 전환 완료 후 삭제
- 다크가 `:root` 기본, 라이트는 `[data-theme="light"]`에서 덮어씀

---

## 4. 폰트

### 4-1. 🔴 CDN을 그대로 쓰지 마세요 — 실측 근거

시안은 `https://cdn.jsdelivr.net/npm/galmuri/dist/galmuri.css`를 씁니다. **프로토타입에는 적절하지만 프로덕션에는 부적합**합니다. 직접 측정한 결과입니다.

| 파일 | 원본 용량 | 글리프 |
|---|---:|---|
| `Galmuri11.woff2` | **492.9 KB** | 20,965자 — 한글 11,172 · 라틴 510 · **한자 6,477** · 카나 187 |
| `GalmuriMono11.woff2` | **478.0 KB** | 20,324자 — 한글 11,172 · 라틴 319 · **한자 6,477** · 카나 187 |
| **합계** | **971 KB** | |

문제 3가지:
1. **한자 6,477자 + 카나 187자를 이 사이트는 한 글자도 쓰지 않습니다.** 용량의 대부분이 이것입니다.
2. **`galmuri.css`에 `unicode-range`가 없습니다.** 분할 로딩이 안 되고, 픽셀 텍스트 한 글자를 그리려고 493KB를 통째로 받습니다.
3. `product.md`의 폰트 예산은 **총 ≤ 1MB**입니다. Galmuri만으로 971KB를 쓰면 Pretendard 몫이 남지 않습니다.

**→ 판정: 서브셋 후 자체 호스팅. CDN 의존 제거.**

### 4-2. 서브셋 실측 — 무엇을 고를지

`fontTools`로 실제 서브셋해 측정했습니다.

| 파일 | 서브셋 범위 | 용량 |
|---|---|---:|
| `Galmuri11` (디스플레이) | **한글 전체(11,172) + 라틴 + 부호**, 한자·카나 제거 | **158.6 KB** |
| `GalmuriMono11` (모노) | **라틴 + 숫자 + 기호만. 한글 제외** | **10.7 KB** |
| | **합계** | **169.3 KB** |

원본 971 KB 대비 **83% 절감**입니다.

**모노에서 한글을 빼는 것이 핵심입니다 (2026-08-01 변경).**
§3-3a에 따라 GalmuriMono11은 라틴·숫자·기호 전용이므로 한글 글리프가 **애초에 쓰이지 않습니다.** 빼면
- 152.7 KB → **10.7 KB** (93% 절감)
- **규칙이 기술적으로 강제됩니다** — 실수로 모노 자리에 한글을 넣으면 Pretendard로 자동 폴백되어 눈에 띕니다. 조용히 11px 한글이 렌더되는 것보다 나은 실패 방식입니다

**디스플레이(Galmuri11)는 한글 전체를 유지합니다.** 히어로 이름·페이지 h1·섹션 헤딩이 전부 한글이고, 상용 2,350자 서브셋(46.6 KB)으로 줄이면 그 목록에 없는 음절이 제목에 들어갈 때 한 단어 안에서 서체가 갈립니다. 112 KB를 더 쓰고 그 사고를 원천 차단하는 편이 낫습니다.

**`Galmuri11-Bold`(162.7 KB)는 로드하지 마세요.** 비트맵 서체는 굵기 변형 시 도트 격자가 무너집니다. 픽셀 텍스트에 `font-weight`를 주지 않습니다.

### 4-3. 자산 준비 (빌드 전 1회)

```bash
pip install fonttools brotli
# jsDelivr에서 Galmuri11.woff2 / GalmuriMono11.woff2 원본을 받아 서브셋:
#
#  Galmuri11-subset.woff2      유지: U+0020-024F, U+2000-206F, U+2190-21FF,
#                                    U+25A0-25FF, U+3000-303F, U+1100-11FF,
#                                    U+3130-318F, U+AC00-D7A3(한글 전체)
#                              제거: 한자 U+4E00-9FFF, 카나 U+3040-30FF
#
#  GalmuriMono11-subset.woff2  유지: U+0020-024F, U+2000-206F, U+2190-21FF,
#                                    U+25A0-25FF (+ ⌘ U+2318)
#                              제거: 한글·한자·카나 전부   ← 규칙 강제 장치
#
# → src/assets/fonts/ 에 배치
```

라이선스: Galmuri는 **SIL Open Font License 1.1** — 자체 호스팅·재배포 가능. 저장소에 `OFL.txt`를 함께 두세요.

### 4-4. `@font-face` 및 폰트 토큰

```css
@font-face {
  font-family: 'Galmuri11';
  src: url('/fonts/Galmuri11-subset.woff2') format('woff2');
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'GalmuriMono11';
  src: url('/fonts/GalmuriMono11-subset.woff2') format('woff2');
  font-weight: 400; font-style: normal; font-display: swap;
}

:root {
  --font-display: 'Galmuri11', 'Pretendard', sans-serif;
  --font-mono:    'GalmuriMono11', 'Pretendard', ui-monospace, monospace;
  --font-body:    'Pretendard', -apple-system, system-ui, sans-serif;
}
```

> `--font-mono`의 2순위가 `IBM Plex Mono`가 아니라 **`Pretendard`** 인 것은 의도적입니다. IBM Plex Mono는 이 프로젝트에 없고, 모노 서브셋에 한글이 없으므로 한글이 들어오면 **Pretendard로 폴백**되어야 합니다. 시스템 모노(`ui-monospace`)로 떨어지면 OS마다 한글 서체가 달라져 예측이 불가능합니다.

- ✅ **Pixelify Sans 폴백은 불필요합니다.** Galmuri11·GalmuriMono11 모두 한글 11,172자를 완전히 포함하는 것을 직접 확인했습니다. 시안 주석의 주장이 사실입니다.
- Pretendard는 이미 `src/assets/fonts/`에 로컬로 있습니다. **CDN(`cdn.jsdelivr.net/gh/orioncactus/pretendard`)을 추가하지 마세요.**
- 히어로 워드마크가 LCP 요소가 될 가능성이 높으므로 `Galmuri11-subset.woff2`만 `<link rel="preload">` 하세요. 나머지는 preload 하지 않습니다(대역폭 경합).

### 4-5. 픽셀 렌더링 규칙

```css
.pixel-type {
  font-family: var(--font-display);
  -webkit-font-smoothing: none;   /* 안티에일리어싱 제거 — 도트 선명도의 핵심 */
  font-smooth: never;
  letter-spacing: 1px;            /* em 아닌 정수 px */
}
```

- ⚠️ **Firefox에는 동등한 표준 속성이 없습니다.** Firefox에서는 도트가 약간 뭉개집니다. 알려진 한계이며 감수합니다(대안은 히어로 워드마크를 SVG로 렌더하는 것 — STEP 2에서 별자리 캔버스와 함께 검토).
- 픽셀 텍스트에 `transform: scale()` 금지. 크기는 §3-3 축 A의 6개 값만 사용.
- `line-height`·`letter-spacing`은 **정수 px**. 소수·em은 서브픽셀 위치를 만들어 도트를 흐립니다.

### 4-6. 사용 자리

| ✅ 픽셀 `--font-display` (22px 이상) | ✅ 모노 `--font-mono` (11px, 라틴·숫자·기호) | ❌ Pretendard로 |
|---|---|---|
| 워드마크 (22px) | 경로 표시 `~/posts/client-side-ai.md` | 내비 라벨 `홈 글 태그 소개` |
| 히어로 이름 `김섭우` (55px) | 프롬프트 기호 `➜` `⌕` | 메타 `Survey · 2025.05.26 · 6분` |
| 페이지 h1 (44px) | `⌘K` 힌트 | **목차 항목** (한글 heading) |
| 섹션 헤딩 `최근 글` (22px) | 숫자 배지 `41` `NEW` | 검색 플레이스홀더·안내문 |
| 통계 수치 (33px) · 404 숫자 (66px) | 태그 칩 `React` `Python` (전부 라틴) | 푸터 설명문 · 드로어 항목 |
| **히어로 주 CTA** (22px) — §6-7 | | 글 본문 · 글 목록의 글 제목 · 코드블록 |

> 태그가 언젠가 한글이 되면 모노 칩에서 Pretendard로 폴백되어 한 줄에 두 서체가 섞입니다. 현재 64종 태그는 전부 라틴이라 문제없지만, 한글 태그가 생기면 **칩 전체를 Pretendard로 바꾸세요.**

---

## 5. 테마 전환

### 5-1. 3단계 상태

```
localStorage["theme"] = "system" | "light" | "dark"     ← 사용자 선택
              ↓ 해석
<html data-theme="light" | "dark">                      ← 실제 적용값만
```

- 기본값 **`system`**. 토글은 `system → light → dark → system` 순환
- `system`일 때 `prefers-color-scheme` 변화를 **런타임에 구독**해야 합니다 (`matchMedia('(prefers-color-scheme: dark)').addEventListener('change', …)`). OS 테마가 바뀌면 즉시 따라가야 합니다

### 5-2. 🔴 FOUC 방지 — 인라인 블로킹 스크립트 필수

`index.html`의 `<head>` 안, **모든 CSS보다 먼저**:

```html
<meta name="color-scheme" content="dark light" />
<script>
  (function () {
    try {
      var s = localStorage.getItem('theme') || 'system';
      var d = s === 'dark' || (s === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
</script>
```

React 마운트 전에 `data-theme`이 결정돼야 합니다. 없으면 다크 사용자가 매 진입마다 흰 화면 섬광을 봅니다. GitHub Pages 정적 환경에서도 이 방식이 그대로 동작합니다.

### 5-3. `color-scheme` 병행

```css
:root { color-scheme: dark; }
[data-theme="light"] { color-scheme: light; }
```

빠뜨리면 다크 화면에 **흰 스크롤바**가 남고, `<input>` 자동완성 배경이 밝게 뜹니다.

### 5-4. 전환 순간 트랜지션 차단

색에 `transition`이 걸려 있으면 토글 시 화면 전체가 훑히듯 바뀌어 어지럽습니다.

```js
document.documentElement.classList.add('theme-switching');
document.documentElement.setAttribute('data-theme', next);
requestAnimationFrame(() =>
  requestAnimationFrame(() =>
    document.documentElement.classList.remove('theme-switching')));
```
```css
.theme-switching * { transition: none !important; }
```

### 5-5. 토글 컴포넌트

- 위치: 헤더 우측 끝 (데스크톱·모바일 **동일**). 모바일 드로어 안에 숨기지 마세요
- 아이콘: **CSS 그리드 5×5 도트로 직접 그림** — 시안의 판단을 채택합니다. 폰트·SVG 없이 시스템의 픽셀 문법을 그대로 씁니다. `system`=A자 / `light`=해 / `dark`=초승달. 각 3px 셀 + 1px 갭
  ```
  해:     0,1,0,1,0  1,1,1,1,1  0,1,1,1,0  1,1,1,1,1  0,1,0,1,0
  초승달: 0,1,1,0,0  1,1,0,0,0  1,1,0,0,0  1,1,0,0,0  0,1,1,0,0
  시스템: 0,1,1,1,0  1,1,0,0,0  1,1,0,1,1  0,0,0,1,1  0,1,1,1,0
  ```
  아이콘 색은 `--color-accent-text`, 컨테이너는 `aria-hidden`
- `<button>` + `aria-label`은 **다음에 일어날 동작**을 말함: `시스템 설정 따르기` / `라이트 모드로 전환` / `다크 모드로 전환`
- 터치 영역 최소 44×44

---

## 6. 전역 셸 컴포넌트

### 6-1. 헤더 — 데스크톱 (≥1024px)

```
높이 48px · position: sticky; top:0 · z-index: var(--z-header)
컨테이너 max-width 1180px, 가운데 정렬

[섭우.log]  [➜ ~/posts/client-side-ai.md]        [홈 글 태그 소개] [⌕____] [◫]
 픽셀 22px      모노 12px, text-muted                모노 13px      250px  토글
```

| 슬롯 | 명세 |
|---|---|
| 워드마크 | `--font-display` 22px. `섭우` = `--color-text-primary`, `.log` = `--color-accent-text`. `<a href="/">` + `aria-label="섭우.log 홈"` |
| 경로 표시 | `➜` 는 `--color-accent-text` + `aria-hidden`. 경로 본문은 `--font-mono` 12px `--color-text-muted`. **길면 왼쪽부터 잘라** `…/client-side-ai.md` (파일명이 정보량이 가장 큼) |
| 내비 | 홈 / 글 / 태그 / 소개. `<a>` 요소. 비활성 `--color-text-secondary`, 호버 `--color-text-primary` |
| **활성 내비** | **배경(`--color-accent-subtle`) + 밑줄(2px `--color-accent-text`) 병용** ← §6-1a |
| 검색 | 인라인 입력 250px → 포커스 시 **320px** + 보더 `--color-accent-border` + `box-shadow: 0 0 0 2px var(--color-focus-glow)`. 전환 `--dur-slow --ease-emphasized`. `⌘K` 힌트는 포커스 시 opacity 0 |
| 테마 토글 | 우측 끝 |
| 배경 전환 | §6-1b |

#### 6-1a. 활성 내비는 배경만으로 표시하면 안 됩니다

`--color-accent-subtle`을 흰 배경에 합성하면 **`#fcf2e3`, 대비 1.11:1**입니다. 배경만 쓰면 라이트에서 활성 항목이 사실상 안 보입니다(다크도 1.15로 마찬가지).
→ **배경 + 밑줄을 함께** 씁니다. 시안의 판단이 정량적으로 옳습니다. 색을 구분하지 못하는 사용자에게도 밑줄의 위치가 남습니다.
활성 라벨 색은 `--color-accent-text` (합성 배경 위 **5.56:1**).

#### 6-1b. 스크롤 배경 전환 (홈 전용)

홈에서만 헤더가 투명하게 시작해 히어로 그래픽이 화면 끝까지 이어져 보이게 합니다.

```
scrollY = 0    → 배경 불투명도 35%, 하단 보더 없음
scrollY = 60px → 배경 불투명도 100%, 하단 보더 --color-border-strong
보더는 진행률 15% 지점부터 나타남
alpha = min(1, scrollY / 60);  bg = rgba(<raised RGB>, 0.35 + alpha * 0.65)
```
- raised RGB: 라이트 `255,255,255` / 다크 `22,29,48`
- **홈 외 페이지에서는 처음부터 불투명**합니다
- 헤더의 **위치·크기는 절대 변하지 않습니다.** 배경 불투명도만 바뀝니다 — 이것이 헤더가 하는 유일한 움직임이며, 히어로 그래픽과 시선을 다투지 않기 위한 제약입니다

### 6-2. 헤더 — 모바일 (≤767px)

```
높이 52px (44px 터치 타깃 확보)

[섭우.log]                              [⌕]  [◫]  [☰]
                                        각 44×44 터치, 시각 20px
─────────────────────────────────────────────────────
[➜ ~/posts/client-side-ai.md]   ← 본문 최상단 브레드크럼 행 (sticky 아님)
```

- **경로 표시를 헤더에서 빼고 본문 최상단으로 내립니다.** 390px에 워드마크+경로+내비+검색+토글은 물리적으로 안 들어갑니다. 모바일에서는 화면 제목이 위치 정보를 이미 담당합니다
- **스크롤 다운 시 헤더 숨김 / 업 시 복귀**: `translateY(-52px)`, 전환 `--dur-slow --ease-emphasized`. 트리거는 `scrollY > 60 && scrollY > lastScrollY`
- ⚠️ `prefers-reduced-motion: reduce`에서는 **숨김 동작 자체를 끕니다**(헤더 항상 노출). 전환만 끄면 헤더가 순간이동해 더 나쁩니다
- 테마 토글은 **헤더에 유지**

### 6-3. 모바일 드로어 (☰)

- 전체화면, 배경 `--color-bg-surface`, 진입 `slideIn` `--dur-slow`
- 구성: 워드마크 + 닫기(✕) / 내비 4항목(활성은 `●`, 비활성은 `○` + `--color-accent-text`) / `연락처` GitHub·Notion·Email / `테마` 3단계 선택
- 트리거는 `<button aria-expanded aria-controls="mobile-drawer">`. **현재 코드의 `<a href="#">`는 교체 대상**
- 필수: **포커스 트랩** · **ESC 닫기** · **`body` 스크롤 락** · 닫을 때 **트리거로 포커스 복귀**
- 스크롤 락은 `overflow:hidden`만 쓰면 iOS에서 배경이 밀립니다. `position:fixed` + `top: -scrollY` 복원 방식을 쓰세요

### 6-4. 검색 UI

| 뷰포트 | 방식 |
|---|---|
| ≥1024px | 헤더 인라인 입력 (250→320px 확장). 결과는 입력 아래 드롭다운 |
| 768~1023px | 아이콘 → 헤더 아래 전폭 행 슬라이드 |
| ≤767px | **전체화면 오버레이** — 모바일 키보드가 화면 절반을 먹으므로 전용 화면이 유리 |

모바일 오버레이 구성: 입력 + `제목·태그·카테고리에서 찾아요` 안내 + `자주 쓰는 태그` 칩(Python 16 / React 14 / CodingTest 9) + 결과 목록.
결과 항목: 제목(`--fs-md` Pretendard 600) + `카테고리 · 날짜 · N분`(모노, 카테고리 색 점 병기).
ESC로 닫힘. 포커스 트랩 적용. 열릴 때 입력에 자동 포커스.

> **검색 로직은 이번 범위 밖입니다.** UI와 상태(입력 / 결과 있음 / 결과 0건)만 만들고, 실제 필터는 글 목록 화면과 함께 붙입니다.
> ⚠️ 현재 `usePosts`의 필터는 `title`·`category`·`tag`에 같은 키워드를 **AND 완전일치**로 걸어 결과가 항상 0입니다. 재작성이 필요하며 이건 별도 태스크입니다.

### 6-5. 푸터

```
[섭우.log]
공부하거나 조사한 내용을 기록합니다.

GitHub   Notion   Email

© 2026 Seobisback
```

- 링크는 **GitHub · Notion · Email 3개만**. **Instagram · Facebook · Qualk는 제거**합니다
- 모바일에서는 세로 스택
- 워드마크는 헤더와 같은 조형(픽셀 + `.log` 액센트)

### 6-6. 상태 정의 (전 컴포넌트 공통)

| 상태 | 규격 |
|---|---|
| 기본 | 위 명세 |
| 호버 | `--dur-base --ease-out`. 색·배경만 변화 |
| **포커스** | `outline: 2px solid var(--color-focus-ring); outline-offset: 2px`. **골드 채움 위에서는 `--color-focus-onFill`로 반전** (골드 위 골드 링은 1.55:1로 보이지 않음). `:focus-visible` 사용 |
| 활성 | `--color-accent-subtle` 배경 + 밑줄 |
| 비활성 | `opacity: .45; pointer-events: none` |

⚠️ `src/initialize.css`의 `a:active, a:hover { outline: 0 }`을 **제거**하세요. 포커스 표시를 지웁니다.

---

## 7. 브레이크포인트 & `react-responsive` 역할 분담

| 이름 | 범위 | 셸 형태 |
|---|---|---|
| sm | ~767px | 모바일 헤더 52px + 드로어 + 검색 오버레이 |
| md | 768~1023px | 워드마크 + 경로 + 내비 + 검색 아이콘 |
| lg | 1024~1279px | 데스크톱 전체 (인라인 검색) |
| xl | ≥1280px | 동일, 컨테이너 1180px 고정 |

**역할 분담 규칙**

| 대상 | 수단 | 이유 |
|---|---|---|
| 레이아웃·타이포·간격·표시 여부 | **CSS 미디어쿼리** | 첫 페인트부터 정확. `useMediaQuery`는 첫 렌더에서 `false`를 반환해 레이아웃 플래시를 만듭니다 |
| DOM 구조 자체가 달라야 함 | **CSS 우선 시도** → 불가할 때만 JS | 드로어·오버레이는 CSS로 처리 가능 |
| JS가 뷰포트를 알아야 함 (스크롤 숨김 활성 여부 등) | `matchMedia` 직접 사용 | |

**정리 대상 (현재 코드)**
- `ResponsivePC`와 `ResponsiveTabletPC`가 **완전히 동일한 JSX**를 렌더합니다 — 조건부 분기가 아무 차이를 만들지 않으면서 트리만 2배입니다. 통합하거나 제거하세요
- 내비게이션은 **`<ul>` 하나**를 두고 CSS로 배치만 바꾸세요. 지금처럼 데스크톱용·모바일용 메뉴가 DOM에 둘 다 있으면 스크린리더가 메뉴를 두 번 읽습니다

브레이크포인트 숫자는 CSS와 JS 양쪽에 존재할 수밖에 없습니다(CSS 커스텀 프로퍼티는 `@media`에서 못 씀). `src/styles/breakpoints.ts`에 상수로 두고, **위 표를 계약 원본**으로 삼으세요. `postcss-custom-media` 도입 여부는 frontend 판단입니다.

---

## 8. 기존 코드와의 접점

### 8-1. `GlobalNavigationBar.tsx` → 🔴 **전면 교체**

개조가 아니라 교체를 권합니다.

| 근거 | 내용 |
|---|---|
| 요구 기능의 대부분이 없음 | 경로 표시 · 검색 · 테마 토글 · 포커스 트랩 드로어 — 전부 신규 |
| 접근성 결함이 구조적 | `<li onClick>`(키보드 접근 불가) · `<a href="#">` 햄버거 · `alert()` 스텁 3곳. 고치면 어차피 전면 재작성 |
| 반응형 구조가 바뀜 | `react-responsive` 3분기 → CSS 미디어쿼리 단일 트리 |
| 스타일 100% 교체 | 현재 CSS는 `--brand-*` 기반이고 다크 모드 개념이 없음 |

→ **남길 것은 `memoji.png` 자산 하나**입니다(워드마크 최종안이 정해지면 병용 여부 결정 — §12).
→ `alert('😅 Oops! This Page is under construction.')` 3곳은 **부활시키지 마세요.** `Works`·`Search` 항목은 새 내비에 없거나(작업은 STEP 7), 정식 화면으로 대체됩니다.

### 8-2. `Footer.tsx` → 🟡 **개조**

구조가 단순하고 바뀌는 것은 링크 목록과 스타일뿐입니다.

- JSX: 3개 리스트(Channels/Services/Contacts) → **1개 리스트**(GitHub·Notion·Email) + 워드마크. 실제로는 코드가 줄어듭니다
- CSS: `Footer.module.css` **전면 교체** (현재 3중 미디어쿼리 + `--brand-*` 기반)
- 제거: Instagram · Facebook · Qualk 링크

### 8-3. 그 외 선행·후속 정리

| 파일 | 조치 | 시점 |
|---|---|---|
| `src/global.css` | `* { font-family; font-weight }` **제거** | 🔴 최선행 (§1-1) |
| `src/global.css` | `--brand-*` 9종은 별칭으로 유지 → 전 화면 전환 후 삭제 | 마지막 |
| `src/global.css` | `@font-face`의 존재하지 않는 `.ttf` 경로 정리 | 아무 때나 |
| `src/initialize.css` | `a:active, a:hover { outline: 0 }` 제거 | 헤더 구현 전 |
| `index.html` | 테마 부트스트랩 스크립트 + `color-scheme` 메타 추가 | 토큰 다음 |
| `src/components/shared/ResponsiveWrapper.tsx` | `ResponsivePC`/`ResponsiveTabletPC` 중복 제거 | GNB 교체 시 |
| `src/stores/index.ts` | 빈 export — 테마 상태를 zustand로 둘지 판단 (Context로도 충분) | GNB 구현 시 |

---

## 9. 확정 카피

`docs/WRITING_GUIDE.md` 기준입니다. 시안에서 가이드를 벗어난 3건을 정정했습니다.

| 위치 | 확정 문구 |
|---|---|
| 워드마크 | `섭우.log` |
| 내비 | `홈` / `글` / `태그` / `소개` |
| 경로 | `~` · `~/posts` · `~/posts/<slug>.md` · `~/tags/<태그>` · `~/about.md` |
| 검색 플레이스홀더 | `제목, 태그로 검색` |
| 검색 범위 안내 | `제목·태그·카테고리에서 찾아요` |
| 검색 결과 수 | `<N>개 일치 · 전체 41개 중` |
| 검색 결과 0건 (제목) | `일치하는 글이 없어요` |
| 검색 결과 0건 (데스크톱 설명) | `다른 키워드로 찾아보거나, 전체 글을 둘러보세요.` |
| 검색 결과 0건 (모바일 설명) | `다른 키워드를 넣거나 위 태그에서 골라 보세요.` |
| 검색 초기 안내 | `검색어를 입력하면 결과가 나와요` |
| 드로어 섹션 | `연락처` / `테마` |
| 테마 3단계 | `시스템` / `라이트` / `다크` |
| 테마 `aria-label` | `시스템 설정 따르기` / `라이트 모드로 전환` / `다크 모드로 전환` |
| 아이콘 `aria-label` | `검색 열기` / `검색 닫기` / `메뉴 열기` / `메뉴 닫기` |
| 푸터 설명 | `공부하거나 조사한 내용을 기록합니다.` |
| 푸터 저작권 | `© 2026 Seobisback` |

**시안에서 정정한 3건**

| # | 시안 | 확정 | 근거 |
|---|---|---|---|
| 1 | `더 나은 서비스를 제공하는 방법을 고민해서 개발하는 걸 좋아합니다.` | **`더 나은 서비스를 만드는 방법을 고민합니다.`** | 기존 사이트의 구 문구가 그대로 들어왔습니다. WRITING_GUIDE §8-16이 이미 축약본으로 판정 |
| 2 | (데스크톱 빈 상태) `제목·태그·카테고리에서 찾습니다.` | **`…에서 찾아요`로 통일** | 같은 문장이 모바일에서는 해요체, 데스크톱에서는 합쇼체였습니다. UI 마이크로카피는 해요체(§3.1) |
| 3 | `검색어를 입력하면 결과가 나옵니다` | **`검색어를 입력하면 결과가 나와요`** | 위와 동일 |

부수 확인: 시안의 섹션 라벨 `최근에 쓴 글`은 STEP 2 소관이며 확정본은 `최근 글`입니다.

---

## 10. 접근성 체크리스트

- [ ] 스킵 링크 `본문 바로가기` — 헤더가 sticky이므로 필수. 포커스 시에만 노출
- [ ] 모든 인터랙티브 요소가 `<a>` 또는 `<button>`. `div onClick` 없음
- [ ] `:focus-visible` 링이 **양 테마에서 보임**. 골드 채움 위에서는 반전
- [ ] 드로어·검색 오버레이: 포커스 트랩 + ESC + 스크롤 락 + 포커스 복귀
- [ ] 햄버거에 `aria-expanded` / `aria-controls`
- [ ] 아이콘 버튼에 `aria-label`, **보이는 텍스트로 시작**하고 역할 단어(`버튼`) 없음
- [ ] 장식 기호 `➜ ⌕ ☰ ✕ ● ○` 전부 `aria-hidden="true"`
- [ ] 터치 타깃 44×44 이상
- [ ] `prefers-reduced-motion: reduce`에서 헤더 숨김·진입 애니메이션·smooth 스크롤 정지
- [ ] 카테고리는 색 점 + **텍스트 라벨** 병기. 색만으로 전달 금지
- [ ] 라우트 변경 시 `document.title` 갱신
- [ ] 360px에서 **페이지 가로 스크롤 0건**

---

## 11. 구현 순서

중간에 화면이 깨지지 않는 순서입니다. 각 단계 끝에서 사이트가 동작해야 합니다.

| # | 작업 | 왜 이 순서인가 |
|:--:|---|---|
| **0** | `global.css`의 `* { font-family; font-weight }` 제거 + 기존 화면 회귀 확인 | 이게 남아 있으면 이후 폰트 작업이 전부 무효 |
| **1** | `tokens.css` 생성 + `--brand-*` **별칭 레이어** 추가 | 별칭 덕에 기존 화면이 그대로 동작합니다. 안전망 |
| **2** | `index.html` 테마 부트스트랩 + `color-scheme` + `[data-theme]` 스코프 | UI 없이 토큰만 전환되는 상태. 콘솔에서 `data-theme` 바꿔 검증 |
| **3** | 폰트 서브셋 생성 → `@font-face` + `--font-*` 토큰 | 아직 어디에도 적용 안 함. 로드만 확인 |
| **4** | **푸터 개조** | 가장 작고 위험이 낮습니다. 토큰·폰트·테마가 실제로 도는지 확인하는 **카나리아** |
| **5** | 새 헤더 — 셸 + 워드마크 + 경로 + 내비 (데스크톱) | 헤더 골격 |
| **6** | 테마 토글 (픽셀 아이콘 + 3단계 순환 + 영속화) | 헤더에 붙일 자리가 생긴 뒤 |
| **7** | 모바일 헤더 + 드로어 (포커스 트랩·ESC·스크롤 락) | 데스크톱이 안정된 뒤 |
| **8** | 검색 UI (데스크톱 인라인 + 모바일 오버레이, **로직 없이**) | 결과 연결은 글 목록 화면과 함께 |
| **9** | 스크롤 전환 (데스크톱 배경 / 모바일 숨김·복귀) + reduced-motion | 마지막. 레이아웃이 고정된 뒤 붙이는 장식 |
| **10** | `ResponsiveWrapper` 중복 제거 · `--brand-*` 별칭 삭제 | 전 화면 전환 완료 후 |

> 4번(푸터)을 5번(헤더)보다 먼저 하는 이유: 헤더는 이 STEP에서 가장 큰 컴포넌트입니다. 토큰·테마·폰트에 문제가 있다면 **작은 컴포넌트에서 먼저 발견**하는 편이 쌉니다.

---

## 12. 열린 항목 — 구현 전 확인 필요

| # | 항목 | 현재 잠정값 | 영향 |
|---|---|---|---|
| 1 | **워드마크 최종 표기** | `섭우.log` | 헤더·푸터·`<title>` 전부. 기존 `memoji.png`를 병용할지도 함께 결정 |
| 2 | 내비에 `작업` 추가 시점 | 미노출 | 작업 항목 4건 이상 준비된 뒤 노출 (STEP 7) |
| 3 | 테마 상태 저장소 | Context 권장 | zustand가 이미 의존성에 있으나 현재 미사용. 테마 하나 때문에 스토어를 도입할지는 frontend 판단 |
| 4 | 폰트 서브셋 시나리오 | **A (311 KB)** | 예산 압박 시 B(87 KB)로 하향. 되돌리기 쉬움 |
| 5 | 경로 표시 생략 방식 | 왼쪽부터 잘라 `…/파일명` | CSS만으로는 왼쪽 말줄임이 까다로움. JS 중간 절단이 필요할 수 있음 |

**이 5가지가 정해지지 않아도 1~10단계 중 9단계까지 진행 가능합니다.** 1번만 헤더 구현(5단계) 전에 확정되면 좋습니다.
