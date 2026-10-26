/* =========================================================
 * 사이트 전역 설정 — 브랜드 / 카테고리 / 광고를 여기서만 바꿉니다.
 * ========================================================= */
/* 사이트가 올라간 기준 주소를 자동으로 찾습니다.
 * 예) https://아이디.github.io/attempt001/  처럼 하위 폴더에 배포해도 동작 */
window.SITE_BASE = (function () {
  var s = document.currentScript && document.currentScript.src;
  return s ? s.replace(/assets\/js\/config\.js(\?.*)?$/, '') : '/';
})();

window.SITE_CONFIG = {
  siteName: '말랑테스트',
  siteUrl: 'https://YOUR-DOMAIN.com',
  contactEmail: 'hello@YOUR-DOMAIN.com',

  // 홈 상단 카테고리 칩 (key는 data/tests.json의 category와 일치)
  categories: [
    { key: 'all', label: '전체' },
    { key: 'mbti', label: '성격·MBTI' },
    { key: 'fortune', label: '운세·타로' }
  ],

  adsense: {
    // AdSense 승인 전에는 false → 광고 자리가 점선 박스로 보입니다.
    // 승인 후 true로 바꾸면 adsbygoogle.js가 모든 페이지에 로드되고,
    // 대시보드에서 켠 자동 광고(전면 비네트·앵커)가 함께 동작합니다.
    enabled: false,
    client: 'ca-pub-XXXXXXXXXXXXXXXX',

    // 수동 디스플레이 광고 단위 ID. enabled=true인데 비어 있으면 그 자리는 숨겨집니다.
    slots: {
      home_top: '',
      home_infeed: '',
      home_bottom: '',
      test_top: '',
      test_mid: '',
      test_bottom: '',
      result_top: '',
      result_mid: '',
      result_bottom: ''
    }
  }
};
