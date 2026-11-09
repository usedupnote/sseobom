"""캐릭터 PNG(3840x2160, 최대 66MB)를 웹용 webp로 변환하고, BI PDF를 미리보기 PNG로 렌더링한다.

사용법: python -I tools/convert_assets.py <에셋 폴더> <출력 폴더>
원본 폴더 이름이 NFD 한글이라 경로는 인자로 받는다(작업 폴더에서 실행하지 않음).
"""
import sys
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

src = Path(sys.argv[1])
out = Path(sys.argv[2])
(out / "char").mkdir(parents=True, exist_ok=True)
(out / "brand").mkdir(parents=True, exist_ok=True)

# 원본 파일명(NFD) → 웹용 이름
CHAR_MAP = {
    "08": "catsh-thumb",      # 08_엄지척 — 성공
    "15": "catsh-question",   # 15_Question_catsh — 결과 없음
    "16": "catsh-safety",     # 16_SafetyCatsh — 주의
    "11": "catsh-please",     # 11_please — 확인 필요
    "01": "char-hello",       # 01_앉아서인사 — 진입
    "05": "catsh-cash",       # 05_캣쉬캐쉬 — 충전
    "09": "char-so",          # 09_so
    "12": "char-hanbok",      # 12_한복인사
}

for p in sorted(src.rglob("*.png")):
    key = p.name[:2]
    name = CHAR_MAP.get(key)
    if not name:
        print("skip", p.name)
        continue
    im = Image.open(p)
    print(p.name, im.size, im.mode)
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    # 알파 기준으로 여백 자르기
    bbox = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if bbox:
        im = im.crop(bbox)
    im.thumbnail((560, 560), Image.LANCZOS)
    dst = out / "char" / f"{name}.webp"
    im.save(dst, "WEBP", quality=86, method=6)
    print("  ->", dst.name, im.size, dst.stat().st_size // 1024, "KB")

# BI PDF 미리보기(로고 추출 위치 확인용)
try:
    import fitz

    for pdf in src.rglob("*.pdf"):
        if "BI" not in pdf.name:
            continue
        doc = fitz.open(pdf)
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=60)
            pix.save(str(out / "brand" / f"bi-preview-{i + 1}.png"))
            print("bi page", i + 1, page.rect)
except ImportError:
    print("PyMuPDF 없음 — BI 미리보기 생략")
