// [0 진입] 컬쳐랜드 앱 홈 모형 — 현행 앱 홈 구조를 따르고, 검색바·일괄등록·자주 묻는 질문만 새로 제안
import { icon, esc, won, mark, a11yBtn } from '../ui.js';
import { MERCHANT_BY_ID } from '../../data/merchants.js';
import { DEMO } from '../../data/demo.js';

const ASKS = ['편의점에서 컬쳐랜드상품권 써도 돼?', '쿠팡에서 쓸 수 있어?', '스타벅스에서 결제되나요?', '문화상품권 18자리 충전되나요?'];

export function homeView({ state }) {
  const favs = state.favorites
    .map((id) => MERCHANT_BY_ID[id])
    .filter(Boolean)
    .map((m) => `<button data-go="#/m/${m.id}">${mark(m, 44)}<span>${esc(m.name)}</span></button>`)
    .join('');

  return {
    title: '홈',
    html: `
    <div class="home-head">
      <img src="assets/brand/logo-wordmark.svg" alt="CULTURE LAND" />
      <div class="hh-right">
        <span class="proposal">${a11yBtn()}</span>
        <button type="button" aria-label="출석체크">${icon('calendar', 18)}출첵</button>
        <button type="button" aria-label="전체 메뉴">${icon('menu', 22)}</button>
      </div>
    </div>
    <nav class="home-tabs" aria-label="홈 탭">
      <button class="on">컬쳐캐쉬</button><button data-go="#/mock/charge">충전</button><button>선물</button><button data-go="#/mock/exchange">교환소</button>
    </nav>
    <div class="scroll">
      <div class="home-body">
        <button class="finder-bar proposal" data-go="#/search">
          ${icon('search', 22)}
          <span><small class="brand">써봄 SSEOBOM</small><strong>상품권, 어디서 어떻게 쓸까?</strong><small>예) 편의점에서 써도 돼? · 쿠팡 · CGV</small></span>
          ${icon('chev', 18)}
        </button>

        <section class="balance" aria-label="컬쳐캐쉬 잔액(시연용)">
          <div class="balance-row">
            <div><small>사용가능 금액</small><b>${won(state.cash)}</b></div>
            <span class="balance-swap" aria-hidden="true">${icon('swap', 18)}</span>
            <div><small>보관중인 금액</small><b>${won(DEMO.safeBalance)}</b></div>
          </div>
          <div class="balance-foot">${icon('lock', 13)}안심금고 · 시연용 가상 잔액</div>
        </section>

        <section class="quick" aria-label="빠른 메뉴">
          <button class="q-main" data-go="#/mock/charge">컬쳐랜드<br />상품권<br />충전하기<span class="q-ic">${icon('card', 22)}</span></button>
          <button data-go="#/mock/barcode"><span class="q-ic">${icon('barcode', 20)}</span>바코드 결제</button>
          <button data-go="#/c/point"><span class="q-ic">${icon('coin', 20)}</span>전환</button>
          <button data-go="#/c/shopping"><span class="q-ic">${icon('bag', 20)}</span>쇼핑</button>
          <button data-go="#/c/food"><span class="q-ic">${icon('ticket', 20)}</span>쿠폰</button>
          <button data-go="#/m/googleplay"><span class="q-ic">${icon('google', 20)}</span>Google</button>
          <button data-go="#/mock/mms"><span class="q-ic">${icon('wallet', 20)}</span>상품권지갑</button>
        </section>

        <button class="bulk-entry proposal" data-go="#/bulk">
          <span class="q-ic">${icon('photo', 22)}</span>
          <span class="be-text"><strong>받은 상품권, 사진에서 한 번에 등록</strong><small>사진첩에서 컬쳐랜드상품권을 찾아 드려요</small></span>
          ${icon('chev', 18)}
        </button>

        <section class="sec">
          <div class="sec-head"><h2>${esc(DEMO.userName)}님의 즐겨찾기</h2></div>
          <div class="favs">${favs}<button data-go="#/search"><span class="fav-add">${icon('search', 18)}</span><span>찾기</span></button></div>
        </section>

        <section class="sec proposal">
          <div class="sec-head"><h2>많이 묻는 질문</h2><button data-go="#/search">더보기</button></div>
          <ul class="ask-list">
            ${ASKS.map((q) => `<li><button data-go="#/r?q=${encodeURIComponent(q)}">${icon('search', 16)}${esc(q)}</button></li>`).join('')}
          </ul>
        </section>

        <p class="home-note">이 화면은 컬쳐랜드 앱 홈 구조를 참고한 시연용 모형이에요. 빨간 점선은 이번에 새로 제안하는 영역이에요.</p>
      </div>
    </div>`,
  };
}
