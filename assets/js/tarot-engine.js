/* =========================================================
 * 오늘의 타로 엔진
 *  - 날짜(YYYYMMDD)를 시드로 22장을 섞어 오늘의 카드 N장을 펼칩니다.
 *    → 같은 날 같은 자리를 고르면 같은 카드 (하루 단위 재방문 유도)
 *  - 고른 카드는 이 브라우저에만 기억 → 다시 오면 “오늘 카드 다시 보기”
 *  - 해석은 별도 URL(result/?c=&d=)로 이동 → 페이지 전환 시 비네트 광고 기회
 * ========================================================= */
(function () {
  var T = window.TAROT_DATA;
  var esc = function (s) { return window.Site.esc(s); };
  var STORE_KEY = 'tarot-pick';

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function todaysCards(day) {
    var ids = T.cards.map(function (c) { return c.id; });
    var r = rng(hash('tarot-' + day));
    for (var i = ids.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp; }
    return ids.slice(0, T.pick);
  }
  function fmt(day) { return day.slice(0, 4) + '년 ' + Number(day.slice(4, 6)) + '월 ' + Number(day.slice(6, 8)) + '일'; }

  function faceHTML(c) {
    return '<div class="tcard__face">' +
      '<span class="tcard__num">' + esc(c.num) + '</span>' +
      '<span class="tcard__sym" aria-hidden="true">' + esc(c.sym) + '</span>' +
      '<span class="tcard__name">' + esc(c.name) + '</span></div>';
  }

  function readStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; } }
  function writeStore(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) {} }

  function mountDraw() {
    var day = window.Site.ymd();
    var ids = todaysCards(day);
    var spread = document.getElementById('spread');
    var cta = document.getElementById('tarot-cta');
    document.getElementById('tarot-date').textContent = fmt(day);

    spread.innerHTML = ids.map(function (id, i) {
      var c = T.cards[id];
      return '<button class="tcard" data-id="' + id + '" aria-label="' + (i + 1) + '번째 카드 고르기">' +
        '<div class="tcard__in"><div class="tcard__back"></div>' + faceHTML(c) + '</div></button>';
    }).join('');

    var saved = readStore();
    if (saved && saved.d === day) {
      cta.innerHTML = '<p>오늘은 이미 카드를 뽑았어요.</p>' +
        '<a class="btn" href="./result/?c=' + saved.c + '&d=' + day + '">오늘의 카드 다시 보기</a>';
      reveal(saved.c, true);
      return;
    }

    cta.innerHTML = '<p>오늘 하루를 떠올리며 마음이 가는 카드를 한 장 골라 주세요.</p>';
    spread.querySelectorAll('.tcard').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = Number(btn.getAttribute('data-id'));
        writeStore({ d: day, c: id });
        reveal(id, false);
        var c = T.cards[id];
        cta.innerHTML = '<p>오늘의 카드는 ' + esc(c.name) + ' 카드예요.</p>' +
          '<a class="btn" id="go-result" href="./result/?c=' + id + '&d=' + day + '">카드 해석 보기</a>';
        setTimeout(function () { var a = document.getElementById('go-result'); if (a) a.focus({ preventScroll: true }); }, 50);
      });
    });

    function reveal(id) {
      spread.querySelectorAll('.tcard').forEach(function (b) {
        b.disabled = true;
        if (Number(b.getAttribute('data-id')) === id) b.classList.add('is-flipped');
        else b.classList.add('is-dim');
      });
    }
  }

  function mountResult() {
    var head = document.getElementById('result-head');
    var detail = document.getElementById('result-detail');
    var p = new URLSearchParams(location.search);
    var id = Number(p.get('c'));
    var day = /^\d{8}$/.test(p.get('d') || '') ? p.get('d') : window.Site.ymd();
    var c = T.cards[id];
    var today = window.Site.ymd();

    if (!c || p.get('c') === null) {
      head.innerHTML = '<div class="result-card"><h1>카드를 찾을 수 없어요</h1>' +
        '<p class="result-sub">링크가 잘렸을 수 있어요. 오늘의 카드를 새로 뽑아 보세요.</p>' +
        '<div class="btn-row"><a class="btn" href="../">카드 뽑으러 가기</a></div></div>';
      detail.innerHTML = '';
      return;
    }

    document.title = c.name + ' 카드 | ' + T.title;

    head.innerHTML =
      '<div class="result-card">' +
      '<p class="tarot-date">' + fmt(day) + '의 카드</p>' +
      '<div class="tarot-big">' + faceHTML(c) + '</div>' +
      '<span class="result-type">' + esc(c.keyword) + '</span>' +
      '<h1>' + esc(c.name) + '</h1>' +
      '<p class="result-sub">' + esc(c.en) + '</p>' +
      '<p class="result-summary" style="margin-top:14px">' + esc(c.message) + '</p>' +
      (day !== today ? '<p class="note">지난 날짜의 카드예요. <a href="../">오늘의 카드 뽑기</a></p>' : '') +
      '</div>';

    detail.innerHTML =
      '<div class="detail">' +
      '<h2>연애</h2><p>' + esc(c.love) + '</p>' +
      '<h2>일·공부</h2><p>' + esc(c.work) + '</p>' +
      '<h2>오늘의 한마디</h2><p>' + esc(c.advice) + '</p>' +
      '<p><span class="lucky" style="background:' + esc(c.color) + '"></span>행운의 색: ' + esc(c.lucky) + '</p>' +
      '</div>' +
      '<p class="note" style="text-align:center;margin-top:14px">카드는 매일 자정에 새로 섞여요. 내일 다시 만나요.</p>' +
      '<div class="btn-row">' +
      '<button class="btn" id="share">카드 공유하기</button>' +
      '<a class="btn btn--plain" href="' + window.Site.url('') + '">다른 테스트 보기</a>' +
      '</div>';

    detail.querySelector('#share').addEventListener('click', function () {
      window.Site.share(location.origin + location.pathname + '?c=' + id + '&d=' + day, '오늘의 타로 - ' + c.name);
    });
  }

  window.Tarot = { mountDraw: mountDraw, mountResult: mountResult, todaysCards: todaysCards };
})();
