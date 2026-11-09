"""BI PDF에서 지정 영역의 벡터 도형을 SVG로 추출한다(로고 워드마크·심볼).

사용법: python -I tools/extract_logo.py <BI.pdf> <출력 폴더>
"""
import sys
from pathlib import Path

import fitz

pdf = fitz.open(sys.argv[1])
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)

# (이름, 페이지, 영역[pt]) — 60dpi 미리보기 좌표 × 1.2
TARGETS = [
    ("logo-wordmark", 0, fitz.Rect(130, 245, 410, 300)),
    ("logo-symbol", 1, fitz.Rect(185, 575, 240, 635)),
    ("logo-combo-voucher", 1, fitz.Rect(185, 575, 390, 635)),
]

BG = {"#F0F0F0", "#EFEFEF", "#FFFFFF", "#E6E6E6", "#F1F1F1"}


def hexc(c):
    return "#%02X%02X%02X" % tuple(round(x * 255) for x in c[:3])


def path_d(items):
    d = []
    for it in items:
        op = it[0]
        if op == "l":
            p1, p2 = it[1], it[2]
            d.append(f"M{p1.x:.2f} {p1.y:.2f}L{p2.x:.2f} {p2.y:.2f}")
        elif op == "c":
            p1, c1, c2, p2 = it[1:5]
            d.append(f"M{p1.x:.2f} {p1.y:.2f}C{c1.x:.2f} {c1.y:.2f} {c2.x:.2f} {c2.y:.2f} {p2.x:.2f} {p2.y:.2f}")
        elif op == "re":
            r = it[1]
            d.append(f"M{r.x0:.2f} {r.y0:.2f}H{r.x1:.2f}V{r.y1:.2f}H{r.x0:.2f}Z")
        elif op == "qu":
            q = it[1]
            d.append(f"M{q.ul.x:.2f} {q.ul.y:.2f}L{q.ur.x:.2f} {q.ur.y:.2f}L{q.lr.x:.2f} {q.lr.y:.2f}L{q.ll.x:.2f} {q.ll.y:.2f}Z")
    # 연속 세그먼트 병합: 이전 끝점과 같은 M 제거
    merged = []
    last_end = None
    for seg in d:
        if seg.startswith("M") and last_end and seg[1:].startswith(last_end):
            seg = seg[1 + len(last_end):]
        merged.append(seg)
        # 끝점 추출
        nums = seg.replace("M", " ").replace("L", " ").replace("C", " ").replace("H", " ").replace("V", " ").replace("Z", " ").split()
        last_end = f"{nums[-2]} {nums[-1]}" if len(nums) >= 2 and not seg.endswith("Z") else None
    return "".join(merged)


for name, pno, clip in TARGETS:
    page = pdf[pno]
    parts = []
    bbox = fitz.Rect()
    for dr in page.get_drawings():
        r = dr["rect"]
        if not clip.contains(r):
            continue
        fill = dr.get("fill")
        if not fill:
            continue
        col = hexc(fill)
        if col in BG:
            continue
        rule = "evenodd" if dr.get("even_odd") else "nonzero"
        parts.append(f'<path fill="{col}" fill-rule="{rule}" d="{path_d(dr["items"])}"/>')
        bbox |= r
    if bbox.is_empty:
        print(name, "도형 없음")
        continue
    pad = 1
    vb = f"{bbox.x0 - pad:.2f} {bbox.y0 - pad:.2f} {bbox.width + 2 * pad:.2f} {bbox.height + 2 * pad:.2f}"
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">' + "".join(parts) + "</svg>"
    (out / f"{name}.svg").write_text(svg, encoding="utf-8")
    print(name, len(parts), "paths", bbox, f"{len(svg) // 1024}KB")
