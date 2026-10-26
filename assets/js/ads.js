/* =========================================================
 * 광고 렌더러
 *  - 페이지의 <div data-ad="슬롯이름"> 을 찾아 광고 단위로 바꿉니다.
 *  - enabled=false : 점선 placeholder (개발/심사 전)
 *  - enabled=true  : adsbygoogle.js 로드 + <ins class="adsbygoogle">
 *    → 스크립트가 로드되는 것만으로 자동 광고(비네트=페이지 이동 시 전면광고,
 *      앵커=화면 하단 고정)가 동작합니다. 켜고 끄는 건 AdSense 대시보드에서.
 * ========================================================= */
(function () {
  var cfg = window.SITE_CONFIG.adsense;
  var loaded = false;

  function loadScript() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + cfg.client;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  function renderSlot(el) {
    if (el.getAttribute('data-ad-done')) return;
    el.setAttribute('data-ad-done', '1');
    var name = el.getAttribute('data-ad');
    var slotId = cfg.slots[name];
    el.innerHTML = '';

    if (cfg.enabled && !slotId) { el.remove(); return; }

    el.classList.add('ad');
    var label = document.createElement('span');
    label.className = 'ad-label';
    label.textContent = '광고';
    el.appendChild(label);

    if (!cfg.enabled) {
      var ph = document.createElement('div');
      ph.className = 'ad-placeholder';
      ph.textContent = '광고 자리: ' + name;
      el.appendChild(ph);
      return;
    }

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', cfg.client);
    ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    el.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }

  window.Ads = {
    init: function () {
      if (cfg.enabled) loadScript();
      document.querySelectorAll('[data-ad]').forEach(renderSlot);
    },
    renderSlot: renderSlot
  };
})();
