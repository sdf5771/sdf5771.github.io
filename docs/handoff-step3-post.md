# 핸드오프 명세 — STEP 3 · 글 상세 `/posts/<slug>`

> **이 문서 + `docs/handoff-step1-shell.md` 두 개만 읽고 구현할 수 있게 쓰였습니다.**
> **토큰의 최종 권위는 `docs/handoff-step1-shell.md` §3입니다.** 이 문서에 값이 인용돼 있어도 STEP 1과 충돌하면 STEP 1이 이깁니다.
> 이 문서는 토큰을 **정의하지 않습니다.** 신규가 필요한 것은 §14에 **제안**으로만 두었고, 승격 여부는 STEP 1 담당이 결정합니다.
>
> 대상 파일: `src/routes/Post/Post.tsx` · `src/routes/Post/Post.module.css` · `src/hooks/usePosts.ts` · `src/utils/generatePostsData.ts`
> 작업 브랜치: **`renewal`** (⚠️ `main`은 push 즉시 프로덕션 배포)

---

## 0. 주 과업

> **사용자는 글 하나를 끝까지 읽고, 읽던 위치를 잃지 않으며, 다 읽으면 다음 글로 이어진다.**

41편 **전부**가 이 화면입니다. 이 화면이 견디지 못하는 콘텐츠 형태가 하나라도 있으면 그 글은 배포 후 깨집니다.
그래서 이 명세는 "예쁜 글 하나"가 아니라 **41편의 실측 분포**를 기준으로 작성했습니다.

**사용자 흐름**

```
진입(홈·목록·검색·외부 딥링크)
  → 제목·메타로 "이 글이 맞나" 판단        (≤2초)
  → 본문 읽기 · 진행바로 남은 양 인지
  → 목차로 구간 점프 / 코드 복사 / 이미지 확인
  → 끝 → 이전·다음 글 또는 시리즈 다음 편
실패 경로: 없는 slug → 404(STEP 5) · 로드 실패 → §12 에러 상태(다시 시도 / 글 목록으로)
```

---

## 1. 선행 조건 — 이것부터 하세요

STEP 1 §1-1과 별개로, **이 화면에만 해당하는** 선행 작업입니다.

| # | 작업 | 이유 |
|---|---|---|
| 1 | **`?id=` 쿼리 라우팅 → `/posts/:slug` 경로 파라미터로 교체** | 현재 `Post.tsx`는 `location.search`의 `id`를 읽습니다. 확정 URL은 `/posts/<slug>`입니다 |
| 2 | **로드 실패 시 `navigate('/')` 제거** | 현재 `catch`에서 무조건 홈으로 튕깁니다. 사용자는 무슨 일이 일어났는지 모른 채 홈에 있게 됩니다. §12 에러 상태로 교체 |
| 3 | **`markdown-it-anchor` 설치** | 헤딩에 `id`가 없으면 목차가 원리적으로 불가능합니다. 현재 렌더러에 앵커 플러그인이 없습니다 |
| 4 | **`markdown-it-math` 의존성 제거** | `markdown-it-katex`와 중복 등록돼 있고 코드에서 쓰이지 않습니다 (`Post.tsx`가 쓰는 건 katex 쪽) |
| 5 | **highlight.js 전체 번들 → 언어별 등록으로 교체** | §6-2. 현재 481KB gzip 단일 청크의 주원인 |

---

## 2. 시안 판정 — 「이 STEP에서 내린 판단」 노트 4건

| # | 시안의 판단 | 판정 | 요지 |
|---|---|---|---|
| 1 | 모바일 목차 = **플로팅 버튼 + 바텀시트** | ✅ **채택** | 근거가 실데이터와 맞습니다 |
| 2 | 목차 없는 12편 = **진행률 카드로 대체** | 🟡 **수정 채택** | 방향은 옳으나 **12편이 아니라 2편**입니다 |
| 3 | 다크 흰 배경 스크린샷 = **크림 매트** | 🟡 **수정 채택** | 매트라는 수단은 옳고, **매트 색이 목적과 모순**입니다 |
| 4 | 라이트 코드블록 = **밝은 바탕 + 보더** | ✅ **채택** | 대비 실측 통과. 신규 hex 2개만 토큰화 필요 |

### 2-1. 모바일 목차 — ✅ 채택

시안 근거("평균 4,800자면 스크롤이 길어 *지금 어디쯤*과 *남은 구간이 무엇인지*가 둘 다 필요")를 실측으로 확인했습니다.

| 지표 | 실측 |
|---|---:|
| 본문 평균 | 4,669자 |
| 중앙값 | 3,198자 |
| **최장** | **21,040자** (client-side-ai) |
| 목차 항목 최대 (H2+H3) | ~~23~~ **24개** (2026-08-01 재측정) |
| **목차 렌더 하한** | **항목 2개 이상.** 1개 이하는 대체 카드 — 아래 |

> ## ✅ `MIN_TOC_ITEMS = 2` 채택 (2026-08-01)
>
> frontend가 명세에 없던 판단(*"1개짜리 목차는 목차가 아니다"*)을 올렸고, **옳습니다.**
>
> 항목이 하나뿐인 목차는 **바로 아래 보이는 섹션 하나로 가는 링크**라 이동 가치가 없으면서 사이드 공간을 차지하고, 사용자에게는 **고장 난 목차로 읽힙니다.** 이건 STEP 1이 금지한 *"목차 영역이 빈 상자로 남으면 안 된다"*와 같은 문제의 다른 얼굴입니다.
>
> **규칙: 목차는 항목이 2개 이상일 때만 렌더한다. 1개 이하는 대체 카드로 대체한다.**
>
> 재측정 결과 **헤딩 0개인 글은 없고**(h1 강등 후 0편), **항목 1개인 글이 2편**이라 대체 카드는 그 2편에 나갑니다. 명세가 2편으로 봤던 "헤딩 없는 글"이 다른 이유로 같은 개수가 된 셈이라 **대체 카드 경로는 그대로 쓰입니다.**

최장 글은 모바일에서 스크롤이 매우 깁니다. 진행바만으로는 "남은 구간이 무엇인지"에 답하지 못한다는 시안의 진단이 맞습니다.
**버튼이 진행률 표시를 겸하는 설계(`≡ 목차 34%`)는 특히 좋습니다** — 평상시에도 정보를 제공하므로 "닫혀 있는 동안 아무 일도 하지 않는 버튼"이 아닙니다. 그대로 갑니다.

### 2-2. 목차 없는 글 — 🟡 수정 채택 (12편 → **2편**)

시안과 브리프는 모두 "H2 없는 12편"을 전제했습니다. **이 전제가 틀렸습니다.**

```
H2 없음                     12편
  └ 그중 H3는 있음          10편   ← 이 10편은 목차를 만들 수 있습니다
H2·H3 모두 없음              2편   ← 진짜 목차 없는 글
```

**H3 없이 H2가 안 쓰인 게 아니라, 이 10편은 H3를 최상위 섹션 구분으로 쓰고 있습니다.**

| 파일 | H3 개수 | 첫 H3 |
|---|---:|---|
| `2023-01-10-Python-if-for-while.md` | 20 | 조건문 |
| `2023-01-10-Python-function-lambda.md` | 11 | 함수 |
| `2023-01-10-Python-default-input-output.md` | 7 | 기본 입출력 |
| `2023-07-19-Skeleton-loading.md` | 7 | SkeletonLoading.tsx |
| `2023-01-08-Python-data-type-list.md` | 6 | 리스트 초기화 |
| `2023-01-09-Python-dictionary-data-type.md` | 4 | 사전 자료형 |
| `2022-12-27-Javascript-type.md` | 2 | 원시 (Primitive) 타입 |
| `2023-01-11-Wanted-pre-onboarding-01.md` | 2 | 멘토님이 리뷰 주신 코드 |
| `2023-04-25-Next-js-practice.md` | 2 | 언제 사용해야 하는가? |
| `2023-01-08-Python-under-bar.md` | 1 | Python에서 언더바 ( _ ) 는 어제 사용하는가? |

**→ 판정: 목차는 H2 + H3를 모두 담습니다.** 그러면 목차가 없는 글은 아래 2편뿐입니다.

- `2022-12-26-React-Redux.md`
- `2023-04-13-Cloud-SaaS-IaaS-PaaS.md`

시안이 만든 대체 카드는 **채택하되, 12편이 아니라 2편에만 나타나고 제목 카피를 정정합니다.** 41편 중 2편(4.9%)이면 예외 처리로 충분히 정당합니다.

> 🔴 **카피 정정 (2026-08-01)**: 시안의 `소제목이 없는 글이에요`는 **사실이 아닙니다.** 대체 카드가 나가는 2편(`react-redux`·`python-under-bar`)에는 **소제목이 1개 있고 화면에 보입니다.** 있는 것을 없다고 말하면 안 됩니다.
>
> | | |
> |---|---|
> | ❌ 폐기 | `소제목이 없는 글이에요` |
> | ✅ **확정** | **`목차를 만들기엔 소제목이 적어요`** (17자, 상한 20자 이내) |
> | 부제 | `대신 진행률로 위치를 알려드려요` — 그대로 유지 |
>
> 확정안은 **소제목 0개와 1개 양쪽에 참**이라 헤딩 분포가 바뀌어도 거짓이 되지 않습니다. 해요체(§3.1)이고, 실패 상태가 아니라 정상 안내이므로 **액션 버튼은 없습니다**(§6.2의 3요소는 사용자가 빠져나와야 하는 상태에 적용됩니다 — 여기서 할 수 있는 일이 없습니다).

> H3를 넣는 부수 효과: 목차 항목 수가 늘어납니다(최대 23개). §8-4의 높이 제한이 반드시 함께 구현돼야 합니다.

> ## 🔴 매트 적용률 41% 누락 — **문단 분해로 해결** (2026-08-01 판정)
>
> **113장 중 46장에 매트가 안 붙습니다.** `markdown-it`의 `breaks: true` 때문에 `![img]` 다음 줄 캡션이 **같은 `<p>` 안에 `<img><br>텍스트`**로 들어와 `isImageOnly` 판정이 false가 됩니다. 하필 **2025년 글 3편 전부**와 `mongodb-local`이 이 패턴입니다.
>
> ### 판정: 문단을 분해해 감쌉니다. 명세를 완화하지 않습니다.
>
> | 선택지 | 판정 |
> |---|---|
> | 이 패턴을 예외로 인정(완화) | ❌ |
> | **`<p>`를 분해해 `<figure>`로 승격** | ✅ **채택** |
>
> 근거 셋입니다.
>
> 1. **누락된 46장이 하필 가장 많이 읽히는 글에 몰려 있습니다.** 매트를 넣은 이유가 다크모드 흰 스크린샷 눈부심 완화인데, **최신 글 3편에서 그 효과가 통째로 빠집니다.** 예외로 인정하면 도입 목적의 상당 부분을 포기하는 셈입니다.
> 2. **캡션 있는 이미지는 매트가 *덜* 필요한 게 아니라 *더* 필요합니다.** 캡션이 액자 밖에 홀로 떠 있으면 어느 이미지의 설명인지 모호해집니다. `<figure>` + `<figcaption>`이 정확히 이걸 푸는 표준 구조입니다.
> 3. **한 글 안에서 액자 있는 이미지와 없는 이미지가 섞이는 것**이 가장 나쁜 결과입니다. 일관성이 없으면 매트가 의도된 디자인이 아니라 버그로 읽힙니다.
>
> ### 변환 규칙
>
> ```
> <p> 안의 <img>는 전부 <figure>로 승격한다.
> 승격 시 그 이미지 직후의 <br> + 텍스트는 <figcaption>이 된다.
> 이미지 앞뒤가 모두 텍스트인 경우(인라인 배지 등)에만 승격하지 않는다.
> ```
>
> | 입력 `<p>` | 출력 |
> |---|---|
> | `<img>` 단독 | `<figure><img></figure>` (현행 유지) |
> | `<img><br>캡션` | `<figure><img><figcaption>캡션</figcaption></figure>` |
> | `텍스트<br><img>` | `<p>텍스트</p>` + `<figure><img></figure>` |
> | `<img>`가 여러 장 | 각각 별도 `<figure>` |
> | `텍스트<img>텍스트` | **승격 안 함** — 인라인 이미지 |
>
> ### §2-3 원문의 취지 — 오해 방지
>
> *"이미지 종류를 판별하는 로직을 만들지 마세요"*가 금지한 것은 **내용 기반 분류**(스크린샷인지 도표인지 사진인지 추정)입니다. 그건 반드시 틀립니다.
> **문단 구조를 보고 `<figure>`로 승격하는 것은 내용 판별이 아니라 구조 변환**이며, 오히려 *"모든 본문 이미지에 예외 없이 일괄 적용"*을 실제로 달성하는 수단입니다. 지금의 `isImageOnly` 분기야말로 그 원칙에서 벗어나 있습니다.
>
> ⚠️ **`breaks: true`를 끄지 마세요.** 41편 전체의 줄바꿈 렌더가 바뀝니다. 변환으로 해결합니다.

### 2-3. 다크 모드 흰 배경 스크린샷 — 🟡 수정 채택

**채택하는 부분 (시안이 옳음)**

> "밝기를 낮추면 텍스트 스크린샷이 읽히지 않으므로 원본은 그대로 둡니다."

맞습니다. `filter: brightness()`를 걸면 안 됩니다. 이 블로그의 이미지 113장 중 다수가 **텍스트가 들어간 스크린샷**이고, 밝기를 낮추면 그 텍스트의 대비가 함께 무너집니다. 접근성을 지키려다 접근성을 깨는 처리입니다. **필터 없이 매트(액자)로 푼다**는 방향을 채택합니다.

**수정하는 부분 (매트 색)**

시안은 다크에서 매트를 `#f4ecd2`(= `--color-text-primary` 다크값)로 깔았습니다. 목적과 모순됩니다.

| 대상 | 페이지 배경(`#0a0f1c`) 대비 |
|---|---:|
| 흰 스크린샷 `#ffffff` | 19.13 : 1 |
| **시안 매트 `#f4ecd2`** | **16.19 : 1** |

눈부심은 *어두운 화면에서 밝은 면적이 넓을 때* 생깁니다. 16:1짜리 크림 매트를 12px 두르면 **밝은 면적이 오히려 커집니다.** 19:1을 16:1로 낮춘 대가로 눈부신 영역을 넓히는 교환입니다.
게다가 `--color-text-primary`는 **텍스트 토큰**입니다. 이걸 배경으로 전용하면 STEP 1 §3-5의 "역할대로 쓴다" 규칙이 깨지고, 나중에 text-primary를 조정하면 이미지 액자 색이 같이 변합니다.

**→ 확정: 매트는 표면 토큰을 씁니다.**

| | 라이트 | 다크 |
|---|---|---|
| 매트 배경 | `--color-bg-surface` | `--color-bg-raised` |
| 매트 보더 | `--color-border-default` | `--color-border-strong` |
| 매트 패딩 | `--space-3`(12px) 데스크톱 · `--space-2`(8px) 모바일 |
| 라운드 | `--radius-xl`(8px) 바깥 / `--radius-md`(4px) 이미지 |
| 그림자 | `--shadow-sm` |

다크에서 `#0a0f1c`(페이지) → `#161d30`(매트) → `#2d3551`(보더) → 이미지로 **밝기가 단계적으로 올라갑니다.** 흰 이미지가 검은 페이지에 직접 닿는 경계가 사라지고, 밝은 면적은 늘지 않습니다. 시안의 "액자에 들어간 자료로 읽힌다"는 의도는 그대로 살아 있습니다.

**41편 이미지 혼재에 대한 일괄 적용 검토** — 실측 113장:

| 형식 | 장수 | 매트 일괄 적용 시 |
|---|---:|---|
| `.png` | 88 | 대부분 스크린샷·다이어그램 — **의도한 효과** |
| `.jpeg` | 11 | 컨퍼런스 현장 사진 (MongoDB.local) — 사진에 액자, 무해 |
| `.jpg` | 8 | 동일 |
| `.gif` | 4 | 동작 녹화 — 무해 (단 §11-3 모션 주의) |
| `.webp` | 2 | 동일 |

**부작용 없음.** 이유는 시안이 `filter`를 쓰지 않기로 한 덕입니다 — 필터였다면 사진의 색이 틀어졌을 것입니다. **패딩·배경·보더만 쓰므로 이미지 픽셀은 전혀 건드리지 않습니다.** 사진에 얇은 매트가 생기는 것은 시각적으로 중립이며 오히려 본문과의 경계를 만들어 줍니다.
→ **모든 본문 이미지에 예외 없이 일괄 적용합니다.** 이미지 종류를 판별하는 로직을 만들지 마세요 (판별 실패가 더 큰 비용).

### 2-4. 라이트 코드블록 — ✅ 채택

시안 값의 대비를 실측했습니다. 전부 통과합니다.

| 역할 | 라이트 (`#f4f1e8` 위) | 다크 (`#0d1220` 위) |
|---|---:|---:|
| 키워드 | 6.31 : 1 | 7.95 : 1 |
| 문자열 | 4.76 : 1 | 9.69 : 1 |
| 연산자 | 5.04 : 1 | 8.44 : 1 |
| 함수 | 5.45 : 1 | 13.52 : 1 |
| 주석 | 5.55 : 1 | 5.43 : 1 |
| 기본 텍스트 | 11.42 : 1 | 12.71 : 1 |

**전부 4.5:1 이상.** 주석까지 5.4:1을 넘긴 건 드물게 좋은 팔레트입니다(대부분의 하이라이트 테마는 주석이 3:1 아래로 떨어집니다).

그리고 **시안은 신택스 색을 새로 지어내지 않았습니다.** 전부 STEP 1 토큰의 재사용입니다 — §14-1에서 매핑을 확인하세요.

---

## 3. 레이아웃 & 그리드

### 3-1. 데스크톱 (≥1024px)

```
┌─ 전역 헤더 (sticky, --header-h-desktop 48px, --z-header)
├─ 읽기 진행바 (3px, 헤더 하단에 붙음)
├─ 브레드크럼            padding: --space-3 --space-9
├─ 히어로 220px
├─ 제목 · 메타 · 태그 · 시리즈
├─ ┌──────────────────┬──────────────┐
│  │ 본문 640px       │ 목차 176px   │   gap 32px, align-items:start
│  │ (--measure-      │ (--toc-w)    │   목차는 position:sticky
│  │  reading)        │              │
│  └──────────────────┴──────────────┘
├─ 이전 / 다음  (1fr 1fr)
└─ 푸터
```

- 콘텐츠 컬럼 총폭 = `640 + 32 + 176` = **848px**. `--container-narrow`(920px) 안에 들어갑니다
- 좌우 패딩 **36px** — STEP 1 스페이싱 스케일에 36이 없습니다. **`--space-8`(32px)로 치환**하고 컬럼 폭은 유지하세요 (§14-2)
- 본문 최대 폭 `--measure-reading`(640px)은 **상한이지 고정폭이 아닙니다.** 코드블록·표·이미지는 이 폭을 넘지 않고 자기 안에서 가로 스크롤합니다

### 3-2. 태블릿 (768~1023px)

- **목차 사이드바를 숨기고 모바일과 같은 플로팅 버튼 + 바텀시트를 씁니다.** 848px 컬럼이 들어가지 않습니다
- 본문은 `min(640px, 100% - 2×--space-6)`로 중앙 정렬
- 히어로 180px

### 3-3. 모바일 (≤767px)

- 단일 컬럼 `1fr`, 좌우 패딩 `--space-4`(16px)
- 헤더 `--header-h-mobile`(52px), 히어로 150px
- 이전/다음은 세로 2행 (`1fr`), 정렬 좌측
- 목차 = 플로팅 버튼 + 바텀시트 (§8-6)

### 3-4. 타이포 스케일 (본문 영역)

시안 값은 STEP 1 축 B에 없는 값이 많습니다. **본문 헤딩은 축 B로 커버되지 않는 별도 스케일이 필요합니다** — §14-2에 신규 토큰으로 제안했습니다. 그 전까지 아래 수치를 그대로 쓰세요.

| 요소 | 데스크톱 | 모바일 | 서체 / 굵기 | 행간 |
|---|---:|---:|---|---|
| 글 제목 `h1` | 34px | 26px | Pretendard 800 | 1.2 (`--lh-heading`) |
| 본문 `h2` | 25px | 21px | Pretendard 800 | 1.3 |
| 본문 `h3` | 20px | 18px | Pretendard 700 | 1.35 |
| 본문 `h4` | 17px | 16px | Pretendard 700 | 1.4 |
| 본문 `p` | 16px (`--fs-lg`) | 16px | Pretendard 400 | **1.8** (`--lh-relaxed`) |
| 메타·경로 | 12px (`--fs-xs`) | 12px | GalmuriMono11 | — |
| 목차 항목 | 13px (`--fs-sm`) | 15px | Pretendard 400 | 1.5 |

- **글 제목에 픽셀 서체를 쓰지 마세요.** STEP 1 §4-6이 "글 목록의 글 제목"을 픽셀 금지로 못박았고, 같은 근거가 글 제목 본체에 더 강하게 적용됩니다 — 최장 96자 한글 제목을 11px 그리드 비트맵으로 3행 조판하면 읽히지 않습니다. 시안도 `h1`에 Pretendard 800을 썼습니다. 유지합니다
- `h1`에 `text-wrap: pretty` 유지 (시안 채택). 미지원 브라우저는 무시하므로 안전합니다
- `letter-spacing: -0.01em`은 `h1`에만

---

## 4. 페이지 블록별 명세

### 4-1. 읽기 진행바

- 헤더 바로 아래, 높이 **3px**, `--z-header`와 함께 sticky
- 트랙 `--color-border-subtle` / 채움 `linear-gradient(90deg, --color-accent-deep, --color-accent-fill, --color-accent-hover)`
- `role="progressbar"` + `aria-label="읽기 진행률"` + `aria-valuenow/min/max`
- 계산 계약은 §8-1

### 4-2. 브레드크럼

```
cd .. / ~/posts / <카테고리> / <slug>
```

- GalmuriMono11 `--fs-xs`, 색 `--color-text-muted`
- `cd ..`만 링크 (`--color-status-info`) → `/posts`로 이동. **`aria-label="글 목록으로"`** (§7.2: 링크 텍스트만으로 목적지를 알 수 없으므로 필수)
- 구분자 `/`는 `aria-hidden="true"`
- 카테고리는 `--color-cat-*`, slug는 `--color-text-secondary`
- **가로 스크롤 허용** (`overflow-x:auto`, 스크롤바 숨김). slug가 긴 글이 있습니다 (최장 **97자**: `2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer`)

### 4-3. 히어로

- 데스크톱 220 / 태블릿 180 / 모바일 150px
- **썸네일이 있는 24편**: 이미지를 `object-fit: cover`로 채우고 위에 `--color-bg-overlay` 그라데이션
- **썸네일이 없는 17편**: 카테고리별 그라데이션 (§14-2 제안 토큰). 이모지를 얹지 **마세요** — 시안은 🤖/🥽/📘를 썼지만 41편에 이모지 필드가 없고, 자동 할당하면 부정확한 이모지가 붙습니다. 그라데이션만으로 충분합니다
- 그라데이션 히어로는 `role="presentation"` (§7.1 — 장식)
- 좌상단 카테고리 배지: `--color-bg-overlay` 위 텍스트, Galmuri11 `--fs-pixel-1`(11px)
- **⚠️ CLS**: 히어로 높이를 CSS로 **고정**하고 이미지에 `width`/`height` 속성을 주세요. 높이를 이미지 로드에 맡기면 제목이 뛰어오릅니다

### 4-4. 제목 · 메타 · 태그

**메타 형식은 WRITING_GUIDE §6.7 확정입니다.**

```
Survey · 2025.05.26 · 6분
```

- 순서 고정. **저자 표시하지 않음** — 41편 전부 동일 저자라 정보량 0 (현재 `Post.tsx`는 저자를 표시하고 있습니다. 제거)
- 카테고리는 **색 점 + 텍스트 병기** (§7.5). 원본 대소문자 유지 (`Survey`/`Study`/`Activity`)
- 날짜는 `YYYY.MM.DD`. 현재 코드의 `toLocaleDateString()`은 **로케일에 따라 결과가 달라집니다** — 고정 포매터로 교체
- 읽기 시간 계산은 §9-3
- 구분자 `·` 앞뒤 공백 1칸, `aria-hidden="true"`

**태그** (WRITING_GUIDE §6.8)

- **최대 3개 노출 + `+N`**. 실데이터 최대 15개 (2편)
- `+N` 버튼의 접근가능한 이름: **`태그 12개 더 보기`**. 펼친 뒤 라벨은 `접기`
- 표시 시 `#` 접두는 **장식** → `aria-hidden`. 태그 문자열은 글에 적힌 원문 그대로 (대소문자 변경 금지)
- **1회성 태그 37종은 링크하지 않습니다** (product.md §⑦). 링크 없는 태그는 `<span>`으로 렌더하고 호버 커서를 바꾸지 마세요

### 4-5. 시리즈

데이터 계약은 §10. UI 규격만 여기 둡니다.

```
┌ (border-left 3px --color-accent-border)
│  시리즈 · 2편 중 1편        다음 편 — <다음 글 제목>
└
```

- 배경 `--color-bg-surface`, 보더 `--color-border-default`, 좌측 강조선 3px `--color-accent-border`
- 라운드 `0 --radius-md --radius-md 0`
- 라벨 Galmuri11 `--fs-pixel-1`, 색 `--color-accent-text`
- 링크 제목은 1행 말줄임 (`text-overflow: ellipsis`)
- **링크 텍스트가 `다음 편`만이면 안 됩니다** (§7.2). 접근가능한 이름에 글 제목이 들어가야 합니다 → `<a>` 안에 `다음 편 — <제목>` 전체를 넣으세요
- **시리즈가 아닌 글에는 이 블록이 아예 없습니다.** 시안은 시리즈가 아닌 `client-side-ai` 글에 "시리즈 · 2편 중 1편"을 붙였습니다 — 시안의 데이터 오류입니다 (§13-2)
- **단독 1편**(`Wanted-pre-onboarding-01`)은 시안대로 `시리즈 · 1편 중 1편` + `이어지는 편이 아직 없습니다`를 **회색(`--color-text-muted`)·링크 없음**으로 표시합니다

### 4-6. 이전 / 다음

데이터 계약은 §10-2.

- 데스크톱 `1fr 1fr` (gap 1px, 배경 `--color-border-default`로 구분선 효과)
- 모바일 세로 2행, 둘 다 좌측 정렬
- 라벨 `← 이전 글` / `다음 글 →` — 화살표는 `aria-hidden`
- 제목 `--fs-base`(14px) Pretendard 600, **2행 클램프** (`-webkit-line-clamp: 2`). 96자 제목이 4행을 먹으면 두 칸 높이가 어긋납니다
- **한쪽이 없을 때**(첫 글·마지막 글): 그 칸을 **비우지 말고 제거**하고 남은 칸이 전체 폭을 차지하게 합니다. 빈 칸은 "로딩 실패"로 오인됩니다
- 링크 접근가능한 이름 = 글 제목 (§7.2)

### 4-7. 코드 복사 버튼 · 링크 복사

WRITING_GUIDE §6.1 / §6.12 확정 카피입니다.

| 요소 | 기본 | 완료 | aria |
|---|---|---|---|
| 코드 복사 | `복사` | `복사됨` | `aria-label="코드 복사"` |
| 링크 복사 | `링크 복사` | `복사됨` | — (라벨이 이미 명확) |

- **시안의 `링크가 복사됐어요`는 §6.12 위반입니다.** 확정 카피는 **`복사됨`**입니다. 정정하세요
- 완료 알림은 별도 `aria-live="polite"` 영역에 **`복사됨`** 텍스트만. 체크 기호(`✓`)를 `aria-live`에 넣지 마세요 (§7.4)
- 1.4초 후 원복 (시안은 1.6초 — §6.12가 1.4초로 확정). `--dur-*`가 아닌 별도 상수
- 완료 상태 배경 `--color-status-success`, 텍스트 `--color-accent-onFill`

---

## 5. 🔴 마크다운 렌더링 — 41편 실측 커버리지

### 5-1. 실제로 쓰이는 문법 (41편 전수 조사)

**이 표가 이 STEP에서 가장 중요합니다.** 코드펜스 내부와 인라인 코드를 제외하고 집계했습니다.

| 문법 | 사용 글 수 | 판정 | 명세 |
|---|---:|---|---|
| 헤딩 (`#`~`####`) | **41 / 41** | 🔴 필수 | §5-3 |
| 순서 없는 목록 | 36 | 🔴 필수 | §5-3 |
| **코드 블록** | **35** | 🔴 필수 | §6 |
| `h2` | 29 | 🔴 필수 | §8 |
| `h3` | 28 | 🔴 필수 | §8 |
| **중첩 목록** | **25** | 🔴 필수 | §5-3 |
| **본문 이미지** | **25** | 🔴 필수 | §11 |
| 굵게 `**` | 24 | 🔴 필수 | §5-3 |
| 링크 | 22 | 🔴 필수 | §5-3 |
| **인용문 `>`** | **16** | 🔴 필수 | §5-3 |
| **수평선 `---`** | **16** | 🔴 필수 | §5-3 |
| 순서 있는 목록 | 14 | 🔴 필수 | §5-3 |
| 인라인 코드 `` ` `` | 12 | 🔴 필수 | §5-3 |
| **표** | **8** | 🔴 필수 | §5-3 |
| **원시 HTML** | **6** | 🟡 대응 필요 | §5-4 |
| 취소선 `~~` | 4 | 🟡 필수 | §5-3 |
| `h4` | 4 | 🟡 필수 | §5-3 |
| 기울임 `*` | 2 | 🟡 필수 | §5-3 |
| **인라인 수식 `$…$`** | **1** | ⚠️ 특수 | §7 |
| **블록 수식 `$$`** | **0** | ⬜ 미사용 | §7 |
| **각주 `[^1]`** | **0** | ⬜ 미사용 | §7 |
| **체크리스트 `- [ ]`** | **0** | ⬜ 미사용 | §7 |

**시안이 본문 예시에 넣은 각주·체크리스트·블록 수식은 41편에서 단 한 번도 쓰이지 않습니다.**
반대로 **41편이 실제로 쓰는 중첩 목록(25편)·수평선(16편)·표(8편)·취소선(4편)·원시 HTML(6편)은 시안이 다루지 않았거나 얕게 다뤘습니다.** §5-3이 그 공백을 메웁니다.

### 5-2. 렌더러 옵션 — 현재 설정의 함정

```js
new MarkdownIt({ html: true, breaks: true, linkify: true })
```

| 옵션 | 현재 | 판정 | 영향 |
|---|---|---|---|
| `html: true` | 켜짐 | **유지** | 6편이 원시 HTML을 씁니다 (§5-4). 콘텐츠가 본인 소유이므로 XSS 위험 없음 |
| **`breaks: true`** | 켜짐 | **유지 (주의)** | 🔴 **단일 개행이 `<br>`이 됩니다.** 41편이 이 동작을 전제로 쓰였으므로 끄면 문단이 뭉칩니다. **대신 `p` 안의 `<br>`이 많아지므로 `line-height`를 1.8로 넉넉히 잡습니다** |
| `linkify: true` | 켜짐 | 유지 | 맨 URL이 자동 링크됩니다. §5-3 링크 스타일이 그대로 적용돼야 합니다 |

### 5-3. 요소별 스타일 명세 (라이트 · 다크)

**색은 전부 STEP 1 토큰입니다. 라이트/다크는 토큰이 알아서 전환하므로 별도 규칙이 필요한 것만 표시했습니다.**

#### 문단 · 인라인

| 요소 | 명세 |
|---|---|
| `p` | 16px / `--lh-relaxed`(1.8) / `--color-text-body` / `margin: 0 0 --space-5`(20px) / `text-wrap: pretty` |
| `strong` | `font-weight: 700` / **색을 `--color-text-primary`로 올림** (본문보다 한 단계 밝게 — 다크에서 굵기만으로는 구분이 약함) |
| `em` | `font-style: italic` / 색 변경 없음 |
| `del` (`~~`) | `text-decoration: line-through` / `--color-text-muted` / **`opacity` 금지** (대비 붕괴) |
| `a` | `--color-status-info` / `text-decoration: underline` / `text-underline-offset: 3px` / 호버 시 `text-decoration-thickness: 2px` |
| 외부 링크 | `↗` 접미 (`aria-hidden`) + `rel="noopener noreferrer"` + `target="_blank"` + `aria-label`에 `(새 창)` (§7.2) |
| `code` (인라인) | GalmuriMono11 14px / 배경 `--color-bg-raised` / 보더 1px `--color-border-default` / `--radius-xs`(2px) / padding `1px 6px` / 색 **`--color-accent-text`** (⚠️ `--color-accent-fill` 아님 — 라이트에서 2.14:1로 무너집니다) / **대비 라이트 6.16:1 · 다크 7.82:1 통과** |

#### 헤딩

| 요소 | 명세 |
|---|---|
| `h2` | §3-4 스케일 / `margin: --space-10 0 --space-4`(40/14) / `scroll-margin-top: 120px` |
| `h3` | §3-4 / `margin: --space-8 0 --space-3` / `scroll-margin-top: 120px` |
| `h4` | §3-4 / `margin: --space-7 0 --space-2` |
| **`h1` (본문 내)** | 🔴 **22편이 본문에 `#`를 씁니다.** 페이지 `h1`(글 제목)과 충돌합니다 → §5-5 |

- `scroll-margin-top: 120px`은 sticky 헤더(48) + 진행바(3) + 여유입니다. **목차 점프 시 헤딩이 헤더 뒤로 숨는 것을 막는 유일한 장치이므로 빠뜨리면 안 됩니다**
- 모바일은 `scroll-margin-top: 90px` (헤더 52px 기준)

#### 목록

| 요소 | 명세 |
|---|---|
| `ul` | `list-style: none` / `padding: 0` / `margin: 0 0 --space-6` |
| `ul > li` | `position: relative` / `padding-left: 22px` / `margin-bottom: 9px` / 마커는 `::before`에 `▸`, `--color-accent-text`, GalmuriMono11, `aria-hidden` 불필요(의사요소는 낭독 안 됨) |
| `ol` | `list-style: decimal` / `padding-left: --space-6`(24px) / 마커 색 `--color-accent-text` (`::marker`) |
| `ol > li` | `margin-bottom: 9px` / `padding-left: --space-1` |
| **중첩 (25편 사용)** | 🔴 **깊이별 마커를 반드시 다르게**: `ul ul` → `·`, `ul ul ul` → `-`. 전부 `▸`이면 계층이 시각적으로 사라집니다. 중첩 `margin: --space-2 0 0 0`, `padding-left: 22px` (부모와 동일 들여쓰기 유지) |
| 목록 안 문단 | `p` 마진 제거 (`li > p { margin: 0 }`) — `breaks:true` 때문에 목록 항목 안에 `p`가 생기는 경우가 있습니다 |

#### 인용문 (16편)

```css
blockquote {
  margin: 0 0 var(--space-6);
  padding: var(--space-4) var(--space-5);
  background: var(--color-accent-subtle);
  border-left: 3px solid var(--color-accent-border);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
blockquote p { margin: 0; font-size: 15px; line-height: 1.75; color: var(--color-text-body); }
blockquote p + p { margin-top: var(--space-3); }
```

- **시안의 `quoteFg` 신규 hex 2개(`#4a3a12`/`#e8d9b0`)는 불필요합니다.** `--color-text-body`가 인용 배경 위에서 **라이트 10.82:1 · 다크 10.89:1**로 충분히 통과합니다 (시안 값은 9.24:1 / 11.42:1로 실질 차이 없음). 토큰 2개를 새로 만들 이유가 없습니다 → §14-1
- 중첩 인용(`blockquote blockquote`)은 41편에 없지만 왼쪽 선만 한 번 더 그어지게 두면 충분합니다

#### 표 (8편)

```css
.content table { border-collapse: collapse; width: 100%; min-width: 420px; font-size: 14px; }
```

- 🔴 **표는 반드시 `overflow-x: auto` 래퍼 안에 있어야 합니다.** 640px 본문에 4열 이상 표가 들어가면 페이지 전체가 가로 스크롤됩니다. `markdown-it`은 래퍼를 만들어 주지 않으므로 **렌더 후 DOM에서 `table`을 감싸거나 `render` 규칙을 오버라이드**하세요
- 래퍼: 보더 1px `--color-border-default`, `--radius-lg`(6px), 스크롤바 얇게
- `th`: 배경 `--color-bg-raised` / Galmuri11 `--fs-pixel-1`(11px) / `font-weight: 400` (픽셀 서체에 굵기 금지 — STEP 1 §4-5) / 좌측 정렬 / 하단 보더 `--color-border-default`
- `td`: padding `10px 14px` / `--color-text-body` / 하단 보더 `--color-border-subtle` / 마지막 행 보더 없음
- 숫자·버전 셀은 GalmuriMono11 12px `--color-text-muted`
- **`caption`은 41편에 없음** — 스타일 불필요

#### 수평선 (16편)

```css
.content hr { border: none; border-top: 1px solid var(--color-border-default); margin: var(--space-8) 0; }
```

`***`, `---`, `___` 세 표기가 모두 쓰입니다. `markdown-it`이 전부 `<hr>`로 정규화하므로 규칙 하나로 충분합니다.

#### 이미지 (25편)

§11 전체 참조. 요약: 모든 `img`를 `figure > div.matte > img` 구조로 감싸고, `alt`가 있으면 `figcaption`을 만듭니다.

### 5-4. 원시 HTML (6편) — 🟡 대응 필요

`html: true`이므로 아래가 그대로 DOM에 들어옵니다.

| 태그 | 등장 | 처리 |
|---|---:|---|
| `<br>` | 12 | 그대로 (문제 없음) |
| **`<h2>`** | **8** | 🔴 **마크다운 `##`가 아니라 원시 HTML로 쓴 헤딩입니다** → §5-5·§8-3 |
| **`<script>`** | **6** | 🔴 §5-6 |
| `<aside>` | 1 | 스타일 없음 → `p`와 동일하게 보이게 최소 규칙 추가 |
| `<dfs>` | 1 | 오타(존재하지 않는 태그). 브라우저가 인라인 무명 요소로 처리 — 무시 |

**`<h2>` 8개가 결정적입니다.** `markdown-it-anchor`는 **마크다운 헤딩 토큰에만** `id`를 붙입니다. 원시 HTML로 쓴 `<h2>`에는 `id`가 붙지 않고, 목차에도 잡히지 않습니다.
→ **목차는 마크다운 파싱 결과가 아니라 렌더링된 DOM에서 헤딩을 수집해야 합니다** (§8-3).

### 5-5. 헤딩 앵커 id — 반드시 해결해야 하는 3가지

**현재 렌더러는 헤딩에 `id`를 전혀 붙이지 않습니다. 목차·딥링크·`scrollIntoView`가 전부 불가능합니다.**

| # | 문제 | 실측 | 해법 |
|---|---|---|---|
| 1 | **한글 헤딩의 slug** | 헤딩 대부분이 한글 | `encodeURIComponent` 기반 slug 대신 **`heading-<index>`** 형태의 안정 id 권장. 한글 URL 프래그먼트는 인코딩되어 주소창이 흉해지고, 글 수정 시 링크가 깨집니다 |
| 2 | **중복 헤딩** | **3편에서 발생** | `2023-01-30-Python-dfs-bfs`(`입출력 예` 2회), `2023-02-01-Python-greedy-algorithm`(`입력조건`·`출력조건`·`입력예시 1`), `2023-02-02-Python-implementation-bruteforce`(`입력조건`·`출력조건`·`입력예시`). **인덱스 기반 id면 원천적으로 발생하지 않습니다** |
| 3 | **본문 `h1` 22편** | 22 / 41 | 페이지에 `h1`이 2개 이상 생겨 문서 개요가 깨집니다 → **렌더 후 본문 내 `h1`을 `h2`로 강등**하고 강등된 것도 목차에 포함하세요 (`2023-04-13-Cloud-SaaS-IaaS-PaaS`는 `h1` 4개가 유일한 구조입니다) |

> **⚠️ `2023-04-13-Cloud-SaaS-IaaS-PaaS.md`와 `2022-12-26-React-Redux.md`가 "목차 없는 2편"인 이유가 바로 이것입니다.** `h1` 강등을 구현하면 Cloud 글은 목차 4개를 갖게 되어 **진짜 목차 없는 글은 1편(`React-Redux`, `h1` 1개)뿐**이 됩니다. 강등 구현 여부에 따라 §2-2의 대체 카드가 1편에만 나타날 수 있습니다 — 어느 쪽이든 레이아웃은 동일합니다.

### 5-6. 🔴 `<script>` 6개 — 보안·동작 확인 필요

6편의 본문에 `<script>` 태그가 있습니다. `dangerouslySetInnerHTML`로 삽입된 `<script>`는 **브라우저가 실행하지 않습니다**(HTML5 명세). 따라서 현재 동작상 무해합니다.

- **조치**: 렌더 후 `<script>`를 DOM에서 제거하세요. 실행되지 않는 태그가 남아 있으면 나중에 `innerHTML` 대신 다른 삽입 방식으로 바꿀 때 실행돼 버립니다
- 원문이 코드 예시로 `<script>`를 보여주려던 것이라면 그 글은 **코드펜스로 고쳐야** 합니다 — 다만 **41편 md 무수정 원칙**에 따라 이번 범위에서는 건드리지 않고, 렌더 시 제거만 합니다

---

## 6. 코드 블록 (35편)

### 6-1. 시각 규격

```
┌ 헤더 ────────────────────────────────┐
│ translate.ts                  [복사] │  ← 파일명 있을 때만
├──────────────────────────────────────┤
│ (pre, overflow-x:auto)               │
└──────────────────────────────────────┘
```

| 부분 | 라이트 | 다크 |
|---|---|---|
| 블록 배경 | `#f4f1e8` (신규 — §14-2) | `--color-bg-surface` (`#0d1220`) |
| 헤더 배경 | `#eae6d9` (신규 — §14-2) | `--color-bg-raised` (`#161d30`) |
| 보더 | `--color-border-default` | `--color-border-default` |
| 파일명 | `--color-text-muted` (5.02:1 ✅) | `--color-text-muted` (4.87:1 ✅) |

- 라운드 `--radius-lg`(6px), `overflow: hidden`
- `pre` padding `--space-4`(16px), 폰트 GalmuriMono11 13px, `line-height: 1.75`
- 🔴 **`pre`는 `overflow-x: auto`이고 절대 줄바꿈하지 않습니다** (`white-space: pre`). 코드를 접으면 들여쓰기 의미가 사라집니다
- 🔴 **라이트에서 코드블록 배경(`#f4f1e8`)과 페이지 배경(`#efece4`)의 대비는 1.045:1** — 사실상 구분이 없습니다. **보더가 유일하게 블록 경계를 만듭니다. 보더를 빼지 마세요** (STEP 1 §라이트 모드 결론과 동일한 이유)
- **파일명은 41편 마크다운에 없습니다.** 코드펜스 인포스트링이 언어명뿐이므로 **헤더는 "복사 버튼만" 있는 형태가 기본**이고, 파일명 행은 인포스트링에 `ts:translate.ts` 같은 표기가 생길 미래를 위해 남겨두되 지금은 렌더되지 않습니다

### 6-2. 🔴 highlight.js — 언어 등록 목록

**현재 `import hljs from 'highlight.js'`는 192개 언어를 전부 번들합니다** (`lib/languages` 2.6MB 원본). 481KB gzip 단일 청크의 주원인입니다.

> ## 🔴 통계 정정 (2026-08-01 · frontend 재측정)
>
> | | 이 절의 값 | **실제** |
> |---|---:|---:|
> | 코드펜스 | 326개 | **169개** |
> | 인포스트링 없음 | 169개 (52%) | **6개 (3.6%)** |
> | 6개 언어 커버리지 | — | **170개 중 162개 (95.3%)** |
>
> 이 절은 **펜스 *줄* 수를 세면서 닫는 줄을 "인포스트링 없음"으로 집계**했습니다. 여는 줄과 닫는 줄이 1:1이라 326 ≈ 169×2이고, 닫는 줄에는 당연히 인포스트링이 없으므로 169가 그대로 "없음"으로 잡혔습니다.
>
> **결론은 그대로 유효합니다** — 6개 언어만 등록하고 `highlightAuto`를 쓰지 않습니다. 오히려 **커버리지가 48%가 아니라 95.3%**라 그 판단이 더 강해집니다. 아래 언어별 분포와 번들 크기는 재측정 대상입니다.

**41편이 실제로 쓰는 인포스트링 전수 조사** (총 ~~326~~ **169**개 펜스):

| 인포스트링 | 펜스 수 | hljs 등록 모듈 | 모듈 크기 |
|---|---:|---|---:|
| **(없음)** | **169** | — (하이라이트 안 함) | — |
| `python` | 80 | `python` | 12 KB |
| `jsx` | 32 | `javascript` (jsx는 별칭) | 20 KB |
| `tsx` | 32 | `typescript` (tsx는 별칭) | 24 KB |
| `javascript` | 7 | (위와 동일) | — |
| `css` | 3 | `css` | 20 KB |
| `xml` | 2 | `xml` | 8 KB |
| `json` | 1 | `json` | 4 KB |
| | **326** | **6개 모듈** | **88 KB** (원본, gzip 전) |

**→ 등록할 언어는 6개뿐입니다.**

```ts
import hljs from 'highlight.js/lib/core';
import python     from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';  // jsx 별칭 포함
import typescript from 'highlight.js/lib/languages/typescript';  // tsx 별칭 포함
import css        from 'highlight.js/lib/languages/css';
import xml        from 'highlight.js/lib/languages/xml';
import json       from 'highlight.js/lib/languages/json';

hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
```

`jsx`/`tsx` 별칭이 각 모듈에 이미 포함돼 있음을 확인했습니다 (`hljs.getLanguage('jsx') → JavaScript`, `'tsx' → TypeScript`). **별도 등록 불필요.**

> **인포스트링 없는 169개 펜스(52%)가 다수입니다.** 현재 코드는 이 경우 `''`를 반환해 이스케이프만 합니다 — **이 동작을 유지하세요.** `hljs.highlightAuto()`를 쓰면 안 됩니다: ① 언어 자동 추론이 짧은 스니펫에서 자주 틀립니다 ② 자동 추론은 전체 언어 정의를 요구해 위 번들 절감이 무의미해집니다. **하이라이트 없는 코드는 결함이 아니라 정상 상태**로 디자인돼 있습니다 — `--color-text-body`로 렌더되고 §6-1의 블록 규격은 동일하게 적용됩니다.

### 6-3. 🔴 hljs 테마 — CSS를 가져오지 마세요

**`highlight.js/styles/*.css`를 import하지 마세요.** 이유:

1. 모든 기성 테마가 **자기 배경색을 강제**합니다 (`.hljs { background: #… }`) — §6-1에서 확정한 테마별 배경과 충돌합니다
2. 라이트/다크 두 테마를 동시에 로드하면 뒤에 온 것이 이깁니다. `@media`로 가르면 **명시적 테마 토글**(STEP 1 §5)이 동작하지 않습니다
3. 어떤 기성 테마도 우리 대비 기준을 만족한다는 보장이 없습니다

**→ 확정: `hljs-*` 클래스에 우리 토큰을 직접 매핑합니다.** 시안이 이미 그렇게 했고, 대비도 전부 통과했습니다 (§2-4).

```css
.content .hljs-keyword,
.content .hljs-built_in,
.content .hljs-literal    { color: var(--color-status-accent); }   /* 6.31 / 7.95 */
.content .hljs-string,
.content .hljs-regexp     { color: var(--color-status-success); }  /* 4.76 / 9.69 */
.content .hljs-operator,
.content .hljs-number,
.content .hljs-symbol     { color: var(--color-status-info); }     /* 5.04 / 8.44 */
.content .hljs-title,
.content .hljs-function,
.content .hljs-attr,
.content .hljs-tag        { color: var(--color-accent-text); }     /* 5.45 / 13.52 */
.content .hljs-comment,
.content .hljs-quote      { color: var(--color-text-muted); }      /* 5.55 / 5.43 */
.content .hljs             { color: var(--color-text-body); }      /* 11.42 / 12.71 */
```

- **토큰을 쓰므로 테마 전환이 자동으로 따라옵니다.** 별도 다크 규칙 불필요
- 위에 없는 `hljs-*` 클래스는 상속받아 `--color-text-body`로 렌더됩니다 — 의도된 동작입니다 (색 종류를 늘리면 코드가 크리스마스 트리가 됩니다)
- **`--color-accent-fill`을 신택스에 쓰지 마세요.** 라이트에서 2.14:1입니다

---

## 7. KaTeX · 각주 · 체크리스트 — 실사용 0에 가까운 3종

### 7-1. 🔴 수식 — 실사용 1편, 그중 2/3이 실패

**41편 전체에서 블록 수식(`$$`)은 0회, 인라인 수식은 1편에서 3회입니다.**
전부 `2023-01-09-Python-dictionary-data-type.md`의 집합 설명입니다. **실제로 렌더해 봤습니다.**

| 원문 | `markdown-it-katex` 결과 |
|---|---|
| `합집합 : … ($A ∪ B$)` | ❌ **파싱 실패 → 평문** `합집합 : … (A ∪ B)` |
| `교집합 : … ($A ∩ B$)` | ❌ **파싱 실패 → 평문** `교집합 : … (A ∩ B)` |
| `차집합 : … ($A - B$)` | ✅ **KaTeX 렌더** (`<span class="katex">`, 세리프 이탤릭) |

**세 줄이 나란히 있는 목록에서 두 줄은 본문 서체 평문, 한 줄만 세리프 이탤릭 수식으로 렌더됩니다.** 유니코드 `∪`/`∩`을 KaTeX가 파싱하지 못하고, 플러그인이 예외를 삼켜 `$`만 지운 평문을 내놓기 때문입니다.

**비용**

| 항목 | 용량 |
|---|---:|
| `katex.min.css` | 21 KB |
| `katex/dist/fonts` | **2.1 MB / 80개 파일** |

폰트는 실제 수식이 렌더될 때만 내려오므로 상시 비용은 CSS 21KB입니다. 그래도 **41편 중 1편의 3개 표현(그중 2개는 실패)을 위해 전역 21KB를 얹는 것**입니다.

**→ 확정 명세**

1. **KaTeX CSS를 전역으로 로드하지 마세요.** 렌더 결과 HTML에 `class="katex"`가 포함된 경우에만 **동적 import**합니다.
   ```ts
   if (html.includes('katex')) { await import('katex/dist/katex.min.css'); }
   ```
   프리렌더(§15) 시에도 같은 조건으로 해당 slug의 HTML에만 `<link>`를 넣습니다. → **40편은 0KB, 1편만 21KB**
2. **`throwOnError: false`를 명시**해 파싱 실패가 평문으로 떨어지는 현재 동작을 계약으로 고정합니다
3. 실패한 수식이 평문으로 나올 때 **본문 서체·색 그대로**여야 합니다 (별도 스타일 없음). 지금 그렇습니다
4. `.katex` 요소는 `--color-text-primary`, 블록 수식(`$$`)이 생기면 `overflow-x: auto` 래퍼 + 중앙 정렬 + `--color-bg-surface` 배경 (미래 대비, 지금은 발동 안 함)
5. **`markdown-it-math` 의존성 제거** (§1-4)

> **사용자 확인 필요 (Q-3-A)**: 이 3개 수식은 `$A ∪ B$` → `(A ∪ B)`로 md를 고치면 KaTeX 의존성을 **완전히** 없앨 수 있습니다(21KB + 플러그인 + 2.1MB 폰트 자산 전부). 시각적 결과는 오히려 **일관돼집니다**(3줄 모두 평문). 다만 「기존 41편 무수정 원칙」에 걸리므로 임의 판단하지 않았습니다.

### 7-2. 각주 — 실사용 0편

**41편에서 각주 정의(`[^1]:`)와 참조(`[^1]`) 모두 0회입니다.** 시안이 본문 예시에 그린 각주 블록은 **실제로 발동하지 않습니다.**

- **판정: 플러그인(`markdown-it-footnote`)은 유지, 스타일은 최소로만 명세.** 제거하지 않는 이유는 product.md가 "현행 지원 기능 유지 `[확정]`"로 못박았고, 플러그인 자체가 수 KB로 저렴하며, 글 발행 재개 시 쓰일 여지가 있기 때문입니다
- **명세 (발동 시)**
  ```css
  .content .footnotes { margin-top: var(--space-8); padding-top: var(--space-5);
                        border-top: 1px solid var(--color-border-default);
                        font-size: 13px; color: var(--color-text-muted); line-height: 1.75; }
  .content .footnotes ol { padding-left: var(--space-5); }
  .content .footnote-ref a { color: var(--color-status-info); font-size: 12px;
                             vertical-align: super; text-decoration: none; }
  .content .footnote-backref { color: var(--color-status-info); text-decoration: none; }
  ```
- 각주 섹션 앞에 **`각주` 라벨**(Galmuri11 `--fs-pixel-1`, `--color-text-secondary`)을 넣습니다 — `markdown-it-footnote`는 라벨을 만들지 않아 수평선 뒤에 번호 목록만 덩그러니 남습니다
- **각주 링크는 목차·진행바 계산에서 제외**해야 합니다 (§8-1)

### 7-3. 체크리스트 — 실사용 0편

**41편에서 `- [ ]` / `- [x]`는 0회입니다.** 각주와 동일하게 **플러그인 유지 + 최소 명세**로 처리합니다.

```css
.content .task-list-item { list-style: none; padding-left: 0; display: flex; gap: 10px; align-items: flex-start; }
.content .task-list-item input[type="checkbox"] { margin-top: 5px; accent-color: var(--color-accent-fill); }
.content .task-list-item input:checked + * { color: var(--color-text-muted); text-decoration: line-through; }
```

- 🔴 **체크박스는 `disabled`여야 합니다** — 읽기 전용 콘텐츠에서 조작 가능한 체크박스는 상태가 저장된다는 잘못된 기대를 만듭니다. `markdown-it-task-lists`의 기본값이 `disabled: true`이므로 옵션을 건드리지 마세요
- 시안은 체크박스를 `<label>`+커스텀 `<span>`으로 그렸습니다. **접근성상 실제 `<input type="checkbox" disabled>`를 쓰고 `accent-color`로 색만 맞추세요** — 커스텀 마크업은 스크린리더에 체크 상태를 전달하지 못합니다

---

## 8. 읽기 진행바 · 목차 계약

### 8-1. 진행바 계산 — 페이지 전체 스크롤 기준 [확정]

시안이 **"본문은 내부 스크롤 컨테이너가 아니라 페이지 전체 스크롤 기준"**으로 바꾼 것을 **확정 채택**합니다.
초안의 내부 스크롤 방식은 모바일 브라우저의 주소창 자동 숨김을 깨뜨리고, 스크롤 복원·딥링크 앵커가 전부 어긋납니다.

**계산 기준 (확정)**

```
시작점 = 본문 컨테이너의 문서상 top          (제목·메타·히어로는 제외)
끝점   = 본문 컨테이너의 문서상 bottom       (이전/다음·푸터는 제외)
진행률 = clamp(0, (스크롤위치 + 뷰포트높이×0.5 - 시작점) / (끝점 - 시작점), 1)
```

- **히어로·제목을 시작점에 넣지 않는 이유**: 넣으면 글을 열자마자 진행률이 8~15%로 시작해 "이미 읽었다"는 잘못된 신호를 줍니다
- **이전/다음·푸터를 끝점에 넣지 않는 이유**: 본문을 다 읽었는데 진행률이 80%면 남은 게 있다고 오인합니다. **본문 마지막 줄이 화면 중앙에 오면 100%**가 됩니다
- 뷰포트 절반(`×0.5`)을 더하는 이유: "읽고 있는 지점"은 화면 상단이 아니라 중앙입니다
- `aria-valuenow`는 **정수 퍼센트**. 값이 바뀔 때만 갱신 (매 스크롤 프레임마다 갱신하면 스크린리더가 폭주합니다)

### 8-2. 스크롤 이벤트 처리 — 확정: rAF 스로틀

| 후보 | 판정 | 이유 |
|---|---|---|
| **`scroll` + `requestAnimationFrame` 스로틀** | ✅ **채택** | 진행률은 **연속값**이라 프레임당 1회 갱신이 정확히 맞습니다 |
| `IntersectionObserver` | 🟡 **목차 활성 항목에만 병용** | 이산 이벤트(헤딩 진입/이탈)에 적합. 연속 진행률에는 부적합 |
| `setTimeout` throttle | ❌ 반려 | 프레임과 어긋나 진행바가 계단식으로 튑니다 |

```
scroll 리스너는 { passive: true } 필수
rAF 안에서 getBoundingClientRect() 1회만 호출 (읽기/쓰기 분리 — 레이아웃 스래싱 방지)
값이 바뀐 경우에만 state 갱신 (정수 퍼센트 비교)
진행바 폭은 state가 아니라 CSS 변수(--progress) 직접 조작 권장 — React 리렌더 회피
```

- 🔴 **시안 프로토타입은 4개 아트보드를 동시에 계산하느라 매 스크롤마다 `querySelectorAll`을 돌립니다. 실제 페이지에서 이 구조를 따라하지 마세요.** 헤딩 목록은 **마운트 시 1회 수집해 offsetTop 배열로 캐시**하고, 리사이즈·이미지 로드 시에만 재계산합니다
- 이미지가 늦게 로드되면 문서 높이가 변합니다 → **모든 `img`에 `width`/`height`를 주어(§11-2) 애초에 높이가 변하지 않게 하는 것이 최선의 대응**입니다

### 8-3. 목차 수집 규칙 [확정]

| 항목 | 확정 |
|---|---|
| **수집 대상** | `h2`, `h3` (§2-2 근거) |
| **h4 포함?** | ❌ **제외.** 4편만 쓰고, 넣으면 최대 항목 수가 더 늘어납니다 |
| **수집 방법** | 🔴 **렌더된 DOM에서 `container.querySelectorAll('h2, h3')`** — 마크다운 토큰이 아니라 DOM. 원시 HTML `<h2>` 8개(§5-4)를 놓치지 않기 위해서입니다 |
| **본문 `h1`** | `h2`로 강등 후 포함 (§5-5) |
| **라벨** | 🔴 **`heading.textContent`** — 헤딩 안의 마크다운이 이미 HTML로 렌더된 상태이므로 `textContent`가 자동으로 순수 텍스트를 줍니다 |
| **들여쓰기** | `h3`는 `padding-left`를 한 단계(+12px) 더 |

> 🔴 **라벨에 `innerHTML`을 쓰면 안 되는 실증 사례** — 최장 헤딩(101자)이 이렇습니다:
> ```
> ### 1.1 WebXR Device API 기술 개요 ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API))
> ```
> `innerHTML`을 그대로 넣으면 **목차 링크(`<a>`) 안에 또 다른 링크(`<a>`)가 생깁니다.** 중첩 `<a>`는 유효하지 않은 HTML이고 브라우저가 임의로 교정해 클릭 대상이 예측 불가가 됩니다. **`textContent` 필수.**
> WRITING_GUIDE §6.10의 "항목은 본문 heading 원문 그대로, 요약·변형 금지"와도 일치합니다 — 링크 마크업 제거는 변형이 아니라 평문화입니다.

### 8-4. 목차 활성 항목 판정 [확정]

```
활성 = "현재 뷰포트 상단 기준선(top: 160px)을 마지막으로 통과한 헤딩"
```

- 여러 헤딩이 동시에 화면에 있어도 **활성은 항상 정확히 하나**입니다 (기준선을 통과한 것 중 마지막)
- **첫 헤딩보다 위에 있을 때**: 활성 없음. 아무 항목도 강조하지 않습니다 (시안은 무조건 0번을 활성으로 두는데, 도입부를 읽는 중에 첫 섹션이 강조되면 거짓 정보입니다)
- **마지막 헤딩을 지난 뒤**: 마지막 항목 유지
- 기준선 160px = 헤더(48) + 진행바(3) + `scroll-margin-top` 여유와 맞춥니다. 모바일은 120px

**시각 표현**

| 상태 | 색 | 좌측 바 |
|---|---|---|
| 기본 | `--color-text-secondary` | `scaleY(0)` |
| 호버 | `--color-text-primary` | `scaleY(0)` |
| **활성** | `--color-accent-text` | `scaleY(1)`, 2px, `--color-accent-text` |
| 포커스 | `--color-focus-ring` 2px 아웃라인 | — |

- 🔴 **활성 표시를 색에만 의존하지 마세요** (§7.5). 좌측 바가 색 외 단서입니다. 추가로 활성 항목에 **`aria-current="location"`**을 부여하세요
- 목차 `<nav>`에 `aria-label="목차"` (WRITING_GUIDE §6.10 — `INDEX`/`Contents` 금지)

### 8-5. 🔴 항목이 많은 글 · 헤딩이 긴 글

**실측 최악값**

| 지표 | 값 | 해당 글 |
|---|---:|---|
| 목차 항목 최대 | **23개** | `2023-02-02-Python-implementation-bruteforce` |
| 2위 | 21개 | `2023-01-30-Python-dfs-bfs` |
| 3위 | 20개 | `2023-01-10-Python-if-for-while` |
| **헤딩 최장** | **101자** | `2025-03-13-ux-trends…` (§8-3 인용) |
| 헤딩 최장 (링크 제외) | 52자 | `2024-09-04-mongodb-local` |

23개 × 36px ≈ **828px** — 대부분의 노트북 뷰포트보다 깁니다. 시안은 3개짜리 목차만 그려 이 상황을 검증하지 못했습니다.

**→ 확정 명세**

```css
.toc-list {
  max-height: calc(100vh - var(--header-h-desktop) - 3px - 200px);
  overflow-y: auto;
  overscroll-behavior: contain;   /* 목차 끝에서 페이지가 함께 스크롤되지 않게 */
}
.toc-item {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;               /* 101자 헤딩 → 2행에서 자름 */
  word-break: keep-all;           /* 한글 단어 중간 절단 방지 */
}
```

- `200px`는 목차 라벨 + 진행률 카드 + `맨 위로` 버튼의 예약 높이입니다
- **활성 항목이 목차 스크롤 영역 밖으로 나가면 목차 안에서만 스크롤해 보이게** 합니다 (`scrollIntoView({ block: 'nearest' })` — **`behavior`를 주지 마세요**, §9-1)
- 2행 클램프로 잘린 항목은 `title` 속성에 전체 텍스트 (툴팁). 단 **툴팁에만 있는 정보는 아니므로** 허용됩니다 (§6.6 — 목적지는 클릭하면 알 수 있음)

### 8-6. 모바일 목차 — 플로팅 버튼 + 바텀시트 [채택]

**플로팅 버튼**

- `position: sticky; bottom: 16px`, 우측 정렬, `--z-sticky`보다 위 (`--z-dropdown` 권장)
- 높이 **48px** (`--tap-min` 44px 이상 ✅), `--radius-pill`
- 배경 `--color-bg-elevated`, 보더 `--color-border-interactive`, `--shadow-md`
- 라벨 `≡ 목차 34%` — `≡`는 `aria-hidden`, 퍼센트는 `--color-text-muted`
- `aria-label="목차 열기"` + **`aria-expanded`** (WRITING_GUIDE §6.10) + `aria-controls`
- **목차가 없는 글에서는 버튼이 나타나지 않습니다**

**바텀시트**

- `position: fixed; inset: 0`, 배경 `--color-bg-overlay`, `--z-modal`
- 시트: 하단 정렬, `--color-bg-raised`, 상단 라운드 `--radius-xl --radius-xl 0 0`, `--shadow-lg`
- 항목 높이 **최소 48px** (`--tap-min` 초과 ✅), 활성 배경 `--color-accent-subtle`
- 닫기 버튼 44×44, `aria-label="목차 닫기"`
- 🔴 **포커스 트랩 필수** — 열리면 시트 안으로 포커스 이동, 닫히면 **버튼으로 복귀**. `Esc`로 닫힘 (시안이 `Esc` 처리를 넣은 것은 채택)
- 🔴 **시트가 열린 동안 배경 스크롤 잠금** (`overflow: hidden` on body + 스크롤바 폭 보정)
- 항목을 누르면 **시트를 먼저 닫고 나서 스크롤**합니다 (시안 동작 채택)
- 🔴 **시트 자체도 항목이 23개면 넘칩니다** → `max-height: 70vh; overflow-y: auto`

---

## 9. 🔴 `prefers-reduced-motion` 대응

### 9-1. 시안 판정 — 정정

**PM 확인("0회 검출")은 문자열 기준으로는 맞지만, 결론은 정정이 필요합니다.**

시안은 `@media (prefers-reduced-motion: reduce)`를 쓰지 않았습니다. 그러나 프로토타입 상단에 **「모션 감소 미리보기」 수동 토글**을 두고, `rm` 상태를 **모든 모션 값에 실제로 배선**했습니다 — `trInstant`/`trBase`/`trSlow`/`animFade`/`skelAnim`과 `scrollIntoView({ behavior: rm ? 'auto' : 'smooth' })`까지.

**→ 판정: 시안은 저감 모션을 설계했고, 미디어쿼리에 연결만 하지 않았습니다.** (Claude Design 캔버스에서는 미디어쿼리를 시연할 수 없어 토글로 대체한 것으로 보입니다.) **설계를 새로 만드는 게 아니라 트리거를 바꾸면 됩니다.** 시안 주석의 문장 — *"진행바는 정보이므로 남고, 움직임만 즉시 반영으로 바뀝니다"* — 이 원칙을 그대로 채택합니다.

### 9-2. 모션 전수 목록과 저감 시 동작 [확정]

| # | 모션 | 기본 | **저감 모션일 때** | 근거 |
|---|---|---|---|---|
| 1 | **읽기 진행바 폭** | `transition: width 80ms linear` | **`transition: none`** — 값은 그대로 갱신 | 진행률은 **정보**입니다. 사라지면 안 되고, 보간만 없앱니다 |
| 2 | **목차 활성 전환** (색·좌측 바) | `160ms ease-out` / 바 `240ms` | **`transition: none`** — 즉시 전환 | 활성 표시는 정보. 즉시 바뀌어도 완전히 기능합니다 |
| 3 | **목차 점프 스크롤** | `scrollIntoView({ behavior: 'smooth' })` | 🔴 **`behavior: 'auto'` (즉시 이동)** | 부드러운 스크롤은 전정기관 자극의 대표 원인입니다 |
| 4 | **`맨 위로` 스크롤** | `behavior: 'smooth'` | 🔴 **`behavior: 'auto'`** | 위와 동일. 이동 거리가 가장 길어 영향이 가장 큽니다 |
| 5 | **`scroll-behavior: smooth`** (CSS) | 적용 | 🔴 **`scroll-behavior: auto`** | CSS 전역 설정도 반드시 함께 꺼야 합니다 — JS만 고치면 앵커 링크가 여전히 부드럽게 스크롤됩니다 |
| 6 | **`맨 위로` 버튼 등장** (`fadeUp`) | `fadeUp 160ms` | **`animation: none`** — 즉시 표시 | 등장 자체는 유지 |
| 7 | **바텀시트 슬라이드업** | `fadeUp 160ms` | **`animation: none`** — 즉시 표시 | 시트는 여전히 열립니다 |
| 8 | **로딩 스켈레톤 shimmer** | `shimmer 1.4s linear infinite` | 🔴 **`animation: none`** + **정적 배경**(`--color-bg-raised`) | 무한 반복 애니메이션은 저감 모션에서 가장 문제가 큽니다 |
| 9 | **복사 버튼 상태 전환** | `all 160ms ease-out` | **`transition: none`** | 상태 자체는 유지 |
| 10 | **코드블록·태그 호버** | `160ms` | **`transition: none`** | |
| 11 | **본문 GIF 4개** | 자동 재생 | 🟡 §11-3 | |

### 9-3. 구현 계약

**① CSS — 전역 안전망**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- `0`이 아니라 `0.01ms`인 이유: `transitionend`/`animationend` 이벤트에 의존하는 코드가 있으면 `0`에서는 이벤트가 발화하지 않아 깨집니다
- 🔴 **`html { scroll-behavior: smooth }`를 쓴다면 위 블록 안에 `auto` 재정의가 반드시 있어야 합니다.** `!important`가 붙은 이유입니다

**② JS — 미디어쿼리를 읽어야 하는 것**

CSS로 못 고치는 것은 `scrollIntoView`의 `behavior` 인자뿐입니다.

```ts
const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scrollBehavior: ScrollBehavior = prefersReduced() ? 'auto' : 'smooth';
```

- 🔴 **호출 시점마다 새로 읽으세요.** 모듈 로드 시 한 번 읽어 캐시하면 사용자가 OS 설정을 바꿔도 반영되지 않습니다
- 훅으로 뽑아 목차 점프·맨 위로·목차 내부 스크롤 3곳에서 공용

**③ 스켈레톤 — CSS만으로는 부족**

전역 안전망이 `animation-duration`을 0.01ms로 만들면 shimmer가 **그라데이션의 임의 위치에서 멈춥니다** — 얼룩진 회색 덩어리가 됩니다.

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton { background: var(--color-bg-raised); animation: none; }
}
```

**그라데이션 자체를 단색으로 교체**해야 합니다. 이 규칙은 전역 안전망 **뒤에** 와야 합니다.

---

## 10. 데이터 계약 — 시리즈 · 이전/다음

### 10-1. 시리즈 [확정: 별도 목록 파일]

**전제**: product-planner 판정대로 시리즈 전용 페이지는 없고, **글 상세 내 컴포넌트로만** 다룹니다 (실제 시리즈 3건). §4-5의 UI가 이 전제와 정확히 맞습니다.

**후보 3안을 실데이터로 검증했습니다.**

| 안 | 41편 무수정? | 판정 |
|---|---|---|
| A. 프론트매터에 `series`/`seriesIndex` 신설 | ❌ 6개 파일 수정 | **반려** — 무수정 원칙 위반 |
| B. **파일명 숫자 접미 규칙** | ✅ | 🔴 **반려 — 실데이터에서 오작동** |
| C. **별도 목록 파일** | ✅ | ✅ **채택** |

**B를 반려하는 실증 근거** — 파일명이 숫자로 끝나는 6개를 뽑으면:

| 파일 | 규칙이 추출하는 base | idx | 실제로 시리즈인가 |
|---|---|---:|---|
| `Wanted-pre-onboarding-01` | `Wanted-pre-onboarding` | 01 | ✅ (단독 1편) |
| `ReactQuery-State-StateManagement-01` | `ReactQuery-State-StateManagement` | 01 | ✅ |
| `ReactQuery-State-StateManagement-02` | 〃 | 02 | ✅ |
| `ux-trends-and-spatial-computing-paradigm-1` | `ux-trends-and-spatial-computing-paradigm` | 1 | ✅ |
| `ux-trends-and-spatial-computing-paradigm-2` | 〃 | 2 | ✅ |
| 🔴 **`Python-Prefix-sum-5`** | `Python-Prefix-sum` | **5** | ❌ **아님** |

`2023-04-13-Python-Prefix-sum-5.md`의 제목은 **`[Python]백준 : 11660 구간 합 구하기 5`** — `5`는 **백준 문제 이름의 일부**입니다. 파일명 규칙은 이 글을 "5편 중 5편"인 단독 시리즈로 만들고, 같은 base를 갖는 `Python-Prefix-sum-reminder`와 엮으려 시도합니다. **규칙이 조용히 틀린 UI를 만들어냅니다.**

**→ 확정: `public/_series.json`**

```json
[
  {
    "id": "react-query-state",
    "title": "React Query와 상태 관리",
    "posts": [
      "2023-01-13-ReactQuery-State-StateManagement-01",
      "2023-01-13-ReactQuery-State-StateManagement-02"
    ]
  },
  {
    "id": "spatial-uxui",
    "title": "Spatial UX/UI와 웹의 패러다임 시프트",
    "posts": [
      "2025-03-13-ux-trends-and-spatial-computing-paradigm-1",
      "2025-03-14-ux-trends-and-spatial-computing-paradigm-2"
    ]
  },
  {
    "id": "wanted-preonboarding",
    "title": "원티드 프리온보딩 챌린지",
    "posts": ["2023-01-11-Wanted-pre-onboarding-01"]
  }
]
```

| 규칙 | 확정 |
|---|---|
| 위치 | `public/_series.json` (`generatePostsData.ts`가 읽어 `posts-data.json`에 `series` 필드로 병합) |
| **41편 md 수정** | **0건** ✅ |
| 순서 | 배열 순서가 곧 편 순서 (날짜순 추론 금지 — 저자 의도가 우선) |
| slug 검증 | 🔴 **빌드 시 존재하지 않는 slug가 있으면 빌드를 실패시키세요.** 조용히 무시하면 시리즈가 소리 없이 사라집니다 |
| 소속 검증 | 🔴 **한 글이 두 시리즈에 속하면 빌드 실패** |
| 유지 비용 | 새 시리즈 글 발행 시 **JSON 한 줄 추가** |
| 표기 | `시리즈 · <전체>편 중 <현재>편` (WRITING_GUIDE §3.4 숫자 표기) |

### 10-2. 이전 / 다음 [확정: 전체 날짜순]

| 후보 | 판정 |
|---|---|
| **전체 글 날짜 내림차순** | ✅ **채택** |
| 같은 카테고리 내 | ❌ 반려 — `Activity`는 **2편뿐**입니다. 그 2편은 서로가 유일한 이웃이 되고, 나머지 39편과의 연결이 끊깁니다 |

**정의**

```
정렬:  date DESC,  동률이면 slug ASC       ← 타이브레이커 필수
이전 글 = 정렬에서 바로 다음 항목  (더 오래된 글)
다음 글 = 정렬에서 바로 앞 항목    (더 최신 글)
```

- 🔴 **동일 날짜가 8개 있습니다** (`2023-04-13`, `2023-02-26`, `2023-01-30`, `2023-01-13`, `2023-01-10`, `2023-01-08` 등). 타이브레이커가 없으면 **빌드마다 순서가 바뀌어** 프리렌더된 이전/다음 링크가 흔들립니다. `slug ASC` 고정 필수
- **경계**
  - 최신 글 `2025-05-26-the-era-of-client-side-ai…` → **`다음 글` 칸 없음** (§4-6대로 제거)
  - 최고(最古) 글 `2022-12-26-…` → **`이전 글` 칸 없음**
- **라벨 방향 확인**: `이전 글` = 더 **오래된** 글입니다. 시간을 거슬러 올라가는 것이 블로그의 관례이고, 브레드크럼/목록 정렬(최신순)과 일관됩니다

> **시안의 오류**: 최신 글(`client-side-ai`, 2025-05-26)에 `다음 글 → MongoDB.local(2024-09-04)`이 붙어 있습니다. **최신 글에는 다음 글이 없고**, 2024년 글이 2025년 글의 "다음"이 될 수도 없습니다. §13-2 참조

### 10-3. 읽기 시간 [확정 공식]

메타에 `6분`을 표시하려면 계산 규칙이 필요합니다. **프론트매터에 읽기 시간 필드가 없습니다.**

```
분 = round( 산문공백제외글자수 / 500  +  코드줄수 / 30  +  이미지수 × 5초/60 )
최소 1분
```

- 산문에서 코드펜스와 이미지 마크업은 제외
- 한국어 기술 문서 묵독 500자/분, 코드 30줄/분(정독 아닌 훑기), 이미지 5초

**41편 적용 결과**

| 지표 | 값 |
|---|---:|
| 최소 | 1분 |
| 중앙값 | 4분 |
| 평균 | 6.3분 |
| **최대** | **26분** (`client-side-ai`) |

- **0분이 나오는 글은 없습니다** (최소 1분 보장 전)
- 🔴 **시안의 `6분`은 실데이터와 맞지 않습니다.** 시안이 6분을 붙인 글(`client-side-ai`)은 21,040자 · 코드 237줄 · 이미지 12장으로 **26분**입니다. 시안 수치를 그대로 옮기지 마세요
- **UI는 최대 2자리 수(`26분`)를 견뎌야 합니다.** 메타 행이 `Survey · 2025.05.26 · 26분`으로 길어져도 모바일 390px에서 줄바꿈되지 않게 `flex-wrap: wrap` + `white-space: nowrap`(각 조각)

---

## 11. 본문 이미지 (25편 · 113장 · 85.7MB)

### 11-1. 매트 구조 [확정]

렌더 후 모든 `.content img`를 아래 구조로 감쌉니다.

```html
<figure class="figure">
  <div class="matte">
    <img src="…" alt="…" loading="lazy" decoding="async" width="…" height="…">
  </div>
  <figcaption>…</figcaption>   <!-- alt가 비어 있지 않을 때만 -->
</figure>
```

색·간격은 §2-3 확정표. 추가 규칙:

- `img { display: block; width: 100%; height: auto; border-radius: var(--radius-md); }`
- `figcaption`: 13px, `--color-text-muted`, `margin-top: --space-2`, `line-height: 1.6`
- 🔴 **`figcaption`은 `alt`를 복제하는 것이므로, 캡션을 렌더하면 그 `img`의 `alt`는 `""`로 비우세요.** 안 그러면 스크린리더가 같은 문장을 두 번 읽습니다 (WRITING_GUIDE §7.1)
- `alt`가 없거나 빈 이미지는 캡션 없이 `alt=""` + `role="presentation"`

### 11-2. 🔴 성능 · CLS — 85.7MB

**실측**

| 항목 | 값 |
|---|---:|
| 총 용량 | **85.7 MB** / 113장 |
| 1MB 초과 | **24장** |
| **최대** | **5.64 MB** (`2024-09-04-mongodb-local/10.jpeg`) |
| 최악의 글 | `mongodb-local` — 13장, 합계 약 40MB |

`mongodb-local` 한 편을 여는 데 **40MB**입니다. 모바일 LTE에서 수십 초입니다.

**→ 확정 요구사항**

| # | 요구 | 담당 |
|---|---|---|
| 1 | 🔴 **모든 `img`에 `loading="lazy"` + `decoding="async"`** | frontend |
| 2 | 🔴 **모든 `img`에 `width`/`height` 속성** — CLS 방지의 유일한 확실한 수단 | 빌드 스크립트 |
| 3 | 🔴 **빌드타임에 이미지 실제 크기를 읽어 `posts-data.json`에 기록** — `image-size` 등으로 slug별 `{src, w, h}` 맵 생성. 런타임에 알 방법이 없습니다 | `generatePostsData.ts` |
| 4 | 🟡 **빌드타임 리사이즈 + WebP 변환 권고** — 본문 최대 폭이 640px(2x = 1280px)인데 원본이 4000px급입니다. **1280px 상한 + WebP면 85.7MB → 5MB 미만**이 현실적입니다 | 별도 태스크 (이번 범위 밖, §17에 남김) |
| 5 | 첫 화면 이미지(히어로)만 `loading="eager"` + `fetchpriority="high"` | frontend |

- **`width`/`height`가 없으면 §8-2의 진행바가 이미지 로드마다 재계산되어 튑니다.** 성능만의 문제가 아니라 기능 문제입니다
- `img`에 `max-width: 100%`와 `height: auto`를 함께 주어 속성값이 반응형을 깨지 않게 합니다

### 11-3. GIF 4장 — 저감 모션

| 파일 | 용량 |
|---|---:|
| `client-side-ai/06.gif` | 1.15 MB |
| `client-side-ai/03.gif` | 0.88 MB |
| `client-side-ai/09.gif` | 0.71 MB |
| `Skeleton-loading/skeleton-loading.gif` | 0.21 MB |

- **애니메이션 GIF는 `prefers-reduced-motion`으로 멈출 수 없습니다** (CSS가 닿지 않음)
- **이번 범위에서는 조치하지 않습니다.** 4장뿐이고, 전부 "동작을 보여주는 것"이 콘텐츠의 목적입니다. 정지시키면 정보가 사라집니다
- **§17 열린 항목으로 기록**: 향후 `<video>`(`autoplay` + `muted` + `playsinline`)로 전환하면 저감 모션에서 자동 정지 + 재생 버튼 제공이 가능하고 용량도 1/5로 줄어듭니다

---

## 12. 상태

### 12-1. 로딩

시안의 스켈레톤을 채택합니다. 카피는 WRITING_GUIDE §6.4 준수.

- 🔴 **스켈레톤이 있으면 텍스트를 넣지 않습니다** (§6.4). **시안의 `불러오는 중…` 텍스트는 스켈레톤과 중복이므로 제거**하세요
- 스켈레톤이 예약해야 하는 자리: 히어로 · 제목 2행 · 메타 1행 · 태그 3개 · 본문 7행 · **목차 컬럼**
- **목차 자리까지 예약하는 시안의 처리는 옳습니다** — 예약하지 않으면 로드 완료 시 본문이 좌측으로 밀립니다(CLS)
- 스켈레톤 컨테이너에 `aria-busy="true"`, 개별 조각은 `aria-hidden="true"`
- 저감 모션 처리는 §9-3-③

**정적 프리렌더(§15)를 하면 로딩 상태는 거의 보이지 않습니다.** 그래도 클라이언트 라우팅 전환 시 필요하므로 구현합니다.

### 12-2. 에러

WRITING_GUIDE §6.3 확정 카피와 시안이 **정확히 일치합니다.** 그대로 갑니다.

| 요소 | 확정 |
|---|---|
| 제목 | **`글을 불러오지 못했어요`** |
| 설명 | **`잠시 후 다시 시도해 주세요.`** |
| 액션 1 (주) | **`다시 시도`** — 골드 채움 버튼 |
| 액션 2 | **`글 목록으로`** — 보조 버튼 |
| 그래픽 | Galmuri11 `?` 66px (`--fs-pixel-6`), 색 `--color-border-strong` |
| 하단 | 실패한 경로 표시 (GalmuriMono11 11px, `--color-text-muted`) |

- ✅ 사과하지 않음 · 기술 용어 없음 · 회복 경로 2개 — 전부 통과
- 🔴 **`다시 시도`가 실제로 재시도해야 합니다.** 현재 코드처럼 홈으로 보내면 안 됩니다 (§1-2)
- 에러 영역에 `role="alert"`
- **존재하지 않는 slug는 이 화면이 아니라 404(STEP 5)로 보냅니다.** 두 상황의 카피가 다릅니다 (§6.3: `찾는 글이 없어요` vs `글을 불러오지 못했어요`)

### 12-3. 이미지 로드 실패

product.md가 요구한 상태입니다. 시안에 없습니다.

- `onerror` 시 `figure`를 **매트만 남기고** 안에 `--color-text-muted` 13px로 **`이미지를 불러오지 못했어요`** 표시
- 깨진 이미지 아이콘을 그대로 노출하지 마세요
- `alt`가 있으면 그 텍스트를 함께 보여줍니다 (정보 보존)

---

## 13. 실데이터 견딤 검증 — 시안 「콘텐츠 변형」 판정

### 13-1. 시안이 제대로 다룬 것 ✅

| 케이스 | 시안 | 판정 |
|---|---|---|
| **최장 제목** | `LONG_TITLE` 상수 | ✅ **실제 96자 제목을 문자 단위까지 정확히 사용했습니다.** 아래 인용과 완전 일치 확인 |
| 태그 15개 | `TAGS15` + `3개 + "+12"` 접기 | ✅ 개수 정확 (태그 문자열은 가공값이나 UI 검증엔 무해) |
| 목차 없음 | 진행률 대체 카드 | ✅ 방향 채택 (편수만 수정 — §2-2) |
| 단독 시리즈 1편 | `시리즈 · 1편 중 1편` | ✅ `Wanted-pre-onboarding-01`을 정확히 지목 |
| 로딩 / 에러 | 스켈레톤 / 회복 경로 2개 | ✅ |

**시안이 사용한 최장 제목 (실제 원문, 96자)**

> **2025 이전 UX/UI 트렌드 정리와 향후 Spatial UX/UI가 가져올 웹 개발의 패러다임 시프트 - WebXR: 공간적 웹 경험과 2025 미래 기술 전망 (2부)**

- 데스크톱 34px / 모바일 26px 기준 **모바일에서 약 8행**입니다
- **클램프하지 마세요.** 글 제목은 전문이 보여야 합니다 (§6.11 "원문 그대로"). 2행 클램프는 **목록·이전/다음 카드에만** 적용합니다
- `word-break: keep-all` 필수 — 한글 단어 중간에서 잘리면 가독성이 급락합니다

### 13-2. 🔴 시안이 실데이터를 못 견디는 지점

| # | 시안 | 실데이터 | 조치 |
|---|---|---|---|
| 1 | **시리즈가 아닌 글에 시리즈 블록** | `client-side-ai`는 어느 시리즈에도 속하지 않음 | §4-5 — 시리즈 없으면 **블록 자체가 없음** |
| 2 | **읽기 시간 `6분`** | 실제 **26분** | §10-3 공식 사용 |
| 3 | **최신 글에 `다음 글` 존재** | `2025-05-26`이 최신 — 다음 글 없음 | §10-2 — 칸 제거 |
| 4 | **`다음 글`이 더 오래된 글** | `MongoDB.local`은 2024-09-04 | §10-2 정렬 정의 |
| 5 | **목차 3개만 검증** | 최대 **23개** | §8-5 높이 제한 |
| 6 | **짧은 목차 라벨만 검증** | 최장 **101자** + 링크 포함 | §8-3 `textContent` + §8-5 2행 클램프 |
| 7 | **각주·체크리스트·수식을 본문에 그림** | 각주 0편 · 체크리스트 0편 · 블록수식 0편 | §7 — 스타일은 남기되 기본 화면 기준이 아님 |
| 8 | **중첩 목록·수평선·표를 얕게 다룸** | 중첩 25편 · 수평선 16편 · 표 8편 | §5-3 |
| 9 | **히어로에 이모지** | 이모지 필드 없음 | §4-3 — 그라데이션만 |
| 10 | **`링크가 복사됐어요`** | WRITING_GUIDE §6.12는 `복사됨` | §4-7 |
| 11 | **`불러오는 중…` + 스켈레톤 동시** | §6.4는 "스켈레톤이 있으면 텍스트 불필요" | §12-1 |
| 12 | **저자 표시 없음** ✅ / 현재 코드는 표시 | §6.7 "저자 표시하지 않음" | 현재 코드에서 제거 |

---

## 14. 토큰 검증

### 14-1. ✅ 신규 토큰이 필요 없는 것 — 시안이 기존 토큰을 쓴 자리

**시안이 신택스 색을 지어냈다고 오해하기 쉽지만, 전부 STEP 1 토큰의 재사용입니다.**

| 시안 변수 | 라이트 | 다크 | = STEP 1 토큰 |
|---|---|---|---|
| `S.key` | `#6b4a86` | `#c39ad9` | **`--color-status-accent`** |
| `S.str` | `#1f7a3a` | `#6fcf7c` | **`--color-status-success`** |
| `S.op` | `#1a6d99` | `#5fb8e6` | **`--color-status-info`** |
| `S.fn` | `#7d5c0e` | `#ffd770` | `--color-accent-text`(L) / `--color-accent-hover`(D) |
| `S.cm` | `#5a6072` | `#7f8aa8` | **`--color-text-muted`** |
| `S.pl` | `#2b3145` | `#cfd5e4` | **`--color-text-body`** |
| `matBd` | `#ddd8cc` | `#2d3551` | `--color-border-default`(L) / `--color-border-strong`(D) |
| `badgeFg` | `#f4ecd2` | `#ffd770` | (다크 text-primary) / `--color-accent-hover` |

- `S.fn`만 모드별로 다른 토큰을 참조합니다. **`--color-accent-text`로 통일하세요** — 다크에서 `#e6a536`이 되어 13.52 → 11.4:1로 여전히 넉넉히 통과하고, 토큰 하나로 단순해집니다
- **`quoteFg`(`#4a3a12`/`#e8d9b0`)는 폐기하고 `--color-text-body`를 쓰세요** — 대비 실측상 실질 차이가 없습니다 (§5-3)

> ## ✅ 승격 판정 완료 (2026-08-01 · STEP 1 담당)
>
> **전문은 `handoff-step1-shell.md` §3-1a.** 요약: **1·2·3·4·5·8 채택**(이름 3건 정정), **6·7 반려**(제안자 판단과 동일).
>
> | 제안 | 확정 |
> |---|---|
> | 1 `--color-code-bg` | **`--color-bg-code`** — 기존 `--color-bg-*` 계열에 편입 |
> | 2 `--color-code-header-bg` | **`--color-bg-code-header`** |
> | 3 `--fs-article-h1…h4` | **그대로 채택.** `tokens.css`에 둠(글 상세·작업 상세 공용) |
> | 4 `--gradient-hero-*` | **`--gradient-thumb-from` / `-to` 2종으로 축소.** §14-2 아래 참조 |
> | 5 스켈레톤 2종 | **그대로 채택** |
> | 8 `--scroll-offset` | **채택.** 헤더 파생값이므로 STEP 1 소유 |
>
> **4번을 축소한 이유**: 이름의 `hero`는 홈 히어로(별자리)를 가리켜 오해를 부릅니다. 실제 용도는 **썸네일 매트**입니다. 그리고 사용자가 *"썸네일 41편 전량 생성 그래픽 통일"*을 확정했으므로 **카테고리별 3종 분기의 전제가 사라졌습니다.** 지금은 `from`/`to` 2종으로 시작하고, 확정된 플레이스홀더 조형이 카테고리 변주를 요구하면 그때 확장하세요 — **값을 지어내지 않기 위해서**입니다.

### 14-2. 🟡 STEP 1에 없는 값 — 신규 토큰 **제안** (승격은 STEP 1 담당 결정)

| # | 시안 값 | 라이트 | 다크 | 제안 |
|---|---|---|---|---|
| 1 | 코드블록 배경 | `#f4f1e8` | (= `--color-bg-surface`) | **`--color-code-bg`** 신설 제안. 라이트에서 `bg-surface`(#f7f5ef)보다 약간 어두워 코드 덩어리를 구분하려는 의도가 명확합니다 |
| 2 | 코드블록 헤더 | `#eae6d9` | (= `--color-bg-raised`) | **`--color-code-header-bg`** 신설 제안. 1과 세트 |
| 3 | 본문 헤딩 스케일 | 34/25/20/17px (데스크톱) | 동일 | **`--fs-article-h1…h4`** 축 신설 제안. STEP 1 축 B(11~21px)는 UI용이라 본문 헤딩을 담지 못합니다 |
| 4 | 히어로 그라데이션 | `#e0b768`→`#f2d79a` | `#7a5210`→`#e6a536` | **`--gradient-hero-*`** 또는 카테고리별 3종. 썸네일 없는 17편에 필요 |
| 5 | 스켈레톤 그라데이션 | `#e8e4da`/`#f3f0e8` | `#131a2c`/`#1c2440` | **`--color-skeleton-base` / `--color-skeleton-sheen`**. 전 화면 공용이므로 STEP 1 소관이 맞습니다 |
| 6 | 좌우 패딩 `36px` | — | — | ❌ **신규 불필요.** `--space-8`(32px)로 치환 (§3-1) |
| 7 | `1.6초` 복사 원복 | — | — | ❌ **반려.** WRITING_GUIDE §6.12가 **1.4초** 확정 |
| 8 | `120px` scroll-margin | — | — | 🟡 `--scroll-offset` 제안 (헤더 높이 파생값이라 STEP 1이 소유하는 게 맞음) |

**1·2·5는 전 화면 공용이므로 STEP 1로 올리는 것을 권합니다. 3은 글 상세·작업 상세 전용이므로 이 STEP이 소유해도 무방합니다.**

### 14-3. ❌ 반드시 고쳐야 하는 토큰 오용

| 시안 | 문제 | 확정 |
|---|---|---|
| `matBg` 다크 = `#f4ecd2` | **`--color-text-primary`(텍스트 토큰)를 배경으로 전용** + 눈부심 목적과 모순 | `--color-bg-raised` (§2-3) |
| `badgeFg` 라이트 = `#f4ecd2` | 동일 (다크 text-primary 값을 라이트 배지 전경으로) | 오버레이 위 전경이므로 **`--color-text-primary`의 다크 값이 필요한 자리**입니다. STEP 1에 `--color-text-onOverlay` 신설 제안 |

---

## 15. URL · 메타 · OG

### 15-1. URL [확정]

```
/posts/<slug>          slug = md 파일명에서 .md 제거, 소문자화, 날짜 접두 유지
예: /posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer
```

- 🔴 **현재 `?id=` 쿼리 방식에서 전환** (§1-1)
- **41개 전부 빌드타임 프리렌더** — 404 폴백만으로는 OG 미리보기가 원리상 불가능합니다 (agent-log 확정)
- 대소문자: 기존 파일명에 대문자가 섞여 있습니다(`React-Navigation`). **소문자 slug를 정본으로 하고, 대문자 요청은 소문자로 301/클라이언트 리다이렉트**하세요. 정적 호스팅이므로 프리렌더 시 소문자 경로만 생성

### 15-2. 필수 메타 태그 (slug별)

WRITING_GUIDE §6.13 기준.

| 태그 | 값 |
|---|---|
| `<title>` | **`<글 제목> · 섭우.log`** — 60자 초과 시 **글 제목 쪽을 자름**(사이트명 유지) |
| `meta[name=description]` | 글 요약 80~110자 |
| `meta[property=og:title]` | 글 제목 |
| `meta[property=og:description]` | 위와 동일 |
| `meta[property=og:type]` | `article` |
| `meta[property=og:url]` | 절대 URL |
| `meta[property=og:image]` | 절대 URL (§15-4) |
| `meta[property=og:image:width/height]` | `1200` / `630` |
| `meta[name=twitter:card]` | `summary_large_image` |
| `article:published_time` | ISO 8601 |
| `<link rel="canonical">` | 절대 URL |
| JSON-LD | `BlogPosting` (`headline`/`datePublished`/`author`/`image`/`keywords`) |

- 🔴 **`property=`를 쓰세요.** agent-log에 기록된 기존 결함이 `name=og:*`입니다 — OG 파서가 무시합니다
- SPA 라우팅 전환 시에도 `<title>`을 갱신해야 합니다 (§7.4)

### 15-3. description — 🔴 40/41편에 없음

**`description` 프론트매터가 있는 글은 1편뿐**(`client-side-ai`)입니다.

**→ 확정: 빌드타임 자동 추출.**

```
본문에서 코드블록·이미지·헤딩·인용을 제거
→ 첫 문단
→ 문장 경계(`. ` `다.` `요.` `습니다.`)에서 자름
→ 80~110자, 넘으면 문장 경계 + `…`
→ 프론트매터 description이 있으면 그것을 우선
```

- 🔴 **문장 중간에서 자르지 마세요** (WRITING_GUIDE §6.11)
- `generatePostsData.ts`가 `posts-data.json`에 `excerpt` 필드로 기록

### 15-4. OG 이미지 — **제안 수준**

| 안 | 비용 | 평가 |
|---|---|---|
| **A. 썸네일 있는 24편은 썸네일, 없는 17편은 공용 기본 이미지** | 낮음 | ✅ **초기 릴리스 권장** |
| B. 빌드타임 slug별 생성 (`satori`/`resvg` → 제목·카테고리·워드마크) | 중 | 🟡 2차. 글마다 다른 카드가 나와 공유 품질이 크게 오릅니다 |
| C. 런타임 생성 | — | ❌ **불가.** 정적 호스팅 |

- **A로 시작할 때 주의**: 썸네일 원본이 1200×630이 아닙니다. **빌드타임에 1200×630으로 크롭/레터박스한 OG 전용 파일을 따로 생성**하세요. 원본을 그대로 쓰면 잘리거나 여백이 생깁니다
- 공용 기본 이미지는 **워드마크 + 카테고리 그라데이션**으로 STEP 1 자산과 통일
- agent-log의 기존 결함(**OG 이미지가 `.ico`**)을 반드시 함께 수정

---

## 16. 접근성 체크리스트 (QA 인계)

| # | 항목 | 기준 |
|---|---|---|
| 1 | 본문 텍스트 대비 | ≥ 4.5:1 — 라이트 10.93 / 다크 13.02 ✅ |
| 2 | 코드 신택스 전 색 | ≥ 4.5:1 — 최저 4.76 ✅ (§2-4) |
| 3 | 링크 대비 | 라이트 4.82 / 다크 8.64 ✅ + **밑줄 병용**(색만으로 구분 금지) |
| 4 | 인라인 코드 | `--color-accent-text` 사용 확인 (`accent-fill`이면 라이트 2.14 ❌) |
| 5 | 터치 타깃 | 목차 플로팅 48px · 바텀시트 항목 48px · 닫기 44px ≥ `--tap-min` |
| 6 | 키보드만으로 전 과업 | 목차 점프 · 코드 복사 · 링크 복사 · 이전/다음 · 바텀시트 개폐 |
| 7 | 포커스 표시 | 모든 인터랙티브에 `--color-focus-ring` 2px + 오프셋 2px. **`outline: none` 금지** |
| 8 | 포커스 순서 | 헤더 → 브레드크럼 → 제목 → 태그 → 시리즈 → 본문 → 목차 → 이전/다음 → 푸터 |
| 9 | 바텀시트 | 포커스 트랩 · `Esc` 닫기 · 닫으면 트리거로 포커스 복귀 · 배경 스크롤 잠금 |
| 10 | `aria-live` | `복사됨`만 (기호 없이) · `polite` |
| 11 | 진행바 | `role="progressbar"` + `aria-valuenow` (정수, 변경 시에만) |
| 12 | 목차 | `<nav aria-label="목차">` + 활성 항목 `aria-current="location"` + **좌측 바(색 외 단서)** |
| 13 | 헤딩 구조 | 페이지 `h1` **정확히 1개** (본문 `h1` 22편 강등 확인 — §5-5) |
| 14 | 이미지 | 정보 이미지는 `alt` 서술 / 장식은 `alt=""` / **캡션과 `alt` 중복 금지** |
| 15 | 장식 글리프 | `➜ / ▸ · ← → ↑ ≡ #` 전부 `aria-hidden="true"` |
| 16 | 저감 모션 | §9-2의 11개 항목 전수 확인 — **특히 `scroll-behavior`와 스켈레톤** |
| 17 | 확대 200% | 가로 스크롤 없음 (코드·표는 자기 컨테이너 안에서만) |
| 18 | 링크 텍스트 | `cd ..`·`다음 편`에 접근가능한 이름 부여 확인 |

---

## 17. 구현 순서

| 단계 | 작업 | 선행 |
|---|---|---|
| 1 | `/posts/:slug` 라우팅 전환 + 에러 상태 (§1-1·§1-2·§12-2) | — |
| 2 | `markdown-it-anchor` 도입 · 본문 `h1` 강등 · `<script>` 제거 (§5-5·§5-6) | — |
| 3 | highlight.js 언어 6개 등록 + 토큰 매핑 (§6-2·§6-3) | STEP 1 토큰 |
| 4 | 마크다운 요소 전체 스타일 (§5-3) — **중첩 목록·표 래퍼·수평선 빠뜨리지 말 것** | STEP 1 토큰 |
| 5 | 이미지 매트 + `width`/`height` 빌드 주입 (§11) | `generatePostsData.ts` |
| 6 | 레이아웃·제목·메타·태그 (§3·§4-4) | STEP 1 셸 |
| 7 | 진행바 + 목차(데스크톱) (§8-1~8-5) | 2단계 |
| 8 | 모바일 바텀시트 (§8-6) | 7단계 |
| 9 | `_series.json` + 이전/다음 + 읽기 시간 (§10) | `generatePostsData.ts` |
| 10 | 저감 모션 전수 적용 (§9) | 7·8단계 |
| 11 | 프리렌더 + 메타/OG (§15) | 전체 |

**1~5단계는 디자인 확정 없이도 착수 가능합니다.**

---

## 18. 확정 카피 (이 화면 전체)

| 위치 | 확정 문구 | 근거 |
|---|---|---|
| 브레드크럼 목록 링크 | `cd ..` + `aria-label="글 목록으로"` | §7.2 |
| 메타 | `<카테고리> · <YYYY.MM.DD> · <N>분` | §6.7 |
| 태그 더보기 | `+<N>` / 접근명 `태그 <N>개 더 보기` / 펼침 후 `접기` | §6.8 |
| 목차 라벨 | `목차` | §6.10 |
| 목차 없음 (제목) | **`목차를 만들기엔 소제목이 적어요`** | §6.2 · 2026-08-01 정정 (구 `소제목이 없는 글이에요`는 사실 아님) |
| 목차 없음 (설명) | `대신 진행률로 위치를 알려드려요.` | §6.2 |
| 모바일 목차 버튼 | `목차 <N>%` + `aria-label="목차 열기"` / `"목차 닫기"` | §6.10·§7.3 |
| 맨 위로 | `맨 위로` + `aria-label="맨 위로 이동"` | §7.3 |
| 코드 복사 | `복사` → `복사됨` + `aria-label="코드 복사"` | §6.1 |
| 링크 복사 | `링크 복사` → **`복사됨`** | §6.12 |
| 시리즈 | `시리즈 · <전체>편 중 <현재>편` | §3.4 |
| 시리즈 다음 편 | `다음 편 — <다음 글 제목>` | §7.2 |
| 시리즈 단독 | `이어지는 편이 아직 없습니다` | §3.1 (읽히는 문장 → 합쇼체) |
| 이전/다음 | `이전 글` / `다음 글` | — |
| 각주 섹션 | `각주` | §6.10 준용 |
| 에러 제목 | `글을 불러오지 못했어요` | §6.3 |
| 에러 설명 | `잠시 후 다시 시도해 주세요.` | §6.3 |
| 에러 액션 | `다시 시도` / `글 목록으로` | §6.3 |
| 이미지 실패 | `이미지를 불러오지 못했어요` | §6.3 준용 |
| `<title>` | `<글 제목> · 섭우.log` | §6.13 |

**시안에서 정정한 3건**

| # | 시안 | 확정 | 근거 |
|---|---|---|---|
| 1 | `링크가 복사됐어요` | **`복사됨`** | §6.12가 `복사됨`으로 확정. 완료 라벨은 짧을수록 좋고, `aria-live` 문구와 동일해야 중복 낭독이 없습니다 |
| 2 | `불러오는 중…` (스켈레톤과 함께) | **삭제** | §6.4 "스켈레톤이 있으면 텍스트 불필요" |
| 3 | 복사 원복 1.6초 | **1.4초** | §6.12 명시값 |

**가이드 통과 확인**: 에러·빈 상태에 농담 없음(S1) ✅ · 영어 UI 라벨 없음 ✅ · 사과 없음 ✅ · 해요체(마이크로카피)/합쇼체(서술문) 구분 준수 ✅

---

## 19. 열린 항목 — 사용자·PM 확인 필요

| # | 항목 | 잠정값 | 영향 |
|---|---|---|---|
| **Q-3-A** | **KaTeX를 유지할지, md 3줄을 고쳐 제거할지** | 유지 + 조건부 로드 | 제거하면 의존성·21KB·2.1MB 폰트 자산이 전부 사라지고 **렌더 결과가 오히려 일관**됩니다. 「41편 무수정 원칙」과 충돌 (§7-1) |
| **Q-3-B** | **각주·체크리스트 플러그인 유지 여부** | 유지 | 41편 사용 0회. product.md가 "현행 기능 유지 `[확정]`"이라 임의 제거하지 않았습니다 |
| **Q-3-C** | **이미지 빌드타임 리사이즈/WebP 도입** | 미도입 | 85.7MB → 5MB 미만. 별도 태스크 규모라 이번 범위에서 뺐습니다 (§11-2-4) |
| **Q-3-D** | **`_series.json` 3건의 시리즈 제목** | 이 문서 §10-1 예시값 | UI에 노출되지 않고 내부 식별용이면 그대로 무방. 노출하려면 저자 확정 필요 |
| **Q-3-E** | **본문 `h1` 강등 구현 여부** | 강등함 | 강등하면 목차 없는 글이 **2편 → 1편**이 됩니다 (§5-5) |
| **Q-3-F** | **OG 이미지 A안/B안** | A (썸네일 + 기본 이미지) | B는 공유 품질이 크게 오르나 빌드 파이프라인 추가 (§15-4) |
| **Q-3-G** | **GIF 4장 `<video>` 전환** | 미전환 | 저감 모션 완전 대응 + 용량 1/5 (§11-3) |

**Q-3-A~C는 frontend 착수 전에 답이 있으면 좋고, 나머지는 구현 중 결정해도 됩니다.**

---

## 부록 A. 41편 실측 요약 (이 명세의 근거)

| 지표 | 값 |
|---|---:|
| 글 수 | 41 |
| 프론트매터 필드 | `layout`·`title`·`date`·`author`·`tags`·`categories` (41/41) · `description` (**1/41**) |
| 제목 길이 | 16 ~ **96**자 |
| 태그 수 | 1 ~ **15**개 |
| 본문 길이 | 576 ~ **21,040**자 (평균 4,669 / 중앙값 3,198) |
| 읽기 시간 | 1 ~ **26**분 (중앙값 4) |
| H2 보유 | 29 / 41 |
| H3 보유 | 28 / 41 |
| **H2·H3 모두 없음** | **2 / 41** |
| 목차 항목 수 (H2+H3) | 0 ~ **23**개 |
| 헤딩 최장 | **101**자 (링크 마크업 포함) |
| 중복 헤딩 보유 글 | 3 |
| 본문 `h1` 보유 글 | **22 / 41** |
| 코드펜스 | 326개 (**인포스트링 없음 169** · python 80 · jsx 32 · tsx 32 · javascript 7 · css 3 · xml 2 · json 1) |
| 이미지 | **113장 / 85.7MB** (png 88 · jpeg 11 · jpg 8 · gif 4 · webp 2) · 1MB 초과 **24장** · 최대 **5.64MB** |
| 썸네일 디렉터리 보유 | 24 / 41 |
| 원시 HTML 사용 | 6편 (`<h2>`×8 · `<script>`×6 · `<br>`×12 · `<aside>`×1) |
| 시리즈 | 3건 (2편짜리 ×2 + 단독 1편 ×1) |
| 동일 날짜 중복 | 8개 날짜 |
| 각주 · 체크리스트 · 블록수식 | **각 0편** |
| 인라인 수식 | 1편 3회 (**그중 2회는 KaTeX 파싱 실패**) |

---

*작성: web-design (STEP 3) · 2026-08-01 · 시안 출처: Claude Design `4a95a040-a1d5-4bf1-a5c0-2429dd00260f` / `STEP3 Post.dc.html`*
