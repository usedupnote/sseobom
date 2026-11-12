"""HTML → PDF (Edge 헤드리스) + 쪽별 미리보기 PNG. 설명 자료(explain)와 발표자료(pitch)에 함께 쓴다.

사용법: (개발 서버 실행 중) python tools/make_pdf.py [URL] [미리보기 폴더]
- URL 기본값은 설명 자료. 발표자료는 http://localhost:8650/docs/pitch.html
- 저장 위치는 HTML 이름을 따른다: docs/explain.html → docs/explain.pdf, docs/pitch.html → docs/pitch.pdf
"""
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
ROOT = Path(__file__).resolve().parent.parent
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8650/docs/explain.html"
PREVIEW = Path(sys.argv[2]) if len(sys.argv) > 2 else None
PDF = ROOT / "docs" / (Path(urlparse(URL).path).stem + ".pdf")

# Edge가 끝난 뒤에야 파일이 써지는 경우가 있어, 이전 파일을 지우고 새 파일이 다 써질 때까지 기다린다
PDF.unlink(missing_ok=True)
subprocess.run(
    [EDGE, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=8000", f"--print-to-pdf={PDF}", URL],
    check=True,
    capture_output=True,
    timeout=180,
)
last = -1
for _ in range(120):
    if PDF.exists():
        size = PDF.stat().st_size
        if size > 0 and size == last:
            break
        last = size
    time.sleep(0.5)
else:
    sys.exit(f"PDF가 만들어지지 않았어요: {PDF}")

import fitz  # PyMuPDF

doc = fitz.open(PDF)
print(PDF.name, "pages", len(doc), "size", doc[0].rect, f"{PDF.stat().st_size // 1024}KB")
if PREVIEW:
    PREVIEW.mkdir(parents=True, exist_ok=True)
    for i, page in enumerate(doc):
        page.get_pixmap(dpi=72).save(str(PREVIEW / f"{PDF.stem}-{i + 1}.png"))
