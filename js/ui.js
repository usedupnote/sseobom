// 공통 UI 도우미: 이스케이프, 아이콘, 배지, 헤더, 출처 표시
import { SOURCES, KIND_LABEL, CHECKED_AT } from '../data/sources.js';

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// {name} 같은 자리표시자 채우기
export const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));

export const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
export const pct = (f) => `${+(f * 100).toFixed(1)}%`;

const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  swap: '<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  dash: '<path d="M6 12h12"/>',
  store: '<path d="M4 9.5 5.5 5h13L20 9.5M4 9.5h16M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12v7h13v-7M10 19v-4h4v4"/>',
  film: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 9.5h17M8 5l-1.5 4.5M13 5l-1.5 4.5M18 5l-1.5 4.5"/>',
  book: '<path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 1 5 16z"/><path d="M5 16a3.5 3.5 0 0 1 3.5-3.5H19"/>',
  game: '<rect x="3" y="7.5" width="18" height="10" rx="5"/><path d="M8 10.5v4M6 12.5h4"/><circle cx="15.5" cy="11.5" r=".9" fill="currentColor"/><circle cx="17.5" cy="13.7" r=".9" fill="currentColor"/>',
  play: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="m10.5 9.3 4.3 2.7-4.3 2.7z" fill="currentColor"/>',
  bag: '<path d="M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8"/>',
  cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c0 1.2 1 1.2 1 2.4M11.5 3.5c0 1.2 1 1.2 1 2.4"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2a3 3 0 1 0 0 5.6"/>',
  barcode: '<path d="M4 6v12M7 6v12M9.5 6v12M13 6v12M15 6v12M18 6v12M20 6v12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  ext: '<path d="M14 5h5v5M19 5l-8 8M17 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10"/>',
  star: '<path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.7l5.4-.8z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".7" fill="currentColor"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14.5h4"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3.5 9h17v-3h-17zM12 6v14M12 6c-1.5-3-5-3-5-1s3 1 5 1zm0 0c1.5-3 5-3 5-1s-3 1-5 1z"/>',
  ticket: '<path d="M4 7.5h16v3a1.8 1.8 0 0 0 0 3.6v3H4v-3a1.8 1.8 0 0 0 0-3.6z"/><path d="M14 7.5v9.6" stroke-dasharray="1.5 1.8"/>',
  google: '<path d="m5 4 10 8-10 8z"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3M4 7.5V17a2 2 0 0 0 2 2h14V9H6.5A2.5 2.5 0 0 1 4 7.5z"/><circle cx="16" cy="14" r="1" fill="currentColor"/>',
  sparkle: '<path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.6L12 17.7l-1.6-5.5L5 10.6 10.4 9z"/>',
  online: '<rect x="3.5" y="5" width="17" height="11" rx="1.5"/><path d="M8.5 19.5h7M12 16v3.5"/>',
  msg: '<path d="M4.5 6.5h15v9.5h-9l-4 3.5v-3.5h-2z"/>',
  copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M5 15.5V5.5A1.5 1.5 0 0 1 6.5 4H15"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5a7 7 0 0 1 14 0"/>',
  calc: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8 7.5h8M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01"/>',
  shield: '<path d="M12 3.5 19 6v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  steps: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 9h7M8.5 12h7M8.5 15h4"/>',
  photo: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4.5 17 5-4.5 3.5 3 2.5-2 4 3.5"/>',
};

export function icon(name, size = 20, cls = '') {
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

// 보기 설정 [가] 버튼 — 글자 크기·고대비
export const a11yBtn = () => `<button type="button" class="a11y-btn" data-a11y aria-label="보기 설정: 글자 크기와 고대비">가<small aria-hidden="true">가</small></button>`;

// 화면 상단 바(뒤로가기 + 제목 + 오른쪽 버튼 + 보기 설정)
export function topbar(title, { back = true, right = '', backTo = '' } = {}) {
  const backBtn = backTo
    ? `<button class="icon-btn" data-go="${esc(backTo)}" aria-label="뒤로">${icon('back', 22)}</button>`
    : back
      ? `<button class="icon-btn" data-back aria-label="뒤로">${icon('back', 22)}</button>`
      : '<span class="icon-btn"></span>';
  return `<header class="topbar">
    ${backBtn}
    <h1 class="topbar-title">${esc(title)}</h1>
    <div class="topbar-right">${right}${a11yBtn()}</div>
  </header>`;
}

// 읽어주기 — 브라우저 내장 음성 합성(서버·키 없음). 지원하지 않으면 버튼을 그리지 않는다.
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
export function speakBtn(text, label = '읽어주기') {
  if (!canSpeak()) return '';
  return `<button type="button" class="btn btn-sm speak-btn" data-speak="${esc(text)}" aria-pressed="false">${icon('sound', 15)}${esc(label)}</button>`;
}
export function speak(text, btn) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  if (synth.speaking) {
    synth.cancel();
    document.querySelectorAll('.speak-btn[aria-pressed="true"]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    if (btn?.dataset.playing === '1') {
      btn.dataset.playing = '0';
      return;
    }
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.95;
  const ko = synth.getVoices().find((v) => v.lang && v.lang.startsWith('ko'));
  if (ko) u.voice = ko;
  if (btn) {
    btn.dataset.playing = '1';
    btn.setAttribute('aria-pressed', 'true');
    u.onend = u.onerror = () => {
      btn.dataset.playing = '0';
      btn.setAttribute('aria-pressed', 'false');
    };
  }
  synth.speak(u);
}

// 출처 한 줄 묶음
export function sourceList(keys = [], { compact = false, checkedAt = CHECKED_AT } = {}) {
  const uniq = [...new Set(keys)].filter((k) => SOURCES[k]);
  if (!uniq.length) return '';
  const items = uniq
    .map((k) => {
      const s = SOURCES[k];
      const kind = `<span class="src-kind src-${s.kind}">${KIND_LABEL[s.kind]}</span>`;
      const label = s.url
        ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}${icon('ext', 12)}</a>`
        : `<span>${esc(s.label)}</span>`;
      return `<li>${kind}${label}</li>`;
    })
    .join('');
  return `<div class="sources ${compact ? 'is-compact' : ''}">
    <p class="sources-head">${icon('info', 14)}정보 출처 · 확인일 ${esc(checkedAt)}</p>
    <ul>${items}</ul>
  </div>`;
}

export function confidenceBadge(conf) {
  if (conf === 'official') return `<span class="conf conf-official">${icon('shield', 13)}공식 확인</span>`;
  if (conf === 'secondary') return `<span class="conf conf-secondary">2차 출처</span>`;
  return `<span class="conf conf-unverified">${icon('question', 13)}확인 필요</span>`;
}

// 화면 위 한 줄 안내 — 실제 결제·충전처럼 시연에 필요하지 않아 꺼 둔 기능을 차분하게 알린다(‘시연용’ 경고 띠 대신)
export function demoTag(text = '실제 결제·충전은 시연에 필요하지 않아 꺼 두었어요') {
  return `<div class="demo-tag" role="note">${icon('info', 14)}${esc(text)}</div>`;
}

// 시연에서 꺼 둔 기능을 눌렀을 때의 안내 문구. 버튼에 data-off="기능 이름"을 달면 app.js가 이 문구를 띄운다.
// 받침에 따라 조사를 고른다. 끝이 괄호·숫자면 그 앞의 마지막 한글을 본다('문화상품권(18자리)' → '는')
export const josa = (word, withFinal, without) => {
  const m = String(word).match(/[가-힣](?=[^가-힣]*$)/);
  if (!m) return `${withFinal}(${without})`;
  return (m[0].charCodeAt(0) - 0xac00) % 28 ? withFinal : without;
};
const eunNeun = (word) => josa(word, '은', '는');
export const offNote = (name = '') => (name ? `${name}${eunNeun(name)} 시연에는 필요하지 않은 기능이에요` : '시연에는 필요하지 않은 기능이에요');

// 사용처 이니셜 원형(제3자 로고 대신)
export function mark(m, size = 44) {
  const ch = (m.name.match(/[A-Za-z0-9가-힣]/) || ['?'])[0].toUpperCase();
  let h = 0;
  for (const c of m.id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `<span class="mmark" style="--s:${size}px;--h:${h}" aria-hidden="true">${esc(ch)}</span>`;
}

// 예시 바코드 — 숫자로부터 결정적으로 생성(실제 결제에는 쓸 수 없음)
export function fakeBarcode(digits, { w = 260, h = 64 } = {}) {
  const ds = String(digits).replace(/\D/g, '');
  let x = 4;
  let bars = '';
  const seq = ('11010010000' + ds.split('').map((d) => ['1101100110', '1100110110', '1100110011', '1001001100', '1001000110', '1000100110', '1001100100', '1001100010', '1000110010', '1100100100'][+d]).join('') + '1100011101011').split('');
  const unit = (w - 8) / seq.length;
  for (const b of seq) {
    if (b === '1') bars += `<rect x="${x.toFixed(2)}" y="0" width="${unit.toFixed(2)}" height="${h}"/>`;
    x += unit;
  }
  return `<svg class="barcode" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="예시 바코드">${bars}</svg>`;
}
