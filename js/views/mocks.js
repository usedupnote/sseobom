// 앱 화면(문자 상품권·충전·교환소·바코드 결제·전환·쿠폰·기프트코드) — 실제 결제·충전은 시연에 필요하지 않아 꺼 두고, 예시 데이터로 흐름만 보여준다
import { icon, esc, won, pct, demoTag, fakeBarcode, topbar, sourceList } from '../ui.js';
import { MERCHANT_BY_ID, MERCHANTS } from '../../data/merchants.js';
import { DEMO } from '../../data/demo.js';
import { state, save, setVoucher } from '../state.js';
import { rerender, openOverlay } from '../app.js';

const bar = (title, back) => topbar(title, { backTo: back });

// 바코드 크게 보여주기 — 저시력 이용자가 계산대에서 화면을 그대로 내밀 수 있게 전체 화면·큰 숫자로
const bigBarcodeBtn = (no, place) =>
  `<button class="btn btn-block proposal" data-big-barcode="${esc(no)}" data-bb-place="${esc(place)}">${icon('expand', 18)}바코드 크게 보여주기</button>`;
function bindBigBarcode(root) {
  root.querySelectorAll('[data-big-barcode]').forEach((b) =>
    b.addEventListener('click', () => {
      const no = b.dataset.bigBarcode;
      openOverlay(`
        <p class="ov-place">${esc(b.dataset.bbPlace || '컬쳐랜드상품권')}</p>
        <p class="ov-hint">직원에게 이 화면을 보여주세요.<br />화면 밝기를 가장 밝게 올리면 잘 읽혀요.</p>
        ${fakeBarcode(no, { w: 340, h: 150 })}
        <p class="ov-no" aria-label="바코드 번호 ${esc(no.replace(/\s/g, ' '))}">${esc(no)}</p>
        <p class="ov-hint">예시 바코드라 실제 결제에는 쓸 수 없어요.</p>
        <button class="btn btn-block" data-close-overlay>닫기</button>`);
    }),
  );
}

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
  const fn = { mms, charge, exchange, barcode, convert, coupon, giftcode }[type] || mms;
  return fn({ back, m });
}

// ── 문자로 받은 상품권(MMS) — 실제 상품권 문자의 구성(바코드·번호·바로가기 링크)을 본뜬 시연 화면 ──
function mms({ back }) {
  return {
    title: '문자로 받은 상품권',
    html: `${bar('메시지', back)}${demoTag('예시 상품권 문자예요 · 실제 결제에는 쓸 수 없어요')}
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
        <div style="margin-top:10px">${bigBarcodeBtn(DEMO.barcodeNo, '컬쳐랜드상품권 ' + won(DEMO.voucherAmount))}</div>
        <p class="mms-warn">${icon('info', 13)} 바코드 인식이 안 될 경우, 아래 바코드 번호로 결제하실 수 있습니다.</p>
        <ul class="mms-rows">
          <li><span>바코드번호</span><b>${DEMO.barcodeNo}</b></li>
          <li><span>고객센터</span><b>${DEMO.customerCenter}</b></li>
          <li><span>사용처/잔액안내</span><button class="hot proposal" data-go="#/search?from=mms">써봄에서 확인${icon('chev', 14)}</button></li>
          <li><span>컬쳐캐쉬 바로충전</span><button data-go="#/mock/charge?back=${encodeURIComponent('#/mock/mms')}">충전하기${icon('chev', 14)}</button></li>
          <li><span>Google Play 기프트 코드 바로충전</span><button data-go="#/m/googleplay">충전하기${icon('chev', 14)}</button></li>
        </ul>
        <div class="mms-places">
          <b>온라인 사용처</b>쿠팡 · 네이버페이 · 넥슨 · Google Play · 스마일머니 · G마켓 외
          <b>오프라인 사용처</b>CU · GS25 · 세븐일레븐 · 이마트24 · CGV · 교보문고 외
        </div>
      </div>
      <p class="home-note" style="margin-top:14px">문자의 [사용처/잔액안내] 링크가 써봄으로 이어지도록 제안해요. 이때 ‘내 상품권’은 자동으로 ‘문자로 받은 상품권’이 돼요.</p>
    </div></div>
    <div class="cta-bar">${back ? backBtn(back) : `<button class="btn btn-primary btn-block" data-go="#/search?from=mms">이 상품권, 어디서 쓸 수 있어요?</button>`}</div>`,
    mount(root) {
      if (!state.voucher) setVoucher('cl16');
      bindBigBarcode(root);
    },
  };
}

// ── 컬쳐캐쉬 충전 ──
function charge({ back }) {
  if (local.step === 'done') {
    return {
      title: '충전 완료',
      html: `${bar('충전', back)}${demoTag('실제 충전은 시연에 필요하지 않아 꺼 두었어요')}
      <div class="scroll"><div class="mock-body success">
        <img src="assets/char/catsh-cash.webp" alt="" />
        <h2>${won(DEMO.voucherAmount)} 충전 완료</h2>
        <p>컬쳐캐쉬 사용가능 금액이 <b>${won(state.cash)}</b>이 됐어요.<br />이제 온라인 결제·전환·쿠폰·앱 바코드에 쓸 수 있어요.</p>
      </div></div>
      <div class="cta-bar">${back ? backBtn(back) : `<button class="btn btn-primary btn-block" data-go="#/search">충전한 캐쉬, 어디서 쓸까요?</button>`}
        <div class="cta-sub">${back ? `<button class="btn" data-go="#/search">어디서 쓸지 찾기</button>` : `<button class="btn" data-go="#/home">홈으로</button>`}</div></div>`,
    };
  }
  const self = encodeURIComponent(location.hash);
  const needExchange = state.voucher === 'gift' && !state.exchanged;
  return {
    title: '컬쳐캐쉬 충전',
    html: `${bar('충전', back)}${demoTag('실제 충전은 시연에 필요하지 않아 꺼 두었어요')}
    <div class="scroll"><div class="mock-body">
      ${needExchange ? `<div class="callout callout-warn"><img src="assets/char/boy-please.webp" alt="" /><div><h3>먼저 [교환소]에서 교환해요</h3><p>선물·경품으로 받은 상품권은 교환소에서 상품권으로 바꾼 뒤 충전할 수 있어요.</p><div class="btns"><button class="btn btn-sm btn-dark" data-go="#/mock/exchange?back=${self}">${icon('swap', 15)}교환소 열기</button></div></div></div>` : ''}
      <div><p class="field-label">충전 수단</p>
        <div class="optlist">
          <button class="opt on">${icon('card', 18)}컬쳐랜드상품권(모바일문화상품권)<small>16자리</small></button>
          <button class="opt" data-go="#/mock/exchange?back=${self}">${icon('gift', 18)}선물·경품 상품권은 교환소에서 먼저 교환<small>${icon('chev', 16)}</small></button>
        </div>
      </div>
      <div><p class="field-label">상품권 번호 16자리 <small style="font-weight:500;color:var(--ink-3)">(예시 번호가 채워져 있어요)</small></p>
        <div class="pin-row" data-off="번호 입력">${DEMO.pinDemo.map((p, i) => `<input value="${p}" readonly aria-label="번호 ${i + 1}번째 4자리" />`).join('')}</div>
        <button class="btn btn-block proposal" style="margin-top:10px" data-go="#/bulk">${icon('photo', 18)}여러 장이면 사진에서 한 번에 등록</button>
      </div>
      <ul class="notes">
        <li>${icon('info', 14)}<span>상품권 충전 한도는 없어요. 보유한도(본인인증 50만원)를 넘으면 대기 캐쉬로 보관돼요.</span></li>
        <li>${icon('info', 14)}<span>번호를 20회 이상 잘못 입력하면 하루 동안 충전이 제한돼요.</span></li>
        <li>${icon('info', 14)}<span>지류 상품권·18자리 온라인문화상품권(㈜문화상품권 발행)과 스마트문상은 충전할 수 없어요.</span></li>
      </ul>
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="doCharge">충전하기</button></div>`,
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

// ── 상품권 교환소 ──
// 공식 충전 안내: "카카오톡, 아이넘버, 기프티쇼, 이벤트 경품으로 받은 상품권은 상품권 교환소에서 상품권으로 교환 후 컬쳐랜드상품권으로 충전이 가능합니다."
// 실제 교환소 화면(로그인 필요)의 입력 항목·유효기간은 확인하지 못해, 시연 화면에는 확인된 내용만 담는다.
const EX_FROM = ['카카오톡 선물', '기프티쇼', '아이넘버', '이벤트 경품'];
function exchange({ back }) {
  const tag = demoTag('실제 교환은 시연에 필요하지 않아 꺼 두었어요');
  if (local.step === 'done') {
    const toCharge = `#/mock/charge${back ? `?back=${encodeURIComponent(back)}` : ''}`;
    const fromCharge = back.startsWith('#/mock/charge');
    return {
      title: '교환 완료',
      html: `${bar('교환소', back)}${tag}
      <div class="scroll"><div class="mock-body bulk-body success">
        <img src="assets/char/boy-thumb.webp" alt="" />
        <h2>상품권 ${won(DEMO.voucherAmount)}으로 교환 완료</h2>
        <p>이제 [충전]에서 컬쳐랜드상품권으로 충전할 수 있어요.</p>
        <p class="bulk-rest">교환한 상품권의 유효기간과 사용 조건은 받은 상품권 안내에서 확인해 주세요.</p>
      </div></div>
      <div class="cta-bar">${
        !back
          ? `<button class="btn btn-primary btn-block" data-go="${toCharge}">컬쳐캐쉬로 충전하기</button><div class="cta-sub"><button class="btn" data-go="#/search">어디서 쓸 수 있는지 찾기</button></div>`
          : fromCharge
            ? backBtn(back, '충전 화면으로 돌아가기')
            : `${backBtn(back, back.startsWith('#/g/') ? '안내로 돌아가기' : /^#\/(r|m|c|t)\b/.test(back) ? '확인 결과로 돌아가기' : '이전 화면으로 돌아가기')}<div class="cta-sub"><button class="btn" data-go="${esc(toCharge)}">컬쳐캐쉬로 충전하기</button></div>`
      }</div>`,
    };
  }
  const from = EX_FROM.includes(local.partner) ? local.partner : EX_FROM[0];
  return {
    title: '상품권 교환소',
    html: `${bar('교환소', back)}${tag}
    <div class="scroll"><div class="mock-body bulk-body">
      <p class="mock-lead">선물·경품으로 받은 상품권은 여기서 상품권으로 바꾼 뒤, [충전]에서 컬쳐랜드상품권으로 충전해요.</p>
      <div><p class="field-label">어디서 받은 상품권인가요?</p>
        <div class="optlist">${EX_FROM.map((f) => `<button class="opt ${f === from ? 'on' : ''}" data-from="${esc(f)}" aria-pressed="${f === from}">${icon('gift', 18)}${esc(f)}</button>`).join('')}</div>
      </div>
      <div><p class="field-label">교환권 번호 <small style="font-weight:500;color:var(--ink-3)">(예시 번호가 채워져 있어요)</small></p>
        <div class="pin-row" style="grid-template-columns:1fr" data-off="교환권 번호 입력"><input value="DEMO-0000-0000" readonly aria-label="예시 교환권 번호" /></div>
      </div>
      <ul class="notes">
        <li>${icon('info', 14)}<span>교환한 뒤에는 [충전] › [컬쳐랜드상품권]에서 컬쳐캐쉬로 충전할 수 있어요.</span></li>
        <li>${icon('info', 14)}<span>입력 항목·유효기간 같은 자세한 조건은 실제 교환소 화면에서 확인해 주세요(로그인 필요).</span></li>
      </ul>
      ${sourceList(['chargeMain', 'exchange'], { compact: true })}
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="doEx">상품권으로 교환하기</button></div>`,
    mount(root) {
      root.querySelectorAll('[data-from]').forEach((b) => b.addEventListener('click', () => ((local.partner = b.dataset.from), rerender())));
      root.querySelector('#doEx').addEventListener('click', () => {
        state.exchanged = true;
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
      html: `${bar('바코드 결제', back)}${demoTag('실제 결제는 시연에 필요하지 않아 꺼 두었어요')}
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
      html: `${bar('바코드 결제', back)}${demoTag('실제 결제는 시연에 필요하지 않아 꺼 두었어요')}
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
    html: `${bar('바코드 결제', back)}${demoTag('실제 결제는 시연에 필요하지 않아 꺼 두었어요')}
    <div class="scroll"><div class="mock-body">
      <div class="pay-barcode">
        <b>${esc(place.name)}</b>
        <div class="bc-wrap">${fakeBarcode('9876543210123456')}<p class="bc-no">9876 5432 1012 3456</p></div>
        <p class="timer" id="timer">유효시간 03:00</p>
        <p class="bal">사용가능 컬쳐캐쉬 ${won(state.cash)}</p>
      </div>
      ${bigBarcodeBtn('9876 5432 1012 3456', place.name + ' 결제')}
      <button class="btn btn-ghost btn-block" id="chgPlace">사용처 바꾸기</button>
      ${enough ? '' : `<div class="callout callout-warn"><img src="assets/char/boy-please.webp" alt="" /><div><h3>잔액이 부족해요</h3><p>먼저 상품권을 컬쳐캐쉬로 충전해요.</p><div class="btns"><button class="btn btn-sm btn-dark" data-go="#/mock/charge?back=${encodeURIComponent(location.hash)}">충전하기</button></div></div></div>`}
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="pay" ${enough ? '' : 'disabled'}>직원이 스캔했다고 가정 · ${won(DEMO.purchase)} 결제</button></div>`,
    mount(root) {
      bindBigBarcode(root);
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
  // 수수료가 공개된 전환처를 먼저 보여주고, 안내에서 넘어온 전환처는 목록에 없더라도 맨 앞에 둔다
  const all = MERCHANTS.filter((x) => x.online?.kind === 'convert');
  const p = MERCHANT_BY_ID[local.partner]?.online?.kind === 'convert' ? MERCHANT_BY_ID[local.partner] : m?.online?.kind === 'convert' ? m : all[0];
  const partners = [p, ...all.filter((x) => x !== p && typeof x.online.fee === 'number')].slice(0, 6);
  const lane = p.online;
  const known = typeof lane.fee === 'number'; // 수수료가 공개 페이지에 없는 전환처는 금액을 계산하지 않는다
  const fee = known ? Math.round(local.amount * lane.fee) : 0;
  const get = local.amount - fee;
  const feeLabel = (x) => (typeof x.fee === 'number' ? `수수료 ${pct(x.fee)}` : '수수료 확인 필요');
  const feeRow = known ? `<div><span>수수료 ${pct(lane.fee)}</span><b>- ${won(fee)}</b></div>` : `<div><span>수수료</span><b>전환 화면에서 확인</b></div>`;
  const getText = known ? `${get.toLocaleString('ko-KR')}P` : '수수료를 뺀 금액';
  if (local.step === 'done') {
    return {
      title: '전환 완료',
      html: `${bar('캐쉬 전환', back)}${demoTag('실제 전환은 시연에 필요하지 않아 꺼 두었어요')}
      <div class="scroll"><div class="mock-body success">
        <img src="assets/char/catsh-cash.webp" alt="" />
        <h2>${esc(lane.target)} ${known ? `${get.toLocaleString('ko-KR')}P ` : ''}전환 완료</h2>
        <div class="receipt">
          <div><span>차감 컬쳐캐쉬</span><b>${won(local.amount)}</b></div>
          ${feeRow}
          <div class="total"><span>받은 ${esc(lane.target)}</span><span>${getText}</span></div>
        </div>
        <p>${lane.shop ? `이제 ${esc(p.name)} 결제 화면에서 ${esc(lane.target)}로 결제해요.` : `이제 ${esc(lane.target)}을(를) 받는 곳에서 결제할 수 있어요.`}</p>
      </div></div>
      <div class="cta-bar">${backBtn(back)}</div>`,
    };
  }
  return {
    title: '캐쉬 전환',
    html: `${bar('캐쉬 전환', back)}${demoTag('실제 전환은 시연에 필요하지 않아 꺼 두었어요')}
    <div class="scroll"><div class="mock-body">
      <div><p class="field-label">전환할 곳</p>
        <div class="optlist">${partners
          .map((x) => `<button class="opt ${x.id === p.id ? 'on' : ''}" data-partner="${x.id}">${icon('coin', 18)}${esc(x.online.target)}<small>${feeLabel(x.online)}</small></button>`)
          .join('')}</div>
      </div>
      <div><p class="field-label">전환 금액 <small style="font-weight:500;color:var(--ink-3)">(사용가능 ${won(state.cash)})</small></p>
        <div class="grid-3">${[5000, 10000, 30000].map((a) => `<button class="opt ${local.amount === a ? 'on' : ''}" data-amt="${a}">${won(a)}</button>`).join('')}</div>
      </div>
      <div class="receipt">
        <div><span>차감 컬쳐캐쉬</span><b>${won(local.amount)}</b></div>
        ${feeRow}
        <div class="total"><span>받는 ${esc(lane.target)}</span><span>${getText}</span></div>
      </div>
      ${state.cash >= local.amount ? '' : `<div class="callout callout-warn"><img src="assets/char/boy-please.webp" alt="" /><div><h3>컬쳐캐쉬가 부족해요</h3><p>전환할 금액만큼 먼저 충전해요.</p><div class="btns"><button class="btn btn-sm btn-dark" data-go="#/mock/charge?back=${encodeURIComponent(location.hash)}">충전하기</button></div></div></div>`}
      <label class="consent"><input type="checkbox" id="consent" ${local.consent ? 'checked' : ''} /><span>(최초 1회) 제3자 정보제공에 동의하고, 컬쳐랜드와 ${esc(p.name)} 계정의 명의가 같은지 확인했어요. 전환 후에는 취소할 수 없어요.</span></label>
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="doConv" ${local.consent && state.cash >= local.amount ? '' : 'disabled'}>전환하기</button></div>`,
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
      html: `${bar('쿠폰', back)}${demoTag('실제 쿠폰 구매는 시연에 필요하지 않아 꺼 두었어요')}
      <div class="scroll"><div class="mock-body success">
        <img src="assets/char/catsh-cash.webp" alt="" />
        <h2>${esc(b.name)} ${won(local.denom)} 쿠폰 발송</h2>
        <p>010-****-1234로 쿠폰 문자가 가요.<br />매장(또는 앱)에서 쿠폰 바코드를 보여주고 써요.</p>
      </div></div>
      <div class="cta-bar">${backBtn(back)}</div>`,
    };
  }
  return {
    title: '쿠폰 구매',
    html: `${bar('쿠폰', back)}${demoTag('실제 쿠폰 구매는 시연에 필요하지 않아 꺼 두었어요')}
    <div class="scroll"><div class="mock-body">
      <div><p class="field-label">브랜드</p><div class="optlist">${[b, ...brands.filter((x) => x !== b)].slice(0, 5).map((x) => `<button class="opt ${x === b ? 'on' : ''}" data-brand="${x.id}">${icon('ticket', 18)}${esc(x.name)}</button>`).join('')}</div></div>
      <div><p class="field-label">금액(권종)</p><div class="grid-3">${[5000, 10000, 30000].map((a) => `<button class="opt ${local.denom === a ? 'on' : ''}" data-denom="${a}">${won(a)}</button>`).join('')}</div></div>
      <div class="receipt"><div><span>받는 번호</span><b>010-****-1234</b></div><div><span>결제수단</span><b>컬쳐캐쉬</b></div><div><span>수수료</span><b>앱에서 확인(로그인 필요)</b></div></div>
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="buy">구매하기</button></div>`,
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
      html: `${bar('Google Play', back)}${demoTag('실제 코드 구매는 시연에 필요하지 않아 꺼 두었어요')}
      <div class="scroll"><div class="mock-body success">
        <img src="assets/char/catsh-cash.webp" alt="" />
        <h2>${won(local.denom)} 기프트코드 발급</h2>
        <div class="receipt"><div><span>코드(예시)</span><b>${DEMO.giftcodeDemo}</b></div><div><span>결제 금액</span><b>${won(local.denom + fee)}</b></div></div>
        <p>Play 스토어 › 프로필 › 결제 및 구독 › [코드 사용]에 입력해요.</p>
      </div></div>
      <div class="cta-bar">${backBtn(back)}</div>`,
    };
  }
  return {
    title: 'Google Play 기프트코드',
    html: `${bar('Google Play', back)}${demoTag('실제 코드 구매는 시연에 필요하지 않아 꺼 두었어요')}
    <div class="scroll"><div class="mock-body">
      <div><p class="field-label">권종(8종)</p><div class="grid-4">${denoms.map((a) => `<button class="opt ${local.denom === a ? 'on' : ''}" data-denom="${a}">${a >= 10000 ? `${a / 10000}만` : `${a / 1000}천`}</button>`).join('')}</div></div>
      <div class="receipt"><div><span>권종</span><b>${won(local.denom)}</b></div><div><span>수수료 3%</span><b>+ ${won(fee)}</b></div><div class="total"><span>결제 금액(컬쳐캐쉬)</span><span>${won(local.denom + fee)}</span></div></div>
      <ul class="notes"><li>${icon('info', 14)}<span>쓰지 않은 코드는 7일 안에 취소할 수 있어요.</span></li></ul>
    </div></div>
    <div class="cta-bar"><button class="btn btn-primary btn-block" id="buy">구매하기</button></div>`,
    mount(root) {
      root.querySelectorAll('[data-denom]').forEach((x) => x.addEventListener('click', () => ((local.denom = +x.dataset.denom), rerender())));
      root.querySelector('#buy').addEventListener('click', () => {
        local.step = 'done';
        rerender();
      });
    },
  };
}

