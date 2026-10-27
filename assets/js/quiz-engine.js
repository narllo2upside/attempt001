/* =========================================================
 * 범용 퀴즈 엔진 — 두 가지 방식
 *
 *  mode: 'category'  선택지마다 결과 키에 1점 → 가장 높은 결과 (동점이면 results에 먼저 적힌 쪽)
 *     questions: [{ q: '질문', o: [['선택지', '결과키'], ...] }]
 *     결과 URL: result/?r=키&s=각 결과 비율(%)을 results 순서대로 '.'로 연결
 *
 *  mode: 'score'     선택지마다 점수 → 합계로 구간(bands) 결정
 *     questions: [{ q: '질문', o: [['선택지', 점수], ...] }]
 *     bands: [{ min: 0, key: 'a' }, { min: 10, key: 'b' }]  (min 오름차순)
 *     scoreText(합계): 결과 상단 큰 숫자 문구 (선택)
 *     결과 URL: result/?v=합계
 *
 *  results: { 키: { name, emoji, summary, traits: [], tip } }
 *  shuffle: true  선택지 순서를 사람마다 섞음 (정답 패턴이 보이는 테스트에 사용)
 * ========================================================= */
(function () {
  var D = window.TEST_DATA;
  var esc = function (s) { return window.Site.esc(s); };
  var LETTERS = ['A', 'B', 'C', 'D', 'E'];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEYS = Object.keys(D.results);

  function tally(answers) {
    var score = {};
    KEYS.forEach(function (k) { score[k] = 0; });
    answers.forEach(function (oi, qi) {
      var opt = D.questions[qi].o[oi];
      if (opt && score.hasOwnProperty(opt[1])) score[opt[1]]++;
    });
    return score;
  }

  function resultHref(answers) {
    if (D.mode === 'score') {
      var v = answers.reduce(function (sum, oi, qi) { return sum + Number(D.questions[qi].o[oi][1]); }, 0);
      return './result/?v=' + v;
    }
    var score = tally(answers);
    var best = KEYS.reduce(function (a, b) { return score[b] > score[a] ? b : a; }, KEYS[0]);
    var total = answers.length || 1;
    var pct = KEYS.map(function (k) { return Math.round(score[k] / total * 100); }).join('.');
    return './result/?r=' + encodeURIComponent(best) + '&s=' + pct;
  }

  function mountTest() {
    var root = document.getElementById('app');
    var idx = 0, answers = [], total = D.questions.length;
    // 문항별 선택지 표시 순서 (shuffle이면 한 번 섞어서 고정)
    var orders = D.questions.map(function (q) {
      var o = q.o.map(function (_, i) { return i; });
      if (D.shuffle) for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = o[i]; o[i] = o[j]; o[j] = t; }
      return o;
    });

    function render() {
      var q = D.questions[idx];
      root.innerHTML =
        '<div class="quiz">' +
        '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + idx + '">' +
        '<span style="width:' + (idx / total * 100) + '%"></span></div>' +
        '<p class="q-count">' + (idx + 1) + ' / ' + total + '</p>' +
        '<h2 class="q-text">' + esc(q.q) + '</h2>' +
        orders[idx].map(function (oi, pos) {
          return '<button class="choice" data-i="' + oi + '" data-pos="' + pos + '"><b>' + LETTERS[pos] + '</b><span>' + esc(q.o[oi][0]) + '</span></button>';
        }).join('') +
        '<div class="quiz-nav"><button class="ghost" id="q-prev"' + (idx === 0 ? ' disabled' : '') + '>이전 질문</button></div></div>';

      root.querySelectorAll('.choice').forEach(function (btn) {
        btn.addEventListener('click', function () {
          answers[idx] = Number(btn.getAttribute('data-i'));
          btn.classList.add('is-picked');
          setTimeout(next, reduce ? 0 : 160);
        });
      });
      root.querySelector('#q-prev').addEventListener('click', function () { if (idx > 0) { idx--; render(); } });
    }

    function next() {
      idx++;
      if (idx < total) { render(); return; }
      // 결과는 별도 페이지 링크 → 사용자가 눌러서 이동해야 전면(비네트) 광고 기회가 생김
      root.innerHTML =
        '<div class="quiz"><div class="progress"><span style="width:100%"></span></div>' +
        '<div class="done"><h2>결과가 나왔어요</h2><p>' + esc(D.doneText || '나의 결과를 확인해 보세요.') + '</p>' +
        '<a class="btn" id="go-result" href="' + resultHref(answers) + '">결과 보기</a>' +
        '<div class="quiz-nav" style="justify-content:center;margin-top:14px"><button class="ghost" id="q-restart">처음부터 다시 하기</button></div>' +
        '</div></div>';
      root.querySelector('#q-restart').addEventListener('click', function () { idx = 0; answers = []; render(); });
      root.querySelector('#go-result').focus({ preventScroll: true });
    }

    render();
  }

  function notFound(head, detail) {
    head.innerHTML = '<div class="result-card"><h1>결과를 찾을 수 없어요</h1>' +
      '<p class="result-sub">링크가 잘렸을 수 있어요. 테스트를 다시 해보세요.</p>' +
      '<div class="btn-row"><a class="btn" href="../">테스트 하러 가기</a></div></div>';
    detail.innerHTML = '';
  }

  function mountResult() {
    var head = document.getElementById('result-head');
    var detail = document.getElementById('result-detail');
    var key, top = '', shareQuery;

    if (D.mode === 'score') {
      var raw = window.Site.param('v');
      var v = Number(raw);
      if (raw === null || isNaN(v)) return notFound(head, detail);
      D.bands.forEach(function (b) { if (v >= b.min) key = b.key; });
      if (D.scoreText) top = '<p class="result-score">' + esc(D.scoreText(v)) + '</p>';
      shareQuery = '?v=' + v;
    } else {
      key = window.Site.param('r');
      shareQuery = '?r=' + encodeURIComponent(key || '') + '&s=' + (window.Site.param('s') || '');
    }

    var r = D.results[key];
    if (!r) return notFound(head, detail);
    document.title = r.name + ' | ' + D.title;

    head.innerHTML =
      '<div class="result-card">' +
      '<p class="result-kicker">' + esc(D.resultLabel || '나의 결과') + '</p>' +
      top +
      '<div class="result-emoji" aria-hidden="true">' + esc(r.emoji || '✨') + '</div>' +
      '<h1>' + esc(r.name) + '</h1>' +
      '<p class="result-summary">' + esc(r.summary) + '</p>' +
      '</div>';

    var bars = '';
    var s = (window.Site.param('s') || '').split('.').map(Number);
    if (D.mode !== 'score' && s.length === KEYS.length && s.every(function (n) { return !isNaN(n); })) {
      bars = '<div class="detail"><h2>나의 성향 분포</h2><ul class="bars">' +
        KEYS.map(function (k, i) {
          return '<li' + (k === key ? ' class="is-me"' : '') + '><span class="bars__label">' + esc(D.results[k].name) + '</span>' +
            '<span class="bars__track"><span style="width:' + s[i] + '%"></span></span><span class="bars__num">' + s[i] + '%</span></li>';
        }).join('') + '</ul></div>';
    }

    detail.innerHTML =
      '<div class="detail">' +
      '<h2>' + esc(D.traitsTitle || '이런 모습이 있어요') + '</h2>' +
      '<ul>' + r.traits.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      (r.tip ? '<h2>' + esc(D.tipTitle || '한마디') + '</h2><p>' + esc(r.tip) + '</p>' : '') +
      '</div>' + bars +
      '<div class="btn-row">' +
      '<button class="btn" id="share">결과 공유하기</button>' +
      '<a class="btn btn--plain" href="../">다시 하기</a>' +
      '</div>';

    detail.querySelector('#share').addEventListener('click', function () {
      window.Site.share(location.origin + location.pathname + shareQuery, D.title + ' - ' + r.name);
    });
  }

  window.TestEngine = { mountTest: mountTest, mountResult: mountResult };
})();
