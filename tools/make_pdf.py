"""설명 자료 HTML → PDF (Edge 헤드리스) + 쪽별 미리보기 PNG.

사용법: (개발 서버 실행 중) python tools/make_pdf.py [URL] [미리보기 폴더]
"""
import subprocess
import sys
from pathlib import Path

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
ROOT = Path(__file__).resolve().parent.parent
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8650/docs/explain.html"
PREVIEW = Path(sys.argv[2]) if len(sys.argv) > 2 else None
PDF = ROOT / "docs" / "explain.pdf"

subprocess.run(
    [EDGE, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=6000", f"--print-to-pdf={PDF}", URL],
    check=True,
    capture_output=True,
    timeout=120,
)

import fitz  # PyMuPDF

doc = fitz.open(PDF)
print("pages", len(doc), "size", doc[0].rect, f"{PDF.stat().st_size // 1024}KB")
if PREVIEW:
    PREVIEW.mkdir(parents=True, exist_ok=True)
    for i, page in enumerate(doc):
        page.get_pixmap(dpi=72).save(str(PREVIEW / f"page-{i + 1}.png"))
