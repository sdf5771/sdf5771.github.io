"""Galmuri 서브셋 생성기 — src/assets/fonts/*-subset.woff2 를 만든 스크립트.

왜 서브셋하는가
---------------
jsDelivr 원본은 Galmuri11 492.9 KB + GalmuriMono11 478.0 KB = 971 KB 이고,
그중 대부분이 이 사이트가 한 글자도 쓰지 않는 한자 6,477자 + 카나 187자입니다.
게다가 배포용 galmuri.css 에는 unicode-range 가 없어 분할 로딩도 안 됩니다.
근거: docs/handoff-step1-shell.md §4-1

🔴 화이트리스트 방식 (2026-08-01 전환, §4-3a)
--------------------------------------------
예전에는 "뺄 것"을 나열하는 블랙리스트였습니다. 화이트리스트로 바꾼 이유는
**용량이 아니라 결정성**입니다.

  블랙리스트  "아는 나쁜 것만 뺀다" → 상류 Galmuri 가 다음 버전에서 글리프를
              추가하면 **우리 번들이 조용히 커집니다.**
  화이트리스트 "쓸 것만 남긴다"     → 상류가 무엇을 추가하든 결과가 변하지 않습니다.

⚠️ 화이트리스트의 위험은 정반대입니다 — **유지 목록에서 빠뜨린 기호가 조용히
   사라져 폴백 서체로 렌더됩니다.** `➜`·`⌕` 사고와 증상이 같고, 원인이 우리
   쪽이라 더 나쁩니다. 그래서 아래 REQUIRED 단언이 **선택이 아니라 안전망**입니다.
   서브셋 직후 두 파일의 cmap 을 검사해 하나라도 없으면 빌드를 실패시킵니다.

채택한 범위 — 두 폰트가 다릅니다
--------------------------------
**Galmuri11 (display, `display` 모드)** — 한글 전체(11,172자) + 라틴 + 부호.
  상용 2,350자만 남기면 더 싸지만, 상용에 없는 음절이 제목에 하나라도 들어가면
  한 단어 안에서 픽셀 → Pretendard 로 서체가 갈립니다. 근거: §4-2

**GalmuriMono11 (mono, `mono` 모드)** — **한글을 뺍니다.** 라틴·숫자·기호만.
  모노는 11px 고정이고 11px 한글 픽셀은 금지이므로(§3-3a) 한글 글리프가 필요 없습니다.
  덤으로 규칙이 **기술적으로 강제**됩니다 — 모노 자리에 실수로 한글을 넣으면
  Pretendard 로 자동 폴백돼 눈에 띕니다. 근거: §13 6번

Galmuri11-Bold 는 의도적으로 받지 않습니다. 비트맵 서체는 굵기 변형 시
도트 격자가 무너지므로 픽셀 텍스트에는 font-weight 를 주지 않습니다. (§4-2)

실행
----
    pip install "fonttools[woff]" brotli
    curl -O https://cdn.jsdelivr.net/npm/galmuri/dist/Galmuri11.woff2
    curl -O https://cdn.jsdelivr.net/npm/galmuri/dist/GalmuriMono11.woff2
    python3 scripts/subset-galmuri.py display Galmuri11.woff2     src/assets/fonts/Galmuri11-subset.woff2
    python3 scripts/subset-galmuri.py mono    GalmuriMono11.woff2 src/assets/fonts/GalmuriMono11-subset.woff2

    # 생성 없이 커밋된 서브셋만 검사 (fontTools 가 있는 환경에서)
    python3 scripts/subset-galmuri.py verify

> 빌드(`npm run build`)가 돌리는 단언은 이 스크립트가 아니라
> `scripts/verify-font-glyphs.mjs` 입니다 — CI 에는 Python·fontTools 가 없고
> Node 만 있기 때문입니다. 두 구현은 **같은 REQUIRED 인벤토리**를 검사합니다.
> 문자를 추가할 때 이 파일과 그 파일을 함께 고치세요.

라이선스
--------
SIL Open Font License 1.1 — 서브셋·자체 호스팅·재배포 모두 허용됩니다.
전문은 src/assets/fonts/Galmuri-OFL.txt.
"""

import os
import subprocess
import sys

from fontTools.ttLib import TTFont

# ------------------------------------------------------------------
# 유지 목록 (화이트리스트) — §4-3a 전수
# ------------------------------------------------------------------
# 두 파일 공통. 여기 없는 코드포인트는 서브셋에 **들어가지 않습니다.**
KEEP_COMMON = [
    (0x0020, 0x024F),  # 기본 라틴 + 라틴-1 + 라틴 확장 A/B — `×` `·` `°`
    (0x2000, 0x206F),  # 일반 구두점 — `…` `–` `—` `•`
    (0x2190, 0x21FF),  # 화살표 — `→` `←` `↑` `↓` `↗`
    (0x25A0, 0x25FF),  # 기하 도형 — `▸` `▶` `●` `○` `■` `□`
    (0x2318, 0x2318),  # `⌘` Command
    (0x2605, 0x2606),  # `★` `☆` 별
    (0x2630, 0x2630),  # `☰` 삼선
]

# ⚠️ `★`(U+2605) `☆`(U+2606) `☰`(U+2630) 은 전부 U+2600–26FF(기타 기호) 블록인데
#    그 블록은 유지 목록에 없습니다. **블록 전체 256자를 넣지 말고 쓰는 것만
#    개별 지정**합니다. 블랙리스트 시절 이 셋이 우연히 살아남아 있었을 뿐이고,
#    화이트리스트로 바꾸는 순간 조용히 사라질 뻔한 자리였습니다.
#    화살표·기하 도형은 몇 KB 안 되고 앞으로 쓸 여지가 있어 블록째 유지합니다.

# Galmuri11(디스플레이)만 추가 — 모노는 라틴·숫자·기호 전용입니다
KEEP_DISPLAY_EXTRA = [
    (0x1100, 0x11FF),  # 한글 자모
    (0x3000, 0x303F),  # CJK 구두점
    (0x3130, 0x318F),  # 한글 호환 자모
    (0xAC00, 0xD7A3),  # 한글 음절 11,172자
]

# ------------------------------------------------------------------
# 🔴 빌드타임 단언 — 화이트리스트의 안전망 (§4-3a · §4-7 인벤토리와 동기화)
# ------------------------------------------------------------------
# 이 문자들은 화면에서 실제로 쓰고 있습니다. 하나라도 서브셋에서 빠지면
# 폴백 서체로 렌더돼 베이스라인·굵기·픽셀 격자가 어긋납니다.
# 새 장식 기호를 쓰려면 ① 위 유지 목록 ② 이 문자열 ③ verify-font-glyphs.mjs
# ④ §4-7 검증 — 네 곳을 함께 고치세요.
REQUIRED = "▸×●○→←↑↗★·…–☰⌘"


def keep_ranges(mode: str) -> list[tuple[int, int]]:
    if mode == "mono":
        return KEEP_COMMON

    if mode == "display":
        return sorted(KEEP_COMMON + KEEP_DISPLAY_EXTRA)

    raise SystemExit("mode 는 'display' 또는 'mono' 여야 합니다")


def assert_required(path: str) -> None:
    """서브셋 cmap 에 REQUIRED 가 전부 있는지 검사합니다. 없으면 종료 코드 1."""
    cmap = TTFont(path).getBestCmap()
    missing = [f"{ch} U+{ord(ch):04X}" for ch in REQUIRED if ord(ch) not in cmap]

    if missing:
        raise SystemExit(
            f"❌ 서브셋 누락: {path}\n"
            f"   {', '.join(missing)}\n"
            f"   → scripts/subset-galmuri.py 의 유지 목록에 해당 코드포인트를 추가하세요."
        )

    print(f"✅ 장식 기호 {len(REQUIRED)}자 전부 존재: {path}")


def subset(mode: str, src: str, dst: str) -> None:
    ranges = keep_ranges(mode)
    unicodes = ",".join(
        f"U+{low:04X}" if low == high else f"U+{low:04X}-{high:04X}"
        for low, high in ranges
    )

    subprocess.run(
        [
            "pyftsubset",
            src,
            f"--output-file={dst}",
            f"--unicodes={unicodes}",
            "--flavor=woff2",
            "--layout-features=*",
            "--no-hinting",
            "--drop-tables+=DSIG",
        ],
        check=True,
    )

    count = len(TTFont(dst).getBestCmap())
    print(f"[{mode}] {dst}: {count}자 / {os.path.getsize(dst) / 1024:.1f} KiB")

    # 🔴 생성 직후 단언. 화이트리스트에서 빠뜨린 기호를 여기서 잡습니다.
    assert_required(dst)


FONT_DIR = "src/assets/fonts"
SUBSET_FILES = [
    f"{FONT_DIR}/Galmuri11-subset.woff2",
    f"{FONT_DIR}/GalmuriMono11-subset.woff2",
]


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "verify":
        for font_path in SUBSET_FILES:
            assert_required(font_path)
    else:
        subset(sys.argv[1], sys.argv[2], sys.argv[3])
