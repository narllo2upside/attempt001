/* =========================================================
 * 공통: 헤더/푸터, 테스트 목록(레지스트리) 로딩, 카드·관련 테스트 렌더
 * 콘텐츠 목록의 원본은 /data/tests.json 하나입니다.
 * ========================================================= */
(function () {
  var C = window.SITE_CONFIG;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function header() {
    var el = document.getElementById('site-header');
    if (!el) return;
    var nav = C.categories.filter(function (c) { return c.key !== 'all'; })
      .map(function (c) { return '<a href="/?cat=' + c.key + '">' + esc(c.label) + '</a>'; }).join('');
    el.innerHTML =
      '<a class="skip" href="#main-content">본문 바로가기</a>' +
      '<header class="site-header"><div class="site-header__in">' +
      '<a class="logo" href="/">' + esc(C.siteName) + '</a>' +
      '<nav class="site-nav" aria-label="카테고리">' + nav + '</nav>' +
      '</div></header>';
  }

  function footer() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML =
      '<footer class="site-footer"><div class="wrap">' +
      '<p class="site-footer__links"><a href="/privacy/">개인정보처리방침</a><a href="mailto:' + esc(C.contactEmail) + '">제휴·문의</a></p>' +
      '<p class="site-footer__small">캐릭터·작품을 소재로 한 테스트는 비공식 팬 콘텐츠이며, 각 저작권은 원저작자에게 있습니다.</p>' +
      '<p class="site-footer__small">© ' + new Date().getFullYear() + ' ' + esc(C.siteName) + '</p>' +
      '</div></footer>';
  }

  var cache = null;
  function loadTests() {
    if (cache) return Promise.resolve(cache);
    return fetch('/data/tests.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (list) { cache = list; return list; });
  }

  function cardHTML(t) {
    var img = t.thumb ? '<img src="' + esc(t.thumb) + '" alt="" loading="lazy" onerror="this.remove()">' : '';
    return '<a class="test-card" href="/test/' + esc(t.slug) + '/">' +
      '<div class="test-card__thumb" style="--tint:' + esc(t.tint || '#FFE07A') + '">' +
      '<span class="test-card__emoji" aria-hidden="true">' + esc(t.emoji || '✨') + '</span>' + img + '</div>' +
      '<div class="test-card__body">' +
      (t.isNew ? '<span class="badge">신규</span>' : '') +
      '<h3>' + esc(t.title) + '</h3>' +
      '<p>' + esc(t.desc) + '</p>' +
      '<p class="test-card__meta">' + esc(t.meta) + '</p>' +
      '</div></a>';
  }

  /* opts: { category, exclude, limit, infeedAfter, infeedSlot } */
  function renderGrid(el, opts) {
    opts = opts || {};
    return loadTests().then(function (list) {
      var items = list.slice().sort(function (a, b) { return (a.rank || 999) - (b.rank || 999); });
      if (opts.category && opts.category !== 'all') items = items.filter(function (t) { return t.category === opts.category; });
      if (opts.exclude) items = items.filter(function (t) { return t.slug !== opts.exclude; });
      if (opts.limit) items = items.slice(0, opts.limit);

      if (!items.length) {
        el.innerHTML = '<p class="empty">이 카테고리에는 아직 테스트가 없어요. <a href="/">전체 테스트 보기</a></p>';
        return;
      }
      var html = '';
      items.forEach(function (t, i) {
        html += cardHTML(t);
        // 피드 중간 광고: N번째 카드 뒤에 한 줄 전체를 차지하는 광고 삽입
        if (opts.infeedAfter && i + 1 === opts.infeedAfter && i + 1 < items.length) {
          html += '<div class="grid-ad" data-ad="' + (opts.infeedSlot || 'home_infeed') + '"></div>';
        }
      });
      el.innerHTML = html;
      el.querySelectorAll('[data-ad]').forEach(window.Ads.renderSlot);
    }).catch(function () {
      el.innerHTML = '<p class="empty">테스트 목록을 불러오지 못했어요. 사이트를 웹서버로 열었는지 확인하세요.</p>';
    });
  }

  function renderRelated(currentSlug, limit) {
    var el = document.getElementById('related');
    if (!el) return;
    renderGrid(el, { exclude: currentSlug, limit: limit || 4 });
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2000);
  }

  function share(url, title) {
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { toast('링크를 복사했어요'); });
    } else {
      window.prompt('아래 링크를 복사하세요', url);
    }
  }

  function ymd(d) {
    d = d || new Date();
    return '' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  }

  document.addEventListener('DOMContentLoaded', function () {
    header();
    footer();
    window.Ads.init();
  });

  window.Site = {
    esc: esc, loadTests: loadTests, renderGrid: renderGrid, renderRelated: renderRelated,
    share: share, toast: toast, ymd: ymd
  };
})();
