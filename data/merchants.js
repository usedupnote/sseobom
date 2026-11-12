// 사용처 데이터 — 공식 '컬쳐캐쉬 사용하기' 목록 153곳 전체(official-list.js) + 오프라인 사용처 28곳 + 확인 필요 5곳.
// 아래 M에는 수수료·한도·주의사항까지 확인한 사용처를 적고, 나머지는 공식 목록의 이름·분야·이용 방식만으로 자동 생성한다.
// 레인(online/offline) kind:
//   direct   결제창에서 컬쳐캐쉬 바로 결제          → 바로 사용 가능
//   barcode  매장에서 상품권(MMS)·앱 바코드 제시     → 바로 사용 가능
//   convert  제휴 포인트로 전환 후 결제(수수료)      → 전환하면 가능
//   coupon   컬쳐캐쉬로 모바일 쿠폰 구매 후 사용     → 쿠폰으로 가능
//   giftcode 기프트코드 구매 후 등록(수수료)         → 코드로 가능
//   none     해당 채널에서 사용 불가
//   unknown  공식 목록에서 확인되지 않음             → 확인 필요
//   null     해당 채널이 없음(예: 온라인 전용 서비스)
// confidence: official(공식 페이지 확인) · secondary(제휴사 공지·언론) · unverified(확인 필요)
import { CHECKED_AT } from './sources.js';
import { OFFICIAL_LIST, OFFICIAL_CHECKED_AT, OFFICIAL_TOTAL } from './official-list.js';

// 분야는 공식 사용처 페이지의 탭(쇼핑·게임·콘텐츠·금융·외식·문화생활) 그대로 + 오프라인 사용처
export const CATEGORIES = [
  { id: 'shopping', label: '쇼핑', icon: 'bag', hint: '쿠팡·Npay·올리브영·다이소' },
  { id: 'game', label: '게임', icon: 'game', hint: '넥슨·스팀·Google Play' },
  { id: 'content', label: '콘텐츠', icon: 'play', hint: '네이버웹툰·리디북스·SOOP' },
  { id: 'finance', label: '금융', icon: 'coin', hint: '페이코·L.POINT·H.Point' },
  { id: 'food', label: '외식', icon: 'cup', hint: '스타벅스·이디야·해피포인트' },
  { id: 'culture', label: '문화생활', icon: 'film', hint: 'CGV·교보문고·YES24' },
  { id: 'offline', label: '오프라인 사용처', icon: 'store', hint: '편의점·영화관·서점 등 매장 28곳' },
];
export const OFFLINE_TOTAL = 28; // 공식 '오프라인 사용처 보기' 팝업 기준
export { OFFICIAL_TOTAL, OFFICIAL_CHECKED_AT };

const ON = (kind, extra = {}) => ({ kind, ...extra });
const OFF = (kind, extra = {}) => ({ kind, ...extra });
const BARCODE = OFF('barcode');

// 전환 수수료(공식 전환 안내·사용 방법, 2026-11-06). 수수료가 공개 페이지에 없는 곳은 숫자를 넣지 않고 FEE_CHECK로 표시한다.
const FEE_CHECK = '전환 화면에서 확인(로그인 필요)';
const CONV = {
  npay: { target: '네이버페이 포인트', fee: 0.06, min: '1,000원(원 단위)', limit: '당일 전환 한도 있음(금액 비공개) · Npay 보유한도 200만원' },
  coupang: { target: '쿠팡캐시', shop: true, fee: 0.06, min: '1,000원(100원 단위)', limit: '월 50만원(수수료 제외) · 일 10회 · 쿠팡캐시 보유한도 50만원' },
  smile: { target: '스마일머니', shop: true, fee: 0.05, min: '1,000원(100원 단위)', limit: '당일 전환 한도 있음 · 스마일머니 보유한도 200만원' },
  pay11: { target: '11pay 포인트', shop: true, fee: 0.06, min: '1,000원', limit: '당일 전환 한도 있음' },
  ssg: { target: 'SSG MONEY', shop: true, fee: 0.05, min: '1,000원', limit: '당일 전환 한도 있음' },
  payco: { target: 'PAYCO 포인트', fee: 0.06, min: '1,000원', limit: '당일 전환 한도 있음' },
  lpoint: { target: 'L.POINT', fee: 0.06, min: '1,000원', limit: '당일 전환 한도 있음' },
  hpoint: { target: 'H.Point', fee: 0.06, min: '100원', limit: '당일 전환 한도 있음' },
  happy: { target: '해피포인트', fee: 0.045, min: '1,000원', limit: '1,000원 단위' },
  // 2026-11-12 공식 목록에서 추가한 전환처 — 포인트 이름은 공식 모바일 전환 목록 표기
  gln: { target: 'G앱머니', fee: 0.08, min: '1,000원(1,000원 단위)', limit: '당일 전환 한도 있음 · G앱머니 보유한도 200만원' },
  cjone: { target: 'CJ ONE 포인트', feeText: FEE_CHECK },
  o2: { target: '오투캐시', feeText: FEE_CHECK },
  mobil: { target: '모빌카드', feeText: FEE_CHECK },
  welcome: { target: '웰컴머니', feeText: FEE_CHECK },
  paybooc: { target: '페이북머니', feeText: FEE_CHECK },
  apt: { target: '아파트캐시', feeText: FEE_CHECK },
  dal: { target: '달포인트', feeText: FEE_CHECK },
};

const conv = (k, extra = {}) => ON('convert', { ...CONV[k], ...extra });

const M = [
  // ── 편의점 ───────────────────────────────────────────
  {
    id: 'conv-all',
    name: '편의점 4사',
    full: '편의점(CU·GS25·세븐일레븐·이마트24)',
    group: ['cu', 'gs25', 'seven', 'emart24'],
    aliases: ['편의점', '편의점4사', '컨비니언스', '편의점들'],
    cat: 'offline',
    online: null,
    offline: BARCODE,
    confidence: 'official',
    sources: ['voucherUse', 'offlinePopup', 'mobileVoucher'],
    note: '공식 안내 원문: "전국 오프라인 편의점(CU, GS25, 7-Eleven, Emart24)"',
  },
  { id: 'cu', name: 'CU', aliases: ['씨유', 'cu편의점', '씨유편의점', 'bgf'], cat: 'offline', online: null, offline: BARCODE, confidence: 'official', sources: ['voucherUse'] },
  { id: 'gs25', name: 'GS25', aliases: ['지에스', '지에스25', 'gs편의점', '지에스편의점', 'gs 25'], cat: 'offline', online: null, offline: BARCODE, confidence: 'official', sources: ['voucherUse'] },
  { id: 'seven', name: '세븐일레븐', aliases: ['7-eleven', '7eleven', '7일레븐', '세븐', '세븐일레븐편의점', 'seveneleven', '7-11'], cat: 'offline', online: null, offline: BARCODE, confidence: 'official', sources: ['voucherUse'] },
  { id: 'emart24', name: '이마트24', aliases: ['emart24', '이마트 24', '이마트편의점'], cat: 'offline', online: null, offline: BARCODE, confidence: 'official', sources: ['voucherUse'] },

  // ── 영화·문화 ────────────────────────────────────────
  {
    id: 'cgv',
    name: 'CGV',
    aliases: ['씨지브이', 'cgv영화관', '씨지비', '시지브이'],
    cat: 'culture',
    online: ON('direct', {
      limit: '사용한도 없음 · 10원 단위',
      notes: ['상품권 번호를 CGV에 바로 입력할 수는 없어요. 컬쳐캐쉬로 충전한 뒤 써요.'],
    }),
    offline: BARCODE,
    extra: [{ kind: 'coupon', label: 'CGV 모바일 쿠폰(관람권)도 컬쳐캐쉬로 구매 가능' }],
    confidence: 'official',
    sources: ['useCash', 'offlinePopup', 'voucherUse'],
  },
  { id: 'megabox', name: '메가박스', aliases: ['megabox', '메박'], cat: 'culture', online: ON('direct'), offline: BARCODE, confidence: 'official', sources: ['voucherUse', 'offlinePopup'] },
  { id: 'lottecinema', name: '롯데시네마', aliases: ['lottecinema', '롯시', '롯데 시네마'], cat: 'culture', online: ON('direct'), offline: BARCODE, confidence: 'official', sources: ['voucherUse', 'offlinePopup'] },
  { id: 'phoenix', name: '휘닉스 평창·섭지코지', aliases: ['휘닉스', '휘닉스파크', '휘닉스평창', '섭지코지', '휘닉스 리조트'], cat: 'offline', places: 2, online: null, offline: BARCODE, confidence: 'official', sources: ['offlinePopup'] },
  { id: 'artbox', name: '아트박스', aliases: ['artbox', '아트 박스'], cat: 'offline', online: null, offline: BARCODE, confidence: 'official', sources: ['voucherUse', 'offlinePopup'] },
  { id: 'hottracks', name: '핫트랙스', aliases: ['hottracks', '핫 트랙스'], cat: 'offline', online: null, offline: BARCODE, confidence: 'official', sources: ['voucherUse', 'offlinePopup'] },
  { id: 'alpha', name: '알파문구', aliases: ['알파', '알파 문구', 'alpha'], cat: 'offline', online: null, offline: BARCODE, confidence: 'official', sources: ['offlinePopup'] },

  // ── 도서 ─────────────────────────────────────────────
  { id: 'kyobo', name: '교보문고', aliases: ['교보', 'kyobo', '교보 문고'], cat: 'culture', online: ON('direct'), offline: BARCODE, confidence: 'official', sources: ['voucherUse', 'offlinePopup'] },
  { id: 'aladin', name: '알라딘', aliases: ['aladin', '알라딘중고서점', '알라딘 중고서점'], cat: 'culture', online: ON('direct'), offline: BARCODE, confidence: 'official', sources: ['voucherUse', 'offlinePopup'] },
  { id: 'youngpoong', name: '영풍문고', aliases: ['영풍', '영풍 문고'], cat: 'culture', online: ON('unknown'), offline: OFF('unknown'), confidence: 'unverified', sources: ['offlinePopup', 'shpMain'], note: '공식 오프라인 사용처(28곳)와 바로사용 목록에서 찾지 못했어요(2026-11-06 기준).' },
  { id: 'yes24', name: 'YES24', aliases: ['예스24', 'yes 24', '예스이십사'], cat: 'culture', online: ON('direct', { notes: ['YES24 정책상 컬쳐캐쉬로 살 수 없는 상품이 있어요.'] }), offline: null, confidence: 'official', sources: ['voucherUse', 'getCashHow'] },
  { id: 'ridi', name: '리디', aliases: ['리디북스', 'ridi', 'ridibooks', '리디 북스'], cat: 'content', online: ON('direct', { notes: ['상품권 번호를 리디에 직접 입력할 수는 없어요. 컬쳐캐쉬로 충전한 뒤 결제해요.'] }), offline: null, confidence: 'official', sources: ['voucherUse'] },

  // ── 게임 ─────────────────────────────────────────────
  {
    id: 'nexon',
    name: '넥슨',
    aliases: ['nexon', '넥슨캐시', '던파', '피파온라인', 'fc온라인'],
    cat: 'game',
    online: ON('direct', { pin: true, limit: '상품권 번호 직접 입력은 월 20만원(넥슨 공지, 2023-08 변경)' }),
    offline: null,
    extra: [{ kind: 'coupon', label: '넥슨카드 쿠폰도 컬쳐캐쉬로 구매 가능' }],
    confidence: 'official',
    sources: ['useCash', 'nexonNotice', 'nexonLimit'],
    note: '넥슨은 충전 없이 넥슨 충전창에 16자리 번호를 바로 넣을 수도 있어요.',
  },
  { id: 'netmarble', name: '넷마블', aliases: ['netmarble', '넷마블캐시'], cat: 'game', online: ON('direct'), offline: null, confidence: 'official', sources: ['useCash'] },
  { id: 'plaync', name: '엔씨소프트(PlayNC)', aliases: ['엔씨', 'ncsoft', 'plaync', '플레이엔씨', '리니지', '엔씨소프트'], cat: 'game', online: ON('direct'), offline: null, confidence: 'official', sources: ['useCash'] },
  { id: 'steam', name: '스팀', aliases: ['steam', '스팀월렛'], cat: 'game', online: ON('direct'), offline: null, confidence: 'official', sources: ['useCash'] },
  { id: 'lol', name: '리그 오브 레전드', aliases: ['롤', 'lol', '리그오브레전드', '라이엇', 'riot', '롤rp'], cat: 'game', online: ON('direct'), offline: null, confidence: 'official', sources: ['useCash'] },
  { id: 'roblox', name: '로블록스', aliases: ['roblox', '로벅스', '로블'], cat: 'game', online: ON('coupon'), offline: null, confidence: 'official', sources: ['useCash'] },
  { id: 'psstore', name: 'PlayStation Store', aliases: ['ps스토어', 'psstore', '플레이스테이션', '플스', 'psn', '플스스토어'], cat: 'game', online: ON('coupon', { notes: ['PS Store 기프트카드 쿠폰을 구매해 등록해요.'] }), offline: null, confidence: 'official', sources: ['useCash'] },
  {
    id: 'googleplay',
    name: 'Google Play',
    aliases: ['구글플레이', '구글', 'google', '플레이스토어', '구글기프트카드', '구글 기프트코드', '유튜브', 'youtube', '유튜브프리미엄'],
    cat: 'game',
    online: ON('giftcode', { fee: 0.03, limit: '5천원~20만원(8종)' }),
    offline: null,
    confidence: 'official',
    sources: ['googleBuy'],
  },
  { id: 'nintendo', name: '닌텐도 eShop', aliases: ['닌텐도', 'nintendo', 'eshop', '닌텐도이숍', '스위치'], cat: 'game', online: ON('unknown'), offline: null, confidence: 'unverified', sources: ['useCash', 'voucherUse'], note: '공식 사용처·쿠폰 목록에서 찾지 못했어요(2026-11-06 기준).' },

  // ── 웹툰·콘텐츠 ──────────────────────────────────────
  { id: 'naverwebtoon', name: '네이버웹툰', aliases: ['네이버 웹툰', '네웹', '웹툰쿠키', '쿠키'], cat: 'content', online: ON('coupon', { notes: ['2026년 10월 쿠폰 서비스가 새로 열렸어요(공지).'] }), offline: null, confidence: 'official', sources: ['useCash', 'notice'] },
  { id: 'kakaopage', name: '카카오페이지', aliases: ['카카오 페이지', '카카오웹툰'], cat: 'content', online: ON('direct'), offline: null, confidence: 'official', sources: ['useCash'] },
  { id: 'kakaoemoticon', name: '카카오 이모티콘', aliases: ['카카오이모티콘', '이모티콘', '카톡이모티콘'], cat: 'content', online: ON('direct', { notes: ['PC에서 결제해야 하는 경우가 있어요(2차 출처).'] }), offline: null, confidence: 'official', sources: ['useCash'] },
  { id: 'disneyplus', name: '디즈니+', aliases: ['디즈니플러스', 'disney+', 'disneyplus', '디즈니'], cat: 'content', online: ON('unknown'), offline: null, confidence: 'unverified', sources: ['useCash', 'cpnMain'], checkedAt: OFFICIAL_CHECKED_AT, note: '2026-11-12 기준 공식 사용처 목록과 쿠폰 목록에서 찾지 못했어요. 이전에는 쿠폰으로 살 수 있었어요.' },
  { id: 'bugs', name: '벅스', aliases: ['bugs', '벅스뮤직'], cat: 'culture', online: ON('direct'), offline: null, confidence: 'official', sources: ['useCash'] },

  // ── 쇼핑 ─────────────────────────────────────────────
  { id: 'coupang', name: '쿠팡', aliases: ['coupang', '쿠팡캐시', '쿠팡이츠', '로켓배송'], cat: 'shopping', online: conv('coupang'), offline: null, confidence: 'official', sources: ['getCashHow', 'useCash'], note: '쿠팡 결제창에는 컬쳐캐쉬가 없어요. 쿠팡캐시로 전환해서 써요.' },
  { id: 'gmarket', name: '스마일머니(G마켓·옥션)', aliases: ['스마일머니', 'g마켓', '지마켓', 'gmarket', '옥션', 'auction', '스마일캐시', '스마일페이'], cat: 'finance', online: conv('smile'), offline: null, confidence: 'official', sources: ['smile', 'useCash'], note: '공식 목록에는 ‘스마일머니’(금융)로 올라 있어요. 전환한 스마일머니를 G마켓·옥션 결제에 써요.' },
  { id: '11st', name: '11번가', aliases: ['11번가', '십일번가', '11st', '11pay'], cat: 'shopping', online: conv('pay11'), offline: null, confidence: 'official', sources: ['pay11', 'getCashHow'] },
  { id: 'ssg', name: 'SSG.COM', aliases: ['ssg', '쓱', '쓱닷컴', '이마트몰', 'ssgmoney', 'ssg머니', '신세계몰'], cat: 'shopping', online: conv('ssg'), offline: null, confidence: 'official', sources: ['getCashHow'] },
  { id: 'gsshop', name: 'GS SHOP', aliases: ['gs샵', 'gsshop', '지에스샵', 'gs홈쇼핑'], cat: 'shopping', online: ON('direct'), offline: null, confidence: 'official', sources: ['useCash'] },
  { id: 'lottehomeshopping', name: '롯데홈쇼핑', aliases: ['롯데 홈쇼핑', '롯데아이몰', 'lotteimall'], cat: 'shopping', online: ON('direct'), offline: null, confidence: 'official', sources: ['useCash'] },
  { id: 'bunjang', name: '번개장터', aliases: ['번장', '번개 장터'], cat: 'shopping', online: ON('direct'), offline: null, confidence: 'official', sources: ['useCash'] },
  {
    id: 'daiso',
    name: '다이소',
    aliases: ['daiso', '다이소몰', '다있소'],
    cat: 'shopping',
    online: ON('direct', { notes: ['다이소몰 결제창에서 컬쳐캐쉬를 선택해요.', '이용 수수료는 공식 안내에서 확인되지 않았어요(앱 배너: 오픈 기념 수수료 지원).'] }),
    offline: OFF('unknown'),
    confidence: 'official',
    sources: ['shpMain', 'daisoFaq', 'offlinePopup'],
    note: '다이소 매장은 공식 오프라인 사용처(28곳)에 없어요. 다이소몰(온라인)에서 쓰세요.',
  },

  // ── 카페·외식 ────────────────────────────────────────
  { id: 'starbucks', name: '스타벅스', aliases: ['starbucks', '스벅', '별다방'], cat: 'food', online: null, offline: OFF('coupon', { feeText: '확인 필요(로그인 후 표시)', notes: ['스타벅스 계산대에서 컬쳐캐쉬로 바로 결제할 수는 없어요. 쿠폰을 사서 써요.'] }), confidence: 'official', sources: ['cpnMain', 'useCash'] },
  { id: 'ediya', name: '이디야커피', aliases: ['이디야', 'ediya'], cat: 'food', online: null, offline: OFF('coupon'), confidence: 'official', sources: ['cpnMain', 'useCash'] },
  { id: 'oliveyoung', name: '올리브영', aliases: ['oliveyoung', '올영', '올리브 영'], cat: 'shopping', online: null, offline: OFF('coupon', { feeText: '확인 필요(로그인 후 표시)', notes: ['올리브영 기프트카드 쿠폰을 사서 써요. 매장 계산대 직접 결제는 공식 목록에 없어요.'] }), confidence: 'official', sources: ['cpnMain', 'useCash'] },
  { id: 'cjfoodville', name: 'CJ푸드빌(뚜레쥬르·빕스)', aliases: ['뚜레쥬르', '빕스', 'cj푸드빌', 'vips'], cat: 'food', online: null, offline: OFF('coupon'), confidence: 'official', sources: ['cpnMain', 'useCash'] },
  {
    id: 'eland',
    name: '애슐리 등 이랜드 외식',
    aliases: ['애슐리', '애슐리퀸즈', '피자몰', '자연별곡', '반궁', '로운샤브샤브', '리미니', '테루', '푸드엠파이어', '싱카이', '키사라', '이랜드', '이랜드외식'],
    cat: 'offline',
    places: 11,
    online: null,
    offline: BARCODE,
    confidence: 'official',
    sources: ['offlinePopup'],
    note: '공식 오프라인 사용처: 애슐리·애슐리퀸즈·피자몰·자연별곡·반궁·로운샤브샤브·리미니·테루·푸드엠파이어·싱카이·키사라',
  },
  { id: 'dalkomm', name: '달콤커피', aliases: ['달콤', 'dalkomm', '달콤 커피'], cat: 'offline', online: null, offline: BARCODE, confidence: 'official', sources: ['offlinePopup'] },
  { id: 'beansbins', name: '빈스빈스', aliases: ['빈스 빈스', 'beansbins'], cat: 'offline', online: null, offline: BARCODE, confidence: 'official', sources: ['offlinePopup'] },
  { id: 'nyburger', name: '뉴욕버거', aliases: ['뉴욕 버거'], cat: 'offline', online: null, offline: BARCODE, confidence: 'official', sources: ['offlinePopup'] },

  // ── 포인트·페이 ──────────────────────────────────────
  { id: 'naverpay', name: '네이버페이', aliases: ['npay', '엔페이', '네이버포인트', '네이버 페이', '네이버쇼핑', '네이버 쇼핑', '스마트스토어', '네이버'], cat: 'shopping', online: conv('npay', { notes: ['전환한 포인트는 취소·현금영수증이 안 돼요.'] }), offline: null, confidence: 'official', sources: ['npay', 'getCashHow'] },
  { id: 'payco', name: 'PAYCO', aliases: ['페이코', 'payco포인트'], cat: 'finance', online: conv('payco'), offline: null, confidence: 'official', sources: ['getCashHow'] },
  { id: 'lpoint', name: 'L.POINT', aliases: ['엘포인트', 'lpoint', 'l포인트', '롯데포인트'], cat: 'finance', online: conv('lpoint', { notes: ['롯데카드 사용처에서는 쓸 수 없어요.'] }), offline: null, confidence: 'official', sources: ['getCashHow'] },
  { id: 'hpoint', name: 'H.Point', aliases: ['에이치포인트', 'hpoint', 'h포인트', '현대포인트'], cat: 'finance', online: conv('hpoint'), offline: null, confidence: 'official', sources: ['getCashHow'] },
  { id: 'happypoint', name: '해피포인트', aliases: ['happypoint', '파리바게뜨', '배스킨라빈스', '배라', '던킨'], cat: 'food', online: conv('happy', { notes: ['전환한 해피포인트를 쓰는 곳은 해피포인트 안내를 따라요.'] }), offline: null, confidence: 'official', sources: ['getCashHow'] },
  {
    id: 'kakaopay',
    name: '카카오페이',
    aliases: ['kakaopay', '카카오페이포인트', '카카오 페이'],
    cat: 'finance',
    online: ON('unknown'),
    offline: null,
    confidence: 'unverified',
    sources: ['convsMain'],
    note: '공식 전환 목록(모바일·PC)에 카카오페이는 없어요. 앱 홈의 "카카오페이포인트 적립" 배너는 전환이 아닌 혜택 배너로 보여요. 앱에서 확인이 필요해요.',
  },
  { id: 'toss', name: '토스', aliases: ['toss', '토스페이', '토스포인트'], cat: 'finance', online: ON('unknown'), offline: null, confidence: 'unverified', sources: ['getCashHow'], note: '공식 사용처·전환 목록에서 찾지 못했어요(2026-11-06 기준).' },
];

// ── 공식 목록의 나머지 사용처 자동 생성 ──
// 위 M에 없는 공식 목록 항목은 이름·분야·이용 방식(바로 사용·쿠폰 구매·포인트 전환)만으로 기본 정보를 만든다.
const COUPON_NOTE = '쿠폰을 쓰는 곳과 방법은 받은 쿠폰의 안내를 따라요.';
const curated = new Set(M.map((m) => m.id));
for (const o of OFFICIAL_LIST) {
  if (curated.has(o.id)) continue;
  const has = (k) => o.kinds.includes(k);
  let online = null;
  let offline = null;
  const extra = [];
  if (has('V')) online = conv(o.conv);
  else if (has('D')) online = ON('direct');
  if (has('C')) {
    if (online) extra.push({ kind: 'coupon', label: `${o.name} 쿠폰도 컬쳐캐쉬로 구매 가능` });
    else if (o.where === 'offline') offline = OFF('coupon', { notes: [COUPON_NOTE] });
    else online = ON('coupon', { notes: [COUPON_NOTE] });
  }
  M.push({
    id: o.id,
    name: o.name,
    aliases: o.aliases || [],
    cat: o.cat,
    online,
    offline,
    ...(extra.length ? { extra } : {}),
    confidence: 'official',
    sources: ['useCash', ...(o.conv === 'gln' ? ['gln'] : has('V') ? ['convsMain'] : has('C') ? ['cpnMain'] : [])],
    checkedAt: OFFICIAL_CHECKED_AT,
  });
}

export const MERCHANTS = M.map((m) => ({ checkedAt: CHECKED_AT, ...m }));
export const MERCHANT_BY_ID = Object.fromEntries(MERCHANTS.map((m) => [m.id, m]));

// 분야 목록에 들어가는 사용처: 공식 목록에 있는 곳만(확인 필요 항목은 검색으로만 나온다).
// '오프라인 사용처'는 분야와 상관없이 매장에서 바코드로 쓸 수 있는 곳 전부.
export const inCategory = (m, cat) => !m.group && m.confidence !== 'unverified' && (cat === 'offline' ? m.offline?.kind === 'barcode' : m.cat === cat);
// 표시용 곳 수(이랜드 외식 11곳처럼 여러 곳을 한 항목으로 묶은 경우 포함)
export const placeCount = (list) => list.reduce((n, m) => n + (m.places || 1), 0);

// 레인 → 판정
export const VERDICT = {
  ok: { label: '바로 사용 가능', tone: 'ok', icon: 'check' },
  indirect: { label: '바꿔서 사용 가능', tone: 'warn', icon: 'swap' },
  no: { label: '사용 불가', tone: 'no', icon: 'x' },
  unknown: { label: '확인 필요', tone: 'muted', icon: 'question' },
  na: { label: '해당 없음', tone: 'muted', icon: 'dash' },
};

export function laneVerdict(lane) {
  if (!lane) return 'na';
  if (lane.kind === 'direct' || lane.kind === 'barcode') return 'ok';
  if (lane.kind === 'convert' || lane.kind === 'coupon' || lane.kind === 'giftcode') return 'indirect';
  if (lane.kind === 'none') return 'no';
  return 'unknown';
}

export function merchantVerdict(m) {
  const v = [laneVerdict(m.online), laneVerdict(m.offline)];
  if (v.includes('ok')) return 'ok';
  if (v.includes('indirect')) return 'indirect';
  if (v.includes('unknown')) return 'unknown';
  return 'no';
}

export const LANE_LABEL = {
  direct: '결제창에서 컬쳐캐쉬로 바로 결제',
  barcode: '계산대에서 바코드 제시',
  convert: '포인트로 전환한 뒤 결제',
  coupon: '모바일 쿠폰을 사서 사용',
  giftcode: '기프트코드를 사서 등록',
  none: '사용할 수 없음',
  unknown: '공식 목록에서 확인되지 않음',
};
