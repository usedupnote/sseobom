// 시연 상태(세션 동안만 유지). 저장 실패(사생활 보호 모드 등)해도 화면은 정상 동작.
import { DEMO } from '../data/demo.js';

const KEY = 'clf-state-v1';
const DEFAULT = {
  voucher: null, // cl16 | cash | munsang18 | smart | gift | paper | null(선택 안 함)
  favorites: [...DEMO.favorites],
  done: {}, // { 'guideKey': [true,false,...] }
  recent: [],
  cash: DEMO.cashBalance,
  charged: false,
  bulk: [], // 일괄등록으로 이미 등록한 가상 사진 id — 같은 상품권을 두 번 등록하지 않게
  proposal: true,
  // 저시력 관점 미러(시연용): 흐림 0~4, 시야 none|hemi|tunnel, 색 none|deutan|gray
  lv: { on: false, blur: 2, field: 'none', color: 'none' },
};

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return { ...structuredClone(DEFAULT), ...saved, lv: { ...DEFAULT.lv, ...(saved.lv || {}) } };
    }
  } catch (_) {
    /* 저장소 사용 불가 */
  }
  return structuredClone(DEFAULT);
}

export const state = load();

export function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) {
    /* 무시 */
  }
}

export function setVoucher(v) {
  state.voucher = v;
  save();
}

export function addRecent(q) {
  const t = q.trim();
  if (!t) return;
  state.recent = [t, ...state.recent.filter((x) => x !== t)].slice(0, 5);
  save();
}

export function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id) ? state.favorites.filter((x) => x !== id) : [...state.favorites, id];
  save();
  return state.favorites.includes(id);
}

export function stepDone(key, i, total) {
  const arr = state.done[key] || Array(total).fill(false);
  arr[i] = !arr[i];
  state.done[key] = arr;
  save();
  return arr;
}

export function resetDemo() {
  Object.assign(state, structuredClone(DEFAULT));
  save();
}

// ── 보기 설정(글자 크기·고대비) — 이 기기에만 저장되는 개인 설정 ──
const VIEW_KEY = 'sseobom-view-v1';
export const TEXT_SCALE = { m: 1, l: 1.25, xl: 1.5 };

function loadView() {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (raw) return { ts: 'm', hc: false, ...JSON.parse(raw) };
  } catch (_) {
    /* 저장소 사용 불가 */
  }
  // 저장된 설정이 없으면 기기의 고대비 설정을 따른다
  const hc = typeof matchMedia === 'function' && (matchMedia('(prefers-contrast: more)').matches || matchMedia('(forced-colors: active)').matches);
  return { ts: 'm', hc };
}

export const view = loadView();

export function saveView(next, { persist = true } = {}) {
  Object.assign(view, next);
  if (persist) {
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify(view));
    } catch (_) {
      /* 무시 */
    }
  }
  applyView();
}

// 저장된 보기 설정으로 되돌리기(저시력 시연 시나리오 뒤 다른 시나리오로 갈 때)
export function restoreView() {
  Object.assign(view, loadView());
  applyView();
}

export function applyView() {
  const screen = typeof document !== 'undefined' && document.getElementById('screen');
  if (!screen) return;
  screen.style.setProperty('--ts', TEXT_SCALE[view.ts] || 1);
  screen.classList.toggle('ts-l', view.ts === 'l');
  screen.classList.toggle('ts-xl', view.ts === 'xl');
  screen.classList.toggle('hc', !!view.hc);
}
