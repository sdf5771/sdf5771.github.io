"""Galmuri 서브셋 생성기 — src/assets/fonts/*-subset.woff2 를 만든 스크립트.

왜 서브셋하는가
---------------
jsDelivr 원본은 Galmuri11 492.9 KB + GalmuriMono11 478.0 KB = 971 KB 이고,
그중 대부분이 이 사이트가 한 글자도 쓰지 않는 한자 6,477자 + 카나 187자입니다.
게다가 배포용 galmuri.css 에는 unicode-range 가 없어 분할 로딩도 안 됩니다.
근거: docs/handoff-step1-shell.md §4-1

채택한 범위 — 두 폰트가 다릅니다
--------------------------------
**Galmuri11 (display, `display` 모드)** — 한글 전체(11,172자) + 라틴 + 부호.
  상용 2,350자만 남기면 더 싸지만, 상용에 없는 음절이 제목에 하나라도 들어가면
  한 단어 안에서 픽셀 → Pretendard 로 서체가 갈립니다. 근거: §4-2

**GalmuriMono11 (mono, `mono` 모드)** — **한글을 뺍니다.** 라틴·숫자·기호만.
  모노는 11px 고정이고 11px 한글 픽셀은 금지이므로(§3-3a) 한글 글리프가 필요 없습니다.
  덤으로 규칙이 **기술적으로 강제**됩니다 — 모노 자리에 실수로 한글을 넣으면
  Pretendard 로 자동 폴백돼 눈에 띕니다. 152.7 KB → 10 KB대. 근거: §13 6번

Galmuri11-Bold 는 의도적으로 받지 않습니다. 비트맵 서체는 굵기 변형 시
도트 격자가 무너지므로 픽셀 텍스트에는 font-weight 를 주지 않습니다. (§4-2)

실행
----
    pip install "fonttools[woff]" brotli
    curl -O https://cdn.jsdelivr.net/npm/galmuri/dist/Galmuri11.woff2
    curl -O https://cdn.jsdelivr.net/npm/galmuri/dist/GalmuriMono11.woff2
    python3 scripts/subset-galmuri.py display Galmuri11.woff2     src/assets/fonts/Galmuri11-subset.woff2
    python3 scripts/subset-galmuri.py mono    GalmuriMono11.woff2 src/assets/fonts/GalmuriMono11-subset.woff2

라이선스
--------
SIL Open Font License 1.1 — 서브셋·자체 호스팅·재배포 모두 허용됩니다.
전문은 src/assets/fonts/Galmuri-OFL.txt.
"""

import os
import subprocess
import sys

from fontTools.ttLib import TTFont

# pyftsubset 에는 '제외' 옵션이 없어서, 원본이 실제로 가진 코드포인트에서
# 아래 범위를 빼 '유지할 목록'을 만들어 넘깁니다.
EXCLUDE_RANGES = [
    (0x3040, 0x30FF),  # 히라가나 + 가타카나
    (0x31F0, 0x31FF),  # 가타카나 음성 확장
    (0x3400, 0x4DBF),  # CJK 통합 한자 확장 A
    (0x4E00, 0x9FFF),  # CJK 통합 한자
    (0xF900, 0xFAFF),  # CJK 호환 한자
    (0xFF66, 0xFF9F),  # 반각 가타카나
    # ↓ 2026-08-01 추가 6종 (§4-2a). 한자·카나만 빼면 226.2 KB 가 남습니다.
    (0x1E00, 0x1EFF),  # 라틴 확장 추가 — 베트남어·발음기호. 한국어+영어 사이트에 불필요
    (0x2400, 0x243F),  # 제어 그림 — `␣` `␤`. 사용처 없음
    (0x2500, 0x257F),  # 괘선 — 아래 설명 참고
    (0x2800, 0x28FF),  # 점자 — 사용처 없음
    (0x3200, 0x33FF),  # 원문자·단위 — `㈜` `㎡`. 본문은 Pretendard 라 픽셀 서체에 불필요
    (0xE000, 0xF8FF),  # 사용자 영역(PUA) — 비표준 사설 글리프. 참조하면 안 되는 영역
]

# 괘선(`─ │ ┌ ┐`)을 빼는 이유 — 디자인에서 쓸 계획이 없습니다(§4-2a).
#   1. 테두리·구분선은 CSS 보더로 그립니다. --color-border-* 4단계가 대비 실측을
#      거친 값이고, 문자 그래픽으로 그린 선은 토큰화도 대비 검증도 불가능합니다.
#   2. 터미널 창 크롬(신호등·창 테두리)은 이미 반려됐습니다. 괘선 테두리는 그
#      결정을 뒷문으로 되돌리는 셈입니다.
#   3. 크기가 맞지 않습니다 — 모노는 11px 고정이라 너무 작고 디스플레이는 22px
#      이상이라 너무 큽니다. 중간이 없습니다.
#   4. 문자 괘선은 정확한 line-height 에서만 이어지는데, 우리 모노는 짧은 인라인
#      문자열용이지 여러 줄 아트용이 아닙니다.
#   5. 스크린리더가 의미 없는 문자열로 읽어 어차피 aria-hidden 이 필요합니다.
# → 규칙: 테두리·구분선·박스는 CSS 보더 토큰으로 그립니다. 나중에 정말 필요해지면
#   이 목록에서 해당 줄만 지우면 되돌아옵니다.
#
# ⚠️ 장식 기호는 이 범위를 피해서 골라야 합니다. 현재 쓰는 `▸`(U+25B8)
#    `×`(U+00D7) `●`(U+25CF) `○`(U+25CB) `→` `↗` `☰` `⌘` `·` `…` `–` 는
#    모두 제외 범위 밖입니다. 새 기호를 쓸 때는 §4-7 의 검증 명령으로
#    **서브셋 파일**의 cmap 을 직접 확인하세요(원본이 아니라).

# mono 모드에서 추가로 제외 — 모노는 라틴·숫자·기호 전용입니다
HANGUL_RANGES = [
    (0x1100, 0x11FF),  # 한글 자모
    (0x3130, 0x318F),  # 한글 호환 자모
    (0xA960, 0xA97F),  # 한글 자모 확장 A
    (0xAC00, 0xD7A3),  # 한글 음절
    (0xD7B0, 0xD7FF),  # 한글 자모 확장 B
]


def build_excludes(mode: str) -> list[tuple[int, int]]:
    if mode == "mono":
        return EXCLUDE_RANGES + HANGUL_RANGES

    if mode == "display":
        return EXCLUDE_RANGES

    raise SystemExit("mode 는 'display' 또는 'mono' 여야 합니다")


def subset(mode: str, src: str, dst: str) -> None:
    exclude_ranges = build_excludes(mode)

    def is_excluded(codepoint: int) -> bool:
        return any(low <= codepoint <= high for low, high in exclude_ranges)

    font = TTFont(src)
    codepoints: set[int] = set()
    for table in font["cmap"].tables:
        codepoints.update(table.cmap.keys())
    font.close()

    keep = sorted(cp for cp in codepoints if not is_excluded(cp))

    subprocess.run(
        [
            "pyftsubset",
            src,
            f"--output-file={dst}",
            "--unicodes=" + ",".join(f"U+{cp:04X}" for cp in keep),
            "--flavor=woff2",
            "--layout-features=*",
            "--no-hinting",
            "--drop-tables+=DSIG",
        ],
        check=True,
    )
    print(f"[{mode}] {dst}: {len(keep)}자 / {os.path.getsize(dst) / 1024:.1f} KB")


if __name__ == "__main__":
    subset(sys.argv[1], sys.argv[2], sys.argv[3])
