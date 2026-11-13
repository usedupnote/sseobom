// 예시 데이터 — 실제 회원·잔액·바코드가 아니에요. 화면에는 '예시'로 표시하고, 시연 페이지 안내와 문서에서 실제 정보와 구분한다.
export const DEMO = {
  userName: '김컬쳐',
  cashBalance: 12000, // 사용가능 금액(원)
  safeBalance: 0, // 안심금고 보관 금액(원)
  voucherAmount: 10000, // 문자로 받은 상품권 금액
  barcodeNo: '1234 5678 9012 3456', // 16자리 형식만 맞춘 가짜 번호
  pinDemo: ['1234', '5678', '9012', '3456'],
  purchase: 4500, // 편의점 시연 결제 금액
  favorites: ['coupang', 'starbucks', 'cgv'],
  giftcodeDemo: 'DEMO-XXXX-XXXX-XXXX',
  customerCenter: '1577-2111',

  // ── 일괄등록 시연용 가상 사진첩 ──
  // 실제 사진이 아니에요. 번호는 모두 가짜이고, 화면에는 앞뒤 4자리만 보여준다(가운데 8자리는 가림).
  // status: ok(16자리 컬쳐랜드상품권 — 등록 가능) · check(번호를 다 읽지 못함) · blocked(다른 회사 상품권 — 여기서는 지류 상품권)
  galleryTotal: 248,
  bulkPhotos: [
    { id: 'p1', type: 'cl16', amount: 10000, from: '문자 캡처', date: '11월 2일', head: '1234', tail: '3456', status: 'ok', sameAsMms: true },
    { id: 'p2', type: 'cl16', amount: 30000, from: '받은 이미지', date: '10월 24일', head: '2468', tail: '6813', status: 'ok' },
    { id: 'p3', type: 'cl16', amount: 5000, from: '화면 캡처', date: '9월 15일', head: '1357', tail: '2468', status: 'ok' },
    { id: 'p4', type: 'cl16', amount: null, from: '화면 캡처', date: '8월 30일', status: 'check' },
    { id: 'p5', type: 'paper', amount: 10000, from: '종이 상품권을 찍은 사진', date: '7월 3일', status: 'blocked' },
  ],
};
