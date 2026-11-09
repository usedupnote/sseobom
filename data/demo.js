// 시연용 가상 데이터 — 실제 회원·잔액·바코드가 아니에요. 화면에는 항상 "시연용" 표시를 붙인다.
export const DEMO = {
  userName: '김컬쳐',
  cashBalance: 12000, // 사용가능 금액(원)
  safeBalance: 0, // 안심금고 보관 금액(원)
  voucherAmount: 10000, // 문자로 받은 상품권 금액
  barcodeNo: '1234 5678 9012 3456', // 미션 가이드 예시와 같은 형식의 가짜 번호
  pinDemo: ['1234', '5678', '9012', '3456'],
  purchase: 4500, // 편의점 시연 결제 금액
  favorites: ['coupang', 'starbucks', 'cgv'],
  giftcodeDemo: 'DEMO-XXXX-XXXX-XXXX',
  customerCenter: '1577-2111',
};
