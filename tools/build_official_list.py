"""공식 '컬쳐캐쉬 사용하기' 목록을 분야별로 받아 data/official-list.js를 다시 만든다.

사용법: python tools/build_official_list.py [확인일 YYYY-MM-DD]
- 로그인 없이 볼 수 있는 공개 페이지만 읽는다: https://www.cultureland.co.kr/usecash/useCash.do
- 이름·분야·이용 방식(바로 사용·쿠폰 구매·포인트 전환)은 페이지 표기 그대로 옮긴다.
- 아래 CURATED·CONV·OFFLINE_COUPON·ALIASES만 사람이 관리한다(공식 목록에 새 이름이 생기면 자동으로 기본 항목이 된다).
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter
from datetime import date
from pathlib import Path

URL = "https://www.cultureland.co.kr/usecash/useCash.do"
OUT = Path(__file__).resolve().parent.parent / "data" / "official-list.js"
CHECKED = sys.argv[1] if len(sys.argv) > 1 else date.today().isoformat()

CAT = {"SHOP": "shopping", "GAME": "game", "CONTENT": "content", "FINANCE": "finance", "FOOD": "food", "CULTURE": "culture"}
KIND = {"쿠폰 구매": "C", "포인트 전한": "V", "포인트 전환": "V", "바로 사용": "D"}  # '전한'은 페이지의 오타 표기

# 공식 표기 → data/merchants.js에서 수수료·한도까지 확인해 둔 사용처 id
CURATED = {
    "올리브영": "oliveyoung", "쿠팡": "coupang", "Npay": "naverpay", "SSG PAY": "ssg", "11pay": "11st", "번개장터": "bunjang", "GS SHOP": "gsshop",
    "롯데홈쇼핑": "lottehomeshopping", "다이소": "daiso", "넥슨": "nexon", "스팀": "steam", "Google Play 기프트 코드": "googleplay", "로블록스": "roblox",
    "PS Store": "psstore", "넷마블": "netmarble", "리그오브레전드": "lol", "Play NC": "plaync", "리디북스": "ridi", "네이버웹툰": "naverwebtoon",
    "카카오페이지": "kakaopage", "카카오이모티콘": "kakaoemoticon", "페이코": "payco", "스마일머니": "gmarket", "L.POINT": "lpoint", "H.Point": "hpoint",
    "해피포인트": "happypoint", "CJ푸드빌": "cjfoodville", "스타벅스": "starbucks", "이디야커피": "ediya", "yes24": "yes24", "CGV": "cgv",
    "롯데시네마": "lottecinema", "알라딘": "aladin", "교보문고": "kyobo", "메가박스": "megabox", "벅스뮤직": "bugs",
}
# 전환 포인트 정보 키(merchants.js의 CONV)
CONV = {"CJ ONE": "cjone", "오투캐시": "o2", "모빌카드": "mobil", "G앱머니": "gln", "웰컴페이": "welcome", "페이북": "paybooc", "아파트아이": "apt", "달포인트": "dal"}
# 쿠폰을 매장에서 쓰는 브랜드(그 밖의 쿠폰은 온라인 서비스로 본다) — 공식 목록에는 없는 구분이라 브랜드 성격으로 나눔
OFFLINE_COUPON = {
    "신세계모바일(키오스크형)", "신세계모바일(Kiosk)", "신세계지류상품권", "롯데모바일교환권(지류교환형)", "롯데지류상품권(배송상품)", "이마티콘", "CJ기프트카드",
    "IKEA", "정관장", "스마일기프트", "요거프레소", "죠스떡볶이", "더본코리아", "홍루이젠",
}
ALIASES = {
    "한게임": ["hangame"], "블리자드": ["blizzard", "배틀넷", "battlenet"], "오버워치": ["overwatch"], "스토브": ["stove"], "웹젠": ["webzen"], "검은 사막": ["blackdesert"],
    "메이플스토리": ["메이플", "maplestory"], "SOOP": ["숲", "아프리카tv", "아프리카", "별풍선"], "틱톡 기프트카드": ["틱톡", "tiktok"], "레진코믹스": ["레진", "lezhin"],
    "원스토어": ["onestore"], "갤럭시스토어": ["galaxystore"], "스푼라디오": ["스푼", "spoon"], "문피아": ["munpia"], "미스터블루": ["mrblue"], "투네이션": ["toonation"],
    "IKEA": ["이케아"], "이마티콘": ["이마트", "emart"], "CJ ONE": ["cj원", "씨제이원"], "현대Hmall": ["hmall", "현대홈쇼핑", "h몰"], "SK telecom": ["skt", "sk텔레콤", "t데이터쿠폰"],
    "T로밍": ["로밍"], "페이북": ["paybooc", "페이북머니"], "웰컴페이": ["웰컴머니"], "아파트아이": ["아파트캐시"], "G앱머니": ["gln"], "Daum 게임": ["다음게임"], "피망": ["pmang"],
    "엠게임": ["mgame"], "카발온라인": ["카발", "cabal"], "라테일": ["latale"], "테일즈런너": ["테런"], "월드오브탱크": ["월탱", "worldoftanks"],
    "파이널판타지14": ["파판14", "파판", "ff14"], "아이템매니아": ["itemmania"], "아이템베이": ["itembay"], "더본코리아": ["더본"], "CJ 더마켓": ["더마켓"],
    "CJ기프트카드": ["cj기프트"], "죠스떡볶이": ["죠스"], "신세계모바일(키오스크형)": ["신세계상품권"], "신세계모바일(Kiosk)": ["신세계상품권"], "신세계지류상품권": ["신세계상품권"],
    "롯데모바일교환권(지류교환형)": ["롯데상품권"], "롯데지류상품권(배송상품)": ["롯데상품권"], "틴캐시": ["teencash"], "티캐시": ["tcash"], "DB손해보험": ["db손보"],
    "탑툰": ["toptoon"], "봄툰": ["bomtoon"], "원스토리": ["onestory"], "크랙": ["crack"], "미르의전설2": ["미르2"], "미르의전설3": ["미르3"], "컬쳐몰": ["컬처몰"],
    "정관장": ["kgc"], "하울팟": ["howlpot"],
}


def fetch(cat, page):
    data = urllib.parse.urlencode({"category": cat, "gubun": "conversion,coupon,direct,usecash", "searchWord": "", "viewType": "LST", "pageNow": page}).encode()
    req = urllib.request.Request(URL, data=data, headers={"User-Agent": "Mozilla/5.0", "X-Requested-With": "XMLHttpRequest"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def parse(html):
    """목록 조각 → [(공식 표기, 이용 방식 코드)], 전체 곳 수"""
    body = re.search(r'<ul class="list-area">(.*?)</ul>', html, re.S)
    items = []
    for li in re.findall(r"<li>(.*?)</li>", body.group(1) if body else "", re.S):
        labels = re.findall(r'event-label="([^"]*)"', li)
        kinds = re.findall(r'event-category="([^"]*)"', li)
        name = next((x.strip() for x in labels if x.strip()), "")
        if name:
            items.append((name, "".join(sorted({KIND[k] for k in kinds if k in KIND}))))
    total = re.search(r"총 <span>(\d+)</span>개", html)
    return items, int(total.group(1)) if total else None


rows, seen = [], {}
for code, cat in CAT.items():
    got, total, page = [], None, 1
    while True:
        items, t = parse(fetch(code, page))
        total = t if t is not None else total
        got += items
        if not items or len(got) >= (total or 0) or page > 12:
            break
        page += 1
        time.sleep(0.4)
    assert total == len(got), f"{code}: 공식 {total}곳 / 받은 것 {len(got)}곳"
    n = 0
    for name, kinds in got:
        if name in CURATED:
            mid = CURATED[name]
        else:
            n += 1
            mid = f"{cat}-{n:02d}"
        assert mid not in seen, (mid, name)
        seen[mid] = name
        row = {"id": mid, "name": name, "cat": cat, "kinds": kinds}
        if name in CONV:
            row["conv"] = CONV[name]
        if name in OFFLINE_COUPON:
            row["where"] = "offline"
        if ALIASES.get(name):
            row["aliases"] = ALIASES[name]
        rows.append(row)

# 사람이 관리하는 표에 있는 이름이 목록에서 사라졌는지, 수수료 정보가 없는 새 전환처가 생겼는지 알린다
names = set(seen.values())
for label, table in (("CURATED", CURATED), ("CONV", CONV), ("OFFLINE_COUPON", OFFLINE_COUPON), ("ALIASES", ALIASES)):
    gone = [k for k in table if k not in names]
    if gone:
        print(f"주의: {label}에 있지만 공식 목록에 없는 이름 — {', '.join(gone)}")
new_conv = [r["name"] for r in rows if "V" in r["kinds"] and r["id"] not in CURATED.values() and "conv" not in r]
if new_conv:
    sys.exit(f"전환 정보(CONV)가 없는 새 전환처: {', '.join(new_conv)}")

lines = [
    "// 컬쳐랜드 공식 '컬쳐캐쉬 사용하기' 목록 전체 — https://www.cultureland.co.kr/usecash/useCash.do",
    f"// {CHECKED}에 분야별(쇼핑·게임·콘텐츠·금융·외식·문화생활)로 받아 정리한 것. 이름·분야·이용 방식은 공식 표기 그대로다.",
    "// kinds: D 바로 사용 · C 쿠폰 구매 · V 포인트 전환 / conv: 전환 포인트 정보 키 / where: 쿠폰을 쓰는 곳(없으면 온라인)",
    "// id가 merchants.js의 상세 사용처와 같으면 그 정보를 쓰고, 아니면 이 목록만으로 기본 정보를 만든다.",
    "// 이 파일은 tools/build_official_list.py가 만든다(직접 고치지 않는다).",
    f"export const OFFICIAL_CHECKED_AT = '{CHECKED}';",
    f"export const OFFICIAL_TOTAL = {len(rows)};",
    "export const OFFICIAL_LIST = [",
    *("  " + json.dumps(r, ensure_ascii=False) + "," for r in rows),
    "];",
]
OUT.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
print(len(rows), dict(Counter(r["cat"] for r in rows)))
