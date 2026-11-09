// 내 상품권 판별 도우미 — 번호(PIN)는 받지 않고 받은 방식·자릿수·이름만 묻는다
import { icon, esc, topbar, sourceList } from '../ui.js';
import { VOUCHERS, identifyVoucher } from '../../data/vouchers.js';
import { setVoucher } from '../state.js';
import { go, rerender } from '../app.js';

const ans = { received: null, digits: null, label: null };
let lastBack = null;

const Q_RECEIVED = [
  ['mms', '문자(MMS)로 받았어요', 'msg'],
  ['paper', '종이 상품권이에요', 'ticket'],
  ['gift', '카톡 선물·기프티쇼·경품', 'gift'],
  ['account', '이미 컬쳐랜드에 충전했어요', 'wallet'],
];
const Q_DIGITS = [
  [16, '16자리'],
  [18, '18자리'],
  [0, '잘 모르겠어요'],
];
const Q_LABEL = [
  ['cultureland', '컬쳐랜드상품권 / 모바일문화상품권'],
  ['munsang', '문화상품권'],
  ['smart', '스마트문상'],
];

export function voucherView({ query }) {
  const back = query.get('back') || '#/search';
  if (back !== lastBack) {
    Object.assign(ans, { received: null, digits: null, label: null });
    lastBack = back;
  }
  const needDigits = ans.received && !['account', 'gift'].includes(ans.received);
  const needLabel = needDigits && ans.digits === 0;
  const ready = ans.received && (!needDigits || ans.digits === 16 || ans.digits === 18 || (needLabel && ans.label));
  const result = ready ? identifyVoucher(ans) : null;
  const v = result && VOUCHERS[result];

  const opts = (list, key) =>
    list
      .map(([val, label, ic]) => `<button class="opt ${ans[key] === val ? 'on' : ''}" data-k="${key}" data-val="${val}" aria-pressed="${ans[key] === val}">${ic ? icon(ic, 18) : ''}${esc(label)}</button>`)
      .join('');

  const resultCard = !ready
    ? ''
    : v
      ? `<article class="card" aria-live="polite">
          <div class="callout ${v.blocked ? 'callout-no' : v.chargeable === true ? 'callout-info' : 'callout-warn'}" style="padding:0;background:none">
            <img src="assets/char/${v.blocked ? 'boy-sweat' : v.chargeable === true ? 'boy-thumb' : 'boy-please'}.webp" alt="" />
            <div><h3>${esc(v.name)}</h3><p>${esc(v.summary || v.reason || '')}</p>${v.alternative ? `<p style="margin-top:6px">${esc(v.alternative)}</p>` : ''}</div>
          </div>
        </article>
        ${sourceList(v.sources, { compact: true })}`
      : `<article class="card"><div class="callout callout-warn" style="padding:0;background:none"><img src="assets/char/boy-please.webp" alt="" /><div><h3>정확히 알기 어려워요</h3><p>상품권에 적힌 발행사와 번호 자릿수를 확인해 주세요. 고객센터(1577-2111)에서도 확인할 수 있어요.</p></div></div></article>`;

  return {
    title: '내 상품권 확인',
    gray: true,
    html: `${topbar('내 상품권 확인')}
    <div class="scroll"><div class="guide-body" style="padding-bottom:120px">
      <article class="card qblock proposal">
        <h3>1. 상품권을 어떻게 받으셨나요?</h3>
        <div class="optlist">${opts(Q_RECEIVED, 'received')}</div>
      </article>
      ${needDigits ? `<article class="card qblock">
        <h3>2. 상품권 번호(PIN)는 몇 자리인가요?</h3>
        <p class="hint">${icon('lock', 14)}번호는 입력하지 마세요. 자릿수만 골라 주세요.</p>
        <div class="grid-3">${opts(Q_DIGITS, 'digits')}</div>
      </article>` : ''}
      ${needLabel ? `<article class="card qblock"><h3>3. 상품권에 적힌 이름은?</h3><div class="optlist">${opts(Q_LABEL, 'label')}</div></article>` : ''}
      ${resultCard}
    </div></div>
    <div class="cta-bar">${result && result !== 'unknown' ? `<button class="btn btn-primary btn-block" id="useV">이 상품권으로 안내받기</button>` : `<button class="btn btn-primary btn-block" disabled>질문에 답해 주세요</button>`}</div>`,
    mount(root) {
      root.querySelectorAll('[data-k]').forEach((b) =>
        b.addEventListener('click', () => {
          const k = b.dataset.k;
          let val = b.dataset.val;
          if (k === 'digits') val = +val;
          ans[k] = val;
          if (k === 'received') Object.assign(ans, { digits: null, label: null });
          if (k === 'digits') ans.label = null;
          rerender();
        }),
      );
      root.querySelector('#useV')?.addEventListener('click', () => {
        setVoucher(result);
        go(back);
      });
    },
  };
}
