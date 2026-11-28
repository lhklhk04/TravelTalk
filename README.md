# TravelTalk

> 지금 있는 곳에서 바로 말할 수 있는 한마디 — 위치 기반 여행 표현 추천 웹앱 (PBL1 1조 MVP)

영어 기초는 되지만 현지어는 모르는 20~30대 초보 여행자를 위해,
지금 있는 **도시**와 **장소**(식당·카페·상점·교통·숙소·관광지)에 맞는 현지어 표현 3~5개를 추천합니다.
지원 여행지 언어는 🇫🇷 프랑스어 · 🇯🇵 일본어 · 🇪🇸 스페인어 · 🇰🇷 한국어 · 🇺🇸 영어이고,
앱 화면은 한국어/English로 볼 수 있습니다.
화면 언어와 같은 언어의 여행지는 숨깁니다 (한국어 화면에서는 한국, English 화면에서는 미국이 목록·언어 선택·위치 찾기에서 빠짐).

- HTML / CSS / Vanilla JS만 사용 (서버·API 키 없음). 외부 호출은 주변 장소 검색(OpenStreetMap Overpass) 하나뿐이고, 실패해도 등록된 명소로 동작
- 브라우저 내장 기능: Geolocation(위치), localStorage(저장), speechSynthesis(발음 듣기)
- 모바일 우선(390px 기준)

---

## 실행 방법

### 1. VS Code Live Server (권장)
`index.html`에서 우클릭 → **Open with Live Server**

### 2. 파일 더블클릭
`index.html`을 더블클릭해도 동작합니다.
이때는 브라우저가 JSON 읽기(`fetch`)를 막기 때문에 `data/*.js` 사본을 대신 읽습니다.

### 3. Python 로컬 서버
```bash
python -m http.server 5500
```
→ http://localhost:5500

> 화면이 예전 그대로면 **Ctrl+Shift+R**(강력 새로고침)을 눌러 주세요.

---

## 주요 기능

| 화면 | 기능 |
|---|---|
| **홈** | 📍 현재 위치 → 가장 가까운 도시 → 언어 자동 선택 · 권한 거부/실패 시 국가·도시 직접 선택 · 장소 유형 6개 · 상황 입력과 키워드 칩 |
| **결과** | 표현 카드 3~5개 (현지어 · 한글 발음 · 뜻 · 사용 상황 · 대화 예시) · 🔊 발음 듣기 · 🔖 저장 · 🇬🇧 영어로 확인하기 · ↻ 다른 표현 보기 · 맞는 표현이 없으면 기본 표현과 영어 도움 문장 |
| **저장한 표현** | 국가 → 도시 → 장소별 묶음 · 🔊 듣기 · 삭제(되돌리기) · 탭 배지에 개수 표시 |
| **설정** | 서비스 언어(한국어/English) · 읽기 속도(느리게/보통) · 한글 발음 표시 켜기/끄기 · 기기 음성 확인 · 저장한 표현/기억한 도시 지우기 |

---

## 폴더 구조

```
index.html            화면 4개(홈·결과·저장·설정) + 하단 탭
css/style.css         모든 스타일 (모바일 우선)
js/
  i18n.js             화면 언어(한국어/English) 사전과 t() 함수
  app.js              화면 동작: 데이터 불러오기, 위치, 결과 카드, 저장 화면, 설정
  recommend.js        추천 점수 규칙 + 장소별 영어 도움 문장
  storage.js          저장한 표현 (localStorage)
  speech.js           발음 듣기 (speechSynthesis)
  world.js            세계지도 데이터 불러오기·바탕 지도 그리기 (애니메이션·저장 지도 공용)
  trip.js             서울 → 고른 도시 비행 애니메이션 (d3-geo SVG)
  savedmap.js         '저장한 표현' 지도 보기 (도시별 핀)
  nearby.js           정확한 위치 → 주변 장소(Overpass / 등록 명소) → 자동 추천, 위치 시뮬레이션
  vendor/             지도 라이브러리 (외부 호출 없이 포함)
    d3-array.min.js       d3-array 3.2.5 (d3-geo가 필요로 함)
    d3-geo.min.js         d3-geo 3.1.2
    topojson-client.min.js  topojson-client 3.1.0
data/
  phrases.json        ✏️ 표현 데이터 (원본, 직접 수정)
  cities.json         ✏️ 도시 좌표 (원본, 직접 수정)
  phrases.js          ⚙️ 자동 생성 사본 — 직접 수정 금지
  cities.js           ⚙️ 자동 생성 사본 — 직접 수정 금지
  tag-map.json        ✏️ OpenStreetMap 태그 → 장소 유형·추천 키워드
  spots.json          ✏️ 미리 등록한 명소 좌표 (Overpass 실패 시 사용, demo가 있으면 시뮬레이션 목록에도 나옴)
  countries-110m.json 세계지도 (world-atlas 2.0.2, 110m TopoJSON)
  countries-110m.js   ⚙️ 자동 생성 사본 — 직접 수정 금지
tools/
  sync_data.py        JSON 검사 + JS 사본 생성
```

---

## 데이터 수정하기

1. `data/phrases.json` 또는 `data/cities.json`을 고칩니다.
2. 아래를 실행해 데이터를 검사하고 JS 사본을 다시 만듭니다.
   ```bash
   python tools/sync_data.py
   ```
   빠진 항목, 중복 id, 잘못된 언어·장소 값이 있거나
   언어×장소 조합의 표현이 6개 미만 또는 기본 표현(`basic`)이 없으면 오류를 알려 줍니다.

### 표현 형식 (`data/phrases.json`)
```json
{
  "id": "fr-cafe-03",
  "language": "fr",
  "placeType": "cafe",
  "basic": false,
  "keywords": ["포장", "테이크아웃", "가져가"],
  "phrase": "À emporter, s'il vous plaît.",
  "meaning_ko": "포장해 주세요.",
  "meaning_en": "To go, please.",
  "pronunciation_ko": "아 엉뽀르떼, 실 부 쁠레",
  "pronunciation_en": "ah ahn-por-TAY, seel voo PLEH",
  "situation": "음료나 빵을 가져가고 싶을 때",
  "situation_en": "When you want to take your drink or pastry with you",
  "dialogue": [
    { "speaker": "직원", "text": "Sur place ou à emporter ?", "meaning_ko": "드시고 가세요, 가져가세요?", "meaning_en": "For here or to go?" },
    { "speaker": "나", "text": "À emporter, s'il vous plaît.", "meaning_ko": "포장해 주세요.", "meaning_en": "To go, please." }
  ],
  "fallback_english": "To go, please."
}
```

| 필드 | 설명 |
|---|---|
| `id` | 고유 값. `언어-장소-번호` 형식. 저장과 "다른 표현 보기"에서 사용 |
| `language` | `fr` / `ja` / `es` / `ko` / `en` |
| `placeType` | `restaurant` / `cafe` / `shop` / `transport` / `hotel` / `sight` |
| `basic` | `true`면 기본 표현. 상황 입력이 없거나 맞는 표현이 없을 때 먼저 보여 줌 |
| `keywords` | 상황 입력과 비교할 한국어 단어 |
| `meaning_ko` / `meaning_en` | 뜻. 화면 언어가 한국어면 `_ko`, English면 `_en`을 보여 줌 |
| `pronunciation_ko` / `pronunciation_en` | 한글 발음 / 로마자 발음 (일본어는 헵번식 로마자) |
| `situation` / `situation_en` | 사용 상황 (한국어 / 영어) |
| `dialogue.speaker` | `나` 또는 `직원` (화면에는 "나/직원" 또는 "Me/Staff"로 표시) |
| `dialogue.meaning_ko` / `meaning_en` | 대화 각 줄의 뜻 |

`_en` 필드가 비어 있으면 영어 화면에서도 한국어 필드를 대신 보여 줍니다. `sync_data.py`는 `_en` 필드가 빠지면 오류를 알려 줍니다.

현재 데이터: 표현 **217개** (언어×장소마다 6~9개), 도시 **18개** (프랑스 4 · 일본 5 · 스페인 5 · 한국 2 · 미국 2)

한국어·영어 표현을 쓸 때는 이렇게 채웁니다.
- 한국어 표현(`ko`): `meaning_ko`·`pronunciation_ko`는 문장 그대로, `meaning_en`은 영어 뜻, `pronunciation_en`은 로마자(국어의 로마자 표기법)
- 영어 표현(`en`): `meaning_en`·`pronunciation_en`은 문장 그대로, `meaning_ko`는 한국어 뜻, `pronunciation_ko`는 한글 발음
- 발음 듣기는 `ko-KR`, `en-US` 음성을 씁니다.

---

## 추천 규칙 (`js/recommend.js`)

API 대신 키워드 점수로 추천합니다.

| 조건 | 점수 |
|---|---|
| 상황 입력에 표현의 `keywords`가 들어 있음 (예: "주문하고 싶어요" ⊃ `주문`) | +3 |
| 입력 단어가 `keywords`와 일부 겹침 | +2 |
| 입력 단어가 표현의 뜻·사용 상황에 들어 있음 | +1 |

- 정렬: 점수 높은 순 → 기본 표현 → 데이터 순서
- 보여 줄 개수: 맞는 표현 수에 따라 3~5개 / 상황 입력이 없으면 기본 표현부터 4개
- 맞는 표현이 없으면: 안내 + 장소별 영어 도움 문장 + 기본 표현
- **다른 표현 보기**: 이미 본 표현을 빼고 다음 3개. 다 보면 처음부터

## 비행 애니메이션 (`js/trip.js`)
- 도시를 고르고 **표현 추천받기**를 누르면 서울 → 그 도시 경로가 곡선으로 그려지고, 비행기가 따라 날아간 뒤 목적지로 확대되고 추천 결과로 넘어갑니다 (약 1.8초).
- 같은 도시는 한 번만 보여 줍니다 (새로고침하면 다시). 도시를 안 골랐거나 도착지가 서울이면 바로 결과로 갑니다.
- **건너뛰기** 버튼이나 Esc로 바로 넘어갈 수 있습니다.
- 기기의 **동작 줄이기**(`prefers-reduced-motion`)가 켜져 있으면 애니메이션 없이 바로 결과로 갑니다. 이때 카드 등장 같은 다른 움직임도 꺼집니다.
- 시간 조절: `TRIP.DRAW_MS`(경로) · `ZOOM_MS`(확대) · `HOLD_MS`(멈춤) · `FADE_MS`(사라짐)
- 지도 데이터 출처: [world-atlas](https://github.com/topojson/world-atlas) (Natural Earth, 퍼블릭 도메인). 라이브러리 d3-array · d3-geo · topojson-client는 ISC 라이선스이며 각 파일 첫 줄에 저작권 표시가 있습니다.

## 정확한 위치 기반 자동 추천 (`js/nearby.js`)
1. **위치 찾기**를 누르면 고정밀 GPS(`enableHighAccuracy`)로 좌표를 받고, 위치 카드에 **정확도 ±m**를 보여 줍니다 (100m보다 크면 주의 문구).
2. OpenStreetMap **Overpass API**(키 없음)로 반경 **50m** 안의 `amenity` · `shop` · `tourism` · `railway` 장소를 찾습니다.
   좌표는 POST 본문으로만 보내고, 페이지를 열 때 자동으로는 보내지 않습니다 (버튼을 눌렀을 때만).
3. 가까운 순 **3곳**을 "지금 여기 계신가요?"로 보여 주고, 고르면
   `data/tag-map.json`이 태그(예: `cuisine=french`, `shop=bakery`, `railway=station`)를 장소 유형·키워드로 바꿔 **바로 추천**합니다.
4. Overpass가 **5초** 안에 응답이 없거나 실패하면(또는 결과가 없으면) `data/spots.json`에서 반경 **200m** 안의 명소를 찾고,
   그것도 없으면 장소 유형을 직접 고르도록 안내합니다.
5. **설정 → 위치 시뮬레이션**에서 시연용 좌표(파리 달팽이 요리 식당, 도쿄 시부야역, 뉴욕 베이글 가게 등)를 고르면
   GPS 대신 그 좌표로 위의 과정을 그대로 실행합니다. 화면 언어와 같은 나라의 장소는 목록에서 빠집니다.

`tag-map.json` 규칙: `placeTypes`는 위에서부터 처음 맞는 하나가 장소 유형을 정하고, `modifiers`는 맞는 것 모두가 키워드·설명을 더합니다.
태그 형식은 `key=value`, 값 여러 개는 `a|b`, 아무 값이나는 `key=*`입니다.
`spots.json`의 좌표는 직접 찾아 넣은 근삿값이니 시연 전에 지도에서 한 번 확인해 주세요.
캠퍼스처럼 넓은 곳은 `"radius": 400`처럼 명소마다 검색 반경(m)을 따로 줄 수 있습니다 (없으면 200m).
예: 중부대학교 고양캠퍼스 (경기 고양시 덕양구 동헌로 305, OSM `amenity=university`, 반경 400m)

## 저장한 표현 지도 보기 (`js/savedmap.js`)
- '저장한 표현' 위쪽의 **목록 | 지도** 버튼으로 전환합니다 (마지막 선택을 기억).
- 저장한 표현이 있는 도시마다 핀이 찍히고, 핀 안의 숫자와 크기가 저장 개수를 나타냅니다.
- 핀을 누르면(키보드는 Tab → Enter) 그 도시에서 저장한 표현 목록이 지도 아래에 열립니다. 처음에는 가장 최근에 저장한 도시가 열려 있습니다.
- 가까운 도시(파리·바르셀로나·마드리드 등)는 핀이 겹치지 않게 살짝 떼어 놓고, 실제 위치는 점선으로 이어 줍니다.
- 표현을 저장할 때 도시 이름·좌표 사본(`city`)도 같이 저장합니다. 예전에 저장한 항목은 `cities.json`에서 좌표를 찾습니다.
- 도시 없이 저장한 표현은 지도에 핀이 없고, 목록 보기에서 볼 수 있다고 안내합니다.

## 위치 규칙
- Geolocation 좌표와 `cities.json` 각 도시의 거리(하버사인 공식)를 계산해 가장 가까운 도시 선택
- 가장 가까운 도시가 100km보다 멀면 주황색 안내와 함께 직접 선택 칸을 열어 줌
- 고른 도시는 기억하고, 위치 권한이 이미 허용돼 있으면 열 때 자동으로 위치 찾기

## localStorage 키

| 키 | 내용 |
|---|---|
| `traveltalk.saved` | 저장한 표현 목록 |
| `traveltalk.cityId` | 마지막으로 고른 도시 |
| `traveltalk.settings` | 읽기 속도, 한글 발음 표시 |
| `traveltalk.simLocation` | 위치 시뮬레이션으로 고른 장소 id (`spots.json`) |
| `traveltalk.savedView` | 저장한 표현 보기 방식 (`list` / `map`) |
| `traveltalk.uiLang` | 화면 언어 (`ko` / `en`). 없으면 브라우저 언어로 정함 |

## 화면 언어 (`js/i18n.js`)
- 고정 문구는 HTML에 `data-i18n="키"`로 표시하고, 문구는 `I18N.ko` / `I18N.en` 사전에 있습니다.
- JS에서는 `t("키")`, 값이 들어가는 문구는 `t("more.left", { n: 3 })`처럼 씁니다.
- 새 문구를 추가할 때는 **ko와 en에 같은 키를 함께** 넣어 주세요.
- 처음 접속하면 브라우저 언어가 한국어(`ko…`)면 한국어, 그 외에는 English로 시작합니다.
- 영어로 입력한 상황도 추천되도록 `recommend.js`의 `EN_KEYWORDS`가 영어 단어를 한국어 키워드로 바꿔 줍니다.

---

## 휴대폰에서 테스트하기

휴대폰 브라우저는 **https** 주소에서만 위치 기능을 허용합니다.
같은 와이파이에서 `http://192.168.x.x:5500`으로 열면 위치 찾기가 막히므로(직접 선택은 가능),
위치까지 확인하려면 GitHub Pages 같은 https 주소에 올려서 여는 것을 권장합니다.

### 휴대폰 점검 목록
- [ ] **위치 허용** → 지원 도시 근처라면 그 도시. 한국에서 한국어 화면이면 한국이 숨겨지므로 "멀리 떨어져 있어요" 안내와 후쿠오카, English 화면이면 서울/부산
- [ ] 설정에서 한국어 ↔ English를 바꾸면 언어 칩·국가 목록에서 각각 한국/미국이 빠지는지
- [ ] **위치 거부** → 안내 문구와 국가·도시 선택 칸이 보임
- [ ] 국가·도시를 고르면 언어가 자동으로 바뀜
- [ ] 장소 선택 + 상황 입력 → 표현 3~5개
- [ ] 엉뚱한 상황 입력(예: "강아지") → 주황 안내 + 영어 도움 문장 + 기본 표현
- [ ] 다른 표현 보기 → 겹치지 않는 표현, 끝까지 보면 처음부터
- [ ] 🔊 → 현지어 목소리로 읽음 (설정 → 기기 음성에서 "있음/없음" 확인)
- [ ] 🔖 저장 → 저장 탭 배지 숫자 증가, 국가·도시·장소별로 묶여 보임
- [ ] 앱을 닫았다 다시 열어도 저장한 표현과 도시가 남아 있음
- [ ] 삭제 → 되돌리기
- [ ] 설정: 느리게 읽기, 한글 발음 끄기, 모두 지우기
- [ ] 화면이 좁아도 글자가 잘리거나 겹치지 않음, 하단 탭이 표현 카드를 가리지 않음

---

## 알려진 한계
- 현지어 문장과 한글 발음은 원어민 검수 전입니다. 발표·배포 전 확인을 권장합니다.
- 키워드 일치 방식이라 문장의 뜻까지 이해하지는 못합니다. (예: "포장 주문"에서 `포장`과 `주문` 표현이 같은 점수)
- 발음 듣기는 기기에 설치된 목소리에 따라 품질이 다르고, 목소리가 없으면 기본 목소리로 읽습니다.
- 예시 문장의 이름(Kim)과 지명(Lyon, 新宿 등)은 상황에 맞게 바꿔 말해야 합니다.
