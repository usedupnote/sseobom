// 시연용 앱 화면(문자 상품권·충전·바코드 결제·전환·쿠폰·기프트코드) — 실제 결제·충전 없음
import { icon, esc, won, pct, demoTag, fakeBarcode } from '../ui.js';
import { MERCHANT_BY_ID, MERCHANTS } from '../../data/merchants.js';
import { DEMO } from '../../data/demo.js';
import { state, save, setVoucher } from '../state.js';
import { rerender } from '../app.js';

const bar = (title, back) =>
  `<header class="topbar">${back ? `<button class="icon-btn" data-go="${esc(back)}" aria-label="안내로 돌아가기">${icon('back', 22)}</button>` : `<button class="icon-btn" data-back aria-label="뒤로">${icon('back', 22)}</button>`}<h1 class="topbar-title">${esc(title)}</h1><span class="icon-btn"></span></header>`;

const backBtn = (back, label = '안내로 돌아가기') => (back ? `<button class="btn btn-primary btn-block" data-go="${esc(back)}">${esc(label)}</button>` : `<button class="btn btn-primary btn-block" data-go="#/home">홈으로</button>`);

const local = { step: 'form', amount: 10000, place: null, partner: null, denom: 10000, consent: false };
let lastKey = '';

export function mockView({ segs, query }) {
  const type = segs[1] || 'mms';
  const back = query.get('back') || '';
  const m = MERCHANT_BY_ID[query.get('m')];
  const key = location.hash.split('?')[0] + (query.get('m') || '');
  if (key !== lastKey) {
    Object.assign(local, { step: 'form', amount: 10000, place: null, partner: null, denom: 10000, consent: false, forcePick: false });
    lastKey = key;
  }
  const fn = { mms, charge, barcode, convert, coupon, giftcode }[type] || mms;
  return fn({ back, m });
}

// ── 문자로 받은 상품권(MMS) — 미션 가이드 4쪽 예시 구성 ──
function mms({ back }) {
  return {
    title: '문자로 받은 상품권',
    html: `${bar('메시지', back)}${demoTag('시연용 상품권 문자 · 가짜 바코드예요')}
    <div class="scroll"><div class="mms-wrap">
      <p class="mms-sender">컬쳐랜드 · 오늘 오전 9:12</p>
      <div class="mms">
        <div class="voucher-card">
          <img class="vc-logo" src="assets/brand/logo-combo-voucher.svg" alt="컬쳐랜드상품권" />
          <hr />
          <img class="vc-word" src="assets/brand/logo-wordmark.svg" alt="" />
          ${fakeBarcode(DEMO.barcodeNo)}
          <p class="vc-amt">${won(DEMO.voucherAmount)}</p>
        </div>
        <p class="mms-warn">${icon('info', 13)} 바코드 인식이 안 될 경우, 아래 바코드 번호로 결제하실 수 있습니다.</p>
        <ul class="mms-rows">
          <li><span>바코드번호</span><b>${DEMO.barcodeNo}</b></li>
          <li><span>고객센터</span><b>${DEMO.customerCenter}</b></li>
          <li><span>사용처/잔액안내</span><button class="hot proposal" data-go="#/search?from=mms">쓸곳찾기${icon('chev', 14)}</button></li>
          <li><span>컬쳐캐쉬 바로충전</span><button data-go="#/mock/charge?back=${encodeURIComponent('#/mock/mms')}">충전하기${icon('chev', 14)}</button></li>
          <li><span>Google Play 기프트 코드 바로충전</span><button data-go="#/m/googleplay">충전하기${icon('chev', 14)}</button></li>
        </ul>
        <div class="mms-places">
          <b>온라인 사용처</b>쿠팡 · 네이버페이 · 넥슨 · Google Play · 스마일캐시 · G마켓 외
          <b>오프라인 사용처</b>CU · GS25 · 세븐일레븐 · 이마트24 · CGV · 교보문고 외
        </div>
      </div>
      <p class="home-note" style="margin-top:14px">문자의 [사용처/잔액안내] 링크가 쓸곳찾기로 이어지도록 제안해요. 이때 ‘내 상품권’은 자동으로 ‘문자로 받은 상품권’이 돼요.</p>
    </div></div>
    <div class="cta-bar">${back ? backBtn(back) : `<button class="btn btn-primary btn-block" data-go="#/search?from=mms">이 상품권, 어디서 쓸 수 있어요?</button>`}</div>`,
    mount() {
      if (!state.voucher) setVoucher('cl16');
    },
  };
}

// ── 컬쳐캐쉬 충전 ──
function charge({ back }) {
  if (local.step === 'done') {
    return {
      title: '충전 완료',
      html: `${bar('충전', back)}${demoTag()}
      <div class="scroll"><div class="mock-body success">
        <img src="assets/char/catsh-cash.webp" alt="" />
        <h2>${won(DEMO.voucherAmount)} 충전 완료</h2>
        <p>컬쳐캐쉬 사용가능 금액이 <b>${won(state.cash)}</b>이 됐어요.<br />이제 온라인 결제·전환·쿠폰·앱 바코드에 쓸 수 있어요.</p>
      </div></div>
      <div class="cta-bar">${backBtn(back)}</div>`,
    };
  }
  return {
    title: '컬쳐캐쉬 충전',
    html: `${bar('충전', back)}${demoTag()}
    <div class="scroll"><div class="mock-body">
      <div><p class="field-label">충전 수단</p>
        <div class="optlist">
          <button class="opt on">${icon('card', 18)}컬쳐랜드상품권(모바일문화상품권)<small>16자리</small></button>
          <button class="opt" disabled>${icon('gift', 18)}교환소에서 교환한 상품권<small>카톡 선물·기프티쇼</small></button>
        </div>
      </div>
      <div><p class="field-label">상품권 번호 16자리 <small style="font-weight:500;color:var(--ink-3)">(시연용 번호가 채워져 있어요)</small></p>
        <div class="pin-row">${DEMO.pinDemo.map((p, i) => `<input value="${p}" readonly aria-label="번호 ${i + 1}번째 4자리" />`).join('')}</div>
      </div>
      <ul class="notes">
        <li>${icon('info', 14)}<span>상품권 충전 한도는 없어요. 보유한도(본인인증 50만원)를 넘으면 대기 캐쉬로 보관돼요.</span></li>
        <li>${icon('info', 14)}<span>번호를 20회 이상 잘못 입력하면 하루 동안 충전이 제한돼요.</span></li>
        <li>${icon('info', 14)}<span>18자리 문화상품권·스마트문상은 충전할 수 없어요.</span></li>
      </ul>
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="doCharge">충전하기(시연)</button></div>`,
    mount(root) {
      root.querySelector('#doCharge').addEventListener('click', () => {
        if (!state.charged) {
          state.cash += DEMO.voucherAmount;
          state.charged = true;
        }
        if (!state.voucher) state.voucher = 'cl16';
        save();
        local.step = 'done';
        rerender();
      });
    },
  };
}

// ── 앱 바코드 결제 ──
const BARCODE_PLACES = () => MERCHANTS.filter((m) => m.offline?.kind === 'barcode' && !m.group);
let timerId;
function barcode({ back, m }) {
  const places = BARCODE_PLACES();
  const fromGuide = !local.forcePick && m && m.offline?.kind === 'barcode' ? (m.group ? MERCHANT_BY_ID[m.group[0]] : m) : null;
  const place = MERCHANT_BY_ID[local.place] || fromGuide;
  if (local.step === 'done') {
    return {
      title: '결제 완료',
      html: `${bar('바코드 결제', back)}${demoTag()}
      <div class="scroll"><div class="mock-body success">
        <img src="assets/char/boy-thumb.webp" alt="" />
        <h2>결제 완료</h2>
        <div class="receipt">
          <div><span>사용처</span><b>${esc(place?.name || '-')}</b></div>
          <div><span>결제 금액</span><b>${won(DEMO.purchase)}</b></div>
          <div class="total"><span>남은 컬쳐캐쉬</span><span>${won(state.cash)}</span></div>
        </div>
      </div></div>
      <div class="cta-bar">${backBtn(back)}</div>`,
    };
  }
  if (!place) {
    return {
      title: '바코드 결제',
      html: `${bar('바코드 결제', back)}${demoTag()}
      <div class="scroll"><div class="mock-body"><p class="field-label">어디서 결제하나요?</p>
        <div class="optlist">${places.map((p) => `<button class="opt" data-place="${p.id}">${icon('store', 18)}${esc(p.name)}</button>`).join('')}</div>
      </div></div>`,
      mount(root) {
        root.querySelectorAll('[data-place]').forEach((b) =>
          b.addEventListener('click', () => {
            local.place = b.dataset.place;
            rerender();
          }),
        );
      },
    };
  }
  const enough = state.cash >= DEMO.purchase;
  return {
    title: '바코드 결제',
    html: `${bar('바코드 결제', back)}${demoTag()}
    <div class="scroll"><div class="mock-body">
      <div class="pay-barcode">
        <b>${esc(place.name)}</b>
        <div class="bc-wrap">${fakeBarcode('9876543210123456')}<p class="bc-no">9876 5432 1012 3456</p></div>
        <p class="timer" id="timer">유효시간 03:00</p>
        <p class="bal">사용가능 컬쳐캐쉬 ${won(state.cash)}</p>
      </div>
      <button class="btn btn-ghost btn-block" id="chgPlace">사용처 바꾸기</button>
      ${enough ? '' : `<div class="callout callout-warn"><img src="assets/char/boy-please.webp" alt="" /><div><h3>잔액이 부족해요</h3><p>먼저 상품권을 컬쳐캐쉬로 충전해요.</p><div class="btns"><button class="btn btn-sm btn-dark" data-go="#/mock/charge?back=${encodeURIComponent(location.hash)}">충전하기</button></div></div></div>`}
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="pay" ${enough ? '' : 'disabled'}>직원이 스캔했다고 가정 · ${won(DEMO.purchase)} 결제</button></div>`,
    mount(root) {
      clearInterval(timerId);
      let s = 180;
      const t = root.querySelector('#timer');
      timerId = setInterval(() => {
        if (!document.body.contains(t)) return clearInterval(timerId);
        s = Math.max(0, s - 1);
        t.textContent = `유효시간 0${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      }, 1000);
      root.querySelector('#chgPlace').addEventListener('click', () => {
        local.place = null;
        local.forcePick = true;
        rerender();
      });
      root.querySelector('#pay')?.addEventListener('click', () => {
        state.cash -= DEMO.purchase;
        save();
        local.place = place.id;
        local.step = 'done';
        rerender();
      });
    },
  };
}

// ── 포인트 전환 ──
function convert({ back, m }) {
  const partners = MERCHANTS.filter((x) => x.online?.kind === 'convert');
  const p = MERCHANT_BY_ID[local.partner] || (m?.online?.kind === 'convert' ? m : partners[0]);
  const lane = p.online;
  const fee = Math.round(local.amount * lane.fee);
  const get = local.amount - fee;
  if (local.step === 'done') {
    return {
      title: '전환 완료',
      html: `${bar('캐쉬 전환', back)}${demoTag()}
      <div class="scroll"><div class="mock-body success">
        <img src="assets/char/catsh-cash.webp" alt="" />
        <h2>${esc(lane.target)} ${get.toLocaleString('ko-KR')}P 전환 완료</h2>
        <div class="receipt">
          <div><span>차감 컬쳐캐쉬</span><b>${won(local.amount)}</b></div>
          <div><span>전환 수수료 ${pct(lane.fee)}</span><b>- ${won(fee)}</b></div>
          <div class="total"><span>받은 ${esc(lane.target)}</span><span>${get.toLocaleString('ko-KR')}P</span></div>
        </div>
        <p>이제 ${esc(p.name)} 결제 화면에서 ${esc(lane.target)}로 결제해요.</p>
      </div></div>
      <div class="cta-bar">${backBtn(back)}</div>`,
    };
  }
  return {
    title: '캐쉬 전환',
    html: `${bar('캐쉬 전환', back)}${demoTag()}
    <div class="scroll"><div class="mock-body">
      <div><p class="field-label">전환할 곳</p>
        <div class="optlist">${partners
          .slice(0, 6)
          .map((x) => `<button class="opt ${x.id === p.id ? 'on' : ''}" data-partner="${x.id}">${icon('coin', 18)}${esc(x.online.target)}<small>수수료 ${pct(x.online.fee)}</small></button>`)
          .join('')}</div>
      </div>
      <div><p class="field-label">전환 금액 <small style="font-weight:500;color:var(--ink-3)">(사용가능 ${won(state.cash)})</small></p>
        <div class="grid-3">${[5000, 10000, 30000].map((a) => `<button class="opt ${local.amount === a ? 'on' : ''}" data-amt="${a}">${won(a)}</button>`).join('')}</div>
      </div>
      <div class="receipt">
        <div><span>차감 컬쳐캐쉬</span><b>${won(local.amount)}</b></div>
        <div><span>수수료 ${pct(lane.fee)}</span><b>- ${won(fee)}</b></div>
        <div class="total"><span>받는 ${esc(lane.target)}</span><span>${get.toLocaleString('ko-KR')}P</span></div>
      </div>
      <label class="consent"><input type="checkbox" id="consent" ${local.consent ? 'checked' : ''} /><span>(최초 1회) 제3자 정보제공에 동의하고, 컬쳐랜드와 ${esc(p.name)} 계정의 명의가 같은지 확인했어요. 전환 후에는 취소할 수 없어요.</span></label>
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="doConv" ${local.consent && state.cash >= local.amount ? '' : 'disabled'}>전환하기(시연)</button></div>`,
    mount(root) {
      root.querySelectorAll('[data-partner]').forEach((b) => b.addEventListener('click', () => ((local.partner = b.dataset.partner), rerender())));
      root.querySelectorAll('[data-amt]').forEach((b) => b.addEventListener('click', () => ((local.amount = +b.dataset.amt), rerender())));
      root.querySelector('#consent').addEventListener('change', (e) => ((local.consent = e.target.checked), rerender()));
      root.querySelector('#doConv').addEventListener('click', () => {
        state.cash -= local.amount;
        save();
        local.partner = p.id;
        local.step = 'done';
        rerender();
      });
    },
  };
}

// ── 모바일 쿠폰 ──
function coupon({ back, m }) {
  const brands = MERCHANTS.filter((x) => x.offline?.kind === 'coupon' || x.online?.kind === 'coupon');
  const b = MERCHANT_BY_ID[local.partner] || (m && brands.includes(m) ? m : MERCHANT_BY_ID.cgv);
  if (local.step === 'done') {
    return {
      title: '쿠폰 발송',
      html: `${bar('쿠폰', back)}${demoTag()}
      <div class="scroll"><div class="mock-body success">
        <img src="assets/char/catsh-cash.webp" alt="" />
        <h2>${esc(b.name)} ${won(local.denom)} 쿠폰 발송</h2>
        <p>010-****-1234로 쿠폰 문자가 갔어요(시연).<br />매장(또는 앱)에서 쿠폰 바코드를 보여주고 써요.</p>
      </div></div>
      <div class="cta-bar">${backBtn(back)}</div>`,
    };
  }
  return {
    title: '쿠폰 구매',
    html: `${bar('쿠폰', back)}${demoTag()}
    <div class="scroll"><div class="mock-body">
      <div><p class="field-label">브랜드</p><div class="optlist">${[b, ...brands.filter((x) => x !== b)].slice(0, 5).map((x) => `<button class="opt ${x === b ? 'on' : ''}" data-brand="${x.id}">${icon('ticket', 18)}${esc(x.name)}</button>`).join('')}</div></div>
      <div><p class="field-label">금액(권종)</p><div class="grid-3">${[5000, 10000, 30000].map((a) => `<button class="opt ${local.denom === a ? 'on' : ''}" data-denom="${a}">${won(a)}</button>`).join('')}</div></div>
      <div class="receipt"><div><span>받는 번호</span><b>010-****-1234</b></div><div><span>결제수단</span><b>컬쳐캐쉬</b></div><div><span>수수료</span><b>앱에서 확인(로그인 필요)</b></div></div>
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="buy">구매하기(시연)</button></div>`,
    mount(root) {
      root.querySelectorAll('[data-brand]').forEach((x) => x.addEventListener('click', () => ((local.partner = x.dataset.brand), rerender())));
      root.querySelectorAll('[data-denom]').forEach((x) => x.addEventListener('click', () => ((local.denom = +x.dataset.denom), rerender())));
      root.querySelector('#buy').addEventListener('click', () => {
        local.partner = b.id;
        local.step = 'done';
        rerender();
      });
    },
  };
}

// ── Google Play 기프트코드 ──
function giftcode({ back }) {
  const denoms = [5000, 10000, 15000, 30000, 50000, 100000, 150000, 200000];
  const fee = Math.round(local.denom * 0.03);
  if (local.step === 'done') {
    return {
      title: '기프트코드 발급',
      html: `${bar('Google Play', back)}${demoTag()}
      <div class="scroll"><div class="mock-body success">
        <img src="assets/char/catsh-cash.webp" alt="" />
        <h2>${won(local.denom)} 기프트코드 발급</h2>
        <div class="receipt"><div><span>코드(시연)</span><b>${DEMO.giftcodeDemo}</b></div><div><span>결제 금액</span><b>${won(local.denom + fee)}</b></div></div>
        <p>Play 스토어 › 프로필 › 결제 및 구독 › [코드 사용]에 입력해요.</p>
      </div></div>
      <div class="cta-bar">${backBtn(back)}</div>`,
    };
  }
  return {
    title: 'Google Play 기프트코드',
    html: `${bar('Google Play', back)}${demoTag()}
    <div class="scroll"><div class="mock-body">
      <div><p class="field-label">권종(8종)</p><div class="grid-4">${denoms.map((a) => `<button class="opt ${local.denom === a ? 'on' : ''}" data-denom="${a}">${a >= 10000 ? `${a / 10000}만` : `${a / 1000}천`}</button>`).join('')}</div></div>
      <div class="receipt"><div><span>권종</span><b>${won(local.denom)}</b></div><div><span>수수료 3%</span><b>+ ${won(fee)}</b></div><div class="total"><span>결제 금액(컬쳐캐쉬)</span><span>${won(local.denom + fee)}</span></div></div>
      <ul class="notes"><li>${icon('info', 14)}<span>쓰지 않은 코드는 7일 안에 취소할 수 있어요.</span></li></ul>
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="buy">구매하기(시연)</button></div>`,
    mount(root) {
      root.querySelectorAll('[data-denom]').forEach((x) => x.addEventListener('click', () => ((local.denom = +x.dataset.denom), rerender())));
      root.querySelector('#buy').addEventListener('click', () => {
        local.step = 'done';
        rerender();
      });
    },
  };
}

