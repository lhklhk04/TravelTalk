/* =========================================================
   TravelTalk — 화면 언어 (ko / en)

   사용법
   - HTML:  <span data-i18n="tab.home">홈</span>
            data-i18n-placeholder / data-i18n-aria-label / data-i18n-title 도 지원
   - JS:    t("toast.saved")  /  t("more.left", { n: 3 })   ← {n} 자리에 값이 들어감
   - 새 문구를 추가할 때는 ko와 en에 같은 키를 함께 넣어 주세요.
     en에 없으면 ko 문구가, 둘 다 없으면 키 이름이 그대로 보여요.
   ========================================================= */
const UI_LANG_KEY = "traveltalk.uiLang";
const UI_LANGS = ["ko", "en"];

const I18N = {
  ko: {
    "app.title": "TravelTalk — 지금 여기서 바로 쓰는 여행 표현",
    "app.tagline": "지금 있는 곳에서 바로 말할 수 있는 한마디",

    // 하단 탭
    "tab.aria": "주요 메뉴",
    "tab.home": "홈",
    "tab.saved": "저장한 표현",
    "tab.settings": "설정",

    // 언어·장소 이름
    "lang.fr": "프랑스어",
    "lang.ja": "일본어",
    "lang.es": "스페인어",
    "lang.ko": "한국어",
    "lang.en": "영어",
    "place.restaurant": "식당",
    "place.cafe": "카페",
    "place.shop": "상점",
    "place.transport": "교통",
    "place.hotel": "숙소",
    "place.sight": "관광지",

    // 홈: 위치
    "loc.title": "현재 위치",
    "loc.notChecked": "아직 확인 전이에요",
    "loc.locating": "위치 확인 중…",
    "loc.chooseManually": "직접 골라 주세요",
    "loc.find": "위치 찾기",
    "loc.findAgain": "다시 찾기",
    "loc.manual": "직접 고르기",
    "loc.country": "국가",
    "loc.city": "도시",
    "loc.selectCountry": "국가 선택",
    "loc.selectCity": "도시 선택",
    "loc.note.auto": "현재 위치 기준으로 자동 선택했어요 (약 {km}km).",
    "loc.note.far": "지원 도시와 약 {km}km 떨어져 있어요. 가장 가까운 {city}로 골랐어요. 다르면 직접 골라 주세요.",
    "loc.note.manual": "직접 선택한 도시예요.",
    "loc.note.restored": "지난번에 고른 도시예요. 위치를 다시 찾으려면 '위치 찾기'를 누르세요.",
    "loc.err.unsupported": "이 브라우저는 위치 기능을 지원하지 않아요. 국가와 도시를 직접 골라 주세요.",
    "loc.err.denied": "위치 권한이 거부됐어요. 국가와 도시를 직접 골라 주세요.",
    "loc.err.unavailable": "위치를 찾을 수 없어요. 국가와 도시를 직접 골라 주세요.",
    "loc.err.timeout": "위치 확인 시간이 초과됐어요. 다시 시도하거나 직접 골라 주세요.",
    "loc.err.unknown": "위치를 확인하지 못했어요. 직접 골라 주세요.",
    "loc.err.noCities": "도시 데이터를 불러오지 못했어요.",

    // 홈: 입력
    "home.language": "언어",
    "home.place": "어디에 있나요?",
    "home.situation": "어떤 상황인가요?",
    "home.optional": "(선택)",
    "home.situationPlaceholder": "예: 채식 메뉴가 있는지 묻고 싶어요",
    "home.keywordsAria": "자주 쓰는 키워드",
    "kw.order": "주문",
    "kw.recommend": "추천",
    "kw.vegetarian": "채식",
    "kw.directions": "길",
    "kw.discount": "할인",
    "kw.reservation": "예약",
    "home.submit": "표현 추천받기",
    "hint.loading": "표현 데이터를 불러오는 중…",
    "hint.chooseBoth": "언어와 장소를 골라 주세요",
    "hint.chooseLang": "언어를 골라 주세요",
    "hint.choosePlace": "장소를 골라 주세요",
    "error.data": "데이터를 불러오지 못했어요. data 폴더를 확인해 주세요.",

    // 결과
    "result.title": "추천 표현",
    "result.back": "홈으로",
    "result.contextAria": "추천 조건",
    "result.fallback": "입력한 상황에 딱 맞는 표현을 찾지 못했어요. 이 장소의 기본 표현을 보여 드릴게요. 막히면 영어로 이렇게 물어보세요.",
    "result.fallbackPlain": "입력한 상황에 딱 맞는 표현을 찾지 못했어요. 이 장소의 기본 표현을 보여 드릴게요.",
    "result.more": "↻ 다른 표현 보기",
    "more.left": "아직 안 본 표현 {n}개",
    "more.done": "다 봤어요. 한 번 더 누르면 처음부터 보여 드려요.",
    "rank.keyword": "‘{kw}’ 관련",
    "rank.related": "관련 표현",
    "rank.basic": "기본 표현",
    "rank.more": "더 보기",
    "card.dialogue": "대화 예시 보기",
    "card.englishNote": "영어로 이렇게 확인할 수 있어요",
    "card.english": "🇬🇧 영어로 확인하기",
    "card.save": "🔖 저장",
    "card.saved": "✓ 저장됨",
    "card.listen": "발음 듣기",
    "speaker.me": "나",
    "speaker.staff": "직원",

    // 저장한 표현
    "saved.title": "저장한 표현",
    "saved.count": "{n}개",
    "saved.empty1": "아직 저장한 표현이 없어요.",
    "saved.empty2": "추천 결과에서 🔖 저장을 눌러 보세요.",
    "saved.goHome": "표현 추천받으러 가기",
    "saved.noCity": "도시 미지정",
    "saved.otherCountry": "기타",
    "saved.delete": "삭제",
    "saved.deleteAria": "{name} 삭제",

    // 설정
    "settings.title": "설정",
    "settings.uiLangGroup": "언어",
    "settings.uiLang": "서비스 언어",
    "settings.speech": "발음",
    "settings.rate": "읽기 속도",
    "settings.rateSlow": "느리게",
    "settings.rateNormal": "보통",
    "settings.showPron": "한글 발음 표시",
    "settings.showPronHelp": "끄면 현지어 문장만 보고 연습할 수 있어요",
    "settings.voices": "기기 음성",
    "settings.voicesHelp": "목소리가 없으면 기본 목소리로 읽어요",
    "settings.voiceOk": "있음",
    "settings.voiceMissing": "없음",
    "settings.speechUnsupported": "이 브라우저는 발음 듣기를 지원하지 않아요",
    "settings.data": "내 데이터",
    "settings.savedPhrases": "저장한 표현",
    "settings.clearAll": "모두 지우기",
    "settings.city": "기억한 도시",
    "settings.none": "없음",
    "settings.clear": "지우기",
    "settings.about": "정보",
    "settings.info": "TravelTalk MVP · PBL1 1조\n표현 {phrases}개 · 도시 {cities}개 · 데이터: {source}",
    "settings.sourceJson": "JSON 파일",
    "settings.sourceJs": "JS 사본",

    // 알림
    "toast.allSeen": "모든 표현을 다 봤어요. 처음부터 다시 보여 드릴게요.",
    "toast.saved": "저장했어요. ‘저장한 표현’ 탭에서 볼 수 있어요.",
    "toast.unsaved": "저장을 취소했어요.",
    "toast.deleted": "삭제했어요.",
    "toast.undo": "되돌리기",
    "toast.speechUnsupported": "이 브라우저는 발음 듣기를 지원하지 않아요.",
    "toast.noVoice": "기기에 {lang} 음성이 없어서 기본 목소리로 읽어요.",
    "toast.clearedSaved": "저장한 표현을 모두 지웠어요.",
    "toast.clearedCity": "기억한 도시를 지웠어요.",
    "confirm.clearSaved": "저장한 표현 {n}개를 모두 지울까요?\n지운 뒤에는 되돌릴 수 없어요.",
  },

  en: {
    "app.title": "TravelTalk — Travel phrases for right where you are",
    "app.tagline": "The right phrase for right where you are",

    "tab.aria": "Main menu",
    "tab.home": "Home",
    "tab.saved": "Saved",
    "tab.settings": "Settings",

    "lang.fr": "French",
    "lang.ja": "Japanese",
    "lang.es": "Spanish",
    "lang.ko": "Korean",
    "lang.en": "English",
    "place.restaurant": "Restaurant",
    "place.cafe": "Café",
    "place.shop": "Shop",
    "place.transport": "Transport",
    "place.hotel": "Hotel",
    "place.sight": "Sights",

    "loc.title": "Current location",
    "loc.notChecked": "Not checked yet",
    "loc.locating": "Finding your location…",
    "loc.chooseManually": "Please choose manually",
    "loc.find": "Find location",
    "loc.findAgain": "Find again",
    "loc.manual": "Choose manually",
    "loc.country": "Country",
    "loc.city": "City",
    "loc.selectCountry": "Select country",
    "loc.selectCity": "Select city",
    "loc.note.auto": "Selected automatically from your location (about {km} km).",
    "loc.note.far": "You're about {km} km from the nearest supported city, so we picked {city}. Choose manually if that's not right.",
    "loc.note.manual": "You chose this city.",
    "loc.note.restored": "This is the city you chose last time. Tap “Find location” to check again.",
    "loc.err.unsupported": "This browser doesn't support location. Please choose a country and city.",
    "loc.err.denied": "Location permission was denied. Please choose a country and city.",
    "loc.err.unavailable": "We couldn't find your location. Please choose a country and city.",
    "loc.err.timeout": "Finding your location took too long. Try again or choose manually.",
    "loc.err.unknown": "We couldn't check your location. Please choose manually.",
    "loc.err.noCities": "Couldn't load the city data.",

    "home.language": "Language",
    "home.place": "Where are you?",
    "home.situation": "What's the situation?",
    "home.optional": "(optional)",
    "home.situationPlaceholder": "e.g. I want to ask if they have vegetarian food",
    "home.keywordsAria": "Common keywords",
    "kw.order": "order",
    "kw.recommend": "recommend",
    "kw.vegetarian": "vegetarian",
    "kw.directions": "directions",
    "kw.discount": "discount",
    "kw.reservation": "reservation",
    "home.submit": "Get phrases",
    "hint.loading": "Loading phrases…",
    "hint.chooseBoth": "Choose a language and a place",
    "hint.chooseLang": "Choose a language",
    "hint.choosePlace": "Choose a place",
    "error.data": "Couldn't load the data. Please check the data folder.",

    "result.title": "Suggested phrases",
    "result.back": "Back to home",
    "result.contextAria": "Your request",
    "result.fallback": "We couldn't find a phrase that matches exactly, so here are the basics for this place. If you get stuck, try asking in English like this.",
    "result.fallbackPlain": "We couldn't find a phrase that matches exactly, so here are the basics for this place.",
    "result.more": "↻ Show other phrases",
    "more.left": "{n} more to see",
    "more.done": "That's all of them. Tap again to start over.",
    "rank.keyword": "Matches “{kw}”",
    "rank.related": "Matches your request",
    "rank.basic": "Basic",
    "rank.more": "More",
    "card.dialogue": "Show example dialogue",
    "card.englishNote": "You can check in English like this",
    "card.english": "🇬🇧 Check in English",
    "card.save": "🔖 Save",
    "card.saved": "✓ Saved",
    "card.listen": "Play pronunciation",
    "speaker.me": "Me",
    "speaker.staff": "Staff",

    "saved.title": "Saved phrases",
    "saved.count": "{n}",
    "saved.empty1": "You haven't saved any phrases yet.",
    "saved.empty2": "Tap 🔖 Save on a suggested phrase.",
    "saved.goHome": "Find phrases",
    "saved.noCity": "No city",
    "saved.otherCountry": "Other",
    "saved.delete": "Delete",
    "saved.deleteAria": "Delete {name}",

    "settings.title": "Settings",
    "settings.uiLangGroup": "Language",
    "settings.uiLang": "App language",
    "settings.speech": "Pronunciation",
    "settings.rate": "Speech speed",
    "settings.rateSlow": "Slow",
    "settings.rateNormal": "Normal",
    "settings.showPron": "Show pronunciation guide",
    "settings.showPronHelp": "Turn off to practice with the original sentence only",
    "settings.voices": "Device voices",
    "settings.voicesHelp": "If a voice is missing, the default voice is used",
    "settings.voiceOk": "Available",
    "settings.voiceMissing": "Not installed",
    "settings.speechUnsupported": "This browser can't play pronunciation",
    "settings.data": "My data",
    "settings.savedPhrases": "Saved phrases",
    "settings.clearAll": "Clear all",
    "settings.city": "Remembered city",
    "settings.none": "None",
    "settings.clear": "Clear",
    "settings.about": "About",
    "settings.info": "TravelTalk MVP · PBL1 Team 1\n{phrases} phrases · {cities} cities · Data: {source}",
    "settings.sourceJson": "JSON file",
    "settings.sourceJs": "JS copy",

    "toast.allSeen": "You've seen them all. Starting over from the top.",
    "toast.saved": "Saved. You can find it in the Saved tab.",
    "toast.unsaved": "Removed from saved.",
    "toast.deleted": "Deleted.",
    "toast.undo": "Undo",
    "toast.speechUnsupported": "This browser can't play pronunciation.",
    "toast.noVoice": "No {lang} voice on this device, so the default voice is used.",
    "toast.clearedSaved": "All saved phrases were cleared.",
    "toast.clearedCity": "The remembered city was cleared.",
    "confirm.clearSaved": "Clear all {n} saved phrases?\nThis can't be undone.",
  },
};

let uiLang = detectUiLang();

// 저장된 값 → 없으면 브라우저 언어(ko로 시작하면 한국어, 그 외 영어)
function detectUiLang() {
  const saved = localStorage.getItem(UI_LANG_KEY);
  if (UI_LANGS.includes(saved)) return saved;
  const browser = (navigator.languages?.[0] || navigator.language || "ko").toLowerCase();
  return browser.startsWith("ko") ? "ko" : "en";
}

function t(key, vars = {}) {
  const text = I18N[uiLang]?.[key] ?? I18N.ko[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => (name in vars ? vars[name] : `{${name}}`));
}

// data-i18n* 속성이 붙은 요소에 현재 언어 문구 넣기
function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  root.querySelectorAll("[data-i18n-aria-label]").forEach((node) => { node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel)); });
  root.querySelectorAll("[data-i18n-title]").forEach((node) => { node.title = t(node.dataset.i18nTitle); });
  document.documentElement.lang = uiLang;
  document.title = t("app.title");
}

function setUiLang(lang) {
  if (!UI_LANGS.includes(lang)) return;
  uiLang = lang;
  localStorage.setItem(UI_LANG_KEY, lang);
  applyI18n();
}
