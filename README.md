# 말랑테스트 — 무료 심리 테스트 사이트

HTML/JS만으로 동작하는 정적 사이트입니다. 모든 경로가 상대경로라서 도메인 루트든 `아이디.github.io/저장소명/` 같은 하위 폴더든 그대로 동작합니다.

- GitHub Pages: Settings → Pages → `Deploy from a branch`, `main`, `/ (root)`
- 로컬 확인: 사이트 루트에서 `python3 -m http.server 8000` → http://localhost:8000

## 폴더 구조

```
index.html                홈 (검색, 카테고리, 목록, 페이지 번호)
assets/js/config.js       ★ 사이트명, 카테고리, 한 페이지 개수, 광고 ID
assets/js/common.js       헤더/푸터, 카드, 인기 테스트 가젯, 관련 테스트
assets/js/ads.js          광고 자리 렌더러
assets/js/*-engine.js     테스트 엔진 5종 (quiz, mbti, tarot, reflex, oracle)
test/<slug>/page.json     ★ 목록 카드 문구 + 페이지 소개·설명·FAQ
test/<slug>/data.js       ★ 질문과 결과
test/<slug>/index.html    자동 생성 (직접 고치지 마세요)
test/<slug>/result/       자동 생성
data/tests.json           자동 생성 (홈·인기·관련 테스트 목록)
sitemap.xml               자동 생성
tools/new_test.py         새 테스트 만들기
tools/check.js            데이터 실수 검사
tools/build.py            페이지 생성
```

## 테스트 고치기·추가하기

```
python3 tools/new_test.py cat-test "고양이 성격 테스트" --from inner-child   # 새로 만들 때만
# test/cat-test/data.js, page.json 수정
node tools/check.js       # 오타·빠진 결과 검사
python3 tools/build.py    # HTML·목록·사이트맵 생성
```

그다음 바뀐 파일을 모두 커밋하면 됩니다. **data.js나 page.json을 고쳤으면 build.py를 꼭 다시 실행하세요.** 생성된 HTML을 직접 고치면 다음 빌드 때 덮어써집니다.

`--from`으로 고를 원본은 테스트 방식에 따라 정하세요.

| 원본 | 방식 | 어울리는 테스트 |
|---|---|---|
| inner-child | 선택지마다 결과 하나에 1점, 가장 많은 결과 | 대부분의 유형 테스트 |
| mental-age-test | 선택지 점수 합계 → 구간별 결과 | 정신연령, 확률, 지수 |
| mbti-test / chiikawa-mbti | MBTI 16유형 | 캐릭터 MBTI |
| reflex-test, book-of-answers, today-tarot | 미니게임, 답의 책, 타로 | — |

### page.json 주요 항목

| 항목 | 쓰이는 곳 |
|---|---|
| title, desc, emoji, tint, meta, isNew | 홈 목록 카드 |
| rank | 숫자가 작을수록 홈 앞쪽, 인기 테스트 가젯 상위 10위 |
| category | config.js의 카테고리 key (personality, love, mbti, fortune, ability) |
| seoTitle, description | 검색 결과 제목·설명 |
| headline, intro, sections, faq, note | 테스트 페이지 본문 |
| theme: "night" | 어두운 테마 (타로) |

썸네일 이미지를 쓰려면 `test/<slug>/thumb.png`(정사각형)를 넣으세요. 없으면 이모지가 보입니다.

## 페이지 구성

모든 테스트·결과 페이지는 같은 틀입니다 (`tools/build.py`의 템플릿을 고치면 전부 바뀜).

- 본문: 상단 광고 → 제목·썸네일·소개 → 테스트 → 중간 광고 → 설명·FAQ → 관련 테스트 4개 → 하단 광고
- 우측 사이드바(화면 폭 1024px 이상): 인기 테스트 10위 가젯 → 따라 내려오는 세로형 광고
- 모바일: 사이드바가 본문 아래로 내려가고, 세로형 광고는 만들지 않음

## 광고 설정

`assets/js/config.js`

1. AdSense 신청: `index.html`의 `google-adsense-account` 메타 주석 해제, `ads.txt`의 pub ID 교체
2. 승인 후 `enabled: true`, `client` 입력
3. AdSense 대시보드 → 자동 광고에서 **전면 광고(비네트)**, **앵커 광고**, **광고 인텐트**를 켜기
4. 디스플레이 광고 단위를 만들어 `slots`에 ID 입력 (비워 둔 자리는 숨겨짐)

| 슬롯 | 위치 | 권장 형태 |
|---|---|---|
| home_top / home_infeed / home_bottom | 홈 목록 위 / 카드 10개마다 / 목록 아래 | 반응형 |
| test_top / test_mid / test_bottom | 테스트 제목 위 / 테스트와 설명 사이 / 맨 아래 | 반응형 |
| result_top / result_mid / result_bottom | 결과 위 / 결과 카드와 상세 사이 / 맨 아래 | 반응형 |
| side | 우측 사이드바 (데스크톱만) | 세로형 300×600 |

**전면 광고(비네트)**는 같은 사이트 안의 `<a href>` 링크를 사용자가 눌러 이동할 때 Google이 띄웁니다. 결과 보기, 카테고리, 페이지 번호, 인기 테스트, 관련 테스트가 모두 실제 링크라서 이동마다 노출 기회가 생깁니다.

**광고 인텐트**는 본문 속 단어를 검색 광고 링크로 바꾸는 자동 광고 기능입니다(testmoa 설명문 중간의 알약 모양 링크). 코드 작업 없이 대시보드에서 켜면 됩니다.

### 정책상 피할 것
- 광고를 선택지 버튼 바로 옆에 붙이지 마세요(오클릭 유도).
- “광고를 눌러 주세요” 같은 문구, 광고를 봐야 결과가 보이는 구조는 금지입니다.
- AdSense는 `github.io` 하위 폴더 주소로 승인받을 수 없습니다. 개인 도메인을 연결하세요.

## 남은 할 일
- `config.js`의 `siteUrl`과 index.html·robots.txt의 `YOUR-DOMAIN.com`을 실제 주소로 바꾼 뒤 build.py 실행
- 개인정보처리방침 운영자 정보 채우기
- 테스트별 썸네일 이미지
