// 사진에서 상품권 한 번에 등록(일괄등록) — 사진첩 전체를 살펴 컬쳐랜드상품권을 찾고, 이용자가 확인한 것만 한 번에 충전하는 제안 화면.
// 사진 접근과 번호 인식은 시연에 필요하지 않아 꺼 두고, data/demo.js의 예시 사진첩만 쓴다. 단계는 주소의 ?st=scan|result|done 으로 구분한다.
import { icon, esc, won, demoTag, topbar, sourceList } from '../ui.js';
import { DEMO } from '../../data/demo.js';
import { VOUCHERS } from '../../data/vouchers.js';
import { state, save } from '../state.js';
import { swap, openSheet, closeSheet } from '../app.js';

const PHOTOS = DEMO.bulkPhotos;
const BY_ID = Object.fromEntries(PHOTOS.map((p) => [p.id, p]));
const TOTAL = DEMO.galleryTotal;
const OK = PHOTOS.filter((p) => p.status === 'ok');
const CHECK = PHOTOS.filter((p) => p.status === 'check');
const BLOCKED = PHOTOS.filter((p) => p.status === 'blocked');

const masked = (p) => `${p.head} •••• •••• ${p.tail}`;
// 문자로 받은 상품권을 충전 화면에서 이미 충전했다면 같은 상품권으로 본다
const isRegistered = (p) => state.bulk.includes(p.id) || (p.sameAsMms && state.charged);
const sumOf = (list) => list.reduce((a, p) => a + (p.amount || 0), 0);

let picked = null; // 등록하려고 고른 사진 id
const chosen = () => OK.filter((p) => picked.has(p.id) && !isRegistered(p));
const ctaLabel = (list) => (list.length ? `${list.length}장 · ${won(sumOf(list))} 한 번에 등록` : '등록할 상품권을 골라 주세요');
let lastRun = []; // 방금 등록한 사진 id(완료 화면에 보여줄 것)
let scanTimer;

const bar = () => topbar('상품권 일괄등록');
const thumb = (p) => `<span class="bk-thumb bk-${p.type} bk-${p.status}" aria-hidden="true"><i></i><b></b></span>`;

export function bulkView({ query }) {
  const step = query.get('st') || 'intro';
  if (step === 'scan') return scan();
  if (step === 'result') return result();
  if (step === 'done') return done();
  return intro();
}

// ── 1. 안내와 동의 ──
function intro() {
  return {
    title: '상품권 일괄등록',
    html: `${bar()}${demoTag('사진 접근은 시연에 필요하지 않아 꺼 두었어요')}
    <div class="scroll"><div class="mock-body bulk-body">
      <div class="bulk-hero">
        <span class="bulk-hero-ic">${icon('photo', 30)}</span>
        <h2>받은 상품권, 사진에서 한 번에 등록</h2>
        <p>문자·화면 캡처로 사진첩에 흩어진 컬쳐랜드상품권을 찾아 컬쳐캐쉬로 한 번에 충전해요. 16자리 번호를 한 장씩 입력하지 않아도 돼요.</p>
      </div>
      <ol class="bulk-how">
        <li><b>1</b><span><strong>사진첩 전체 살펴보기</strong>상품권으로 보이는 사진만 골라내요.</span></li>
        <li><b>2</b><span><strong>번호·금액을 읽고 종류 가리기</strong>16자리 컬쳐랜드상품권만 등록 대상이에요. 다른 회사 상품권은 따로 알려드려요.</span></li>
        <li><b>3</b><span><strong>직접 확인하고 한 번에 등록</strong>고른 상품권만 충전돼요.</span></li>
      </ol>
      <div class="callout callout-info bulk-privacy">
        <span class="bulk-shield">${icon('shield', 22)}</span>
        <div><h3>사진은 이렇게 다뤄요</h3>
          <ul>
            <li>사진은 이 휴대폰 안에서만 살펴보고, 밖으로 보내지 않아요.</li>
            <li>상품권이 아닌 사진은 저장하거나 보여주지 않아요.</li>
            <li>[등록하기]를 누르기 전에는 아무것도 충전되지 않아요.</li>
          </ul>
        </div>
      </div>
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="bulkStart">${icon('photo', 18)}사진에서 상품권 찾기</button>
      <div class="cta-sub"><button class="btn" data-go="#/mock/charge">번호 직접 입력하기</button></div></div>`,
    mount(root) {
      root.querySelector('#bulkStart').addEventListener('click', askPermission);
    },
  };
}

// 휴대폰의 사진 접근 허용 창을 본뜬 시트
function askPermission() {
  openSheet(
    `<h3>‘컬쳐랜드’가 사진에 접근하려고 합니다</h3>
     <p class="vs-note" style="margin-bottom:14px">상품권 사진을 찾아 한 번에 등록하는 데에만 써요. 실제 사진 접근은 시연에 필요하지 않아 꺼 두었고, 예시 사진첩 ${TOTAL}장을 살펴봐요.</p>
     <div class="optlist">
       <button type="button" class="btn btn-primary btn-block" id="permAll">전체 사진 접근 허용</button>
       <button type="button" class="btn btn-block" id="permNo">허용 안 함</button>
     </div>`,
    (sh) => {
      sh.querySelector('#permAll').addEventListener('click', () => {
        picked = null;
        swap('#/bulk?st=scan');
      });
      sh.querySelector('#permNo').addEventListener('click', closeSheet);
    },
  );
}

// ── 2. 사진첩 살펴보기 ──
const HIT_AT = [0.12, 0.35, 0.5, 0.72, 0.9]; // 진행률이 이만큼 되면 상품권 사진을 하나씩 찾은 것으로 표시
const HIT_TILE = [1, 4, 6, 9, 11];
function scan() {
  const tiles = Array.from({ length: 12 }, () => '<i></i>').join('');
  return {
    title: '사진 살펴보는 중',
    html: `${bar()}${demoTag('예시 사진첩을 살펴보고 있어요')}
    <div class="scroll"><div class="mock-body bulk-body bulk-scan" aria-live="off">
      <div class="bulk-tiles" aria-hidden="true">${tiles}</div>
      <h2 id="scanTitle">사진을 살펴보고 있어요</h2>
      <div class="bulk-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${TOTAL}" aria-valuenow="0" aria-labelledby="scanTitle"><span></span></div>
      <p class="bulk-count"><b data-scan-n>0</b> / ${TOTAL}장 확인</p>
      <p class="bulk-found">${icon('ticket', 16)}상품권으로 보이는 사진 <b data-scan-found>0</b>장</p>
      <p class="bulk-hint">사진은 이 휴대폰 안에서만 살펴봐요.</p>
    </div></div>`,
    mount(root) {
      const n = root.querySelector('[data-scan-n]');
      const found = root.querySelector('[data-scan-found]');
      const barEl = root.querySelector('.bulk-bar');
      const tiles = [...root.querySelectorAll('.bulk-tiles i')];
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const steps = reduce ? 2 : 16;
      let i = 0;
      clearInterval(scanTimer);
      scanTimer = setInterval(
        () => {
          if (!document.body.contains(n)) return clearInterval(scanTimer);
          i++;
          const f = i / steps;
          const hits = HIT_AT.filter((h) => f >= h).length;
          n.textContent = Math.round(TOTAL * f);
          found.textContent = hits;
          barEl.setAttribute('aria-valuenow', Math.round(TOTAL * f));
          barEl.firstElementChild.style.width = `${f * 100}%`;
          tiles.forEach((t, k) => {
            t.classList.toggle('seen', k < Math.round(f * tiles.length));
            t.classList.toggle('hit', HIT_TILE.indexOf(k) > -1 && HIT_TILE.indexOf(k) < hits);
          });
          if (i >= steps) {
            clearInterval(scanTimer);
            setTimeout(() => document.body.contains(n) && swap('#/bulk?st=result'), 400);
          }
        },
        reduce ? 400 : 150,
      );
    },
  };
}

// ── 3. 찾은 상품권 확인하고 고르기 ──
function result() {
  if (!picked) picked = new Set(OK.filter((p) => !isRegistered(p)).map((p) => p.id));
  const self = encodeURIComponent('#/bulk?st=result');
  const other = VOUCHERS[BLOCKED[0]?.type] || VOUCHERS.paper;

  const okItem = (p) => {
    const reg = isRegistered(p);
    return `<label class="bk-item ${reg ? 'is-reg' : ''}">
      <input type="checkbox" data-pick="${p.id}" ${picked.has(p.id) && !reg ? 'checked' : ''} ${reg ? 'disabled' : ''} />
      ${thumb(p)}
      <span class="bk-main"><strong>컬쳐랜드상품권 ${won(p.amount)}</strong><span class="bk-no">${masked(p)}</span>
        <span class="bk-meta"><small>${esc(p.from)} · ${esc(p.date)}</small>${reg ? `<span class="pill pill-muted">${icon('check', 13)}이미 등록됨</span>` : `<span class="pill pill-ok">${icon('check', 13)}16자리 확인</span>`}</span></span>
    </label>`;
  };
  const checkItem = (p) => `<div class="bk-item is-static">
      ${thumb(p)}
      <span class="bk-main"><strong>컬쳐랜드상품권으로 보여요</strong><small>번호 일부가 잘려 있어 다 읽지 못했어요. 원본 문자를 보고 직접 입력해 주세요.</small><small>${esc(p.from)} · ${esc(p.date)}</small>
        <button type="button" class="btn btn-sm" data-go="#/mock/charge?back=${self}">번호 직접 입력하기</button></span>
    </div>`;
  // 등록할 수 없는 사진(다른 회사 상품권) — 왜 안 되는지와 대안을 보여주는 결과 화면으로 이어준다
  const WHY = { paper: '지류 상품권 충전되나요?', munsang18: '문화상품권 18자리 충전되나요?' };
  const blockedItem = (p) => `<div class="bk-item is-static">
      ${thumb(p)}
      <span class="bk-main"><strong>${esc(VOUCHERS[p.type].short)} ${won(p.amount)}</strong><small>${esc(VOUCHERS[p.type].reason)}</small><small>${esc(p.from)} · ${esc(p.date)}</small>
        <button type="button" class="btn btn-sm" data-go="#/r?q=${encodeURIComponent(WHY[p.type] || WHY.paper)}">이유와 대안 보기</button></span>
    </div>`;

  return {
    title: '찾은 상품권',
    html: `${bar()}${demoTag('예시 사진첩이에요 · 실제 상품권 번호가 아니에요')}
    <div class="scroll"><div class="mock-body bulk-body">
      <div class="bulk-sum">
        <h2>사진 ${TOTAL}장에서 상품권 ${PHOTOS.length}장을 찾았어요</h2>
        <p><span class="pill pill-ok">${icon('check', 13)}등록 가능 ${OK.length}</span><span class="pill pill-warn">${icon('question', 13)}확인 필요 ${CHECK.length}</span><span class="pill pill-no">${icon('x', 13)}등록 불가 ${BLOCKED.length}</span></p>
      </div>
      <section><h3 class="bk-head">등록할 수 있어요 <small>체크한 상품권만 등록돼요</small></h3><div class="bk-list">${OK.map(okItem).join('')}</div></section>
      <section><h3 class="bk-head">확인이 필요해요</h3><div class="bk-list">${CHECK.map(checkItem).join('')}</div></section>
      <section><h3 class="bk-head">등록할 수 없어요</h3><div class="bk-list">${BLOCKED.map(blockedItem).join('')}</div></section>
      <ul class="notes">
        <li>${icon('info', 14)}<span>번호는 앞뒤 4자리만 보여줘요. 등록한 뒤에는 사진첩의 상품권 사진을 지우는 것이 안전해요.</span></li>
        <li>${icon('info', 14)}<span>보유한도(본인인증 50만원)를 넘는 금액은 대기 캐쉬로 보관돼요.</span></li>
      </ul>
      ${sourceList(['chargeMain', 'userType', ...other.sources], { compact: true })}
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="bulkGo" ${chosen().length ? '' : 'disabled'}>${ctaLabel(chosen())}</button></div>`,
    mount(root) {
      const goBtn = root.querySelector('#bulkGo');
      // 체크를 바꾸면 화면을 다시 그리지 않고 아래 버튼의 장수·금액만 고친다(초점과 스크롤 유지)
      root.querySelectorAll('[data-pick]').forEach((box) =>
        box.addEventListener('change', () => {
          if (box.checked) picked.add(box.dataset.pick);
          else picked.delete(box.dataset.pick);
          goBtn.textContent = ctaLabel(chosen());
          goBtn.disabled = !chosen().length;
        }),
      );
      goBtn.addEventListener('click', () => {
        const sel = chosen();
        if (!sel.length) return;
        const sum = sumOf(sel);
        state.cash += sum;
        state.bulk = [...state.bulk, ...sel.map((p) => p.id)];
        if (sel.some((p) => p.sameAsMms)) state.charged = true;
        if (!state.voucher || state.voucher === 'cl16') state.voucher = 'cash'; // 이제 컬쳐캐쉬 보유 → 안내에서 충전 단계 생략
        save();
        lastRun = sel.map((p) => p.id);
        swap('#/bulk?st=done');
      });
    },
  };
}

// ── 4. 등록 완료 → 어디서 쓸지로 연결 ──
function done() {
  const ids = lastRun.length ? lastRun : state.bulk;
  const items = ids.map((id) => BY_ID[id]).filter(Boolean);
  if (!items.length) return intro();
  const left = CHECK.length + BLOCKED.length;
  return {
    title: '등록 완료',
    html: `${bar()}${demoTag('실제 충전은 시연에 필요하지 않아 꺼 두었어요')}
    <div class="scroll"><div class="mock-body bulk-body success">
      <img src="assets/char/catsh-cash.webp" alt="" />
      <h2>${items.length}장 · ${won(sumOf(items))} 등록 완료</h2>
      <p>컬쳐캐쉬 사용가능 금액이 <b>${won(state.cash)}</b>이 됐어요.</p>
      <div class="receipt">
        ${items.map((p) => `<div><span>컬쳐랜드상품권 •••• ${p.tail}</span><b>${won(p.amount)}</b></div>`).join('')}
        <div class="total"><span>충전한 컬쳐캐쉬</span><span>${won(sumOf(items))}</span></div>
      </div>
      <p class="bulk-rest">등록하지 않은 ${left}장(확인 필요 ${CHECK.length} · 등록 불가 ${BLOCKED.length})은 그대로 두었어요.</p>
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" data-go="#/search">충전한 캐쉬, 어디서 쓸까요?</button>
      <div class="cta-sub"><button class="btn" data-go="#/home">홈으로</button><button class="btn" data-go="#/bulk?st=result">찾은 사진 다시 보기</button></div></div>`,
  };
}
