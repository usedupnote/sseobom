// 정보 출처 목록. 모든 사용처·안내 문구는 이 키로 출처를 단다.
// kind: official(컬쳐랜드 공식) · guide(대회 가이드에 실린 컬쳐랜드 자료) · secondary(제휴사 공지·언론·블로그)
export const CHECKED_AT = '2026-11-06';

export const SOURCES = {
  voucherUse: {
    label: '컬쳐랜드상품권 사용처 안내(모바일)',
    url: 'https://m.cultureland.co.kr/vchr/culturevoucherUse.do',
    kind: 'official',
  },
  useCash: {
    label: '컬쳐캐쉬 사용처(PC, 총 154곳)',
    url: 'https://www.cultureland.co.kr/usecash/useCash.do',
    kind: 'official',
  },
  getCashHow: {
    label: '컬쳐캐쉬 사용 방법',
    url: 'https://www.cultureland.co.kr/usecash/getCashHow.do',
    kind: 'official',
  },
  cashGuide: {
    label: '컬쳐캐쉬 이용 가이드',
    url: 'https://www.cultureland.co.kr/guide/culturecashGuide.do',
    kind: 'official',
  },
  mobileVoucher: {
    label: '컬쳐랜드상품권(모바일) 안내',
    url: 'https://www.cultureland.co.kr/voucher/mobile.do',
    kind: 'official',
  },
  chargeMain: {
    label: '컬쳐캐쉬 충전 안내',
    url: 'https://www.cultureland.co.kr/charge/main.do',
    kind: 'official',
  },
  userType: {
    label: '회원 유형·보유한도 안내',
    url: 'https://www.cultureland.co.kr/guide/changeUserType.do',
    kind: 'official',
  },
  faq: {
    label: '고객센터 자주 묻는 질문',
    url: 'https://www.cultureland.co.kr/customer/customerMain.do',
    kind: 'official',
  },
  notice: {
    label: '공지사항',
    url: 'https://www.cultureland.co.kr/customer/notice/noticeList.do',
    kind: 'official',
  },
  policyMobile: {
    label: '컬쳐랜드상품권 이용약관',
    url: 'https://www.cultureland.co.kr/etc/policyCash_mobilePin.do',
    kind: 'official',
  },
  smartMunsang: {
    label: '스마트문상 안내',
    url: 'https://www.cultureland.co.kr/voucher/smart_munsang.do',
    kind: 'official',
  },
  googleBuy: {
    label: 'Google Play 기프트코드 구매',
    url: 'https://www.cultureland.co.kr/google/googleBuy.do',
    kind: 'official',
  },
  npay: {
    label: '네이버페이 포인트 전환 안내',
    url: 'https://www.cultureland.co.kr/conversion/naverpay_bridge.do',
    kind: 'official',
  },
  smile: {
    label: '스마일캐시 전환 안내',
    url: 'https://www.cultureland.co.kr/conversion/smilecash_bridge.do',
    kind: 'official',
  },
  pay11: {
    label: '11pay 포인트 전환 안내',
    url: 'https://www.cultureland.co.kr/conversion/skpaypoint_bridge.do',
    kind: 'official',
  },
  coupangBridge: {
    label: '쿠팡캐시 전환 안내',
    url: 'https://www.cultureland.co.kr/conversion/coupang_bridge.do',
    kind: 'official',
  },
  convsMain: {
    label: '캐쉬 전환 목록(모바일)',
    url: 'https://m.cultureland.co.kr/convs/convsMain.do',
    kind: 'official',
  },
  cpnMain: {
    label: '모바일 쿠폰 구매 목록(모바일)',
    url: 'https://m.cultureland.co.kr/cpn/cpnMain.do',
    kind: 'official',
  },
  shpMain: {
    label: '쇼핑몰 바로사용 목록(모바일)',
    url: 'https://m.cultureland.co.kr/shp/shpMain.do',
    kind: 'official',
  },
  offlinePopup: {
    label: '오프라인 사용처 안내(사용처 페이지 팝업, 28곳)',
    url: 'https://www.cultureland.co.kr/usecash/useCash.do',
    kind: 'official',
  },
  cashTerms: {
    label: '컬쳐캐쉬 이용약관 제9조(환불, 2026-06-22 시행)',
    url: 'https://m.cultureland.co.kr/agreement/agreement.do',
    kind: 'official',
  },
  nexonLimit: {
    label: '넥슨 공지: 컬쳐랜드상품권 월 한도 15만→20만원(2023-08-03)',
    url: 'http://notice.nexon.com/Notice/NoticeView?sn=118607&pageno=31&maskgamecode=65536',
    kind: 'secondary',
  },
  daisoFaq: {
    label: '다이소몰 FAQ(결제수단: 문화상품권(컬처랜드))',
    url: 'https://www.daiso.co.kr/cs/faq?cid=21',
    kind: 'secondary',
  },
  missionGuide: {
    label: '컬쳐랜드 Y-AI 사전 미션 가이드 3·4쪽(앱 화면·MMS 상품권 예시)',
    url: '',
    kind: 'guide',
  },
  nexonNotice: {
    label: '넥슨 공지: 컬쳐랜드상품권 결제 안내(2023-01-12)',
    url: 'https://maplestory.nexon.com/News/Notice/139837',
    kind: 'secondary',
  },
};

export const KIND_LABEL = {
  official: '공식',
  guide: '공식 자료',
  secondary: '2차 출처',
  unverified: '확인 필요',
};
