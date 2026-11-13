// [2 결과] 판정 카드 · 목록 · 결과 없음 · 상품권 주제 안내
import { icon, esc, mark, sourceList, confidenceBadge, topbar, speakBtn } from '../ui.js';

const searchBtn = (q) => `<button class="icon-btn" data-go="#/search${q ? `?q=${encodeURIComponent(q)}` : ''}" aria-label="${q ? '다시 검색' : '검색'}">${icon('search', 20)}</button>`;
import { MERCHANTS, MERCHANT_BY_ID, CATEGORIES, laneVerdict, merchantVerdict, inCategory, placeCount, OFFICIAL_TOTAL, OFFLINE_TOTAL, OFFICIAL_CHECKED_AT } from '../../data/merchants.js';
import { VOUCHERS } from '../../data/vouchers.js';
import { TOPICS } from '../../data/topics.js';
import { parseQuery, suggest } from '../parser.js';
import { state as appState, setVoucher, toggleFavorite, addRecent } from '../state.js';
import { go, rerender, toast } from '../app.js';
import { CH_LABEL, lanePill, laneLine, routeFor, pickLane, verdictCopy, verdictBox, openVoucherSheet, voucherLabel, METHODS, voucherActions, callBtn, extBtn, officialListBtn, extraSteps, blockedCopy, OTHER_VOUCHER_HEAD } from './shared.js';
import { SOURCES } from '../../data/sources.js';

const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));
// 이용 방식별 목록(홈의 전환·쇼핑·쿠폰 메뉴) — 분야가 아니라 방식으로 묶는다
const listed = (m) => !m.group && m.confidence !== 'unverified';
const KIND_LISTS = {
  convert: { title: '포인트 전환', sub: '컬쳐캐쉬를 제휴 포인트로 바꿔 써요. 수수료는 전환처마다 달라요.', test: (m) => m.online?.kind === 'convert' },
  coupon: { title: '쿠폰 구매', sub: '컬쳐캐쉬로 모바일 쿠폰을 사서 써요.', test: (m) => [m.online, m.offline].some((l) => l?.kind === 'coupon') || (m.extra || []).some((x) => x.kind === 'coupon') },
  direct: { title: '바로 사용', sub: '결제 화면에서 컬쳐캐쉬를 골라 바로 결제해요.', test: (m) => m.online?.kind === 'direct' },
};
const kindIds = (k) => MERCHANTS.filter((m) => listed(m) && KIND_LISTS[k].test(m)).map((m) => m.id);

// ── 해석 칩: "이렇게 이해했어요" ──────────────────────────
function interpBar(p, { q, state, ch }) {
  if (!q) return '';
  const chips = [];
  if (p.merchants.length) {
    const names = p.merchants.map((id) => MERCHANT_BY_ID[id]?.name).filter(Boolean);
    chips.push(`<button class="ichip" data-edit="q">${icon('store', 14)}<i>사용처</i><b>${esc(names.slice(0, 2).join('·'))}${names.length > 2 ? ` 외 ${names.length - 2}` : ''}</b></button>`);
  } else if (p.category) {
    chips.push(`<button class="ichip" data-edit="q">${icon('store', 14)}<i>분류</i><b>${esc(CAT_LABEL[p.category])}</b></button>`);
  }
  if (p.merchants.length || p.category) {
    chips.push(`<button class="ichip" data-edit="ch">${icon(ch === 'online' ? 'online' : 'store', 14)}<i>장소</i><b>${ch ? CH_LABEL[ch] : '전체'}</b>${icon('down', 12)}</button>`);
  }
  chips.push(`<button class="ichip" data-edit="v">${icon('card', 14)}<i>상품권</i><b>${esc(voucherLabel(state.voucher))}</b>${icon('down', 12)}</button>`);
  if (p.topic) chips.push(`<span class="ichip">${icon('question', 14)}<i>질문</i><b>${{ charge: '충전', refund: '환불', balance: '잔액', convert: '전환' }[p.topic]}</b></span>`);
  const typo = p.matchedBy === 'typo' ? `<p class="typo-note">${icon('sparkle', 14)} ‘${esc(p.typo?.from || q)}’을(를) 비슷한 이름으로 찾았어요.</p>` : p.matchedBy === 'choseong' ? `<p class="typo-note">${icon('sparkle', 14)} 초성으로 찾았어요.</p>` : '';
  return `<div class="interp proposal">
    <p class="interp-q">${icon('search', 14)}<q>${esc(q)}</q></p>
    <div class="interp-row"><span>${icon('sparkle', 13)}이렇게 이해했어요</span>${chips.join('')}</div>${typo}
  </div>`;
}

function bindInterp(root, { q, ch, onCh }) {
  root.querySelectorAll('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.dataset.edit;
      if (k === 'q') go(`#/search?q=${encodeURIComponent(q || '')}`);
      if (k === 'v') openVoucherSheet(() => rerender());
      if (k === 'ch') onCh(ch === null ? 'offline' : ch === 'offline' ? 'online' : null);
    }),
  );
}

// ── 상품권 경고(18자리·스마트문상·모호한 '문화상품권') ────
// 질문에 "문화상품권"처럼 모호한 표현이 있으면 이전 설정과 상관없이 다시 묻는다
const calloutVoucher = (p, state) => (p?.voucher === 'ask' ? 'ask' : state.voucher);

function voucherCallout(voucher, back, current, { inCard = false } = {}) {
  if (voucher === 'ask') {
    const b = (id, label) => `<button class="btn btn-sm ${current === id ? 'btn-dark' : ''}" data-setv="${id}" aria-pressed="${current === id}">${current === id ? icon('check', 14) : ''}${label}</button>`;
    return `<div class="callout callout-warn">
      <img src="assets/char/boy-please.webp" alt="" />
      <div><h3>어떤 ‘문화상품권’인가요?</h3>
      <p>이름이 비슷해도 발행사가 달라요. 상품권 번호 자릿수를 확인해 주세요(번호는 입력하지 마세요).</p>
      <div class="btns">${b('cl16', '16자리 · 컬쳐랜드상품권')}${b('munsang18', '18자리 문화상품권')}${b('paper', '종이(지류) 상품권')}</div>
      ${!inCard && VOUCHERS[current]?.blocked ? `<p style="margin-top:8px"><b>${esc(blockedCopy(current).title)}.</b> ${esc(VOUCHERS[current].reason)}</p><div class="btns">${voucherActions(current, back)}</div>` : ''}</div>
    </div>`;
  }
  const v = VOUCHERS[voucher];
  if (v?.blocked && inCard) return ''; // 사용처 화면: 판정 카드가 내 상품권 기준으로 답한다
  if (v?.blocked)
    return `<div class="callout callout-no">
      <img src="assets/char/boy-sweat.webp" alt="" />
      <div><h3>${esc(blockedCopy(voucher).title)}</h3><p>${esc(v.reason)} 아래 내용은 컬쳐랜드상품권(16자리)·컬쳐캐쉬 기준이에요.</p>
      <div class="btns"><button class="btn btn-sm" data-go="#/v?back=${encodeURIComponent(back)}">내 상품권 다시 확인</button>${voucherActions(voucher, back)}</div></div>
    </div>`;
  // 안내가 가리키는 다음 동작(교환소·공지·고객센터)은 버튼으로 바로 이어준다
  if (voucher === 'gift')
    return appState.exchanged
      ? `<div class="callout callout-info"><img src="assets/char/boy-thumb.webp" alt="" /><div><h3>교환소에서 교환을 마쳤어요</h3><p>교환한 상품권으로 아래 방법대로 쓰면 돼요.</p></div></div>`
      : `<div class="callout callout-warn"><img src="assets/char/boy-please.webp" alt="" /><div><h3>먼저 [교환소]에서 교환해요</h3><p>${esc(v.reason)}</p><div class="btns">${voucherActions('gift', back)}</div></div></div>`;
  return '';
}

function bindVoucherButtons(root) {
  root.querySelectorAll('[data-setv]').forEach((b) =>
    b.addEventListener('click', () => {
      setVoucher(b.dataset.setv);
      rerender();
    }),
  );
}

// ── 판정 카드(사용처 1곳) ─────────────────────────────────
function merchantCard(m, { ch, state, back }) {
  const focus = pickLane(m, ch);
  // 내 상품권이 쓸 수 없는 종류면 그 답을 먼저 보여주고, 사용처의 일반 판정은 '다른 상품권이 있다면' 아래로 내린다
  const mine = blockedCopy(state.voucher, m.name);
  const copy = mine || verdictCopy(m, focus);
  const laneRow = (key) => {
    const lane = m[key];
    const v = laneVerdict(lane);
    const route = routeFor(lane, state.voucher);
    const usable = route && (v === 'ok' || v === 'indirect');
    const line = lane ? laneLine(lane) : key === 'offline' ? '매장 없음 · 온라인 서비스' : '온라인 결제 없음';
    return `<button class="lane ${focus === key ? 'is-focus' : ''}" ${usable ? `data-go="#/g/${m.id}/${route}"` : 'disabled'}>
      <span class="lane-ch">${icon(key === 'online' ? 'online' : 'store', 20)}${CH_LABEL[key]}${focus === key ? '<span class="lane-tag">질문한 곳</span>' : ''}</span>
      <span class="lane-main">${lanePill(lane)}<small>${esc(line)}</small></span>
      <span class="lane-go">방법 보기${icon('chev', 16)}</span>
    </button>`;
  };
  const notes = [...(m[focus]?.notes || []), ...(m.extra || []).map((x) => x.label)];
  const members = m.group ? `<div class="members">${m.group.map((id) => `<span>${esc(MERCHANT_BY_ID[id].name)}</span>`).join('')}</div><p class="typo-note">4곳 모두 이용 방법이 같아요.</p>` : '';
  // 읽어주기용 문장: 판정 + 온라인·매장 요약
  const laneSay = (key) => {
    const l = m[key];
    if (!l) return `${CH_LABEL[key]}은 해당 없음.`;
    return `${CH_LABEL[key]}: ${laneLine(l)}.`;
  };
  const sayText = `${m.group ? m.name : m.full || m.name}. ${copy.title}. ${copy.body} ${mine ? `${OTHER_VOUCHER_HEAD}, ` : ''}${laneSay('online')} ${laneSay('offline')}`;
  return `<article class="card">
    <div class="m-head">${mark(m, 48)}<div><h2>${esc(m.group ? m.name : m.full || m.name)}</h2><p>${esc(CAT_LABEL[m.cat] || '')} ${confidenceBadge(m.confidence)}</p></div></div>
    ${members}
    ${verdictBox(copy)}
    ${mine ? `<div class="next-actions"><button class="btn btn-sm" data-go="#/v?back=${encodeURIComponent(back)}">내 상품권 다시 확인</button>${voucherActions(state.voucher, back)}</div>` : ''}
    ${!mine && focus && laneVerdict(m[focus]) === 'unknown' ? `<div class="next-actions" aria-label="확인할 곳">${officialListBtn()}${callBtn()}</div>` : ''}
    ${speakBtn(sayText, '결과 읽어주기') ? `<div style="margin-top:8px">${speakBtn(sayText, '결과 읽어주기')}</div>` : ''}
    ${mine ? `<p class="lanes-head">${icon('info', 14)}${OTHER_VOUCHER_HEAD}</p>` : ''}
    <div class="lanes" role="list" aria-label="온라인·매장 구분">${laneRow('online')}${laneRow('offline')}</div>
    ${notes.length ? `<ul class="notes">${notes.map((n) => `<li>${icon('info', 14)}<span>${esc(n)}</span></li>`).join('')}</ul>` : ''}
  </article>`;
}

function ctaFor(m, ch, state) {
  const focus = pickLane(m, ch);
  let lane = focus ? m[focus] : null;
  let key = focus;
  // 고른 채널이 불가·확인 필요면 쓸 수 있는 다른 채널로 이어준다(다이소 매장 → 다이소몰)
  if (!['ok', 'indirect'].includes(laneVerdict(lane))) {
    const other = focus === 'online' ? 'offline' : 'online';
    if (['ok', 'indirect'].includes(laneVerdict(m[other]))) {
      lane = m[other];
      key = other;
    } else return '';
  }
  const route = routeFor(lane, state.voucher);
  if (!route) return '';
  const method = METHODS[route];
  const n = method.steps.length + extraSteps(method, state.voucher);
  const label = key !== focus ? `대신 ${CH_LABEL[key]}에서 쓰는 방법 보기` : `${CH_LABEL[key]}에서 쓰는 방법 보기`;
  return `<button class="btn btn-primary btn-block" data-go="#/g/${m.id}/${route}">${esc(label)} · ${n}단계 ${icon('chev', 18)}</button>`;
}

function merchantScreen(m, { q, p, ch, state, back }) {
  const blocked = !!VOUCHERS[state.voucher]?.blocked;
  const fav = state.favorites.includes(m.id);
  return {
    title: m.name,
    gray: true,
    html: `
    ${topbar(q ? '확인 결과' : '사용 가능 여부', { right: searchBtn(q) })}
    <div class="scroll">
      ${interpBar(p || { merchants: [m.id], matchedBy: 'name' }, { q, state, ch })}
      <div class="result-body">
        ${voucherCallout(calloutVoucher(p, state), back, state.voucher, { inCard: true })}
        ${merchantCard(m, { ch, state, back })}
        ${sourceList(m.sources, { checkedAt: m.checkedAt })}
      </div>
    </div>
    <div class="cta-bar">
      ${blocked ? `<button class="btn btn-primary btn-block" data-go="#/v?back=${encodeURIComponent(back)}">내 상품권 다시 확인하기</button>` : ctaFor(m, ch, state)}
      <div class="cta-sub">
        <button class="btn btn-ghost" id="favBtn" aria-pressed="${fav}">${icon('star', 16)}${fav ? '즐겨찾기 해제' : '즐겨찾기'}</button>
        <button class="btn btn-ghost" data-go="#/search">다른 곳 찾기</button>
      </div>
    </div>`,
    mount(root) {
      bindInterp(root, {
        q,
        ch,
        onCh: (next) => {
          const base = q ? `#/r?q=${encodeURIComponent(q)}` : `#/m/${m.id}?`;
          go(`${base}${next ? `${q ? '&' : ''}ch=${next}` : ''}`);
        },
      });
      bindVoucherButtons(root);
      root.querySelector('#favBtn')?.addEventListener('click', () => {
        const on = toggleFavorite(m.id);
        toast(on ? '홈 즐겨찾기에 추가했어요' : '즐겨찾기에서 뺐어요');
        rerender();
      });
    },
  };
}

// ── 목록(카테고리·여러 곳) ────────────────────────────────
function listScreen({ title, sub, ids, q, p, ch, state, back }) {
  const items = ids.map((id) => MERCHANT_BY_ID[id]).filter((m) => m && !m.group);
  const filtered = ch ? items.filter((m) => m[ch] && laneVerdict(m[ch]) !== 'na') : items;
  const rank = { ok: 0, indirect: 1, unknown: 2, no: 3 };
  filtered.sort((a, b) => rank[ch ? laneVerdict(a[ch]) : merchantVerdict(a)] - rank[ch ? laneVerdict(b[ch]) : merchantVerdict(b)]);
  const rows = filtered
    .map((m) => {
      const pills = [m.online ? lanePill(m.online, '온라인', true) : '', m.offline ? lanePill(m.offline, '매장', true) : ''].join('');
      return `<li><button data-go="#/m/${m.id}${ch ? `?ch=${ch}` : ''}">${mark(m, 40)}<span class="ml-main"><span class="ml-name">${esc(m.name)}</span><span class="ml-pills">${pills}</span></span>${icon('chev', 18, 'ic-chev')}</button></li>`;
    })
    .join('');
  return {
    title,
    html: `
    ${topbar(title, { right: searchBtn('') })}
    <div class="scroll">
      ${q ? interpBar(p, { q, state, ch }) : ''}
      <div class="list-head"><h2>${esc(title)} ${placeCount(filtered)}곳</h2><p>${esc(sub)}</p></div>
      <div class="seg" role="tablist" aria-label="장소 필터">
        ${[[null, '전체'], ['online', '온라인'], ['offline', '매장']].map(([k, l]) => `<button role="tab" aria-selected="${ch === k}" class="${ch === k ? 'on' : ''}" data-ch="${k || ''}">${l}</button>`).join('')}
      </div>
      <div style="padding:0 16px">${voucherCallout(calloutVoucher(p, state), back, state.voucher)}</div>
      <ul class="mlist">${rows || `<li class="list-foot">이 조건에 맞는 사용처가 없어요.</li>`}</ul>
      <p class="list-foot">공식 사용처 목록 ${OFFICIAL_TOTAL}곳(${OFFICIAL_CHECKED_AT} 기준)과 오프라인 사용처 ${OFFLINE_TOTAL}곳을 모두 담았어요. 사용처는 바뀔 수 있어요. <a href="https://www.cultureland.co.kr/usecash/useCash.do" target="_blank" rel="noopener">공식 목록 보기</a></p>
    </div>`,
    mount(root) {
      bindInterp(root, { q, ch, onCh: (next) => setCh(next) });
      bindVoucherButtons(root);
      const setCh = (next) => {
        const h = location.hash;
        const i = h.indexOf('?');
        const path = i < 0 ? h : h.slice(0, i);
        const sp = new URLSearchParams(i < 0 ? '' : h.slice(i + 1));
        if (next) sp.set('ch', next);
        else sp.delete('ch');
        go(`${path}?${sp.toString()}`);
      };
      root.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => setCh(b.dataset.ch || null)));
    },
  };
}

// ── 결과 없음 ────────────────────────────────────────────
function emptyScreen({ q, p, state }) {
  const sugg = (p.suggestions?.length ? p.suggestions : suggest(q)).map((id) => MERCHANT_BY_ID[id]).filter(Boolean);
  return {
    title: '결과 없음',
    html: `
    ${topbar('확인 결과', { right: searchBtn(q) })}
    <div class="scroll">
      ${interpBar(p, { q, state, ch: null })}
      <div class="empty">
        <img src="assets/char/catsh-wink.webp" alt="" />
        <h2>‘${esc(q)}’은(는) 찾지 못했어요</h2>
        <p>공식 사용처 목록 ${OFFICIAL_TOTAL}곳(${OFFICIAL_CHECKED_AT} 기준)과 오프라인 사용처 ${OFFLINE_TOTAL}곳에서 찾지 못했어요.<br />사용처는 바뀔 수 있으니 공식 목록이나 고객센터에서 한 번 더 확인해 주세요.</p>
        ${sugg.length ? `<p class="label" style="margin-top:8px">혹시 이곳인가요?</p><div class="chips">${sugg.map((m) => `<button class="chip" data-go="#/m/${m.id}">${esc(m.name)}</button>`).join('')}</div>` : ''}
        <div class="empty-actions">
          <button class="btn btn-dark btn-block" data-go="#/search">카테고리로 찾기</button>
          <a class="btn btn-block" href="https://www.cultureland.co.kr/usecash/useCash.do" target="_blank" rel="noopener">공식 사용처 전체 보기 ${icon('ext', 14)}</a>
          <a class="btn btn-block" href="tel:15772111">고객센터 1577-2111 (평일 08:00~17:00)</a>
          <button class="btn btn-ghost btn-block" data-off="사용처 추가 요청">이 사용처 추가 요청하기</button>
        </div>
      </div>
    </div>`,
    mount(root) {
      bindInterp(root, { q, ch: null, onCh: () => {} });
    },
  };
}

// ── 주제 안내(충전·환불·잔액) ─────────────────────────────
export function topicScreen(topicId, { q, p, state }) {
  const t = TOPICS[topicId] || TOPICS.charge;
  const v = state.voucher;
  const blocked = VOUCHERS[v]?.blocked;
  const showCharge = t.route === 'charge' && !blocked;
  return {
    title: t.title,
    gray: true,
    html: `
    ${topbar(t.title)}
    <div class="scroll">
      ${q ? interpBar(p, { q, state, ch: null }) : ''}
      <div class="result-body">
        ${voucherCallout(calloutVoucher(p, state), location.hash, v)}
        ${blocked && t.route === 'charge' ? `<div class="card"><h3 class="card-t">${icon('info', 18)}이렇게 해 보세요</h3><p style="margin:0;font-size:14px;line-height:1.6;color:var(--ink-2)">${esc(VOUCHERS[v].alternative)}</p><div class="btns" style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap"><button class="btn btn-sm" data-setv="cl16">16자리 컬쳐랜드상품권이에요</button><button class="btn btn-sm" data-go="#/search">사용처 찾기</button></div></div>` : ''}
        <article class="card">
          <h3 class="card-t">${icon('info', 18)}${esc(t.title)}</h3>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:var(--ink-2)">${esc(t.lead)}</p>
          <dl class="facts">${t.facts.map(([k, val]) => `<dt>${esc(k)}</dt><dd>${esc(val)}</dd>`).join('')}</dl>
          ${t.actions ? `<div class="next-actions">${t.actions.map((a) => (a.to ? `<button class="btn btn-sm" data-go="${esc(a.to)}">${esc(a.label)}</button>` : a.tel ? callBtn() : extBtn(a.label, SOURCES[a.src].url))).join('')}</div>` : ''}
        </article>
        ${sourceList(t.sources)}
      </div>
    </div>
    ${showCharge ? `<div class="cta-bar"><button class="btn btn-primary btn-block" data-go="#/g/_charge/charge">충전 방법 보기 · ${v === 'gift' ? 5 : 4}단계 ${icon('chev', 18)}</button></div>` : ''}`,
    mount(root) {
      if (q) bindInterp(root, { q, ch: null, onCh: () => {} });
      bindVoucherButtons(root);
    },
  };
}

// ── 라우트 진입점 ────────────────────────────────────────
export function resultView({ query, state }) {
  const q = query.get('q') || '';
  const p = parseQuery(q);
  if (p.voucher && p.voucher !== 'ask' && p.voucher !== state.voucher) setVoucher(p.voucher);
  addRecent(q);
  const ch = query.get('ch') || p.channel || null;
  const back = location.hash;

  if (p.merchants.length === 1) return merchantScreen(MERCHANT_BY_ID[p.merchants[0]], { q, p, ch, state, back });
  if (p.merchants.length > 1) return listScreen({ title: '찾은 사용처', sub: '여러 곳이 해당돼요. 하나를 골라 확인하세요.', ids: p.merchants, q, p, ch, state, back });
  if (p.category) {
    const c = CATEGORIES.find((x) => x.id === p.category);
    return listScreen({ title: c.label, sub: c.hint, ids: MERCHANTS.filter((m) => inCategory(m, p.category)).map((m) => m.id), q, p, ch, state, back });
  }
  if (p.topic === 'convert') return listScreen({ ...KIND_LISTS.convert, ids: kindIds('convert'), q, p, ch, state, back });
  if (p.topic || p.voucher) return topicScreen(p.topic || 'charge', { q, p, state });
  return emptyScreen({ q, p, state });
}

export function merchantRoute({ segs, query, state }) {
  const m = MERCHANT_BY_ID[segs[1]];
  if (!m) return emptyScreen({ q: segs[1] || '', p: { merchants: [], suggestions: [] }, state });
  return merchantScreen(m, { q: '', p: null, ch: query.get('ch'), state, back: location.hash });
}

export function categoryRoute({ segs, query, state }) {
  if (KIND_LISTS[segs[1]]) return listScreen({ ...KIND_LISTS[segs[1]], ids: kindIds(segs[1]), q: '', p: null, ch: query.get('ch'), state, back: location.hash });
  const c = CATEGORIES.find((x) => x.id === segs[1]) || CATEGORIES[0];
  const ids = MERCHANTS.filter((m) => inCategory(m, c.id)).map((m) => m.id);
  return listScreen({ title: c.label, sub: c.hint, ids, q: '', p: null, ch: query.get('ch'), state, back: location.hash });
}

export function topicRoute({ segs, state }) {
  return topicScreen(segs[1], { q: '', p: null, state });
}
