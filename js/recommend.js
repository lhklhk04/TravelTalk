/* =========================================================
   TravelTalk — 규칙 기반 추천 (API 없이 키워드 점수)

   점수 규칙
   - 상황 입력에 표현의 keywords가 들어 있으면       +3 (예: "주문하고 싶어요" ⊃ "주문")
   - 입력 단어가 keywords의 일부와 겹치면            +2 (예: "케이크" ↔ "케이크")
   - 입력 단어가 표현의 뜻·사용 상황에 들어 있으면   +1
   정렬: 점수 높은 순 → 기본 표현(basic) 먼저 → 데이터 순서
   ========================================================= */

// 장소별 "영어로 도움 요청" 문장 (맞는 표현이 없을 때)
const PLACE_HELP = {
  restaurant: { en: "Excuse me, do you speak English? I need some help with the menu.", ko: "실례합니다, 영어 하실 수 있나요? 메뉴 관련해서 도움이 필요해요." },
  cafe:       { en: "Excuse me, do you speak English? I'd like to order.",                ko: "실례합니다, 영어 하실 수 있나요? 주문하고 싶어요." },
  shop:       { en: "Excuse me, do you speak English? I have a question about this.",     ko: "실례합니다, 영어 하실 수 있나요? 이것에 대해 물어볼 게 있어요." },
  transport:  { en: "Excuse me, do you speak English? I'm trying to get here.",           ko: "실례합니다, 영어 하실 수 있나요? 여기로 가려고 해요." },
  hotel:      { en: "Excuse me, do you speak English? I need some help with my room.",    ko: "실례합니다, 영어 하실 수 있나요? 방 관련해서 도움이 필요해요." },
  sight:      { en: "Excuse me, do you speak English? I have a question about the visit.", ko: "실례합니다, 영어 하실 수 있나요? 관람 관련해서 물어볼 게 있어요." },
};

// 영어로 입력한 상황도 찾을 수 있도록: 영어 단어 → 데이터의 한국어 키워드
// (화면 언어가 English일 때 키워드 칩도 이 단어들을 넣어요)
const EN_KEYWORDS = {
  "order": "주문", "menu": "메뉴", "recommend": "추천", "recommendation": "추천", "popular": "인기",
  "vegetarian": "채식", "vegan": "비건", "meat": "고기", "allergy": "알레르기",
  "table": "자리", "seat": "자리", "bill": "계산", "pay": "결제", "payment": "결제", "card": "카드",
  "water": "물", "toilet": "화장실", "restroom": "화장실", "bathroom": "화장실",
  "reservation": "예약", "reserve": "예약", "booking": "예약", "book": "예약",
  "coffee": "커피", "latte": "라떼", "milk": "우유", "espresso": "에스프레소", "soy": "두유", "oat": "귀리",
  "takeout": "포장", "take out": "포장", "to go": "포장", "here": "여기서",
  "wifi": "와이파이", "wi-fi": "와이파이", "internet": "인터넷", "password": "비밀번호",
  "dessert": "디저트", "cake": "케이크", "bread": "빵",
  "price": "가격", "how much": "얼마", "discount": "할인", "sale": "세일",
  "size": "사이즈", "try on": "입어", "clothes": "옷", "tax": "면세", "refund": "환급", "bag": "봉투",
  "buy": "구매", "just looking": "구경", "browse": "구경",
  "directions": "길", "direction": "길", "lost": "길", "way": "길", "where": "어디",
  "station": "역", "train": "기차", "subway": "지하철", "metro": "메트로", "bus": "버스",
  "ticket": "표", "taxi": "택시", "address": "주소", "get off": "내리", "platform": "승강장", "next": "다음",
  "check in": "체크인", "check-in": "체크인", "check out": "체크아웃", "check-out": "체크아웃",
  "luggage": "짐", "baggage": "짐", "breakfast": "조식", "towel": "수건",
  "entrance": "입장", "admission": "입장료", "student": "학생",
  "photo": "사진", "picture": "사진", "open": "영업", "hours": "시간", "time": "시간",
  "guide": "가이드", "english": "영어", "audio": "오디오",
};

// 입력에 들어 있는 영어 단어를 찾아 한국어 키워드를 덧붙임 ("vegetarian menu" → "... 채식 메뉴")
function expandEnglish(text) {
  const lower = (text || "").toLowerCase();
  if (!/[a-z]/.test(lower)) return text || "";
  const extra = [];
  for (const [en, ko] of Object.entries(EN_KEYWORDS)) {
    const pattern = new RegExp(`(^|[^a-z])${en.replace(/[-\s]/g, "[-\\s]?")}s?([^a-z]|$)`);
    if (pattern.test(lower)) extra.push(ko);
  }
  return extra.length ? `${text} ${extra.join(" ")}` : text;
}

// 단어 끝의 조사·어미를 떼어 비교하기 쉽게 (아주 단순한 규칙)
const ENDINGS = /(에서|으로|에게|까지|부터|하고|이랑|싶어요|싶은데|있나요|있어요|해요|예요|이에요|인가요|을|를|이|가|은|는|에|로|도|요|좀)$/;

function normalizeText(text) {
  return (text || "").toLowerCase().replace(/[.,!?~"'()]/g, " ").trim();
}

function tokenize(text) {
  return normalizeText(text)
    .split(/\s+/)
    .map((w) => w.replace(ENDINGS, ""))
    .filter((w) => w.length >= 2);
}

function scorePhrase(phrase, text, tokens) {
  let score = 0;
  const matched = [];

  for (const kw of phrase.keywords) {
    if (text.includes(kw)) {
      score += 3;
      matched.push(kw);
    }
  }
  const body = `${phrase.meaning_ko} ${phrase.situation}`;
  for (const t of tokens) {
    if (matched.some((kw) => t.includes(kw))) continue; // 이미 +3 받은 단어는 건너뜀
    if (phrase.keywords.some((kw) => kw.includes(t) || t.includes(kw))) score += 2;
    else if (body.includes(t)) score += 1;
  }
  return { score, matched };
}

/**
 * @param {Array} pool      선택한 언어·장소의 표현 목록
 * @param {string} situation 상황 입력
 * @returns {{ mode: "none"|"match"|"fallback", ranked: Array, matchedCount: number, firstPageSize: number }}
 *   mode  none     = 상황 입력 없음 → 기본 표현 먼저
 *         match    = 키워드가 맞는 표현 있음
 *         fallback = 입력은 했지만 맞는 표현 없음 → 기본 표현 + 영어 확인 문장
 */
function recommend(pool, situation) {
  const expanded = expandEnglish(situation);
  const text = normalizeText(expanded);
  const tokens = tokenize(expanded);

  const scored = pool.map((phrase, index) => ({
    phrase,
    index,
    ...(text ? scorePhrase(phrase, text, tokens) : { score: 0, matched: [] }),
  }));

  scored.sort((a, b) =>
    b.score - a.score ||
    Number(b.phrase.basic) - Number(a.phrase.basic) ||
    a.index - b.index
  );

  const matchedCount = scored.filter((s) => s.score > 0).length;
  const basicCount = pool.filter((p) => p.basic).length;

  let mode, firstPageSize;
  if (!text) {
    mode = "none";
    firstPageSize = 4;
  } else if (matchedCount === 0) {
    mode = "fallback";
    firstPageSize = Math.min(5, Math.max(3, basicCount));
  } else {
    mode = "match";
    firstPageSize = Math.min(5, Math.max(3, matchedCount)); // 3~5개
  }

  return { mode, ranked: scored, matchedCount, firstPageSize };
}
