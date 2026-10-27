/* =========================================================
 * 답을 주는 책 엔진
 *  질문을 떠올리고 책을 펼치면 answers 중 하나를 무작위로 보여줍니다.
 *  적은 질문은 서버로 보내지 않고 이 브라우저 탭(sessionStorage)에만 잠깐 둡니다.
 *  결과 URL: result/?a=번호
 * ========================================================= */
(function () {
  var D = window.TEST_DATA;
  var esc = function (s) { return window.Site.esc(s); };
  var QKEY = 'oracle-question';

  function mountTest() {
    var app = document.getElementById('app');
    app.innerHTML =
      '<div class="oracle">' +
      '<label class="oracle__label" for="oq">질문을 떠올리거나 적어 보세요</label>' +
      '<textarea id="oq" rows="2" maxlength="80" placeholder="예) 이번 주에 먼저 연락해 볼까?"></textarea>' +
      '<p class="note">적은 질문은 저장되거나 전송되지 않아요.</p>' +
      '<div class="oracle__book" id="book" aria-hidden="true"><span class="oracle__cover">📕</span></div>' +
      '<div class="oracle__cta" id="cta"><button class="btn" id="open">책 펼치기</button></div>' +
      '</div>';

    app.querySelector('#open').addEventListener('click', function () {
      var q = app.querySelector('#oq').value.trim();
      try { sessionStorage.setItem(QKEY, q); } catch (e) {}
      var a = Math.floor(Math.random() * D.answers.length);
      var book = app.querySelector('#book');
      book.classList.add('is-opening');
      var cta = app.querySelector('#cta');
      cta.innerHTML = '<p class="note">책장을 넘기는 중…</p>';
      setTimeout(function () {
        book.classList.remove('is-opening');
        book.classList.add('is-open');
        cta.innerHTML = '<p>책이 펼쳐졌어요.</p><a class="btn" id="go-result" href="./result/?a=' + a + '">답 확인하기</a>';
        cta.querySelector('#go-result').focus({ preventScroll: true });
      }, 1100);
    });
  }

  function mountResult() {
    var head = document.getElementById('result-head');
    var detail = document.getElementById('result-detail');
    var a = Number(window.Site.param('a'));
    var text = D.answers[a];
    if (window.Site.param('a') === null || text == null) {
      head.innerHTML = '<div class="result-card"><h1>펼친 페이지를 찾을 수 없어요</h1><div class="btn-row"><a class="btn" href="../">책 펼치러 가기</a></div></div>';
      detail.innerHTML = '';
      return;
    }
    var q = '';
    try { q = sessionStorage.getItem(QKEY) || ''; } catch (e) {}
    head.innerHTML =
      '<div class="result-card oracle-page">' +
      (q ? '<p class="result-kicker">나의 질문</p><p class="oracle-q">' + esc(q) + '</p>' : '<p class="result-kicker">책님의 대답</p>') +
      '<h1 class="oracle-answer">' + esc(text) + '</h1>' +
      '<p class="note">' + (a + 1) + '쪽</p></div>';
    detail.innerHTML =
      '<div class="detail"><h2>이렇게 읽어 보세요</h2><p>' + esc(D.howToRead) + '</p></div>' +
      '<div class="btn-row"><button class="btn" id="share">답 공유하기</button><a class="btn btn--plain" href="../">다른 질문하기</a></div>';
    detail.querySelector('#share').addEventListener('click', function () {
      window.Site.share(location.origin + location.pathname + '?a=' + a, D.title);
    });
  }

  window.TestEngine = { mountTest: mountTest, mountResult: mountResult };
})();
