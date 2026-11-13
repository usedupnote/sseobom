// 해시 라우터 + 공통 동작(뒤로가기·시트·토스트·보기 설정·읽어주기)
import { state, save, resetDemo, view, saveView, applyView, restoreView } from './state.js';
import { VOUCHERS } from '../data/vouchers.js';
import { speak, offNote } from './ui.js';
import { initLowVision, applyLowVision } from './lowvision.js';
import { homeView } from './views/home.js';
import { searchView } from './views/search.js';
import { resultView, merchantRoute, categoryRoute, topicRoute } from './views/result.js';
import { guideView } from './views/guide.js';
import { mockView } from './views/mocks.js';
import { voucherView } from './views/voucher.js';
import { bulkView } from './views/bulk.js';

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
  g: guideView, // 사용 안내(?s=n 이면 한 단계씩 크게 보기)
  mock: mockView, // 시연용 앱 화면
  v: voucherView, // 내 상품권 판별
  bulk: bulkView, // 사진에서 상품권 한 번에 등록(?st=scan|result|done)
};

let depth = 0;
export function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

// 한 화면 안에서 단계만 바꿀 때: 뒤로가기 기록을 늘리지 않고 주소만 바꿔 다시 그린다
export function swap(hash) {
  history.replaceState(null, '', hash);
  render();
}

export function rerender() {
  const sc = app.querySelector('.scroll, .focus-wrap');
  const top = sc ? sc.scrollTop : 0;
  render({ keepScroll: top });
}

function render({ keepScroll } = {}) {
  const { segs, query } = parseHash();
  const route = ROUTES[segs[0]] || homeView;
  // 딥링크로 보유 상품권 지정(예: 문자 상품권 링크 → ?v=cl16)
  // 새로 들어올 때만 적용한다(화면 안에서 상품권을 바꾼 뒤 다시 그릴 때 링크 값으로 되돌아가지 않게)
  const v = query.get('v');
  if (keepScroll === undefined && v && VOUCHERS[v] && state.voucher !== v) {
    state.voucher = v;
    save();
  }
  closeSheet();
  closeOverlay();
  if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
  const out = route({ segs, query, state });
  app.className = `view ${out.gray ? 'is-gray' : ''} ${keepScroll === undefined ? 'view-enter' : ''}`;
  app.innerHTML = out.html;
  document.title = `${out.title ? out.title + ' · ' : ''}컬쳐랜드 써봄`;
  out.mount?.(app);
  const sc = app.querySelector('.scroll, .focus-wrap');
  if (sc) sc.scrollTop = keepScroll ?? 0;
  if (keepScroll === undefined) {
    const f = app.querySelector('[autofocus]');
    if (f && window.matchMedia('(min-width: 861px)').matches) f.focus();
    // 설명 자료 캡처용: ?vs=1 이면 보기 설정 시트, ?bb=1 이면 바코드 크게 보기를 바로 연다
    if (query.get('vs') === '1') openViewSettings();
    if (query.get('bb') === '1') app.querySelector('[data-big-barcode]')?.click();
    if (query.get('off') === '1') app.querySelector('[data-off]')?.click(); // 캡처용: 꺼 둔 기능을 눌렀을 때의 안내
  }
}

window.addEventListener('hashchange', () => {
  depth++;
  render();
});

// ── 보기 설정 시트 ──
const TS_OPTS = [
  ['m', '기본', 16],
  ['l', '크게', 20],
  ['xl', '아주 크게', 24],
];
function openViewSettings() {
  const tsRow = TS_OPTS.map(
    ([k, label, px]) =>
      `<button type="button" class="vs-opt ${view.ts === k ? 'on' : ''}" data-ts="${k}" aria-pressed="${view.ts === k}"><span class="sample" style="font-size:${px}px">가</span><small>${label}</small></button>`,
  ).join('');
  const hcRow = [
    [false, '기본 화면', '<span class="vs-hc-sample" style="background:#fff;color:#1f1f1f;border:1px solid #ccc">가</span>'],
    [true, '고대비', '<span class="vs-hc-sample" style="background:#000;color:#ffd400;border:1px solid #000">가</span>'],
  ]
    .map(
      ([on, label, sample]) =>
        `<button type="button" class="vs-opt ${!!view.hc === on ? 'on' : ''}" data-hc="${on ? 1 : 0}" aria-pressed="${!!view.hc === on}">${sample}<small>${label}</small></button>`,
    )
    .join('');
  openSheet(
    `<h3>보기 설정</h3>
     <div class="vs-group" role="group" aria-label="글자 크기"><p>글자 크기</p><div class="vs-row">${tsRow}</div></div>
     <div class="vs-group" role="group" aria-label="화면 대비"><p>화면 대비</p><div class="vs-row two">${hcRow}</div>
       <p class="vs-note">고대비는 검정 바탕에 흰 글씨, 노랑 강조로 보여줘요. 바코드는 계산대에서 읽히도록 항상 흰 바탕이에요.</p></div>
     <div class="vs-group"><p>이렇게도 쓸 수 있어요</p>
       <p class="vs-note">· 사용 안내의 <b>[한 단계씩 크게 보기]</b> — 한 화면에 한 단계만 가운데 크게<br />· <b>[읽어주기]</b> — 판정과 단계를 소리로 들려줘요<br />· 휴대폰의 확대·글자 크기 기능과 함께 써도 화면이 깨지지 않아요</p></div>
     <button type="button" class="btn btn-primary btn-block" data-close-sheet>적용하고 닫기</button>
     <p class="vs-note" style="margin-top:8px">설정은 이 기기에만 저장돼요.</p>`,
    (sh) => {
      sh.addEventListener('click', (e) => {
        const ts = e.target.closest('[data-ts]');
        const hc = e.target.closest('[data-hc]');
        if (ts) saveView({ ts: ts.dataset.ts });
        if (hc) saveView({ hc: hc.dataset.hc === '1' });
        if (ts || hc) {
          rerender();
          openViewSettings(); // 바뀐 크기로 시트를 다시 그린다
        }
        if (e.target.closest('[data-close-sheet]')) closeSheet();
      });
    },
  );
}

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
  const a11y = e.target.closest('[data-a11y]');
  if (a11y) {
    e.preventDefault();
    openViewSettings();
    return;
  }
  const sp = e.target.closest('[data-speak]');
  if (sp) {
    e.preventDefault();
    speak(sp.dataset.speak, sp);
    return;
  }
  // 시연에서 꺼 둔 기능(출석체크·선물하기·번호 입력 등): 죽은 버튼으로 두지 않고 이유를 알려 준다
  const off = e.target.closest('[data-off]');
  if (off) {
    e.preventDefault();
    toast(offNote(off.dataset.off));
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
    // 심사용 시나리오는 매번 '내 상품권' 설정 없이 새로 시작. 저시력 시나리오는 보기 설정도 함께 바꾼다.
    e.preventDefault();
    closeSheet();
    state.voucher = null;
    save();
    // 저시력 시나리오의 보기 설정은 저장하지 않고 이번 시연에만 적용(다른 시나리오로 가면 원래 설정으로)
    if (scn.dataset.viewPreset === 'lowvision') saveView({ ts: 'l', hc: true }, { persist: false });
    else restoreView();
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

// ── 전체 화면 오버레이(바코드 크게 보여주기) ──
export function openOverlay(html) {
  closeOverlay();
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = html;
  ov.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-overlay]')) closeOverlay();
  });
  screen.append(ov);
  ov.querySelector('button')?.focus();
}
export function closeOverlay() {
  screen.querySelectorAll('.overlay').forEach((n) => n.remove());
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSheet();
    closeOverlay();
  }
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
  if (!document.body.classList.contains('capture')) toastTimer = setTimeout(() => t.remove(), 2200); // 캡처 모드에서는 안내를 그대로 둔다
}

// 설명 자료용 캡처 모드(?capture): 떠 있는 시연 버튼 숨김. ?ts=l|xl&hc=1 로 보기 설정을 저장 없이 지정
const pageParams = new URLSearchParams(location.search);
if (pageParams.has('capture')) document.body.classList.add('capture');
if (pageParams.get('capture') === 'lv') document.body.classList.add('capture-lv'); // 두 폰만 나란히(패널 숨김)
if (pageParams.has('ts') || pageParams.has('hc')) {
  saveView({ ts: pageParams.get('ts') || view.ts, hc: pageParams.get('hc') === '1' }, { persist: false });
}
applyView();

// 검증용 색각 시뮬레이션(?sim=gray|deutan) — 색만으로 구분하는 곳이 없는지 확인하는 용도
const sim = pageParams.get('sim');
if (sim) {
  document.body.insertAdjacentHTML(
    'beforeend',
    `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="deutan"><feColorMatrix type="matrix" values="0.367 0.861 -0.228 0 0  0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0  0 0 0 1 0"/></filter></svg>`,
  );
  screen.style.filter = sim === 'gray' ? 'grayscale(1)' : 'url(#deutan)';
}

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
  saveView({ ts: 'm', hc: false });
  applyLowVision();
  toast('시연 상태와 보기 설정을 처음으로 되돌렸어요');
  go('#/home');
});

// 좁은 화면: 시나리오 시트
document.getElementById('mobileFab')?.addEventListener('click', () => {
  const items = [...document.querySelectorAll('.scn button')].map((b) => b.outerHTML).join('');
  openSheet(`<h3>심사용 시나리오</h3><div class="scn">${items}</div>
    <div class="panel-links"><a href="#/home" data-scn="#/home">앱 홈에서 시작</a><a href="docs/explain.pdf" target="_blank" rel="noopener">설명 자료(PDF)</a><a href="docs/pitch.pdf" target="_blank" rel="noopener">발표자료(PDF)</a></div>
    ${document.querySelector('.panel-note')?.outerHTML || ''}`);
});

render();
initLowVision(pageParams); // 첫 화면을 그린 뒤 오른쪽 저시력 관점 폰을 연결
