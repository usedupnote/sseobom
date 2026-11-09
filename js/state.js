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
  proposal: true,
};

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
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
