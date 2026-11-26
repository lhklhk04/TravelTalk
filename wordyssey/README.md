# TravelTalk

> 지금 있는 곳에서 바로 말할 수 있는 한마디 — 위치 기반 여행 표현 추천 웹앱 (PBL1 1조 MVP)

영어 기초는 되지만 현지어는 모르는 20~30대 초보 여행자를 위해,
지금 있는 **도시**와 **장소**(식당·카페·상점·교통·숙소·관광지)에 맞는 현지어 표현 3~5개를 추천합니다.
지원 여행지 언어는 🇫🇷 프랑스어 · 🇯🇵 일본어 · 🇪🇸 스페인어 · 🇰🇷 한국어 · 🇺🇸 영어이고,
앱 화면은 한국어/English로 볼 수 있습니다.
화면 언어와 같은 언어의 여행지는 숨깁니다 (한국어 화면에서는 한국, English 화면에서는 미국이 목록·언어 선택·위치 찾기에서 빠짐).

- HTML / CSS / Vanilla JS만 사용 (서버·외부 API·API 키 없음)
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
data/
  phrases.json        ✏️ 표현 데이터 (원본, 직접 수정)
  cities.json         ✏️ 도시 좌표 (원본, 직접 수정)
  phrases.js          ⚙️ 자동 생성 사본 — 직접 수정 금지
  cities.js           ⚙️ 자동 생성 사본 — 직접 수정 금지
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
