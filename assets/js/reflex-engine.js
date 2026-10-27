/* =========================================================
 * 반사신경 엔진
 *  화면이 초록색으로 바뀌는 순간 탭 → 반응 속도(ms) 측정, rounds회 평균
 *  bands: [{ max: 200, key: 'falcon' }, ...] (max 오름차순, 마지막은 max 생략)
 *  결과 URL: result/?ms=평균
 * ========================================================= */
(function () {
  var D = window.TEST_DATA;
  var esc = function (s) { return window.Site.esc(s); };

  function bandOf(ms) {
    for (var i = 0; i < D.bands.length; i++) {
      if (D.bands[i].max == null || ms <= D.bands[i].max) return D.bands[i].key;
    }
    return D.bands[D.bands.length - 1].key;
  }

  function mountTest() {
    var app = document.getElementById('app');
    var rounds = D.rounds || 5;
    var times = [], state = 'idle', timer = null, startAt = 0;

    app.innerHTML =
      '<div class="reflex">' +
      '<button class="reflex__pad" id="pad" data-state="idle"><strong id="pad-title">탭해서 시작</strong><span id="pad-sub">초록색으로 바뀌는 순간 최대한 빨리 탭하세요</span></button>' +
      '<p class="reflex__log" id="log">' + rounds + '번 측정해서 평균을 내요</p>' +
      '<div class="reflex__cta" id="cta"></div></div>';

    var pad = app.querySelector('#pad'), title = app.querySelector('#pad-title'),
      sub = app.querySelector('#pad-sub'), log = app.querySelector('#log'), cta = app.querySelector('#cta');

    function set(st, t, s) { state = st; pad.setAttribute('data-state', st); title.textContent = t; sub.textContent = s || ''; }

    function arm() {
      set('wait', '기다리세요…', '아직 누르면 안 돼요');
      timer = setTimeout(function () {
        startAt = performance.now();
        set('go', '지금!', '');
      }, 1200 + Math.random() * 2600);
    }

    function logText() {
      return times.map(function (t, i) { return (i + 1) + '회 ' + t + 'ms'; }).join(' / ') || (rounds + '번 측정해서 평균을 내요');
    }

    pad.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (state === 'idle' || state === 'next') { arm(); return; }
      if (state === 'wait') {
        clearTimeout(timer);
        set('next', '너무 빨랐어요', '탭해서 이번 회차를 다시 해요');
        return;
      }
      if (state === 'go') {
        var ms = Math.round(performance.now() - startAt);
        times.push(ms);
        log.textContent = logText();
        if (times.length < rounds) { set('next', ms + 'ms', '탭해서 다음 회차 (' + (times.length + 1) + '/' + rounds + ')'); return; }
        var avg = Math.round(times.reduce(function (a, b) { return a + b; }, 0) / times.length);
        set('done', '평균 ' + avg + 'ms', '측정이 끝났어요');
        pad.disabled = true;
        cta.innerHTML = '<a class="btn" id="go-result" href="./result/?ms=' + avg + '">결과 보기</a>' +
          '<div class="quiz-nav" style="justify-content:center;margin-top:12px"><button class="ghost" id="again">다시 측정하기</button></div>';
        cta.querySelector('#again').addEventListener('click', function () {
          times = []; pad.disabled = false; cta.innerHTML = ''; log.textContent = logText(); set('idle', '탭해서 시작', '초록색으로 바뀌는 순간 최대한 빨리 탭하세요');
        });
        cta.querySelector('#go-result').focus({ preventScroll: true });
      }
    });
    // 키보드 사용자: 스페이스/엔터도 탭으로 처리
    pad.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pad.dispatchEvent(new PointerEvent('pointerdown')); }
    });
  }

  function mountResult() {
    var head = document.getElementById('result-head');
    var detail = document.getElementById('result-detail');
    var ms = Number(window.Site.param('ms'));
    if (!ms || ms < 50 || ms > 5000) {
      head.innerHTML = '<div class="result-card"><h1>결과를 찾을 수 없어요</h1><div class="btn-row"><a class="btn" href="../">측정하러 가기</a></div></div>';
      detail.innerHTML = '';
      return;
    }
    var r = D.results[bandOf(ms)];
    document.title = r.name + ' (' + ms + 'ms) | ' + D.title;
    head.innerHTML =
      '<div class="result-card">' +
      '<p class="result-kicker">나의 평균 반응 속도</p>' +
      '<p class="result-score">' + ms + 'ms</p>' +
      '<div class="result-emoji" aria-hidden="true">' + esc(r.emoji) + '</div>' +
      '<h1>' + esc(r.name) + '</h1>' +
      '<p class="result-summary">' + esc(r.summary) + '</p></div>';
    detail.innerHTML =
      '<div class="detail"><h2>이런 순간에 강해요</h2><ul>' +
      r.traits.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<h2>구간표</h2><ul class="band-list">' +
      D.bands.map(function (b, i) {
        var lo = i === 0 ? 0 : D.bands[i - 1].max + 1;
        var range = b.max == null ? lo + 'ms 이상' : (i === 0 ? b.max + 'ms 이하' : lo + '~' + b.max + 'ms');
        return '<li' + (D.results[b.key] === r ? ' class="is-me"' : '') + '>' + esc(D.results[b.key].emoji + ' ' + D.results[b.key].name) + ' <span>' + range + '</span></li>';
      }).join('') + '</ul></div>' +
      '<div class="btn-row"><button class="btn" id="share">결과 공유하기</button><a class="btn btn--plain" href="../">다시 측정하기</a></div>';
    detail.querySelector('#share').addEventListener('click', function () {
      window.Site.share(location.origin + location.pathname + '?ms=' + ms, D.title + ' - ' + ms + 'ms');
    });
  }

  window.TestEngine = { mountTest: mountTest, mountResult: mountResult };
})();
