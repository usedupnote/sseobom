"""설명 자료용 화면 캡처 — Edge 헤드리스로 모바일 폭(390px, 2배율) 화면을 PNG로 저장한다.

사용법: (개발 서버 실행 중) python tools/capture.py [기본 URL]
페이지 매개변수: capture=1(시연 버튼 숨김), ts=l|xl(글자 크기), hc=1(고대비), sim=gray|deutan(색각 시뮬레이션)
"""
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import quote

from PIL import Image

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8650/"
OUT = Path(__file__).resolve().parent.parent / "docs" / "screens"
OUT.mkdir(parents=True, exist_ok=True)

Q_CONV = quote("편의점에서 컬쳐랜드상품권 써도 돼?")
SHOTS = [
    # (파일명, 페이지 매개변수, 해시 경로, 높이)
    ("01-home", "", "#/home", 844),
    ("02-search", "", "#/search", 844),
    ("03-result-conv", "", f"#/r?q={Q_CONV}", 844),
    ("04-guide-conv", "", "#/g/conv-all/barcode-mms?v=cl16", 1180),
    ("05-mms", "", "#/mock/mms", 844),
    ("06-result-coupang", "", "#/r?q=" + quote("쿠팡에서 쓸 수 있어?") + "&v=cl16", 844),
    ("07-guide-coupang", "", "#/g/coupang/convert?v=cl16", 1500),
    ("08-cgv-compare", "", "#/g/cgv/barcode-mms?v=cl16", 1900),
    ("09-munsang18", "", "#/r?q=" + quote("지류 상품권 충전되나요?"), 844),  # 파일명은 그대로(설명 자료가 참조), 내용은 지류 상품권
    ("10-empty", "", "#/r?q=" + quote("배달의민족"), 844),
    ("11-voucher", "", "#/v", 844),
    ("12-starbucks-ask", "", "#/r?q=" + quote("스타벅스에서 문화상품권 돼?"), 844),
    # 저시력 대응
    ("13-lv-settings", "", "#/home?vs=1", 844),
    ("14-lv-result-hc", "&ts=l&hc=1", f"#/r?q={Q_CONV}", 844),
    ("15-lv-step-hc", "&ts=l&hc=1", "#/g/conv-all/barcode-mms?v=cl16&s=2", 844),
    ("16-lv-barcode", "&ts=l&hc=1", "#/mock/mms?bb=1", 844),
    ("17-lv-result-xl", "&ts=xl", f"#/r?q={Q_CONV}", 844),
    ("18-sim-gray", "&sim=gray", "#/g/cgv/barcode-mms?v=cl16", 844),
    ("19-sim-deutan", "&sim=deutan", "#/r?q=CGV", 844),
    # 사진에서 상품권 한 번에 등록(일괄등록)
    ("22-bulk-intro", "", "#/bulk", 844),
    ("23-bulk-result", "", "#/bulk?st=result", 844),
    ("24-bulk-result-hc", "&ts=l&hc=1", "#/bulk?st=result", 844),
    # 다음 동작 버튼: 선물·경품 상품권 → 교환소
    ("25-gift-result", "", "#/r?q=" + quote("카톡 선물로 받은 상품권 쿠팡에서 쓸 수 있어?"), 844),
    ("26-exchange", "", "#/mock/exchange", 844),
    # 공식 목록 전체 반영: 분야 목록
    ("27-category-finance", "", "#/c/finance", 844),
    ("28-category-offline", "", "#/c/offline", 844),
    # 발표자료용: 수수료 계산(한 단계씩 크게 보기), 공식 목록에 없는 곳
    ("29-coupang-calc", "", "#/g/coupang/convert?v=cl16&s=3", 844),
    ("30-unknown", "", "#/r?q=" + quote("닌텐도"), 844),
    # 시연에 필요하지 않아 꺼 둔 기능을 눌렀을 때의 안내(?off=1)
    ("31-off-toast", "", "#/home?off=1", 844),
    # 내 상품권(지류)으로는 쓸 수 없을 때: 판정과 사용 안내가 같은 답을 한다
    ("32-blocked-result", "", "#/r?q=" + quote("교보문고") + "&v=paper", 844),
    ("33-blocked-guide", "", "#/g/kyobo/barcode-mms?v=paper", 844),
]

# 일부만 다시 찍기: python tools/capture.py <기본 URL> 04,25,26  (파일명 앞 번호)
ONLY = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else None
if ONLY:
    SHOTS = [s for s in SHOTS if s[0].split("-")[0] in ONLY]

SCALE = 2

# 데스크톱: 기본 화면과 저시력 관점 폰을 나란히(패널 숨김) — 1200x900 창에서 두 폰 영역만 잘라낸다
DESKTOP_SHOTS = [
    ("20-lv-mirror", "?capture=lv&lv=1&lvblur=3", f"#/r?q={Q_CONV}", (1200, 900), (200, 20, 1000, 840)),
    ("21-lv-mirror-hc", "?capture=lv&lv=1&lvblur=3&ts=l&hc=1", f"#/r?q={Q_CONV}", (1200, 900), (200, 20, 1000, 840)),
]
ORIGIN = BASE.split("?")[0]


def shoot(cmd, target):
    """Edge가 끝난 뒤에야 파일이 써지는 경우가 있어, 이전 파일을 지우고 새 파일이 다 써질 때까지 기다려 메모리로 읽는다(실패하면 한 번 더)."""
    for attempt in range(2):
        target.unlink(missing_ok=True)
        subprocess.run(cmd, check=True, capture_output=True, timeout=60)
        last = -1
        for _ in range(60):
            if target.exists():
                size = target.stat().st_size
                if size > 0 and size == last:  # 크기가 더 늘지 않으면 다 쓴 것
                    try:
                        with Image.open(target) as im:
                            im.load()
                            return im.copy()
                    except OSError:
                        pass
                last = size
            time.sleep(0.25)
    raise RuntimeError(f"캡처 실패: {target.name}")


def save(im, target):
    """Edge가 파일을 아직 잡고 있으면 저장이 실패할 수 있어 몇 번 다시 시도한다."""
    for _ in range(20):
        try:
            im.save(target, optimize=True)
            return
        except OSError:
            time.sleep(0.3)
    im.save(target, optimize=True)


if ONLY:
    DESKTOP_SHOTS = [s for s in DESKTOP_SHOTS if s[0].split("-")[0] in ONLY]
for name, params, route, (w, h), box in DESKTOP_SHOTS:
    target = OUT / f"{name}.png"
    cmd = [
        EDGE,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--force-device-scale-factor={SCALE}",
        f"--window-size={w},{h}",
        "--virtual-time-budget=4000",
        f"--screenshot={target}",
        ORIGIN + params + route,
    ]
    im = shoot(cmd, target)
    save(im.crop(tuple(v * SCALE for v in box)), target)
    print(name, target.stat().st_size // 1024, "KB")

for name, params, route, h in SHOTS:
    target = OUT / f"{name}.png"
    url = BASE + params + route
    cmd = [
        EDGE,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--force-device-scale-factor={SCALE}",
        f"--window-size=500,{h}",  # 헤드리스 최소 폭 때문에 500으로 그리고 390만 잘라낸다
        "--virtual-time-budget=4000",
        f"--screenshot={target}",
        url,
    ]
    im = shoot(cmd, target)
    save(im.crop((0, 0, 390 * SCALE, im.height)), target)
    print(name, target.stat().st_size // 1024, "KB")
