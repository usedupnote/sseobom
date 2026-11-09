// 규칙 기반 질문 해석기 — 서버·API 없이 브라우저에서 동작.
// 입력: 사용처명 / 카테고리 / 자연어 질문
// 출력: { merchants, category, channel, voucher, topic, matchedBy, typo, suggestions }
import { MERCHANTS, CATEGORIES } from '../data/merchants.js';

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export function choseong(str) {
  let out = '';
  for (const ch of str) {
    const c = ch.charCodeAt(0) - 0xac00;
    out += c >= 0 && c <= 11171 ? CHO[Math.floor(c / 588)] : ch;
  }
  return out;
}

const isChoOnly = (s) => s.length >= 2 && [...s].every((c) => CHO.includes(c));

// 공백·기호 제거 + 소문자 + 표기 통일
export function compact(s) {
  return s
    .toLowerCase()
    .replace(/7\s*-?\s*(eleven|일레븐)/g, '세븐일레븐')
    .replace(/[\s.,!?~'"“”‘’()·\-_/]/g, '');
}

// 토큰 끝의 조사·어미 떼기
const PARTICLES = /(에서는|에서도|에서|에선|에도|에는|에|은|는|이|가|을|를|도|로|으로|랑|이랑|하고|좀|이요|요|까지|부터|만)$/;
const tokenize = (s) =>
  s
    .toLowerCase()
    .replace(/[.,!?~'"“”‘’()·]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(PARTICLES, '') || t);

// ── 신호 사전 ───────────────────────────────────────────
// 'ask' = "문화상품권"처럼 16자리(컬쳐랜드)와 18자리(㈜문화상품권) 중 어느 쪽인지 모호한 표현
const VOUCHER_RULES = [
  { id: 'smart', re: /스마트\s*문상|스마트\s*문화\s*상품권/ },
  { id: 'cl16', re: /모바일\s*문화\s*상품권|16\s*자리|컬[쳐처]\s*랜드\s*상품권/ },
  { id: 'munsang18', re: /18\s*자리|온라인\s*문화\s*상품권/ },
  { id: 'gift', re: /기프티쇼|카톡\s*선물|카카오톡\s*선물|경품/ },
  { id: 'cash', re: /컬[쳐처]\s*캐[쉬시]|충전한\s*캐[쉬시]/ },
  { id: 'ask', re: /문화\s*상품권|문상|지류|종이\s*상품권/ },
];

const CHANNEL_RULES = [
  { id: 'offline', re: /매장|오프라인|가게|지점|현장|계산대|카운터|직접\s*가|가서|바코드|영화관에서|극장에서|서점에서/ },
  { id: 'online', re: /온라인|인터넷|사이트|홈페이지|결제창|쇼핑몰|웹에서|모바일\s*결제|앱\s*결제|인앱/ },
];

const TOPIC_RULES = [
  { id: 'refund', re: /환불|돌려받|현금으로/ },
  { id: 'balance', re: /잔액|남은\s*(돈|금액)|얼마\s*남/ },
  { id: 'charge', re: /충전/ },
  { id: 'convert', re: /전환|포인트로\s*바꾸|바꿔/ },
];

const CATEGORY_RULES = [
  { id: 'conv', re: /편의점/ },
  { id: 'culture', re: /영화|극장|시네마|관람/ },
  { id: 'book', re: /서점|도서|책|문구/ },
  { id: 'game', re: /게임|겜|아이템|현질/ },
  { id: 'content', re: /웹툰|웹소설|음악|ott|이모티콘|전자책/ },
  { id: 'shopping', re: /쇼핑|온라인\s*몰|택배|생필품/ },
  { id: 'food', re: /카페|커피|외식|식당|빵|디저트|화장품/ },
  { id: 'point', re: /포인트|페이(?!지)/ },
];

// ── 사용처 색인 ─────────────────────────────────────────
const INDEX = [];
for (const m of MERCHANTS) {
  const terms = new Set([m.name, ...(m.aliases || [])].map(compact));
  for (const t of terms) {
    if (!t) continue;
    INDEX.push({ id: m.id, term: t, short: t.length <= 2, latin: /^[a-z0-9+]+$/.test(t) });
  }
}
INDEX.sort((a, b) => b.term.length - a.term.length);

// 한글 음절을 자모로 풀어 오타 거리를 잰다('쿠펑'→'쿠팡'은 1, '쿠펑'→'쿠키'는 3)
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
function jamo(str) {
  const out = [];
  for (const ch of str) {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c >= 0 && c <= 11171) {
      out.push(CHO[Math.floor(c / 588)], JUNG[Math.floor((c % 588) / 28)]);
      if (c % 28) out.push(JONG[c % 28]);
    } else out.push(ch);
  }
  return out;
}

// 인접 전치까지 1로 세는 편집거리(OSA) — 'cvg'→'cgv' = 1
function distance(a, b) {
  if (a.join('') === b.join('')) return 0;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}
const jdist = (a, b) => distance(jamo(a), jamo(b));

function matchMerchants(raw) {
  const text = compact(raw);
  const tokens = tokenize(raw).map(compact);
  const found = [];
  let rest = text;
  for (const e of INDEX) {
    if (found.includes(e.id)) continue;
    // 짧은 별칭·영문 별칭은 토큰 단위로만(예: 'cu'가 'culture' 안에서 잡히지 않게)
    const hit = e.short || e.latin ? tokens.includes(e.term) : rest.includes(e.term);
    if (hit) {
      found.push(e.id);
      if (!e.short && !e.latin) rest = rest.split(e.term).join('·');
    }
  }
  // 그룹(편의점 4사)과 그 구성원이 함께 잡히면 구성원 우선
  const group = MERCHANTS.find((m) => m.group && found.includes(m.id));
  if (group && found.some((id) => group.group.includes(id))) {
    return found.filter((id) => id !== group.id);
  }
  return found;
}

// 질문에서 사용처 후보 단어만 남기기(동사·상품권 단어 제외)
const STOP = /^(컬쳐랜드|컬처랜드|상품권|문화상품권|컬쳐캐쉬|캐쉬|캐시|사용|사용처|쓸|수|있어|있나요|돼|되나요|되나|될까|돼요|되요|가능|가능해|가능한가요|써도|쓰는|쓰려면|어디|어디서|어떻게|방법|결제|매장|온라인|오프라인|에서|가서|하고|싶어|하나요|나요|해요|좀|알려줘|알려주세요)$/;

function fuzzy(raw) {
  const tokens = tokenize(raw)
    .map(compact)
    .filter((t) => t.length >= 2 && !STOP.test(t));
  const scored = [];
  for (const t of tokens) {
    if (isChoOnly(t)) {
      for (const e of INDEX) {
        const c = choseong(e.term);
        if (c === t) scored.push({ id: e.id, d: 0, via: 'choseong', from: t });
        else if (c.startsWith(t)) scored.push({ id: e.id, d: 0.5, via: 'choseong', from: t });
      }
      continue;
    }
    for (const e of INDEX) {
      if (e.latin !== /^[a-z0-9+]+$/.test(t)) continue;
      const d = jdist(t, e.term);
      const units = jamo(e.term).length;
      const max = units <= 4 ? 1 : 2;
      if (d <= max && d < units / 2) scored.push({ id: e.id, d, via: 'typo', from: t, to: e.term });
    }
  }
  scored.sort((a, b) => a.d - b.d);
  const ids = [...new Set(scored.map((s) => s.id))];
  return { ids, best: scored[0] || null };
}

export function parseQuery(raw = '') {
  const q = raw.trim();
  const res = {
    query: q,
    merchants: [],
    category: null,
    channel: null,
    voucher: null,
    topic: null,
    matchedBy: 'none',
    typo: null,
    suggestions: [],
  };
  if (!q) return res;

  res.voucher = VOUCHER_RULES.find((r) => r.re.test(q))?.id || null;
  res.channel = CHANNEL_RULES.find((r) => r.re.test(q))?.id || null;
  res.topic = TOPIC_RULES.find((r) => r.re.test(q))?.id || null;

  // 1) 사용처 이름·별칭
  const ids = matchMerchants(q);
  if (ids.length) {
    res.merchants = ids;
    res.matchedBy = 'name';
    if (res.topic === 'charge' || res.topic === 'convert') res.topic = null; // "쿠팡캐시로 전환" 같은 문장은 사용처 결과 우선
    return res;
  }

  // 2) 카테고리 키워드 (단독 카테고리 id 입력 포함)
  const cat = CATEGORIES.find((c) => c.label === q || c.id === q)?.id || CATEGORY_RULES.find((r) => r.re.test(q))?.id;
  if (cat && !(res.topic && cat === 'point')) {
    res.category = cat;
    res.matchedBy = 'category';
    // 편의점은 4사가 같은 방법이라 묶음 결과 하나로 바로 연결
    if (cat === 'conv') res.merchants = ['conv-all'];
    return res;
  }

  // 3) 상품권·충전·환불 같은 주제 질문
  if (res.topic || res.voucher) {
    res.matchedBy = 'topic';
    return res;
  }

  // 4) 초성·오타
  const fz = fuzzy(q);
  if (fz.ids.length && fz.best) {
    if (fz.best.via === 'choseong' || fz.ids.length <= 3) {
      res.merchants = fz.ids.slice(0, 5);
      res.matchedBy = fz.best.via;
      res.typo = fz.best.via === 'typo' ? { from: fz.best.from } : null;
      return res;
    }
  }

  // 5) 결과 없음 — 느슨한 제안
  res.suggestions = suggest(q);
  return res;
}

// 결과 없음일 때 비슷한 이름 제안(편집거리 3 이내 또는 앞글자 일치)
export function suggest(q) {
  const tokens = tokenize(q)
    .map(compact)
    .filter((t) => t.length >= 2 && !STOP.test(t));
  const out = new Map();
  for (const t of tokens) {
    for (const e of INDEX) {
      if (e.latin !== /^[a-z0-9+]+$/.test(t)) continue;
      const d = jdist(t, e.term);
      if (d <= 4 || e.term.startsWith(t.slice(0, 2))) {
        const prev = out.get(e.id);
        if (prev === undefined || d < prev) out.set(e.id, d);
      }
    }
  }
  return [...out.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4)
    .map(([id]) => id);
}

// 입력 중 자동완성: 이름·별칭·초성 접두
export function autocomplete(input, limit = 6) {
  const t = compact(input);
  if (!t) return [];
  const cho = isChoOnly(t);
  const out = [];
  for (const m of MERCHANTS) {
    if (m.group) continue;
    const terms = [m.name, ...(m.aliases || [])].map(compact);
    const hit = terms.some((term) => (cho ? choseong(term).startsWith(t) : term.startsWith(t) || term.includes(t)));
    if (hit) out.push(m.id);
    if (out.length >= limit) break;
  }
  return out;
}
