// 이용자가 "가지고 있는 것" — 안내 단계를 바꾸는 기준.
// chargeable: 컬쳐캐쉬로 충전 가능 여부 / storeDirect: 매장에서 상품권 바코드를 그대로 제시 가능
export const VOUCHERS = {
  cl16: {
    id: 'cl16',
    short: '컬쳐랜드상품권',
    name: '컬쳐랜드상품권(문자로 받은 16자리)',
    aka: '옛 이름: 모바일문화상품권',
    digits: 16,
    chargeable: true,
    storeDirect: true,
    validity: '구매일로부터 5년(이벤트·제휴 판매분은 더 짧을 수 있음)',
    summary: '문자(MMS)로 받은 상품권 그대로 편의점·서점·영화관 매장에서 바코드로 쓸 수 있고, 컬쳐캐쉬로 충전하면 온라인·전환·쿠폰까지 쓸 수 있어요.',
    sources: ['mobileVoucher', 'policyMobile', 'nexonNotice'], // 16자리 표기는 넥슨 공지 원문에서 확인
  },
  cash: {
    id: 'cash',
    short: '컬쳐캐쉬',
    name: '컬쳐캐쉬(이미 충전함)',
    aka: '컬쳐랜드 계정에 충전된 잔액',
    digits: null,
    chargeable: true,
    storeDirect: false,
    validity: '충전일로부터 5년',
    summary: '이미 충전했다면 충전 단계 없이 바로 결제·전환·쿠폰 구매로 넘어가요. 매장에서는 컬쳐랜드 앱의 바코드 결제를 써요.',
    sources: ['cashGuide', 'faq'],
  },
  munsang18: {
    id: 'munsang18',
    short: '문화상품권(18자리)',
    name: '문화상품권(18자리, ㈜문화상품권 발행)',
    aka: '온라인·지류 문화상품권',
    digits: 18,
    chargeable: false,
    storeDirect: false,
    blocked: true,
    reason: '㈜문화상품권이 발행한 상품권이에요. 제휴가 끝나 컬쳐랜드 충전 서비스가 종료됐어요(온라인문화상품권은 2025년 8월 11일 종료).',
    alternative: '사용처는 ㈜문화상품권 홈페이지나 고객센터(1577-3111)에서 확인하세요.',
    issuerAsk: '발행사인 ㈜문화상품권 고객센터(1577-3111)', // 매장이 이 상품권을 직접 받는지 물어볼 곳
    sources: ['noticePaper', 'faq', 'nexonNotice'],
  },
  smart: {
    id: 'smart',
    short: '스마트문상',
    name: '스마트문상(게임 전용, 18자리)',
    aka: '게임 전용 무기명 상품권',
    digits: 18,
    chargeable: false,
    storeDirect: false,
    blocked: true,
    reason: '게임 전용 상품권이라 컬쳐캐쉬로 충전할 수 없어요. 제휴 게임 결제창에서 PIN을 직접 입력해 써요.',
    alternative: '스마트문상 안내 페이지에서 사용 가능한 게임을 확인하세요.',
    sources: ['smartMunsang'],
  },
  gift: {
    id: 'gift',
    short: '선물·경품 교환권',
    name: '카카오톡 선물·기프티쇼·경품으로 받은 교환권',
    aka: '교환소에서 상품권으로 바꾼 뒤 사용',
    digits: null,
    chargeable: 'exchange',
    storeDirect: false,
    reason: '카카오톡·아이넘버·기프티쇼·이벤트 경품으로 받은 상품권은 컬쳐랜드 [교환소]에서 먼저 상품권으로 교환한 뒤 충전해요.',
    sources: ['chargeMain', 'exchange'],
  },
};

// 지류(종이) 상품권 — 공식 공지(2026-01-09): ㈜문화상품권 발행, 제휴 종료로 2026-02-06 충전 서비스 종료(2022-12-31 이전 발행분 포함),
// 사용처 문의는 ㈜문화상품권 홈페이지·고객센터(1577-3111)
VOUCHERS.paper = {
  id: 'paper',
  short: '지류 상품권',
  name: '지류 상품권(종이 문화상품권)',
  aka: '㈜문화상품권이 발행한 종이 상품권',
  digits: 18,
  chargeable: false,
  storeDirect: false,
  blocked: true,
  reason: '㈜문화상품권이 발행한 종이 상품권이에요. 제휴가 끝나 컬쳐랜드 충전 서비스가 2026년 2월 6일에 종료됐어요(2022년 12월 31일 이전 발행분 포함).',
  alternative: '사용처는 ㈜문화상품권 홈페이지나 고객센터(1577-3111)에서 확인하세요.',
  issuerAsk: '발행사인 ㈜문화상품권 고객센터(1577-3111)',
  sources: ['noticePaper'],
};

// '내 상품권' 선택지 순서. 18자리 온라인문화상품권(munsang18)은 선택지에서 빼고, 질문에 "18자리"가 나오거나 판별 도우미에서만 쓴다.
export const VOUCHER_ORDER = ['cl16', 'cash', 'paper', 'smart', 'gift'];

// 판별 도우미: 받은 방식 + PIN 자릿수(숫자는 받지 않음) + 적힌 이름 → 상품권 종류
export function identifyVoucher({ received, digits, label }) {
  if (received === 'account') return 'cash';
  if (received === 'gift') return 'gift';
  if (received === 'paper') return 'paper'; // 종이 상품권은 자릿수를 묻지 않는다
  if (label === 'smart') return 'smart';
  if (digits === 18) return 'munsang18';
  if (digits === 16) return 'cl16';
  if (received === 'paper') return 'paper';
  if (received === 'mms' && label === 'cultureland') return 'cl16';
  return 'unknown';
}
