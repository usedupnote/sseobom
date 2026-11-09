// 결과·안내 화면이 함께 쓰는 판정 로직과 조각
import { icon, esc, pct } from '../ui.js';
import { VERDICT, laneVerdict, LANE_LABEL } from '../../data/merchants.js';
import { METHODS, routesForLane } from '../../data/methods.js';
import { VOUCHERS, VOUCHER_ORDER } from '../../data/vouchers.js';
import { setVoucher } from '../state.js';
import { openSheet, closeSheet } from '../app.js';

export const CH_LABEL = { online: '온라인', offline: '매장' };
const TONE_PILL = { ok: 'pill-ok', warn: 'pill-warn', no: 'pill-no', muted: 'pill-muted' };

// 레인 상태를 짧은 알약 배지로
export function lanePill(lane, prefix = '', small = false) {
  const v = laneVerdict(lane);
  if (v === 'na') return small ? '' : `<span class="pill pill-muted ${small ? 'sm' : ''}">${icon('dash', 12)}해당 없음</span>`;
  const meta = VERDICT[v];
  const word = lane && lane.kind === 'convert' ? '전환' : lane && lane.kind === 'coupon' ? '쿠폰' : lane && lane.kind === 'giftcode' ? '코드' : v === 'ok' ? '가능' : meta.label;
  return `<span class="pill ${TONE_PILL[meta.tone]} ${small ? 'sm' : ''}">${icon(meta.icon, small ? 11 : 13)}${prefix ? esc(prefix) + ' ' : ''}${esc(word)}</span>`;
}

export function feeText(lane) {
  if (!lane) return '';
  if (lane.feeText) return `수수료 ${lane.feeText}`;
  if (typeof lane.fee === 'number') return `수수료 ${pct(lane.fee)}`;
  if (lane.kind === 'direct' || lane.kind === 'barcode') return '수수료 없음';
  return '';
}

// 레인 한 줄 설명
export function laneLine(lane) {
  if (!lane) return '';
  const parts = [];
  if (lane.kind === 'convert') parts.push(`${lane.target}로 전환한 뒤 결제`);
  else parts.push(LANE_LABEL[lane.kind] || '');
  const f = feeText(lane);
  if (f) parts.push(f);
  if (lane.limit) parts.push(lane.limit.split(' · ')[0]); // 자세한 한도는 안내 화면에서
  return parts.join(' · ');
}

// 이용자 상황에 맞는 안내 방식 고르기
export function routeFor(lane, voucher) {
  const routes = routesForLane(lane);
  if (!routes.length) return null;
  if (routes.includes('barcode-mms')) return voucher === 'cash' ? 'barcode-app' : 'barcode-mms';
  if (routes.includes('pin')) return voucher === 'cash' ? 'direct' : 'pin';
  return routes[0];
}

// 질문의 채널 → 보여줄 레인 고르기
export function pickLane(m, channel) {
  const lanes = { online: m.online, offline: m.offline };
  if (channel && lanes[channel]) return channel;
  const rank = (l) => ({ ok: 0, indirect: 1, unknown: 2, no: 3, na: 9 })[laneVerdict(l)];
  const order = ['offline', 'online'].sort((a, b) => rank(lanes[a]) - rank(lanes[b]));
  return lanes[order[0]] ? order[0] : null;
}

// 판정 문장
export function verdictCopy(m, ch) {
  const lane = ch ? m[ch] : null;
  const where = ch ? CH_LABEL[ch] : '';
  const v = laneVerdict(lane);
  const name = m.name;
  if (v === 'ok' && lane.kind === 'barcode')
    return { tone: 'ok', icon: 'check', title: `${where}에서 바로 사용 가능`, body: `${name} 계산대에서 바코드를 보여주면 결제돼요. 문자로 받은 상품권 그대로 써도 되고, 충전한 컬쳐캐쉬는 앱 [바코드 결제]로 써요.` };
  if (v === 'ok')
    return { tone: 'ok', icon: 'check', title: `${where}에서 바로 사용 가능`, body: lane.pin ? `${name} 충전창에 상품권 번호를 바로 넣거나, 결제수단에서 컬쳐캐쉬를 고르면 돼요.` : `${name} 결제 화면에서 결제수단으로 ‘컬쳐랜드 컬쳐캐쉬’를 고르면 돼요. 상품권은 먼저 컬쳐캐쉬로 충전해요.` };
  if (v === 'indirect' && lane.kind === 'convert')
    return { tone: 'warn', icon: 'swap', title: `${lane.target}로 바꾸면 사용 가능`, body: `${name} 결제창에는 컬쳐캐쉬가 없어요. 컬쳐캐쉬를 ${lane.target}로 전환하면 써요. 전환 수수료 ${pct(lane.fee)}가 빠져요.` };
  if (v === 'indirect' && lane.kind === 'coupon')
    return { tone: 'warn', icon: 'swap', title: '모바일 쿠폰으로 사용 가능', body: `${name} 계산대에서 컬쳐캐쉬로 바로 결제할 수는 없어요. 컬쳐랜드 앱 [쿠폰]에서 ${name} 쿠폰을 사서 써요.` };
  if (v === 'indirect' && lane.kind === 'giftcode')
    return { tone: 'warn', icon: 'swap', title: '기프트코드로 사용 가능', body: `컬쳐캐쉬로 ${name} 기프트코드를 사서 등록해요. 수수료 ${pct(lane.fee)}가 붙어요.` };
  if (v === 'na')
    return ch === 'offline'
      ? { tone: 'muted', icon: 'dash', title: '매장이 없는 온라인 서비스예요', body: `${name}은(는) 온라인에서 이용해요. 아래 온라인 방법을 확인하세요.` }
      : { tone: 'muted', icon: 'dash', title: '온라인 결제는 해당 없어요', body: `${name}은(는) 매장에서 이용해요.` };
  if (v === 'unknown')
    return { tone: 'muted', icon: 'question', title: `${where ? where + ' 사용 ' : ''}확인 필요`, body: m.note || '공식 사용처 목록에서 확인되지 않았어요. 앱 사용처 목록이나 고객센터(1577-2111)에서 확인해 주세요.' };
  return { tone: 'no', icon: 'x', title: `${where}에서 사용할 수 없어요`, body: m.note || '' };
}

export function verdictBox(c) {
  return `<div class="verdict tone-${c.tone}" role="status">
    <span class="v-ic">${icon(c.icon, 20)}</span>
    <div><h3>${esc(c.title)}</h3>${c.body ? `<p>${esc(c.body)}</p>` : ''}</div>
  </div>`;
}

// 상품권 선택 시트
export function openVoucherSheet(onPick) {
  const opts = VOUCHER_ORDER.map((id) => {
    const v = VOUCHERS[id];
    return `<button class="opt" data-pick="${id}">${esc(v.name)}<small>${esc(v.aka || '')}</small></button>`;
  }).join('');
  openSheet(
    `<h3>어떤 상품권을 갖고 계세요?</h3>
     <div class="optlist">${opts}
       <button class="opt" data-pick="">선택 안 함</button>
       <button class="opt" data-pick="?">${icon('question', 18)}잘 모르겠어요 — 판별 도우미</button>
     </div>`,
    (sh) => {
      sh.addEventListener('click', (e) => {
        const b = e.target.closest('[data-pick]');
        if (!b) return;
        const id = b.dataset.pick;
        closeSheet();
        if (id === '?') {
          location.hash = `#/v?back=${encodeURIComponent(location.hash)}`;
          return;
        }
        setVoucher(id || null);
        onPick?.(id || null);
      });
    },
  );
}

export function voucherLabel(id) {
  if (!id) return '선택 안 함';
  if (id === 'paper') return '종이 상품권';
  return VOUCHERS[id]?.short || id;
}

export { METHODS };
