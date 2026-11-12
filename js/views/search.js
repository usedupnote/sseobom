// [1 입력] 이름·카테고리·자연어를 한 입력창에서 받는다
import { icon, esc, mark, a11yBtn } from '../ui.js';
import { CATEGORIES, MERCHANT_BY_ID } from '../../data/merchants.js';
import { VOUCHERS } from '../../data/vouchers.js';
import { autocomplete } from '../parser.js';
import { addRecent, setVoucher } from '../state.js';
import { go } from '../app.js';
import { lanePill } from './shared.js';

const EXAMPLES = ['편의점에서 컬쳐랜드상품권 써도 돼?', '쿠팡에서 쓸 수 있어?', 'CGV 매장에서 바코드로', '넥슨 캐시 충전', '스벅', 'ㄱㅂㅁㄱ'];
const VOUCHER_CHIPS = [
  ['cl16', '문자로 받은 상품권'],
  ['cash', '충전한 컬쳐캐쉬'],
  ['munsang18', '18자리 문화상품권'],
  ['smart', '스마트문상'],
];

export function searchView({ query, state }) {
  const from = query.get('from');
  const pre = query.get('q') || '';
  const recent = state.recent.length
    ? `<section><p class="label">최근 검색</p><div class="chips">${state.recent
        .map((q) => `<button class="chip ex" data-go="#/r?q=${encodeURIComponent(q)}">${icon('search', 14)}${esc(q)}</button>`)
        .join('')}</div></section>`
    : '';

  return {
    title: '사용처 찾기',
    html: `
    <form class="search-top" role="search" id="sform">
      <button type="button" class="icon-btn" data-back aria-label="뒤로">${icon('back', 22)}</button>
      <label class="search-field">
        <span class="sr-only">사용처 이름이나 궁금한 점</span>
        ${icon('search', 18)}
        <input id="sq" type="search" name="q" value="${esc(pre)}" placeholder="사용처 이름이나 궁금한 점" autocomplete="off" enterkeyhint="search" autofocus />
        <button type="button" class="clear" id="sclear" aria-label="지우기" ${pre ? '' : 'hidden'}>${icon('x', 16)}</button>
      </label>
      <button class="search-go" type="submit">찾기</button>
      ${a11yBtn()}
    </form>
    <div class="ac" id="ac" hidden></div>
    <div class="scroll">
      <div class="search-body">
        ${from === 'mms' ? `<div class="callout callout-info"><img src="assets/char/catsh-wink.webp" alt="" /><div><h3>문자 상품권에서 오셨군요</h3><p>‘내 상품권’을 <b>문자로 받은 상품권</b>으로 맞춰 두었어요. 쓰고 싶은 곳을 물어보세요.</p></div></div>` : ''}
        <section>
          <p class="label">내 상품권 <button type="button" data-go="#/v?back=${encodeURIComponent('#/search')}">잘 모르겠어요</button></p>
          <div class="chips" id="vchips">
            ${VOUCHER_CHIPS.map(([id, label]) => `<button type="button" class="chip ${state.voucher === id ? 'on' : ''}" data-v="${id}" aria-pressed="${state.voucher === id}">${esc(label)}</button>`).join('')}
          </div>
          ${state.voucher && VOUCHERS[state.voucher]?.blocked ? `<p class="typo-note">${icon('info', 14)} ${esc(VOUCHERS[state.voucher].short)}은(는) 컬쳐랜드에서 충전할 수 없어요. 결과에서 대안을 알려드릴게요.</p>` : ''}
        </section>
        <section>
          <p class="label">이렇게 물어보세요</p>
          <div class="chips">${EXAMPLES.map((q) => `<button type="button" class="chip ex" data-go="#/r?q=${encodeURIComponent(q)}">${esc(q)}</button>`).join('')}</div>
        </section>
        <section>
          <p class="label">분야로 찾기</p>
          <div class="cats">${CATEGORIES.map((c) => `<button type="button" data-go="#/c/${c.id}">${icon(c.icon, 24)}${esc(c.label)}</button>`).join('')}</div>
        </section>
        ${recent}
      </div>
    </div>`,
    mount(root) {
      if (from === 'mms' && !state.voucher) setVoucher('cl16');
      const input = root.querySelector('#sq');
      const ac = root.querySelector('#ac');
      const clear = root.querySelector('#sclear');
      root.querySelector('#sform').addEventListener('submit', (e) => {
        e.preventDefault();
        const q = input.value.trim();
        if (!q) return input.focus();
        addRecent(q);
        go(`#/r?q=${encodeURIComponent(q)}`);
      });
      const update = () => {
        const v = input.value;
        clear.hidden = !v;
        const ids = autocomplete(v);
        if (!ids.length) {
          ac.hidden = true;
          return;
        }
        ac.innerHTML = ids
          .map((id) => {
            const m = MERCHANT_BY_ID[id];
            const pills = [lanePill(m.online, '온', true), lanePill(m.offline, '매장', true)].filter(Boolean).join('');
            return `<button type="button" data-go="#/m/${id}">${mark(m, 30)}<span class="ac-name">${esc(m.name)}</span><span class="ac-pills">${pills}</span></button>`;
          })
          .join('');
        ac.hidden = false;
      };
      input.addEventListener('input', update);
      clear.addEventListener('click', () => {
        input.value = '';
        update();
        input.focus();
      });
      root.querySelector('#vchips').addEventListener('click', (e) => {
        const b = e.target.closest('[data-v]');
        if (!b) return;
        setVoucher(state.voucher === b.dataset.v ? null : b.dataset.v);
        root.querySelectorAll('#vchips .chip').forEach((c) => {
          const on = c.dataset.v === state.voucher;
          c.classList.toggle('on', on);
          c.setAttribute('aria-pressed', on);
        });
      });
      if (pre) update();
    },
  };
}
