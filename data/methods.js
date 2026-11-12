// 이용 방식별 단계 템플릿. 문구는 공식 안내(사용 방법·사용처 안내·충전 안내)를 이용자 말투로 옮긴 것.
// {name}=사용처명, {target}=전환 포인트명, {fee}=수수료 문구
// needsCash: 컬쳐캐쉬 잔액이 있어야 하는 방식 → 보유 상품권이 cl16이면 앞에 충전 단계를 붙인다.

export const CHARGE_STEP = {
  id: 'charge',
  title: '상품권을 컬쳐캐쉬로 충전하기',
  body: '컬쳐랜드 앱에 로그인한 뒤 [충전] › [컬쳐랜드상품권(모바일문화상품권)]에서 16자리 번호를 입력해요. 받은 문자의 [컬쳐캐쉬 바로충전] 링크를 눌러도 돼요.',
  tip: '상품권 충전 한도는 따로 없지만, 계정 보유한도(본인인증 50만원)를 넘는 금액은 대기 캐쉬로 들어가요. 번호를 20회 이상 틀리면 하루 동안 충전이 막혀요.',
  action: { label: '충전 화면 열기', to: 'mock/charge' },
  sources: ['mobileVoucher', 'chargeMain', 'userType'],
};

// 선물·경품으로 받은 상품권(gift)을 갖고 있으면 맨 앞에 붙는 단계
export const EXCHANGE_STEP = {
  id: 'exchange',
  title: '[교환소]에서 상품권으로 교환하기',
  body: '카카오톡·아이넘버·기프티쇼·이벤트 경품으로 받은 상품권은 컬쳐랜드 [교환소]에서 먼저 상품권으로 바꿔요.',
  tip: '교환한 상품권의 유효기간과 사용 조건은 교환소 화면과 받은 상품권 안내에서 확인해 주세요.',
  action: { label: '교환소 화면 열기', to: 'mock/exchange' },
  sources: ['chargeMain', 'exchange'],
};

export const METHODS = {
  'barcode-mms': {
    id: 'barcode-mms',
    label: '받은 문자 바코드로',
    short: '문자 바코드',
    channel: 'offline',
    needsCash: false,
    forVoucher: ['cl16'],
    summary: '충전 없이, 문자로 받은 상품권 바코드를 계산대에 보여주면 끝',
    prep: ['문자(MMS)로 받은 컬쳐랜드상품권', '결제할 금액만큼 남은 잔액'],
    steps: [
      {
        title: '받은 문자에서 상품권 열기',
        body: '컬쳐랜드상품권 문자(MMS)를 열어 바코드가 보이게 해요. 화면 밝기를 올리면 인식이 잘 돼요.',
        action: { label: '시연용 상품권 문자 보기', to: 'mock/mms' },
      },
      {
        title: '{name} 계산대에서 바코드 보여주기',
        body: '"컬쳐랜드상품권으로 결제할게요"라고 말하고 바코드를 보여줘요. 인식이 안 되면 바코드 아래 16자리 번호로 결제할 수 있어요.',
      },
      {
        title: '남은 금액 확인하기',
        body: '잔액 관리형이라 남은 금액은 다음에 나눠 쓸 수 있어요. 문자의 [사용처/잔액안내]에서 남은 금액을 확인해요.',
        action: { label: '문자에서 잔액 안내 보기', to: 'mock/mms' },
      },
    ],
    cautions: ['오프라인 전용으로 발행된 상품권은 컬쳐캐쉬 충전이 안 돼요(매장에서만 사용).'],
    sources: ['voucherUse', 'mobileVoucher'],
  },
  'barcode-app': {
    id: 'barcode-app',
    label: '앱 바코드로',
    short: '앱 바코드',
    channel: 'offline',
    needsCash: true,
    summary: '충전한 컬쳐캐쉬로 앱 [바코드 결제]를 열어 계산대에 제시',
    prep: ['컬쳐랜드 앱 로그인', '컬쳐캐쉬 잔액'],
    steps: [
      {
        title: '앱 홈에서 [바코드 결제] 누르기',
        body: '컬쳐랜드 앱 홈 화면의 [바코드 결제]를 눌러요.',
        action: { label: '바코드 결제 화면 열기', to: 'mock/barcode' },
      },
      {
        title: '사용처 고르고 바코드 띄우기',
        body: '사용할 곳({name})을 고르면 결제용 바코드가 나타나요.',
      },
      {
        title: '계산대에서 바코드 보여주고 결제',
        body: '직원에게 바코드를 보여주면 컬쳐캐쉬에서 금액이 빠져나가요. 결제 후 앱에서 잔액을 확인해요.',
      },
    ],
    cautions: ['본인인증 회원이 아니면 일부 사용처 이용이 제한될 수 있어요.'],
    sources: ['voucherUse', 'appStore'],
  },
  direct: {
    id: 'direct',
    label: '결제창에서 바로',
    short: '바로사용',
    channel: 'online',
    needsCash: true,
    summary: '{name} 결제 화면에서 결제수단으로 컬쳐캐쉬 선택',
    prep: ['컬쳐랜드 계정(아이디·비밀번호)', '컬쳐캐쉬 잔액', '{name} 회원 로그인(비회원 주문 불가)'],
    steps: [
      {
        title: '{name}에서 결제 단계까지 진행',
        body: '사고 싶은 상품·충전 금액을 고른 뒤 결제 화면으로 가요. 컬쳐랜드 앱 [쇼핑](바로사용) 메뉴에서 {name}을 눌러 들어가도 돼요.',
      },
      {
        title: '결제수단에서 "컬쳐랜드 컬쳐캐쉬" 선택',
        body: '결제수단 목록에서 컬쳐랜드(컬쳐캐쉬)를 고르고, 뜨는 창에서 컬쳐랜드 계정으로 로그인해요.',
      },
      {
        title: '잔액 확인 후 결제 완료',
        body: '사용할 금액을 확인하고 결제해요. 잔액이 모자라면 다른 결제수단과 함께 쓰는 복합결제가 가능한 곳도 있어요.',
      },
    ],
    cautions: ['제휴사 정책에 따라 컬쳐캐쉬로 살 수 없는 상품이 있어요.', '비회원 주문에는 쓸 수 없어요.'],
    sources: ['getCashHow', 'voucherUse'],
  },
  pin: {
    id: 'pin',
    label: '상품권 번호 직접 입력',
    short: '번호 입력',
    channel: 'online',
    needsCash: false,
    forVoucher: ['cl16'],
    summary: '충전 없이 {name} 충전창에 상품권 16자리 번호를 바로 입력',
    prep: ['문자로 받은 컬쳐랜드상품권 16자리 번호', '{name} 계정 로그인'],
    steps: [
      {
        title: '{name} 충전창 열기',
        body: '{name} 홈페이지(또는 게임 안 상점)의 캐시 충전 화면으로 가요.',
      },
      {
        title: '[상품권] › [컬쳐랜드상품권] 선택',
        body: '결제수단에서 상품권 › 컬쳐랜드상품권을 골라요.',
      },
      {
        title: '16자리 번호 입력 → 충전',
        body: '받은 문자의 16자리 번호를 입력하면 {name} 캐시로 충전돼요.',
      },
    ],
    cautions: ['넥슨 공지 기준 상품권 직접 결제는 월 20만원까지예요.'],
    sources: ['nexonNotice', 'nexonLimit'],
  },
  convert: {
    id: 'convert',
    label: '{target}로 전환해서',
    short: '포인트 전환',
    channel: 'online',
    needsCash: true,
    // {feeNote}·{feeBody}: 수수료가 공개된 곳은 "수수료 6%", 아닌 곳은 "전환 화면에서 확인"으로 채운다(guide.js)
    // {payWhere}·{payTitle}·{payBody}: 쇼핑몰 전환(쿠팡 등)은 "{name}에서", 포인트 자체가 사용처면 "{target}을 받는 곳에서"
    summary: '컬쳐캐쉬를 {target}(으)로 바꿔서 {payWhere} 결제 · {feeNote}',
    prep: ['휴대폰 본인인증 회원', '컬쳐랜드와 {name} 계정 명의가 같을 것', '컬쳐캐쉬 잔액'],
    steps: [
      {
        title: '앱 [전환]에서 {target} 선택',
        body: '컬쳐랜드 앱 홈의 [전환]을 누르고 {target}을(를) 골라요. 처음 한 번은 제3자 정보제공 동의가 필요해요.',
        action: { label: '전환 화면 열기', to: 'mock/convert' },
      },
      {
        title: '전환 금액 입력 → [전환하기]',
        body: '{feeBody} 결제 금액을 확인하고 완료해요.',
        calculator: true,
      },
      {
        title: '{payTitle}',
        body: '{payBody}',
      },
    ],
    cautions: ['전환 후에는 취소할 수 없어요.', '하루에 전환할 수 있는 금액이 정해져 있어요.'],
    sources: ['getCashHow', 'cashGuide'],
  },
  coupon: {
    id: 'coupon',
    label: '모바일 쿠폰으로',
    short: '쿠폰 구매',
    channel: 'offline',
    needsCash: true,
    summary: '컬쳐캐쉬로 {name} 모바일 쿠폰을 사서 매장·앱에서 사용',
    prep: ['컬쳐캐쉬 잔액', '쿠폰을 받을 휴대폰 번호'],
    steps: [
      {
        title: '앱 [쿠폰]에서 {name} 고르기',
        body: '컬쳐랜드 앱 홈의 [쿠폰]에서 {name}과(와) 금액(권종)을 골라요.',
        action: { label: '쿠폰 화면 열기', to: 'mock/coupon' },
      },
      {
        title: '받는 번호·결제수단 선택',
        body: '쿠폰 받을 번호를 확인하고 결제수단으로 컬쳐캐쉬를 선택해 구매해요.',
      },
      {
        title: '받은 쿠폰을 {name}에서 사용',
        body: '휴대폰으로 받은 쿠폰 바코드를 매장(또는 앱)에서 보여주고 써요.',
      },
    ],
    cautions: ['쿠폰마다 사용 매장·유효기간이 달라요. 받은 쿠폰의 안내를 확인하세요.'],
    sources: ['voucherUse', 'useCash'],
  },
  giftcode: {
    id: 'giftcode',
    label: '기프트코드로',
    short: '기프트코드',
    channel: 'online',
    needsCash: true,
    summary: '컬쳐캐쉬로 Google Play 기프트코드를 사서 Play 스토어에 등록 · 수수료 {fee}',
    prep: ['컬쳐캐쉬 잔액', 'Google 계정'],
    steps: [
      {
        title: '앱 [Google]에서 권종 고르기',
        body: '컬쳐랜드 앱 홈의 [Google]을 눌러 금액(5천원~20만원)을 골라요. 받은 문자의 [Google Play 기프트 코드 바로충전]으로도 들어갈 수 있어요.',
        action: { label: '기프트코드 화면 열기', to: 'mock/giftcode' },
      },
      {
        title: '컬쳐캐쉬로 구매(수수료 {fee})',
        body: '결제하면 기프트코드가 발급돼요.',
      },
      {
        title: 'Play 스토어 › [코드 사용]에 입력',
        body: 'Play 스토어 앱의 프로필 › 결제 및 구독 › [코드 사용]에 입력하면 Google Play 잔액으로 들어가요. YouTube 결제에도 쓸 수 있어요.',
      },
    ],
    cautions: ['발급된 코드는 남에게 알려주지 마세요. 코드를 요구하는 연락은 사기일 수 있어요.'],
    sources: ['googleBuy'],
  },
};

// 사용처 레인(kind) → 안내 방식 id
export function routesForLane(lane) {
  if (!lane) return [];
  switch (lane.kind) {
    case 'barcode':
      return ['barcode-mms', 'barcode-app'];
    case 'direct':
      return lane.pin ? ['pin', 'direct'] : ['direct'];
    case 'convert':
      return ['convert'];
    case 'coupon':
      return ['coupon'];
    case 'giftcode':
      return ['giftcode'];
    default:
      return [];
  }
}
