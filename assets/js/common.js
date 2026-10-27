/* =========================================================
 * 공통: 헤더/푸터, 테스트 목록(레지스트리), 카드 그리드, 인기 테스트 가젯,
 *       관련 테스트, 페이지네이션, 공유
 * 테스트 목록의 원본은 /data/tests.json (tools/build.py가 자동 생성)
 * ========================================================= */
(function () {
  var C = window.SITE_CONFIG;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 사이트 내부 경로 → 실제 주소 (하위 폴더 배포 대응)
  function url(p) { return window.SITE_BASE + String(p || '').replace(/^\//, ''); }

  function catLabel(key) {
    var c = C.categories.filter(function (x) { return x.key === key; })[0];
    return c ? c.label : key;
  }

  function header() {
    var el = document.getElementById('site-header');
    if (!el) return;
    var nav = C.categories.filter(function (c) { return c.key !== 'all'; })
      .map(function (c) { return '<a href="' + url('?cat=' + c.key) + '">' + esc(c.label) + '</a>'; }).join('');
    el.innerHTML =
      '<a class="skip" href="#main-content">본문 바로가기</a>' +
      '<header class="site-header"><div class="site-header__in">' +
      '<a class="logo" href="' + url('') + '">' + esc(C.siteName) + '</a>' +
      '<nav class="site-nav" aria-label="카테고리">' + nav + '</nav>' +
      '</div></header>';
  }

  function footer() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML =
      '<footer class="site-footer"><div class="site-footer__in">' +
      '<p class="site-footer__links"><a href="' + url('privacy/') + '">개인정보처리방침</a><a href="mailto:' + esc(C.contactEmail) + '">제휴·문의</a></p>' +
      '<p class="site-footer__small">캐릭터·작품을 소재로 한 테스트는 비공식 팬 콘텐츠이며, 각 저작권은 원저작자에게 있습니다. 모든 테스트는 재미와 자기 이해를 위한 참고용이며 전문 진단을 대신하지 않습니다.</p>' +
      '<p class="site-footer__small">© ' + new Date().getFullYear() + ' ' + esc(C.siteName) + '</p>' +
      '</div></footer>';
  }

  var cache = null;
  function loadTests() {
    if (cache) return Promise.resolve(cache);
    return fetch(url('data/tests.json'), { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (list) {
        cache = list.slice().sort(function (a, b) { return (a.rank || 999) - (b.rank || 999); });
        return cache;
      });
  }

  function thumbHTML(t, cls) {
    var img = t.thumb ? '<img src="' + esc(url(t.thumb)) + '" alt="" loading="lazy" onerror="this.remove()">' : '';
    return '<div class="' + cls + '" style="--tint:' + esc(t.tint || '#FFE07A') + '">' +
      '<span aria-hidden="true">' + esc(t.emoji || '✨') + '</span>' + img + '</div>';
  }

  function cardHTML(t) {
    return '<a class="test-card" href="' + esc(url('test/' + t.slug + '/')) + '">' +
      thumbHTML(t, 'test-card__thumb') +
      (t.isNew ? '<span class="badge">신규</span>' : '') +
      '<div class="test-card__body">' +
      '<h3>' + esc(t.title) + '</h3>' +
      '<p class="test-card__desc">' + esc(t.desc) + '</p>' +
      '<p class="test-card__meta">' + esc(t.meta) + '</p>' +
      '</div></a>';
  }

  function adCell(slot) { return '<div class="grid-ad" data-ad="' + slot + '"></div>'; }

  /* opts: { category, exclude, limit, query, page, pageSize, infeedEvery, infeedSlot }
   * 반환: { total, pages } */
  function renderGrid(el, opts) {
    opts = opts || {};
    return loadTests().then(function (list) {
      var items = list;
      if (opts.category && opts.category !== 'all') items = items.filter(function (t) { return t.category === opts.category; });
      if (opts.exclude) items = items.filter(function (t) { return t.slug !== opts.exclude; });
      if (opts.query) {
        var q = opts.query.trim().toLowerCase();
        items = items.filter(function (t) { return (t.title + ' ' + t.desc).toLowerCase().indexOf(q) !== -1; });
      }
      var total = items.length;
      var pages = 1;
      if (opts.pageSize) {
        pages = Math.max(1, Math.ceil(total / opts.pageSize));
        var page = Math.min(Math.max(1, opts.page || 1), pages);
        items = items.slice((page - 1) * opts.pageSize, page * opts.pageSize);
      }
      if (opts.limit) items = items.slice(0, opts.limit);

      if (!items.length) {
        el.innerHTML = '<p class="empty">' + (opts.query ? '‘' + esc(opts.query) + '’와 맞는 테스트가 없어요. 다른 단어로 찾아보세요.' :
          '이 카테고리에는 아직 테스트가 없어요. <a href="' + url('') + '">전체 테스트 보기</a>') + '</p>';
        return { total: 0, pages: 1 };
      }
      var html = '';
      items.forEach(function (t, i) {
        html += cardHTML(t);
        // 피드 중간 광고: N개 카드마다 한 줄 전체를 차지하는 광고
        if (opts.infeedEvery && (i + 1) % opts.infeedEvery === 0 && i + 1 < items.length) html += adCell(opts.infeedSlot || 'home_infeed');
      });
      el.innerHTML = html;
      el.querySelectorAll('[data-ad]').forEach(window.Ads.renderSlot);
      return { total: total, pages: pages };
    }).catch(function () {
      el.innerHTML = '<p class="empty">테스트 목록을 불러오지 못했어요. 사이트를 웹서버로 열었는지 확인하세요.</p>';
      return { total: 0, pages: 1 };
    });
  }

  function renderRelated(currentSlug, limit) {
    var el = document.getElementById('related');
    if (!el) return;
    loadTests().then(function (list) {
      // 같은 카테고리 우선, 부족하면 인기순으로 채움
      var cur = list.filter(function (t) { return t.slug === currentSlug; })[0];
      var same = list.filter(function (t) { return t.slug !== currentSlug && cur && t.category === cur.category; });
      var rest = list.filter(function (t) { return t.slug !== currentSlug && same.indexOf(t) === -1; });
      var pick = same.concat(rest).slice(0, limit || 4);
      el.innerHTML = pick.map(cardHTML).join('');
    });
  }

  /* 우측 사이드바 ‘인기 테스트’ 가젯 (rank 순 상위 10개) */
  function renderPopular(currentSlug, limit) {
    var el = document.getElementById('popular');
    if (!el) return;
    loadTests().then(function (list) {
      el.innerHTML = list.slice(0, limit || 10).map(function (t, i) {
        var cur = t.slug === currentSlug;
        return '<li><a href="' + esc(url('test/' + t.slug + '/')) + '"' + (cur ? ' aria-current="page"' : '') + '>' +
          '<span class="popular__rank">' + (i + 1) + '</span>' +
          thumbHTML(t, 'popular__thumb') +
          '<span class="popular__title">' + esc(t.title) + '</span></a></li>';
      }).join('');
    });
  }

  function pagination(el, cur, pages, makeHref) {
    if (!el) return;
    if (pages <= 1) { el.innerHTML = ''; return; }
    var html = '';
    if (cur > 1) html += '<a href="' + makeHref(cur - 1) + '">이전</a>';
    for (var p = 1; p <= pages; p++) {
      html += p === cur ? '<span aria-current="page">' + p + '</span>' : '<a href="' + makeHref(p) + '">' + p + '</a>';
    }
    if (cur < pages) html += '<a href="' + makeHref(cur + 1) + '">다음</a>';
    el.innerHTML = html;
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2000);
  }

  function share(link, title) {
    if (navigator.share) {
      navigator.share({ title: title, url: link }).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(function () { toast('링크를 복사했어요'); });
    } else {
      window.prompt('아래 링크를 복사하세요', link);
    }
  }

  function ymd(d) {
    d = d || new Date();
    return '' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  }

  function param(name) { return new URLSearchParams(location.search).get(name); }

  document.addEventListener('DOMContentLoaded', function () {
    header();
    footer();
    window.Ads.init();
  });

  window.Site = {
    esc: esc, url: url, catLabel: catLabel, loadTests: loadTests, renderGrid: renderGrid,
    renderRelated: renderRelated, renderPopular: renderPopular, pagination: pagination,
    share: share, toast: toast, ymd: ymd, param: param
  };
})();
