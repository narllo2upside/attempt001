/* =========================================================
 * MBTI형 테스트 엔진 (재사용)
 * 각 테스트 폴더의 data.js 가 window.TEST_DATA 를 정의하면
 *   - 테스트 페이지:  MbtiTest.mountQuiz()
 *   - 결과 페이지:    MbtiTest.mountResult()
 * 만 호출하면 됩니다. 새 테스트 = data.js 내용만 교체.
 * ========================================================= */
(function () {
  var D = window.TEST_DATA;
  var esc = function (s) { return window.Site.esc(s); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 축마다 A 선택이 과반이면 앞 글자, 아니면 뒤 글자
  function compute(answers) {
    return D.axes.map(function (pair, ai) {
      var total = 0, a = 0;
      D.questions.forEach(function (q, qi) {
        if (q.axis !== ai) return;
        total++;
        if (answers[qi] === 'A') a++;
      });
      return a * 2 > total ? pair[0] : pair[1];
    }).join('');
  }

  function mountQuiz() {
    var host = document.getElementById('app') || document.getElementById('quiz');
    host.innerHTML = '<div class="quiz"></div>';
    var root = host.firstChild;
    var idx = 0;
    var answers = [];
    var total = D.questions.length;

    function render() {
      var q = D.questions[idx];
      root.innerHTML =
        '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + idx + '">' +
        '<span style="width:' + (idx / total * 100) + '%"></span></div>' +
        '<p class="q-count">' + (idx + 1) + ' / ' + total + '</p>' +
        '<h2 class="q-text">' + esc(q.q) + '</h2>' +
        '<button class="choice" data-v="A"><b>A</b><span>' + esc(q.a) + '</span></button>' +
        '<button class="choice" data-v="B"><b>B</b><span>' + esc(q.b) + '</span></button>' +
        '<div class="quiz-nav"><button class="ghost" id="q-prev"' + (idx === 0 ? ' disabled' : '') + '>이전 질문</button></div>';

      root.querySelectorAll('.choice').forEach(function (btn) {
        btn.addEventListener('click', function () {
          answers[idx] = btn.getAttribute('data-v');
          btn.classList.add('is-picked');
          setTimeout(next, reduce ? 0 : 160);
        });
      });
      root.querySelector('#q-prev').addEventListener('click', function () {
        if (idx > 0) { idx--; render(); }
      });
    }

    function next() {
      idx++;
      if (idx < total) { render(); root.querySelector('.choice').focus({ preventScroll: true }); return; }
      finish();
    }

    function finish() {
      var type = compute(answers);
      // 결과는 별도 URL로 이동 → 실제 페이지 전환이 일어나 전면(비네트) 광고 노출 기회가 생깁니다.
      // 반드시 사용자가 누르는 <a href> 링크여야 비네트가 동작합니다 (JS로 location 이동 X).
      root.innerHTML =
        '<div class="progress"><span style="width:100%"></span></div>' +
        '<div class="done"><h2>결과가 나왔어요</h2>' +
        '<p>나와 닮은 친구를 확인해 보세요.</p>' +
        '<a class="btn" id="go-result" href="./result/?type=' + type + '">결과 보기</a>' +
        '<div class="quiz-nav" style="justify-content:center;margin-top:14px">' +
        '<button class="ghost" id="q-restart">처음부터 다시 하기</button></div></div>';
      root.querySelector('#q-restart').addEventListener('click', function () { idx = 0; answers = []; render(); });
      root.querySelector('#go-result').focus({ preventScroll: true });
    }

    render();
  }

  function figureHTML(type, r) {
    var src = window.Site.url((D.imageBase || 'test/' + D.slug + '/images/') + type + '.png');
    var fallback = D.noImage ? '<span class="result-figure__type">' + type + '</span>' :
      '<span>' + esc(r.character) + ' 이미지 자리<br>(' + esc(src) + ')</span>';
    return '<div class="result-figure">' + fallback +
      '<img src="' + esc(src) + '" alt="' + esc(r.character + ' - ' + r.nickname) + '" onerror="this.remove()">' +
      '</div>';
  }

  function mountResult() {
    var head = document.getElementById('result-head');
    var detail = document.getElementById('result-detail');
    var type = (new URLSearchParams(location.search).get('type') || '').toUpperCase();
    var r = D.results[type];

    if (!r) {
      head.innerHTML = '<div class="result-card"><h1>결과를 찾을 수 없어요</h1>' +
        '<p class="result-sub">링크가 잘렸을 수 있어요. 테스트를 다시 해보세요.</p>' +
        '<div class="btn-row"><a class="btn" href="../">테스트 하러 가기</a></div></div>';
      detail.innerHTML = '';
      return;
    }

    document.title = r.character + ' (' + type + ') | ' + D.title;

    head.innerHTML =
      '<div class="result-card">' +
      '<span class="result-type">' + type + '</span>' +
      '<h1>' + esc(r.nickname) + '</h1>' +
      '<p class="result-sub">' + esc((D.subTpl || '나와 닮은 친구는 {c}').replace('{c}', r.character)) + '</p>' +
      figureHTML(type, r) +
      '<p class="result-summary">' + esc(r.summary) + '</p>' +
      '</div>';

    var best = D.results[r.best], worst = D.results[r.worst];
    detail.innerHTML =
      '<div class="detail">' +
      '<h2>이런 모습이 있어요</h2>' +
      '<ul>' + r.traits.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<div class="match">' +
      '<div><small>' + esc(D.bestLabel || '잘 맞는 친구') + '</small><strong>' + esc(best.character) + '</strong><br><a href="./?type=' + r.best + '">' + r.best + ' 결과 보기</a></div>' +
      '<div><small>' + esc(D.worstLabel || '조금 다른 친구') + '</small><strong>' + esc(worst.character) + '</strong><br><a href="./?type=' + r.worst + '">' + r.worst + ' 결과 보기</a></div>' +
      '</div></div>' +
      '<div class="btn-row">' +
      '<button class="btn" id="share">결과 공유하기</button>' +
      '<a class="btn btn--plain" href="../">다시 하기</a>' +
      '</div>';

    detail.querySelector('#share').addEventListener('click', function () {
      window.Site.share(location.origin + location.pathname + '?type=' + type, D.title + ' - ' + r.character);
    });
  }

  window.MbtiTest = { mountQuiz: mountQuiz, mountResult: mountResult, compute: compute };
  window.TestEngine = { mountTest: mountQuiz, mountResult: mountResult };
})();
