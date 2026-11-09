"""설명 자료용 화면 캡처 — Edge 헤드리스로 모바일 폭(390x844, 2배율) 화면을 PNG로 저장한다.

사용법: (개발 서버 실행 중) python tools/capture.py [기본 URL]
"""
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8650/"
OUT = Path(__file__).resolve().parent.parent / "docs" / "screens"
OUT.mkdir(parents=True, exist_ok=True)

SHOTS = [
    ("01-home", "#/home", 844),
    ("02-search", "#/search", 844),
    ("03-result-conv", "#/r?q=" + quote("편의점에서 컬쳐랜드상품권 써도 돼?"), 844),
    ("04-guide-conv", "#/g/conv-all/barcode-mms?v=cl16", 1180),
    ("05-mms", "#/mock/mms", 844),
    ("06-result-coupang", "#/r?q=" + quote("쿠팡에서 쓸 수 있어?") + "&v=cl16", 844),
    ("07-guide-coupang", "#/g/coupang/convert?v=cl16", 1500),
    ("08-cgv-compare", "#/g/cgv/barcode-mms?v=cl16", 1900),
    ("09-munsang18", "#/r?q=" + quote("문화상품권 18자리 충전되나요?"), 844),
    ("10-empty", "#/r?q=" + quote("배달의민족"), 844),
    ("11-voucher", "#/v", 844),
    ("12-starbucks-ask", "#/r?q=" + quote("스타벅스에서 문화상품권 돼?"), 844),
]

from PIL import Image

SCALE = 2
for name, route, h in SHOTS:
    target = OUT / f"{name}.png"
    cmd = [
        EDGE,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--force-device-scale-factor={SCALE}",
        f"--window-size=500,{h}",  # 헤드리스 최소 폭 때문에 500으로 그리고 390만 잘라낸다
        "--virtual-time-budget=4000",
        f"--screenshot={target}",
        BASE + route,
    ]
    subprocess.run(cmd, check=True, capture_output=True, timeout=60)
    im = Image.open(target)
    im.crop((0, 0, 390 * SCALE, im.height)).save(target, optimize=True)
    print(name, im.size, "->", (390 * SCALE, im.height), target.stat().st_size // 1024, "KB")
