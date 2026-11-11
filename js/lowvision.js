// 저시력 관점 미러(시연용) — 왼쪽 폰과 같은 화면을 오른쪽 폰에 흐림·시야·색각 시뮬레이션으로 비춘다.
// 왼쪽 화면(#screen)의 변화를 지켜보다가 바뀐 부분만 오른쪽(#mirror)에 복제한다. 오른쪽은 조작할 수 없다.
import { state, save } from './state.js';

const screen = document.getElementById('screen');
const mirror = document.getElementById('mirror');
const wrap = document.getElementById('simWrap');
const mask = document.getElementById('simMask');
const cap = document.getElementById('lvCap');

const BLUR_PX = [0, 1, 1.8, 2.8, 4]; // 390px 폭 화면 기준
const BLUR_LABEL = ['없음', '약하게', '중간', '강하게', '아주 강하게'];
const FIELD_LABEL = { none: '', hemi: '양이측 반맹', tunnel: '터널 시야' };
const COLOR_LABEL = { none: '', deutan: '적록 색각 이상', gray: '전색맹' };
const SCROLLERS = '.scroll, .focus-wrap, .sheet, .ac, .favs';

// ── 복제 ────────────────────────────────────────────────
// 복제본에서 id 등 중복되면 안 되는 속성을 뗀다
function strip(node) {
  if (node.nodeType !== 1) return node;
  for (const n of [node, ...node.querySelectorAll('[id], [autofocus], [aria-live]')]) {
    n.removeAttribute('id');
    n.removeAttribute('autofocus');
    n.removeAttribute('aria-live');
  }
  return node;
}

function syncScroll() {
  const a = screen.querySelectorAll(SCROLLERS);
  const b = mirror.querySelectorAll(SCROLLERS);
  a.forEach((el, i) => {
    const m = b[i];
    if (!m) return;
    m.scrollTop = el.scrollTop;
    m.scrollLeft = el.scrollLeft;
  });
}

function fullSync() {
  mirror.className = screen.className; // 글자 크기·고대비 설정도 그대로
  mirror.style.setProperty('--ts', screen.style.getPropertyValue('--ts') || '1');
  wrap.classList.toggle('hc', screen.classList.contains('hc'));
  const copy = strip(screen.cloneNode(true));
  mirror.replaceChildren(...copy.childNodes);
  syncScroll();
}

// #screen 안의 노드 위치(자식 순번 경로) → #mirror의 같은 자리 노드
function pathOf(node) {
  const path = [];
  while (node && node !== screen) {
    const parent = node.parentNode;
    if (!parent) return null;
    path.unshift(Array.prototype.indexOf.call(parent.childNodes, node));
    node = parent;
  }
  return node === screen ? path : null;
}
function resolve(path) {
  let n = mirror;
  for (const i of path) {
    n = n.childNodes[i];
    if (!n) return null;
  }
  return n;
}

// 바뀐 노드들 중 가장 바깥 것만 골라 그 부분만 다시 복제한다(구조가 어긋나면 전체 복제)
function patch(targets) {
  const live = [...new Set(targets)].filter((t) => t === screen || screen.contains(t));
  if (!live.length) return;
  if (live.includes(screen)) return fullSync();
  const top = live.filter((t) => !live.some((o) => o !== t && o.contains(t)));
  for (const t of top) {
    const path = pathOf(t);
    const dst = path && resolve(path);
    if (!dst) return fullSync();
    dst.replaceWith(strip(t.cloneNode(true)));
  }
  syncScroll();
}

const observer = new MutationObserver((records) => patch(records.map((r) => r.target)));
let watching = false;
let scrollRaf = 0;
const onInput = (e) => patch([e.target]); // 입력 값은 속성 변화가 아니라 따로 반영
const onScroll = () => {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    syncScroll();
  });
};

function watch(on) {
  if (on === watching) return;
  watching = on;
  if (on) {
    observer.observe(screen, { subtree: true, childList: true, attributes: true, characterData: true });
    screen.addEventListener('input', onInput, true);
    screen.addEventListener('scroll', onScroll, true);
  } else {
    observer.disconnect();
    screen.removeEventListener('input', onInput, true);
    screen.removeEventListener('scroll', onScroll, true);
    mirror.replaceChildren();
  }
}

// ── 화면 맞춤: 폰이 창 높이·너비 안에 들어오도록 축소 ────────
export function fitPhones() {
  const root = document.documentElement;
  if (!matchMedia('(min-width: 861px)').matches) {
    root.style.removeProperty('--phone-zoom');
    return;
  }
  const on = state.lv.on;
  let z = (innerHeight - 64 - (on ? 40 : 0)) / 844;
  if (on) z = Math.min(z, (innerWidth - 48 - 250 - 2 * 28) / (2 * 390));
  root.style.setProperty('--phone-zoom', Math.max(0.5, Math.min(1, z)).toFixed(3));
}

// ── 적용 ────────────────────────────────────────────────
export function applyLowVision() {
  const lv = state.lv;
  document.body.classList.toggle('lv-on', lv.on);

  const filters = [];
  if (lv.color === 'deutan') filters.push('url(#lv-deutan)');
  if (lv.color === 'gray') filters.push('grayscale(1)');
  if (BLUR_PX[lv.blur]) filters.push(`blur(${BLUR_PX[lv.blur]}px)`);
  mirror.style.filter = filters.join(' ') || 'none';
  mask.dataset.field = lv.field;

  const parts = [BLUR_PX[lv.blur] ? `흐림 ${BLUR_LABEL[lv.blur]}` : '', FIELD_LABEL[lv.field], COLOR_LABEL[lv.color]].filter(Boolean);
  cap.textContent = parts.length ? parts.join(' · ') : '효과 없음';

  // 패널 조작부
  const toggle = document.getElementById('lvToggle');
  if (toggle) toggle.checked = lv.on;
  const opts = document.getElementById('lvOpts');
  if (opts) opts.hidden = !lv.on;
  const range = document.getElementById('lvBlur');
  if (range) range.value = lv.blur;
  const out = document.getElementById('lvBlurOut');
  if (out) out.textContent = BLUR_LABEL[lv.blur];
  document.querySelectorAll('[data-lv-field]').forEach((b) => {
    const on = b.dataset.lvField === lv.field;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  });
  document.querySelectorAll('[data-lv-color]').forEach((b) => {
    const on = b.dataset.lvColor === lv.color;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  });

  fitPhones();
  watch(lv.on);
  if (lv.on) fullSync();
}

function set(next) {
  Object.assign(state.lv, next);
  save();
  applyLowVision();
}

export function initLowVision(pageParams) {
  // 설명 자료 캡처용: ?lv=1&lvblur=0~4&lvfield=hemi|tunnel&lvcolor=deutan|gray
  if (pageParams?.has('lv')) {
    Object.assign(state.lv, {
      on: pageParams.get('lv') === '1',
      blur: Math.max(0, Math.min(4, parseInt(pageParams.get('lvblur') ?? state.lv.blur, 10) || 0)),
      field: FIELD_LABEL[pageParams.get('lvfield')] !== undefined ? pageParams.get('lvfield') : state.lv.field,
      color: COLOR_LABEL[pageParams.get('lvcolor')] !== undefined ? pageParams.get('lvcolor') : state.lv.color,
    });
  }

  document.getElementById('lvToggle')?.addEventListener('change', (e) => set({ on: e.target.checked }));
  document.getElementById('lvBlur')?.addEventListener('input', (e) => set({ blur: +e.target.value }));
  document.getElementById('lvOpts')?.addEventListener('click', (e) => {
    const f = e.target.closest('[data-lv-field]');
    const c = e.target.closest('[data-lv-color]');
    if (f) set({ field: f.dataset.lvField });
    if (c) set({ color: c.dataset.lvColor });
  });

  // 시야 시뮬레이션의 중심(시선)은 왼쪽 폰 위의 마우스 위치를 따라간다
  document.getElementById('mainPhone')?.addEventListener('pointermove', (e) => {
    if (!state.lv.on || state.lv.field === 'none') return;
    const r = screen.getBoundingClientRect();
    const pc = (v) => `${Math.max(0, Math.min(100, v * 100)).toFixed(1)}%`;
    mask.style.setProperty('--gx', pc((e.clientX - r.left) / r.width));
    mask.style.setProperty('--gy', pc((e.clientY - r.top) / r.height));
  });

  window.addEventListener('resize', fitPhones);
  applyLowVision();
}
