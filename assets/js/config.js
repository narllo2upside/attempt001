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
    { key: 'personality', label: '성격' },
    { key: 'love', label: '연애' },
    { key: 'mbti', label: 'MBTI' },
    { key: 'fortune', label: '운세' },
    { key: 'ability', label: '능력' }
  ],

  // 홈 상단 배너 슬라이드 (slug 순서대로, copy는 배너 문구 — 비우면 테스트 설명 사용)
  featured: [
    { slug: 'today-tarot', copy: '카드 한 장으로 여는 오늘 하루. 연애, 일, 행운의 색까지.' },
    { slug: 'chiikawa-mbti', copy: '12개의 질문으로 나와 꼭 닮은 친구를 찾아보세요.' },
    { slug: 'attachment-test', copy: '답장이 늦을 때 나는? 연애할 때의 내 마음 습관.' },
    { slug: 'inner-child', copy: '어른이 된 지금도 마음속에 살고 있는 아이를 만나요.' },
    { slug: 'reflex-test', copy: '초록색이 되는 순간 탭! 내 반응 속도는 몇 ms?' }
  ],

  // 홈 큐레이션 줄 — category로 묶거나 slugs로 직접 고르기
  shelves: [
    { title: '💞 나의 연애 유형', category: 'love' },
    { title: '🧠 자아 탐구 중', category: 'personality' },
    { title: '🔮 오늘은 뭔가 궁금해', slugs: ['today-tarot', 'book-of-answers', 'lucky-test', 'reflex-test'] }
  ],

  // 홈 목록 한 페이지에 보일 테스트 수, 피드 광고 간격
  pageSize: 20,
  infeedEvery: 10,

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
      result_bottom: '',
      side: ''          // 우측 사이드바 세로형(300x600 권장), 데스크톱에서만
    }
  }
};
