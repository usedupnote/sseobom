// 해시 라우터 + 공통 동작(뒤로가기·시트·토스트)
import { state, save, resetDemo } from './state.js';
import { VOUCHERS } from '../data/vouchers.js';
import { homeView } from './views/home.js';
import { searchView } from './views/search.js';
import { resultView, merchantRoute, categoryRoute, topicRoute } from './views/result.js';
import { guideView } from './views/guide.js';
import { mockView } from './views/mocks.js';
import { voucherView } from './views/voucher.js';

const app = document.getElementById('app');
const screen = document.getElementById('screen');

function parseHash() {
  // 질문 안의 '?'가 쿼리 구분자로 잘리지 않도록: 첫 '?'에서만 나누고, 값 디코딩은 URLSearchParams에 맡긴다
  const raw = location.hash.replace(/^#\/?/, '') || 'home';
  const i = raw.indexOf('?');
  const path = i < 0 ? raw : raw.slice(0, i);
  const qs = i < 0 ? '' : raw.slice(i + 1);
  return { segs: path.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(qs) };
}

const ROUTES = {
  home: homeView,
  search: searchView,
  r: resultView, // 질문 → 결과
  m: merchantRoute, // 사용처 판정
  c: categoryRoute, // 카테고리 목록
  t: topicRoute, // 충전·환불·잔액 안내
  g: guideView, // 사용 안내
  mock: mockView, // 시연용 앱 화면
  v: voucherView, // 내 상품권 판별
};

let depth = 0;
export function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

export function rerender() {
  const sc = app.querySelector('.scroll');
  const top = sc ? sc.scrollTop : 0;
  render({ keepScroll: top });
}

function render({ keepScroll } = {}) {
  const { segs, query } = parseHash();
  const view = ROUTES[segs[0]] || homeView;
  // 딥링크로 보유 상품권 지정(예: 문자 상품권 링크 → ?v=cl16)
  const v = query.get('v');
  if (v && VOUCHERS[v] && state.voucher !== v) {
    state.voucher = v;
    save();
  }
  closeSheet();
  const out = view({ segs, query, state });
  app.className = `view ${out.gray ? 'is-gray' : ''} ${keepScroll === undefined ? 'view-enter' : ''}`;
  app.innerHTML = out.html;
  document.title = `${out.title ? out.title + ' · ' : ''}컬쳐랜드 쓸곳찾기`;
  out.mount?.(app);
  const sc = app.querySelector('.scroll');
  if (sc) sc.scrollTop = keepScroll ?? 0;
  if (keepScroll === undefined) {
    const f = app.querySelector('[autofocus]');
    if (f && window.matchMedia('(min-width: 861px)').matches) f.focus();
  }
}

window.addEventListener('hashchange', () => {
  depth++;
  render();
});

// 전역 클릭 위임
document.addEventListener('click', (e) => {
  const back = e.target.closest('[data-back]');
  if (back) {
    e.preventDefault();
    if (depth > 0) {
      depth -= 2; // hashchange가 다시 +1
      history.back();
    } else go('#/home');
    return;
  }
  const goEl = e.target.closest('[data-go]');
  if (goEl) {
    e.preventDefault();
    go(goEl.dataset.go);
    return;
  }
  const scn = e.target.closest('[data-scn]');
  if (scn) {
    // 심사용 시나리오는 매번 '내 상품권' 설정 없이 새로 시작
    e.preventDefault();
    closeSheet();
    state.voucher = null;
    save();
    go(scn.dataset.scn);
  }
});

// ── 시트 ──
export function openSheet(html, mount) {
  closeSheet();
  const dim = document.createElement('div');
  dim.className = 'sheet-dim';
  const sh = document.createElement('div');
  sh.className = 'sheet';
  sh.setAttribute('role', 'dialog');
  sh.setAttribute('aria-modal', 'true');
  sh.innerHTML = html;
  dim.addEventListener('click', closeSheet);
  screen.append(dim, sh);
  mount?.(sh);
  sh.querySelector('button, input, a')?.focus();
}
export function closeSheet() {
  screen.querySelectorAll('.sheet, .sheet-dim').forEach((n) => n.remove());
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSheet();
});

let toastTimer;
export function toast(msg) {
  screen.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  screen.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 2200);
}

// 설명 자료용 캡처 모드(?capture): 떠 있는 시연 버튼 숨김
if (new URLSearchParams(location.search).has('capture')) document.body.classList.add('capture');

// ── 데스크톱 패널 ──
const toggle = document.getElementById('proposalToggle');
document.body.classList.toggle('show-proposal', state.proposal);
if (toggle) {
  toggle.checked = state.proposal;
  toggle.addEventListener('change', () => {
    state.proposal = toggle.checked;
    save();
    document.body.classList.toggle('show-proposal', state.proposal);
  });
}
document.getElementById('resetDemo')?.addEventListener('click', (e) => {
  e.preventDefault();
  resetDemo();
  toast('시연 상태를 처음으로 되돌렸어요');
  go('#/home');
});

// 좁은 화면: 시나리오 시트
document.getElementById('mobileFab')?.addEventListener('click', () => {
  const items = [...document.querySelectorAll('.scn button')].map((b) => b.outerHTML).join('');
  openSheet(`<h3>심사용 시나리오</h3><div class="scn">${items}</div>
    <div class="panel-links"><a href="#/home" data-scn="#/home">앱 홈에서 시작</a><a href="docs/explain.pdf" target="_blank" rel="noopener">설명 자료(PDF)</a></div>`);
});

render();
