"""app.css 일괄 변환(1회용): 저시력 대응.

1) 글자 크기: 13px 미만은 13px로 올리고, 모든 font-size에 글자 배율 변수(--ts)를 곱한다.
2) 앱 화면의 흰 바탕(#fff)을 테마 변수(--surface)로 바꿔 고대비 테마에서 덮어쓸 수 있게 한다.
   바코드·패널처럼 항상 흰 바탕이어야 하는 규칙은 제외한다.

사용법: python tools/a11y_css.py css/app.css
"""
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
css = path.read_text(encoding="utf-8")

KEEP_WHITE = (".scn button", ".panel-links a", ".balance-swap", ".bc-wrap", "body.capture", ".phone {")
MIN_PX = 13.0

out = []
for line in css.splitlines():
    # 글자 크기
    def fs(m):
        v = float(m.group(1))
        v = max(v, MIN_PX)
        num = f"{v:g}"
        return f"font-size: calc({num}px * var(--ts, 1))"

    if "calc(" not in line or "font-size: calc(var(--s)" not in line:
        line = re.sub(r"font-size:\s*(\d+(?:\.\d+)?)px", fs, line)

    # 흰 바탕 → 테마 변수
    if not any(k in line for k in KEEP_WHITE):
        line = re.sub(r"background:\s*#fff\b", "background: var(--surface)", line)
    out.append(line)

path.write_text("\n".join(out) + "\n", encoding="utf-8")
print("done", len(out), "lines")
