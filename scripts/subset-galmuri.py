"""Galmuri 서브셋 생성기 — src/assets/fonts/*-subset.woff2 를 만든 스크립트.

왜 서브셋하는가
---------------
jsDelivr 원본은 Galmuri11 492.9 KB + GalmuriMono11 478.0 KB = 971 KB 이고,
그중 대부분이 이 사이트가 한 글자도 쓰지 않는 한자 6,477자 + 카나 187자입니다.
게다가 배포용 galmuri.css 에는 unicode-range 가 없어 분할 로딩도 안 됩니다.
근거: docs/handoff-step1-shell.md §4-1

채택한 시나리오
---------------
A — 한글 전체(11,172자) + 라틴 + 부호 유지, 한자·카나 제거.
상용 2,350자만 남기는 B(87 KB)가 더 싸지만, 상용에 없는 음절이 제목에 하나라도
들어가면 한 단어 안에서 픽셀 → Pretendard 로 서체가 갈립니다. 근거: §4-2

Galmuri11-Bold 는 의도적으로 받지 않습니다. 비트맵 서체는 굵기 변형 시
도트 격자가 무너지므로 픽셀 텍스트에는 font-weight 를 주지 않습니다. (§4-2)

실행
----
    pip install "fonttools[woff]" brotli
    curl -O https://cdn.jsdelivr.net/npm/galmuri/dist/Galmuri11.woff2
    curl -O https://cdn.jsdelivr.net/npm/galmuri/dist/GalmuriMono11.woff2
    python3 scripts/subset-galmuri.py Galmuri11.woff2     src/assets/fonts/Galmuri11-subset.woff2
    python3 scripts/subset-galmuri.py GalmuriMono11.woff2 src/assets/fonts/GalmuriMono11-subset.woff2

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
]


def is_excluded(codepoint: int) -> bool:
    return any(low <= codepoint <= high for low, high in EXCLUDE_RANGES)


def subset(src: str, dst: str) -> None:
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
    print(f"{dst}: {len(keep)}자 / {os.path.getsize(dst) / 1024:.1f} KB")


if __name__ == "__main__":
    subset(sys.argv[1], sys.argv[2])
