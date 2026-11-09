// [3 사용 안내] 보유 상품권에 맞춘 단계 안내 — 결과 화면에서 바로 이어짐
import { icon, esc, fill, won, pct, sourceList } from '../ui.js';
import { MERCHANT_BY_ID, laneVerdict } from '../../data/merchants.js';
import { METHODS, CHARGE_STEP, routesForLane } from '../../data/methods.js';
import { VOUCHERS } from '../../data/vouchers.js';
import { setVoucher, stepDone, toggleFavorite } from '../state.js';
import { rerender, toast } from '../app.js';
import { CH_LABEL, feeText, openVoucherSheet, voucherLabel } from './shared.js';

const CHARGE_ONLY = {
  id: 'charge',
  label: '컬쳐캐쉬 충전',
  short: '충전',
  needsCash: false,
  summary: '문자로 받은 상품권을 컬쳐캐쉬로 바꿔 두면 온라인 결제·전환·쿠폰까지 쓸 수 있어요',
  prep: ['문자로 받은 16자리 컬쳐랜드상품권', '컬쳐랜드 앱 로그인(본인인증 회원 권장)'],
  steps: [
    { title: '컬쳐랜드 앱 로그인', body: '아이디가 없으면 회원가입 후 휴대폰 본인인증을 해 두세요. 본인인증 회원이 아니면 일부 사용처 이용이 제한돼요.' },
    { title: '[충전] › [컬쳐랜드상품권] 선택', body: '앱 홈의 [컬쳐랜드상품권 충전하기]를 누르거나, 받은 문자의 [컬쳐캐쉬 바로충전] 링크를 눌러요.', action: { label: '충전 화면 열기', to: 'mock/charge' } },
    { title: '16자리 번호 입력 → [충전하기]', body: '문자에 있는 16자리 번호를 입력해요. 20회 이상 틀리면 하루 동안 충전이 제한돼요.' },
    { title: '컬쳐캐쉬 잔액 확인', body: '앱 홈의 사용가능 금액에서 확인해요. 보유한도(본인인증 50만원)를 넘는 금액은 대기 캐쉬로 들어가요.' },
  ],
  cautions: ['18자리 문화상품권(㈜문화상품권)·스마트문상·오프라인 전용 상품권은 충전할 수 없어요.'],
  sources: ['mobileVoucher', 'chargeMain', 'userType'],
};

function laneOf(m, routeId) {
  for (const key of ['offline', 'online']) {
    if (routesForLane(m[key]).includes(routeId)) return { key, lane: m[key] };
  }
  return { key: METHODS[routeId]?.channel || 'online', lane: null };
}

export function guideView({ segs, state }) {
  const isChargeOnly = segs[1] === '_charge';
  const m = isChargeOnly ? { id: '_charge', name: '컬쳐캐쉬 충전', sources: [] } : MERCHANT_BY_ID[segs[1]];
  const routeId = isChargeOnly ? 'charge' : segs[2];
  const method = isChargeOnly ? CHARGE_ONLY : METHODS[routeId];
  if (!m || !method) {
    return { title: '안내', html: `<header class="topbar"><button class="icon-btn" data-back>${icon('back', 22)}</button><h1 class="topbar-title">안내를 찾지 못했어요</h1><span></span></header>` };
  }
  const { key: chKey, lane } = isChargeOnly ? { key: 'online', lane: null } : laneOf(m, routeId);
  const vars = { name: m.name, target: lane?.target || '', fee: lane && typeof lane.fee === 'number' ? pct(lane.fee) : '' };
  const voucher = state.voucher;
  const vinfo = VOUCHERS[voucher];
  const blocked = vinfo?.blocked;

  // 단계 구성: 컬쳐캐쉬가 필요한 방식이면 앞에 충전 단계
  const steps = [];
  if (method.needsCash) {
    steps.push({ ...CHARGE_STEP, skip: voucher === 'cash', charge: true });
  }
  for (const s of method.steps) steps.push({ ...s, title: fill(s.title, vars), body: fill(s.body, vars) });
  const doneKey = `${m.id}/${routeId}`;
  const done = state.done[doneKey] || [];
  const isDone = (i) => !!done[i] || steps[i].skip || (steps[i].charge && state.charged);
  const doneCount = steps.filter((_, i) => isDone(i)).length;
  const allDone = doneCount === steps.length;
  const backHash = location.hash;

  // 같은 사용처의 다른 방법(비교)
  const alts = [];
  if (!isChargeOnly) {
    for (const key of ['offline', 'online']) {
      const l = m[key];
      if (!['ok', 'indirect'].includes(laneVerdict(l))) continue;
      for (const r of routesForLane(l)) {
        const mt = METHODS[r];
        const needCharge = mt.needsCash && voucher !== 'cash';
        alts.push({ r, key, mt, l, n: mt.steps.length + (needCharge ? 1 : 0), needCharge });
      }
    }
  }
  const tabs = alts.length > 1 ? `<div class="route-tabs" role="tablist" aria-label="이용 방법">${alts
    .map((a) => `<button role="tab" aria-selected="${a.r === routeId}" class="${a.r === routeId ? 'on' : ''}" data-go="#/g/${m.id}/${a.r}">${esc(CH_LABEL[a.key])} · ${esc(fill(a.mt.short, { target: a.l.target || '' }))}<small>${a.n}단계${a.needCharge ? ' · 충전 필요' : ''}</small></button>`)
    .join('')}</div>` : '';

  // 보유 상품권 확인 줄
  const vRow = voucher
    ? `<div class="mine"><span>${icon('card', 16)} 내 상품권: <b>${esc(voucherLabel(voucher))}</b></span><button id="chgV">변경</button></div>`
    : `<div class="mine-ask"><p>상품권을 어떻게 갖고 계세요? 단계가 달라져요.</p><div class="chips"><button class="chip" data-setv="cl16">문자로 받은 상품권</button><button class="chip" data-setv="cash">충전한 컬쳐캐쉬</button><button class="chip" data-go="#/v?back=${encodeURIComponent(backHash)}">잘 모르겠어요</button></div></div>`;

  // 문자 바코드 방식인데 컬쳐캐쉬만 있는 경우 안내
  const mismatch =
    routeId === 'barcode-mms' && voucher === 'cash'
      ? `<div class="callout callout-info"><img src="assets/char/catsh-wink.webp" alt="" /><div><h3>이미 충전하셨다면 앱 바코드로 써요</h3><p>충전한 상품권 번호는 문자 바코드로 다시 쓸 수 없어요.</p><div class="btns"><button class="btn btn-sm btn-dark" data-go="#/g/${m.id}/barcode-app">앱 바코드 방법 보기</button></div></div></div>`
      : routeId === 'pin' && voucher === 'cash'
        ? `<div class="callout callout-info"><img src="assets/char/catsh-wink.webp" alt="" /><div><h3>충전한 컬쳐캐쉬는 결제창에서 써요</h3><div class="btns"><button class="btn btn-sm btn-dark" data-go="#/g/${m.id}/direct">결제창에서 바로 쓰기</button></div></div></div>`
        : '';

  const stepHtml = steps
    .map((s, i) => {
      const d = isDone(i);
      const cls = s.skip ? 'is-skip' : d ? 'is-done' : '';
      const act = s.action ? `<button class="btn btn-sm btn-dark" data-go="#/${s.action.to}?m=${m.id}&back=${encodeURIComponent(backHash)}">${icon('phone', 15)}${esc(s.action.label)}</button>` : '';
      const check = s.skip ? '' : `<button class="step-check" data-step="${i}" aria-pressed="${d}">${icon('check', 14)}${d ? '했어요' : '완료 표시'}</button>`;
      const calc = s.calculator && lane ? calcHtml(lane) : '';
      return `<li class="step ${cls}">
        <span class="step-n">${d && !s.skip ? icon('check', 18) : i + 1}</span>
        <div>
          <h4>${esc(s.title)}${s.skip ? '<span class="tag-skip">이미 충전함 · 건너뛰기</span>' : ''}${s.charge && state.charged && !s.skip ? '<span class="tag-skip">시연 충전 완료</span>' : ''}</h4>
          ${s.skip ? '' : `<p>${esc(s.body)}</p>`}
          ${s.tip && !s.skip ? `<p class="tip">${icon('info', 13)}${esc(s.tip)}</p>` : ''}
          ${calc}
          ${s.skip ? '' : `<div class="step-actions">${act}${check}</div>`}
        </div>
      </li>`;
    })
    .join('');

  const facts = lane
    ? [
        ['장소', CH_LABEL[chKey]],
        ['방식', fill(method.label, vars)],
        ['수수료', feeText(lane).replace('수수료 ', '') || '-'],
        lane.min ? ['최소 금액', lane.min] : null,
        lane.limit ? ['한도', lane.limit] : null,
      ].filter(Boolean)
    : [];

  const cautions = [...(method.cautions || []), ...(lane?.notes || [])];
  const srcKeys = [...(method.sources || []), ...(method.needsCash ? CHARGE_STEP.sources : []), ...(m.sources || [])];
  const title = isChargeOnly ? '컬쳐캐쉬 충전 방법' : `${m.name} ${CH_LABEL[chKey]}에서 쓰는 방법`;
  const fav = state.favorites.includes(m.id);

  return {
    title,
    gray: true,
    html: `
    <header class="topbar"><button class="icon-btn" data-back aria-label="뒤로">${icon('back', 22)}</button><h1 class="topbar-title">사용 방법</h1><span class="icon-btn"></span></header>
    <div class="scroll">
      <section class="guide-hero">
        <h2>${esc(title)}</h2>
        <p>${esc(fill(method.summary, vars))}</p>
        ${tabs}
        ${vRow}
      </section>
      <div class="guide-body">
        ${blocked ? `<div class="callout callout-no"><img src="assets/char/boy-sweat.webp" alt="" /><div><h3>${esc(vinfo.short)}은(는) 이 방법으로 쓸 수 없어요</h3><p>${esc(vinfo.reason)}</p><div class="btns"><button class="btn btn-sm" data-go="#/v?back=${encodeURIComponent(backHash)}">내 상품권 다시 확인</button></div></div></div>` : ''}
        ${mismatch}
        <article class="card">
          <h3 class="card-t">${icon('check', 18)}준비물</h3>
          <ul class="prep">${(method.prep || []).map((p) => `<li>${icon('check', 16)}${esc(fill(p, vars))}</li>`).join('')}</ul>
        </article>
        <article class="card">
          <div class="progress-label"><b>따라 하기</b><span>${doneCount}/${steps.length} 완료</span></div>
          <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="${doneCount}"><i style="width:${(doneCount / steps.length) * 100}%"></i></div>
          <ol class="steps">${stepHtml}</ol>
        </article>
        ${allDone ? `<article class="card done-card"><img src="assets/char/boy-thumb.webp" alt="" /><h3>다 됐어요!</h3><p>${esc(m.name)}에서 상품권을 쓰는 순서를 모두 확인했어요.</p></article>` : ''}
        ${facts.length ? `<article class="card"><h3 class="card-t">${icon('info', 18)}수수료·한도</h3><dl class="facts">${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></article>` : ''}
        ${cautions.length ? `<article class="card caution"><img src="assets/char/catsh-safe.webp" alt="" /><div><h3 class="card-t">주의하세요</h3><ul>${cautions.map((c) => `<li>${esc(fill(c, vars))}</li>`).join('')}<li>상품권 번호·바코드를 요구하는 전화·문자는 사기일 수 있어요.</li></ul></div></article>` : ''}
        ${alts.length > 1 ? compareHtml(alts, routeId, m) : ''}
        ${sourceList(srcKeys)}
      </div>
    </div>
    <div class="cta-bar">
      ${allDone ? `<button class="btn btn-primary btn-block" data-go="#/search">다른 사용처 찾기</button>` : `<button class="btn btn-primary btn-block" id="nextStep">다음 단계 완료 표시 (${Math.min(doneCount + 1, steps.length)}/${steps.length})</button>`}
      ${isChargeOnly ? '' : `<div class="cta-sub"><button class="btn btn-ghost" id="favBtn">${icon('star', 16)}${fav ? '즐겨찾기 해제' : '즐겨찾기'}</button><button class="btn btn-ghost" data-go="#/m/${m.id}">판정 결과로</button></div>`}
    </div>`,
    mount(root) {
      root.querySelectorAll('[data-setv]').forEach((b) =>
        b.addEventListener('click', () => {
          setVoucher(b.dataset.setv);
          rerender();
        }),
      );
      root.querySelector('#chgV')?.addEventListener('click', () => openVoucherSheet(() => rerender()));
      root.querySelectorAll('[data-step]').forEach((b) =>
        b.addEventListener('click', () => {
          stepDone(doneKey, +b.dataset.step, steps.length);
          rerender();
        }),
      );
      root.querySelector('#nextStep')?.addEventListener('click', () => {
        const i = steps.findIndex((_, k) => !isDone(k));
        if (i < 0) return;
        stepDone(doneKey, i, steps.length);
        rerender();
        // 방금 표시한 다음 단계(또는 완료 카드)가 보이게
        const target = document.querySelector('.done-card') || document.querySelectorAll('.step')[i + 1];
        target?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
      root.querySelector('#favBtn')?.addEventListener('click', () => {
        const on = toggleFavorite(m.id);
        toast(on ? '홈 즐겨찾기에 추가했어요' : '즐겨찾기에서 뺐어요');
        rerender();
      });
      const calc = root.querySelector('#calcAmt');
      if (calc) {
        const upd = () => {
          const amt = Math.max(0, parseInt(calc.value.replace(/\D/g, ''), 10) || 0);
          const fee = Math.round(amt * lane.fee);
          root.querySelector('#calcFee').textContent = `- ${won(fee)}`;
          root.querySelector('#calcGet').textContent = `${(amt - fee).toLocaleString('ko-KR')}P`;
        };
        calc.addEventListener('input', upd);
        upd();
      }
    },
  };
}

function calcHtml(lane) {
  return `<div class="calc">
    <label for="calcAmt">${icon('calc', 14)} 전환하면 얼마 받나요?</label>
    <div class="calc-input"><input id="calcAmt" inputmode="numeric" value="10000" aria-label="전환할 컬쳐캐쉬 금액" /><span>원</span></div>
    <div class="calc-rows">
      <div><span>수수료 ${pct(lane.fee)}</span><span id="calcFee"></span></div>
      <div class="total"><span>받는 ${esc(lane.target)}</span><span id="calcGet"></span></div>
    </div>
  </div>`;
}

function compareHtml(alts, current, m) {
  const rows = alts
    .map(
      (a) => `<tr class="${a.r === current ? 'on' : ''}">
      <td>${esc(CH_LABEL[a.key])} · ${esc(fill(a.mt.short, { target: a.l.target || '' }))}</td>
      <td>${a.n}단계</td>
      <td>${esc(feeText(a.l).replace('수수료 ', '') || '-')}</td>
      <td>${a.needCharge ? '충전 필요' : '바로'}</td>
      <td>${a.r === current ? '보는 중' : `<a href="#/g/${m.id}/${a.r}">보기</a>`}</td>
    </tr>`,
    )
    .join('');
  return `<article class="card"><h3 class="card-t">${icon('swap', 18)}다른 방법과 비교</h3>
    <table class="compare"><thead><tr><th>방법</th><th>단계</th><th>수수료</th><th>충전</th><th></th></tr></thead><tbody>${rows}</tbody></table></article>`;
}

