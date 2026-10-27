/* =========================================================
 * 홈(랜딩) 페이지
 *  배너 슬라이드 → 카테고리 → 새로 나온 테스트 → 인기 TOP → 큐레이션 줄 → 전체 목록
 *  ?cat=… 또는 ?page=2 이상이면 랜딩 섹션 없이 목록 페이지로 동작
 * ========================================================= */
(function () {
  var C = window.SITE_CONFIG;
  var S = window.Site;
  var esc = S.esc;
  var cats = C.categories;
  var cur = S.param('cat') || 'all';
  if (!cats.some(function (c) { return c.key === cur; })) cur = 'all';
  var page = Math.max(1, parseInt(S.param('page'), 10) || 1);
  var isLanding = cur === 'all' && page === 1;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function href(cat, p) {
    var q = [];
    if (cat !== 'all') q.push('cat=' + cat);
    if (p > 1) q.push('page=' + p);
    return S.url(q.length ? '?' + q.join('&') : '') + (cat === 'all' && p === 1 ? '' : '#all');
  }
  function bySlug(list) { var m = {}; list.forEach(function (t) { m[t.slug] = t; }); return m; }
  function row(items) { return '<div class="row"><div class="row__track">' + items.map(S.cardHTML).join('') + '</div></div>'; }

  /* ---------- 배너 슬라이드 ---------- */
  function hero(list) {
    var el = document.getElementById('hero');
    var map = bySlug(list);
    var slides = (C.featured || []).filter(function (f) { return map[f.slug]; });
    if (!slides.length) { el.remove(); return; }
    el.innerHTML =
      '<div class="hero__track" id="hero-track">' +
      slides.map(function (f, i) {
        var t = map[f.slug];
        return '<a class="slide" href="' + esc(S.url('test/' + t.slug + '/')) + '" style="--tint:' + esc(t.tint) + '" aria-label="' + (i + 1) + ' / ' + slides.length + ': ' + esc(t.title) + '">' +
          '<div><span class="slide__kicker">' + esc(S.catLabel(t.category)) + (t.isNew ? ' · 신규' : '') + '</span>' +
          '<h2>' + esc(t.title) + '</h2><p>' + esc(f.copy || t.desc) + '</p>' +
          '<span class="slide__cta">지금 해보기 →</span></div>' +
          '<div class="slide__orb" aria-hidden="true">' + esc(t.emoji) + '</div></a>';
      }).join('') + '</div>' +
      (slides.length > 1 ? '<div class="hero__ctrl"><button id="hero-prev" aria-label="이전 배너">‹</button><span class="hero__count" id="hero-count">1 / ' + slides.length + '</span><button id="hero-next" aria-label="다음 배너">›</button></div>' : '');

    if (slides.length < 2) return;
    var track = el.querySelector('#hero-track'), count = el.querySelector('#hero-count');
    var idx = 0, timer = null;
    function go(i) { idx = (i + slides.length) % slides.length; track.scrollTo({ left: idx * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); }
    track.addEventListener('scroll', function () {
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== idx) idx = i;
      count.textContent = (idx + 1) + ' / ' + slides.length;
    }, { passive: true });
    el.querySelector('#hero-prev').addEventListener('click', function () { go(idx - 1); restart(); });
    el.querySelector('#hero-next').addEventListener('click', function () { go(idx + 1); restart(); });
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(idx + 1); }, 5000); }
    el.addEventListener('mouseenter', function () { clearInterval(timer); });
    el.addEventListener('mouseleave', restart);
    el.addEventListener('focusin', function () { clearInterval(timer); });
    restart();
  }

  /* ---------- 인기 TOP (rank 순) ---------- */
  function rankHTML(list, n) {
    return list.slice(0, n).map(function (t, i) {
      return '<a class="rank-card" href="' + esc(S.url('test/' + t.slug + '/')) + '">' +
        '<span class="rank-card__num">' + (i + 1) + '</span>' + S.thumbHTML(t, 'rank-card__thumb') +
        '<div><h3>' + esc(t.title) + '</h3><p>' + esc(t.meta) + '</p></div></a>';
    }).join('');
  }

  function landing(list) {
    hero(list);
    var fresh = list.filter(function (t) { return t.isNew; });
    document.getElementById('new-row').innerHTML = fresh.length ? row(fresh) : '';
    document.getElementById('new-wrap').hidden = !fresh.length;
    document.getElementById('rank').innerHTML = rankHTML(list, 6);

    var map = bySlug(list);
    document.getElementById('shelves').innerHTML = (C.shelves || []).map(function (s) {
      var items = s.slugs ? s.slugs.map(function (k) { return map[k]; }).filter(Boolean)
        : list.filter(function (t) { return t.category === s.category; });
      if (!items.length) return '';
      var more = s.category ? '<a href="' + href(s.category, 1) + '">더 보기</a>' : '';
      return '<section><h2 class="section-title">' + esc(s.title) + more + '</h2>' + row(items) + '</section>';
    }).join('');
  }

  function chips(list) {
    document.getElementById('cat-chips').innerHTML = cats.map(function (c) {
      var n = c.key === 'all' ? list.length : list.filter(function (t) { return t.category === c.key; }).length;
      return '<a class="chip" href="' + href(c.key, 1) + '"' + (c.key === cur ? ' aria-current="page"' : '') + '>' +
        esc(c.label) + '<small>' + n + '</small></a>';
    }).join('');
  }

  /* ---------- 전체 목록 ---------- */
  var grid = document.getElementById('test-grid');
  function renderList(query) {
    return S.renderGrid(grid, {
      category: cur, query: query, page: page,
      pageSize: query ? 0 : C.pageSize, infeedEvery: C.infeedEvery, infeedSlot: 'home_infeed'
    }).then(function (info) {
      document.getElementById('list-count').textContent = info.total + '개';
      S.pagination(document.getElementById('pager'), page, query ? 1 : info.pages, function (p) { return href(cur, p); });
    });
  }

  document.getElementById('search-icon').innerHTML = S.SEARCH_ICON;
  if (isLanding) {
    document.getElementById('list-intro').remove();
  } else {
    document.getElementById('landing').remove();
    document.getElementById('hero').remove();
    document.getElementById('list-title').textContent = '테스트 목록';
    document.getElementById('list-h1').textContent = cur === 'all' ? '전체 테스트' : S.catLabel(cur) + ' 테스트';
  }

  S.loadTests().then(function (list) {
    chips(list);
    if (isLanding) landing(list);
  });
  renderList('');

  var t;
  var input = document.getElementById('search');
  input.addEventListener('input', function (e) {
    clearTimeout(t);
    var v = e.target.value;
    t = setTimeout(function () { renderList(v); }, 150);
  });
  document.getElementById('search-form').addEventListener('submit', function (e) { e.preventDefault(); });
  // 헤더 검색 아이콘(#search)으로 들어오면 검색창에 바로 포커스
  function focusIfHash() { if (location.hash === '#search') setTimeout(function () { input.focus({ preventScroll: true }); }, 300); }
  window.addEventListener('hashchange', focusIfHash);
  focusIfHash();
})();
