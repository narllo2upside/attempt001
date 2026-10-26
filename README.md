# 말랑테스트 — testmoa.com 구조를 본뜬 정적 테스트 사이트

서버 없이 HTML/JS만으로 동작합니다. Cloudflare Pages, Netlify, GitHub Pages(커스텀 도메인) 등에 폴더째 올리면 됩니다.
경로가 `/assets/...` 처럼 루트 기준이라 **도메인 루트에 배포**해야 합니다.

로컬 확인: 사이트 루트에서 `python3 -m http.server 8000` 후 http://localhost:8000
(파일을 더블클릭해서 열면 tests.json을 못 읽습니다)

## 폴더 구조

```
/index.html                     홈: 카테고리 칩 + 테스트 카드 목록
/data/tests.json                ★ 콘텐츠 레지스트리 (홈·관련 테스트 목록의 원본)
/assets/js/config.js            ★ 사이트명, 카테고리, AdSense ID/슬롯
/assets/js/ads.js               광고 슬롯 렌더러 (data-ad="이름" → 광고)
/assets/js/common.js            헤더/푸터, 카드 렌더, 공유
/assets/js/mbti-engine.js       MBTI형 테스트 공용 엔진
/assets/js/tarot-engine.js      오늘의 타로 엔진
/assets/css/style.css
/test/chiikawa-mbti/            index.html(질문) · result/index.html(결과) · data.js · images/
/test/today-tarot/              index.html(카드 뽑기) · result/index.html(해석) · data.js
/privacy/                       개인정보처리방침 템플릿 (AdSense 심사 필수)
/ads.txt  /robots.txt  /sitemap.xml
/tools/new_test.py              새 테스트 자동 생성
```

## 콘텐츠 추가

MBTI형 테스트는 엔진이 공용이라 **데이터만 바꾸면 새 테스트**가 됩니다.

```
python3 tools/new_test.py cat-mbti "고양이 MBTI 테스트" --emoji 🐱 --desc "나와 닮은 고양이는?"
```

1. `test/cat-mbti/` 폴더 생성, tests.json·sitemap.xml에 자동 등록
2. `data.js`에서 질문 12개(axis 0~3, 축당 3개)와 결과 16개 수정
3. `index.html`의 소개 문구·FAQ 수정 (검색 유입·AdSense 심사용 본문이라 중요)
4. 이미지 넣기: `thumb.png`(목록 카드), `cover.png`(상단), `images/ENFP.png` 등 16장
   이미지가 없으면 이모지·안내 박스가 대신 보입니다.

`tests.json`의 `rank`가 작을수록 목록 앞에 나오고, `isNew: true`면 ‘신규’ 배지가 붙습니다.

## 광고 설정

`assets/js/config.js`에서만 다룹니다.

1. AdSense 신청: `index.html`의 `google-adsense-account` 메타 주석을 풀고 pub ID 입력, `ads.txt`의 pub ID 교체
2. 승인 후 `enabled: true`, `client` 입력
3. AdSense 대시보드 → 자동 광고에서 **전면 광고(비네트)**, **앵커 광고** 켜기
4. 디스플레이 광고 단위를 만들어 `slots`에 ID 입력 (비워 둔 자리는 숨겨짐)

| 슬롯 | 위치 |
|---|---|
| home_top / home_infeed / home_bottom | 홈 목록 위 / 카드 6개마다 / 목록 아래 |
| test_top / test_mid / test_bottom | 질문 카드 위 / 질문 카드와 설명 사이 / 관련 테스트 아래 |
| result_top / result_mid / result_bottom | 결과 위 / 결과 요약과 상세 사이 / 관련 테스트 아래 |

### 페이지 이동 시 광고(비네트)가 뜨는 조건
- 같은 도메인으로 가는 **`<a href>` 링크를 사용자가 눌러서** 이동할 때 Google이 띄웁니다.
  JS로 `location.href`를 바꾸거나 해시(#) 라우팅만 하면 뜨지 않습니다.
- 그래서 이 사이트는 결과 보기, 카테고리 칩, 관련 테스트, 궁합 결과 보기를 모두 실제 링크로 만들었습니다.
- 노출 빈도는 Google이 조절합니다. 뜰 때 주소 끝에 `#google_vignette`가 붙습니다.

### 정책상 피할 것
- 광고를 A/B 선택 버튼 바로 옆에 붙이지 마세요(오클릭 유도). 현재 배치는 버튼과 충분히 떨어져 있습니다.
- “광고를 눌러 주세요” 같은 문구, 결과를 광고 클릭 뒤에 보여주는 구조는 금지입니다.

## 남은 할 일
- 모든 HTML의 `YOUR-DOMAIN.com`을 실제 도메인으로 교체
- 개인정보처리방침의 운영자 정보 채우기
- 카카오톡 공유를 원하면 Kakao JavaScript SDK와 앱 키를 추가 (현재는 시스템 공유 + 링크 복사)
- 결과별 OG 이미지(카톡 미리보기)를 원하면 결과를 유형별 정적 페이지로 생성하는 빌드 단계 추가
- 다국어: `/ja/`, `/en/` 폴더로 복제 후 data.js 번역
