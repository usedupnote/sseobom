// 실행: node tests/parser.test.mjs
import { parseQuery, autocomplete } from '../js/parser.js';
import { MERCHANTS, MERCHANT_BY_ID, CATEGORIES, inCategory, placeCount, OFFLINE_TOTAL } from '../data/merchants.js';
import { OFFICIAL_LIST, OFFICIAL_TOTAL } from '../data/official-list.js';
import { SOURCES } from '../data/sources.js';
import { METHODS, routesForLane } from '../data/methods.js';

// 공식 목록에서 자동 생성한 사용처는 id가 순번이라 공식 표기로 찾는다
const idOf = (name) => OFFICIAL_LIST.find((o) => o.name === name)?.id;

const CASES = [
  // [질문, 기대값]
  ['편의점에서 컬쳐랜드상품권 써도 돼?', { merchants: ['conv-all'], voucher: 'cl16' }],
  ['편의점', { merchants: ['conv-all'] }],
  ['CU', { merchants: ['cu'] }],
  ['cu에서 결제되나요', { merchants: ['cu'] }],
  ['씨유 매장에서 바코드로', { merchants: ['cu'], channel: 'offline' }],
  ['7-Eleven', { merchants: ['seven'] }],
  ['쿠팡에서 쓸 수 있어?', { merchants: ['coupang'] }],
  ['쿠팡캐시로 전환', { merchants: ['coupang'], topic: null }],
  ['CGV', { merchants: ['cgv'] }],
  ['cgv 영화관에서 문화상품권 돼?', { merchants: ['cgv'], voucher: 'ask', channel: 'offline' }],
  ['스벅', { merchants: ['starbucks'] }],
  ['스타벅스에서 컬쳐캐쉬 쓰려면', { merchants: ['starbucks'], voucher: 'cash' }],
  ['네이버웹툰 쿠키', { merchants: ['naverwebtoon'] }],
  ['카카오페이지', { merchants: ['kakaopage'] }],
  ['카카오페이로 바꿀 수 있어?', { merchants: ['kakaopay'] }],
  ['문화상품권 18자리 충전되나요?', { merchants: [], voucher: 'munsang18', topic: 'charge', matchedBy: 'topic' }],
  ['스마트문상 충전', { voucher: 'smart', topic: 'charge' }],
  ['모바일문화상품권 충전 방법', { voucher: 'cl16', topic: 'charge' }],
  ['환불 받고 싶어요', { topic: 'refund', matchedBy: 'topic' }],
  ['잔액 확인', { topic: 'balance' }],
  ['닌텐도', { merchants: ['nintendo'] }],
  ['닌텐도 eShop', { merchants: ['nintendo'] }],
  ['영화 보고 싶어', { category: 'culture', matchedBy: 'category' }],
  ['게임', { category: 'game' }],
  ['카페', { category: 'food' }],
  ['ㅋㅍ', { merchants: ['coupang'], matchedBy: 'choseong' }],
  ['쿠펑', { merchants: ['coupang'], matchedBy: 'typo' }],
  ['메가빡스', { merchants: ['megabox'], matchedBy: 'typo' }],
  ['cvg', { merchants: ['cgv'], matchedBy: 'typo' }],
  ['알나딘', { merchants: ['aladin'], matchedBy: 'typo' }],
  ['배달의민족', { merchants: [], matchedBy: 'none' }],
  ['다이소 매장', { merchants: ['daiso'], channel: 'offline' }],
  ['애슐리', { merchants: ['eland'] }],
  ['컬쳐랜드 상품권 넥슨에서 충전', { merchants: ['nexon'], voucher: 'cl16' }],
  // 공식 목록 전체 반영(2026-11-12)
  ['한게임', { merchants: [idOf('한게임')] }],
  ['피망에서 써도 돼?', { merchants: [idOf('피망')] }],
  ['메이플스토리', { merchants: [idOf('메이플스토리')] }],
  ['star conflict 결제', { merchants: [idOf('Star Conflict')] }],
  ['CJ ONE 포인트로 전환', { merchants: [idOf('CJ ONE')] }],
  ['리디북스', { merchants: ['ridi'] }],
  ['스마일머니', { merchants: ['gmarket'] }],
  ['디즈니플러스', { merchants: ['disneyplus'] }],
  ['신세계상품권', { merchantSet: [idOf('신세계모바일(키오스크형)'), idOf('신세계모바일(Kiosk)'), idOf('신세계지류상품권')] }],
  ['오프라인 사용처', { category: 'offline' }],
  ['금융', { category: 'finance' }],
  ['문화생활', { category: 'culture' }],
  ['콘텐츠', { category: 'content' }],
];

let pass = 0;
const fails = [];
for (const [q, exp] of CASES) {
  const r = parseQuery(q);
  const bad = [];
  for (const [k, v] of Object.entries(exp)) {
    // merchantSet: 여러 곳이 함께 나와야 하는 경우(순서는 따지지 않음)
    const got = k === 'merchantSet' ? [...r.merchants].sort() : r[k];
    if (k === 'merchantSet') v.sort();
    const ok = Array.isArray(v) ? JSON.stringify(got) === JSON.stringify(v) : got === v;
    if (!ok) bad.push(`${k}: 기대 ${JSON.stringify(v)} / 실제 ${JSON.stringify(got)}`);
  }
  if (bad.length) fails.push(`✗ "${q}"\n    ${bad.join('\n    ')}`);
  else pass++;
}

// 자동완성
const ac = [
  ['쿠', 'coupang'],
  ['ㄱㅂ', 'kyobo'],
  ['메가', 'megabox'],
];
for (const [q, id] of ac) {
  const got = autocomplete(q);
  if (got.includes(id)) pass++;
  else fails.push(`✗ 자동완성 "${q}" → ${id} 없음 (${got.join(', ')})`);
}

// 데이터 무결성: 출처·확인일·신뢰도·안내 방식
for (const m of MERCHANTS) {
  const issues = [];
  if (!m.sources?.length) issues.push('출처 없음');
  for (const s of m.sources || []) if (!SOURCES[s]) issues.push(`알 수 없는 출처 키 ${s}`);
  if (!m.checkedAt) issues.push('확인일 없음');
  if (!['official', 'secondary', 'unverified'].includes(m.confidence)) issues.push('신뢰도 없음');
  for (const lane of [m.online, m.offline]) {
    for (const r of routesForLane(lane)) if (!METHODS[r]) issues.push(`안내 방식 없음 ${r}`);
  }
  if (m.group) for (const id of m.group) if (!MERCHANT_BY_ID[id]) issues.push(`그룹 구성원 없음 ${id}`);
  if (issues.length) fails.push(`✗ 데이터 ${m.id}: ${issues.join(', ')}`);
  else pass++;
}
// 공식 목록 반영: 153곳이 빠짐없이 들어 있고, 분야별 곳 수가 공식 목록과 같아야 한다
const check = (name, ok, detail = '') => (ok ? pass++ : fails.push(`✗ ${name} ${detail}`));
check('공식 목록 수', OFFICIAL_LIST.length === OFFICIAL_TOTAL && OFFICIAL_TOTAL === 153, `(${OFFICIAL_LIST.length})`);
check('id 중복 없음', new Set(MERCHANTS.map((m) => m.id)).size === MERCHANTS.length);
const lost = OFFICIAL_LIST.filter((o) => !MERCHANT_BY_ID[o.id]).map((o) => o.name);
check('공식 목록 전부 포함', !lost.length, lost.join(', '));
for (const c of CATEGORIES.filter((x) => x.id !== 'offline')) {
  const want = OFFICIAL_LIST.filter((o) => o.cat === c.id).length;
  const got = MERCHANTS.filter((m) => inCategory(m, c.id)).length;
  check(`분야 ${c.label} 곳 수`, want === got, `공식 ${want} / 화면 ${got}`);
}
const offline = MERCHANTS.filter((m) => inCategory(m, 'offline'));
check('오프라인 사용처 곳 수', placeCount(offline) === OFFLINE_TOTAL, `(${placeCount(offline)})`);
// 전환처는 공개된 수수료(숫자)나 '확인 필요' 문구 중 하나는 있어야 한다
const noFee = MERCHANTS.filter((m) => m.online?.kind === 'convert' && typeof m.online.fee !== 'number' && !m.online.feeText).map((m) => m.name);
check('전환 수수료 표기', !noFee.length, noFee.join(', '));

for (const [k, mth] of Object.entries(METHODS)) {
  for (const s of mth.sources || []) if (!SOURCES[s]) fails.push(`✗ 방식 ${k}: 알 수 없는 출처 키 ${s}`);
}

console.log(`통과 ${pass} / ${pass + fails.length}`);
if (fails.length) {
  console.log(fails.join('\n'));
  process.exit(1);
}
