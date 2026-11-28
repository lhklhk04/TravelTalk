/* =========================================================
   TravelTalk — 화면과 사용자 동작 (UI)
   - 데이터 불러오기, 화면 전환
   - 위치 → 가까운 도시 → 언어 자동 선택
   - 추천 결과 카드, 저장한 표현, 설정
   화면 문구는 i18n.js(t 함수), 추천 점수는 recommend.js,
   저장은 storage.js, 발음은 speech.js에 있어요.
   ========================================================= */

const PLACE_ORDER = ["restaurant", "cafe", "shop", "transport", "hotel", "sight"];
const PLACE_ICON = { restaurant: "🍽️", cafe: "☕", shop: "🛍️", transport: "🚆", hotel: "🏨", sight: "🏛️" };
const LANG_FLAG = { fr: "🇫🇷", ja: "🇯🇵", es: "🇪🇸", ko: "🇰🇷", en: "🇺🇸" };

// 화면 언어와 같은 언어의 여행지는 숨김 (한국어 화면 → 한국 숨김, English 화면 → 미국 숨김)
const isVisibleLang = (lang) => lang !== uiLang;
const visibleCities = () => db.cities.filter((c) => isVisibleLang(c.language));

// 이름 표시 (화면 언어에 따라)
const langName = (lang) => t(`lang.${lang}`);
const placeName = (place) => t(`place.${place}`);
const cityName = (city) => (uiLang === "en" ? city.name_en || city.name_ko : city.name_ko);
const countryName = (city) => (uiLang === "en" ? city.country_en || city.country_ko : city.country_ko);
const cityLabel = (city) => `${cityName(city)}, ${countryName(city)}`;

// 표현 데이터에서 화면 언어에 맞는 필드 고르기
//   localized(p, "meaning")       → en: meaning_en       / ko: meaning_ko
//   localized(p, "pronunciation") → en: pronunciation_en / ko: pronunciation_ko
//   localized(p, "situation")     → en: situation_en     / ko: situation
// 영어 필드가 비어 있으면 한국어 필드로 대신 보여 줌
function localized(obj, field) {
  if (uiLang === "en" && obj[`${field}_en`]) return obj[`${field}_en`];
  return obj[`${field}_ko`] ?? obj[field] ?? "";
}

// 홈 화면 입력 상태
const state = {
  city: null,       // cities.json의 도시 객체
  language: null,   // "fr" | "ja" | "es"
  placeType: null,  // "restaurant" | ...
  situation: "",
  spot: null,       // "지금 여기 계신가요?"에서 고른 장소 { name, placeType, keywords, info } (nearby.js)
  loadError: false,
  // 위치 카드 표시 상태: idle(확인 전) | locating | failed | set
  loc: { status: "idle", located: false, note: null }, // note = { key, vars, warn }
};

// 불러온 데이터
const db = {
  phrases: [],
  cities: [],
  source: null, // "json" | "js"
};

/* ---------- 데이터 불러오기 ----------
   1) data/*.json을 fetch (Live Server 등 서버로 열었을 때)
   2) 실패하면 data/*.js 사본 사용 (index.html을 더블클릭해 file://로 열었을 때) */
async function loadData() {
  try {
    // no-cache: JSON을 고친 뒤 새로고침하면 브라우저에 남은 옛 파일 대신 새 파일을 읽음
    const getJson = (url) =>
      fetch(url, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    const [phrases, cities, tagMap, spots] = await Promise.all([
      getJson("data/phrases.json"), getJson("data/cities.json"),
      getJson("data/tag-map.json"), getJson("data/spots.json"),
    ]);
    Object.assign(db, { phrases, cities, tagMap, spots, source: "json" });
  } catch (err) {
    const copy = window.TRAVELTALK_DATA || {};
    if (!copy.phrases || !copy.cities) throw new Error("data not found");
    Object.assign(db, {
      phrases: copy.phrases, cities: copy.cities,
      tagMap: copy.tagMap || null, spots: copy.spots || [], source: "js",
    });
  }
  console.info(`[TravelTalk] phrases ${db.phrases.length}, cities ${db.cities.length} (${db.source})`);
}

// 선택한 언어·장소의 표현 목록
function phrasesFor(language, placeType) {
  return db.phrases.filter((p) => p.language === language && p.placeType === placeType);
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 태그·클래스·텍스트로 요소 만들기 (textContent라 HTML이 섞여도 안전)
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/* ---------- 화면 전환 ---------- */
function showScreen(name) {
  stopSpeaking();
  if (name === "saved") renderSaved();
  if (name === "settings") renderSettings();

  $$(".screen").forEach((node) => {
    const on = node.dataset.screen === name;
    node.hidden = !on;
    node.classList.toggle("is-active", on);
  });

  // 결과 화면은 홈 탭에 속한 화면으로 취급
  const tabName = name === "result" ? "home" : name;
  $$(".tab").forEach((tab) => {
    const on = tab.dataset.tab === tabName;
    tab.classList.toggle("is-active", on);
    if (on) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });

  window.scrollTo(0, 0);
}

/* =========================================================
   위치: Geolocation → 가장 가까운 도시 → 국가·언어 자동 선택
   ========================================================= */
const CITY_KEY = "traveltalk.cityId";   // 마지막으로 고른 도시 기억
const FAR_KM = 100;                      // 이보다 멀면 "지원 도시와 멀다"고 안내

// 두 좌표 사이 거리(km) — 하버사인 공식
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function findNearestCity(lat, lng) {
  let best = null;
  for (const city of visibleCities()) {
    const km = distanceKm(lat, lng, city.lat, city.lng);
    if (!best || km < best.km) best = { city, km };
  }
  return best;
}

// 위치 카드 그리기 (화면 언어가 바뀌면 다시 호출)
function renderLocation() {
  const { status, located, note } = state.loc;
  let cityText;
  if (status === "locating") cityText = t("loc.locating");
  else if (state.city) cityText = cityLabel(state.city);
  else if (status === "failed") cityText = t("loc.chooseManually");
  else cityText = t("loc.notChecked");
  $("#location-city").textContent = cityText;

  $("#btn-locate").textContent = t(located ? "loc.findAgain" : "loc.find");

  const noteEl = $("#location-note");
  const vars = { ...(note?.vars || {}), city: state.city ? cityName(state.city) : "" };
  noteEl.textContent = note ? t(note.key, vars) : "";
  noteEl.classList.toggle("is-warn", Boolean(note?.warn));

  // 위치 정확도 (± 미터) + 시뮬레이션 표시
  const acc = $("#location-accuracy");
  const showAcc = status === "set" && state.loc.accuracy != null;
  acc.hidden = !showAcc;
  if (showAcc) {
    const low = state.loc.accuracy > 100;
    acc.replaceChildren(el("span", null, t("loc.accuracy", { m: state.loc.accuracy.toLocaleString() })));
    if (state.loc.simulated) acc.append(el("span", "sim-badge", t("loc.simBadge")));
    if (low) acc.append(el("span", "acc-low", t("loc.accuracyLow")));
    acc.classList.toggle("is-warn", low);
  }
}

function setLocationNote(key, vars = {}, warn = false) {
  state.loc.note = key ? { key, vars, warn } : null;
  renderLocation();
}

// 도시 확정 → 화면 표시 + 언어 자동 선택 + 저장
function setCity(city, noteKey, noteVars = {}, warn = false) {
  state.city = city;
  state.loc.status = "set";
  selectLanguage(city.language);
  syncManualPicker(city);
  localStorage.setItem(CITY_KEY, city.id);
  setLocationNote(noteKey, noteVars, warn);
}

// withPlaces: 좌표를 받은 뒤 주변 장소(Overpass)까지 찾을지 — '위치 찾기' 버튼을 누를 때만 true
function locate({ withPlaces = true } = {}) {
  // 설정의 '위치 시뮬레이션'이 켜져 있으면 GPS 대신 그 좌표
  const sim = getSimSpot();
  if (sim) {
    onPosition({ latitude: sim.lat, longitude: sim.lng, accuracy: NEARBY.SIM_ACCURACY_M }, { simulated: true, withPlaces });
    return;
  }
  if (!("geolocation" in navigator)) {
    onLocateFail("loc.err.unsupported");
    return;
  }

  $(".location-card").classList.add("is-loading");
  $("#btn-locate").disabled = true;
  state.loc.status = "locating";
  setLocationNote(null);

  navigator.geolocation.getCurrentPosition(
    (pos) => onPosition(pos.coords, { simulated: false, withPlaces }),
    (err) => {
      const key = { 1: "loc.err.denied", 2: "loc.err.unavailable", 3: "loc.err.timeout" }[err.code] || "loc.err.unknown";
      onLocateFail(key);
    },
    // 장소 단위(50m)로 찾으려면 정확한 위치가 필요 → GPS 사용, 예전 위치는 쓰지 않음
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function onPosition({ latitude, longitude, accuracy }, { simulated, withPlaces }) {
  $(".location-card").classList.remove("is-loading");
  $("#btn-locate").disabled = false;
  state.loc.located = true;
  state.loc.accuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : null;
  state.loc.simulated = simulated;

  const nearest = findNearestCity(latitude, longitude);
  if (!nearest) return onLocateFail("loc.err.noCities");

  const km = Math.round(nearest.km);
  if (km > FAR_KM) {
    setCity(nearest.city, "loc.note.far", { km: km.toLocaleString() }, true);
    $("#manual-picker").hidden = false;
  } else {
    setCity(nearest.city, "loc.note.auto", { km });
    $("#manual-picker").hidden = true;
  }

  if (withPlaces) searchNearby(latitude, longitude);
}

function onLocateFail(messageKey) {
  $(".location-card").classList.remove("is-loading");
  $("#btn-locate").disabled = false;
  state.loc.status = state.city ? "set" : "failed";
  $("#manual-picker").hidden = false;
  setLocationNote(messageKey, {}, true);
}

/* ---------- 국가·도시 직접 선택 ---------- */
function buildCountryOptions() {
  const sel = $("#country-select");
  const current = sel.value;
  sel.length = 1; // "국가 선택"만 남기기
  const seen = new Set();
  for (const c of visibleCities()) {
    if (seen.has(c.country)) continue;
    seen.add(c.country);
    sel.add(new Option(countryName(c), c.country));
  }
  sel.value = [...sel.options].some((o) => o.value === current) ? current : "";
}

function buildCityOptions(country) {
  const sel = $("#city-select");
  const current = sel.value;
  sel.length = 1; // "도시 선택"만 남기기
  visibleCities()
    .filter((c) => c.country === country)
    .forEach((c) => sel.add(new Option(cityName(c), c.id)));
  sel.disabled = !country;
  if ([...sel.options].some((o) => o.value === current)) sel.value = current;
}

// 자동으로 정해진 도시를 선택 상자에도 반영
function syncManualPicker(city) {
  $("#country-select").value = city.country;
  buildCityOptions(city.country);
  $("#city-select").value = city.id;
}

function setupManualPicker() {
  buildCountryOptions();

  $("#country-select").addEventListener("change", (e) => {
    buildCityOptions(e.target.value);
    // 국가만 바꿔도 그 나라 언어는 바로 선택
    const first = db.cities.find((c) => c.country === e.target.value);
    if (first) selectLanguage(first.language);
  });

  $("#city-select").addEventListener("change", (e) => {
    const city = db.cities.find((c) => c.id === e.target.value);
    if (city) setCity(city, "loc.note.manual");
  });

  $("#btn-manual").addEventListener("click", () => {
    const picker = $("#manual-picker");
    picker.hidden = !picker.hidden;
    if (!picker.hidden) $("#country-select").focus();
  });
}

// 첫 화면: 저장된 도시 복원 → 이미 위치 권한이 있으면 자동으로 위치 찾기
async function initLocation() {
  setupManualPicker();

  const saved = visibleCities().find((c) => c.id === localStorage.getItem(CITY_KEY));
  if (saved) setCity(saved, "loc.note.restored");

  try {
    const perm = await navigator.permissions?.query({ name: "geolocation" });
    if (perm?.state === "granted") locate({ withPlaces: false }); // 열 때는 도시만, 주변 장소 검색은 버튼을 눌렀을 때
  } catch {
    /* permissions API를 지원하지 않으면 버튼을 누를 때 찾기 */
  }
}

/* ---------- 라디오형 버튼 그룹 ---------- */
function setupRadioGroup(groupEl, dataKey, onSelect) {
  groupEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[role='radio']");
    if (!btn) return;
    groupEl.querySelectorAll("[role='radio']").forEach((b) =>
      b.setAttribute("aria-checked", String(b === btn))
    );
    onSelect(btn.dataset[dataKey]);
  });
}

// 장소 유형 선택 (직접 누르면 "지금 여기" 장소 선택은 풀림)
function selectPlaceType(place, { keepSpot = false } = {}) {
  state.placeType = place;
  $$("#place-group [role='radio']").forEach((b) =>
    b.setAttribute("aria-checked", String(b.dataset.place === place))
  );
  if (!keepSpot && state.spot && state.spot.placeType !== place) {
    state.spot = null;
    nearby.selectedKey = null;
    renderNearby();
  }
  updateSubmitState();
}

function selectLanguage(lang) {
  state.language = lang;
  $$("#lang-group [role='radio']").forEach((b) =>
    b.setAttribute("aria-checked", String(b.dataset.lang === lang))
  );
  updateSubmitState();
}

/* ---------- 추천 버튼 활성화 ---------- */
function updateSubmitState() {
  const loaded = db.phrases.length > 0;
  const ready = loaded && state.language && state.placeType;
  $("#btn-recommend").disabled = !ready;

  let key = "";
  if (state.loadError) key = "error.data";
  else if (!loaded) key = "hint.loading";
  else if (!state.language && !state.placeType) key = "hint.chooseBoth";
  else if (!state.language) key = "hint.chooseLang";
  else if (!state.placeType) key = "hint.choosePlace";
  $("#form-hint").textContent = key ? t(key) : "";
}

/* ---------- 상황 키워드 칩 → 입력창에 추가 ---------- */
function appendKeyword(word) {
  const ta = $("#situation");
  const current = ta.value.trim();
  if (current.split(/\s+/).includes(word)) return;
  ta.value = current ? `${current} ${word}` : word;
  state.situation = ta.value;
  ta.focus();
}

/* =========================================================
   결과 화면: 추천 → 카드 표시 → 다른 표현 보기
   ========================================================= */
const MORE_SIZE = 3; // "다른 표현 보기" 한 번에 보여 줄 개수

const result = {
  mode: null,
  ranked: [],
  shown: new Set(), // 이미 보여 준 표현 id
  page: [],         // 지금 화면에 있는 카드 (언어를 바꾸면 다시 그림)
};

// "지금 여기 계신가요?"에서 고른 장소가 지금 장소 유형과 같을 때만 그 태그 키워드를 씀
const activeSpot = () => (state.spot && state.spot.placeType === state.placeType ? state.spot : null);

// 표현 추천 실행: 도시가 있으면 비행 애니메이션(도시당 1번) 후 결과 화면
async function runRecommend() {
  state.situation = $("#situation").value;
  if (!state.language || !state.placeType) { updateSubmitState(); return; }
  const origin = db.cities.find((c) => c.id === TRIP.ORIGIN_ID);
  if (origin && shouldPlayTrip(state.city)) {
    $("#btn-recommend").disabled = true;
    const labels = { from: cityName(origin), to: cityName(state.city) };
    labels.route = t("trip.route", labels);
    await playTrip(origin, state.city, labels, showRecommendations);
    updateSubmitState();
  } else {
    showRecommendations();
  }
}

function showRecommendations() {
  const pool = phrasesFor(state.language, state.placeType);
  // 고른 장소의 태그 키워드(예: cuisine=bagel → 주문·포장)를 상황 입력에 더해 점수 계산
  const spot = activeSpot();
  const scoringText = [state.situation, ...(spot ? spot.keywords : [])].join(" ");
  const r = recommend(pool, scoringText);
  Object.assign(result, { mode: r.mode, ranked: r.ranked, shown: new Set(), page: [] });

  renderContext();
  renderFallback();
  renderPage(nextBatch(r.firstPageSize));
  showScreen("result");
}

function nextBatch(size) {
  return result.ranked.filter((s) => !result.shown.has(s.phrase.id)).slice(0, size);
}

function showMore() {
  let batch = nextBatch(MORE_SIZE);
  if (batch.length === 0) {
    result.shown.clear();
    batch = nextBatch(MORE_SIZE);
    toast(t("toast.allSeen"));
  }
  renderPage(batch);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderContext() {
  const box = $("#result-context");
  box.replaceChildren();
  if (state.city) box.append(el("span", "ctx-chip", `📍 ${cityLabel(state.city)}`));
  const spot = activeSpot();
  if (spot) {
    const details = [labelOf(spot.info.type), ...spot.info.mods.slice(0, 2).map(labelOf)].join(" · ");
    box.append(el("span", "ctx-chip is-spot", `📌 ${spot.name} · ${details}`));
  }
  box.append(el("span", "ctx-chip", `${PLACE_ICON[state.placeType]} ${placeName(state.placeType)}`));
  box.append(el("span", "ctx-chip", `${LANG_FLAG[state.language]} ${langName(state.language)}`));
  const s = state.situation.trim();
  if (s) box.append(el("p", "ctx-situation", `“${s}”`));
}

function renderFallback() {
  const box = $("#fallback-box");
  box.replaceChildren();
  box.hidden = result.mode !== "fallback";
  if (box.hidden) return;

  // 영어권 여행지라면 "영어로 물어보세요" 문장은 필요 없음
  if (state.language === "en") {
    box.append(el("p", null, t("result.fallbackPlain")));
    return;
  }
  const help = PLACE_HELP[state.placeType];
  box.append(el("p", null, t("result.fallback")));
  const en = el("p", "fallback-en", help.en);
  if (uiLang === "ko") en.append(el("small", null, help.ko)); // 영어 화면에서는 번역 줄이 필요 없음
  box.append(en);
}

function renderPage(batch) {
  result.page = batch;
  batch.forEach((s) => result.shown.add(s.phrase.id));
  drawPage();
}

function drawPage() {
  $("#phrase-list").replaceChildren(...result.page.map(renderCard));
  const left = result.ranked.length - result.shown.size;
  $("#more-hint").textContent = left > 0 ? t("more.left", { n: left }) : t("more.done");
}

function renderCard({ phrase, score, matched }) {
  const li = el("li", "phrase-card");
  li.dataset.id = phrase.id;

  // 상단: 왜 추천됐는지 (영어 화면에서는 한국어 키워드 대신 일반 문구)
  const top = el("div", "phrase-top");
  let label = t("rank.more");
  if (score > 0 && matched.length && uiLang === "ko") label = t("rank.keyword", { kw: matched.join("·") });
  else if (score > 0) label = t("rank.related");
  else if (phrase.basic) label = t("rank.basic");
  top.append(
    el("span", `phrase-rank${score > 0 ? "" : " is-basic"}`, label),
    listenButton(phrase.phrase, phrase.language),
  );
  li.append(top);

  const text = el("p", "phrase-text", phrase.phrase);
  text.lang = phrase.language;
  li.append(
    text,
    el("p", "phrase-pron", localized(phrase, "pronunciation")),
    el("p", "phrase-meaning", localized(phrase, "meaning")),
    el("p", "phrase-situation", `💬 ${localized(phrase, "situation")}`),
  );

  // 대화 예시 (접었다 펴기)
  if (phrase.dialogue?.length) {
    const details = el("details", "phrase-dialogue");
    details.append(el("summary", null, t("card.dialogue")));
    for (const line of phrase.dialogue) {
      const isMe = line.speaker === "나";
      const row = el("div", `dialogue-line${isMe ? " is-me" : ""}`);
      const body = el("div");
      const said = el("p", null, line.text);
      said.lang = phrase.language;
      body.append(said, el("small", null, localized(line, "meaning")));
      row.append(
        el("span", "dialogue-speaker", t(isMe ? "speaker.me" : "speaker.staff")),
        body,
        listenButton(line.text, phrase.language, true),
      );
      details.append(row);
    }
    li.append(details);
  }

  // 영어로 확인하기 (처음엔 숨김). 영어 표현이면 문장 자체가 영어라 버튼이 필요 없음
  const hasEnglishCheck = phrase.language !== "en";
  if (hasEnglishCheck) {
    const english = el("p", "phrase-english");
    english.hidden = true;
    english.append(el("small", null, t("card.englishNote")), document.createTextNode(phrase.fallback_english));
    li.append(english);
  }

  // 버튼
  const actions = el("div", "phrase-actions");
  const saveBtn = el("button", "btn-chip");
  saveBtn.type = "button";
  saveBtn.dataset.action = "save";
  setSaveButton(saveBtn, isSaved(phrase.id, state.city?.id));
  actions.append(saveBtn);
  if (hasEnglishCheck) {
    const enBtn = el("button", "btn-chip", t("card.english"));
    enBtn.type = "button";
    enBtn.dataset.action = "english";
    enBtn.setAttribute("aria-pressed", "false");
    actions.append(enBtn);
  }
  li.append(actions);

  return li;
}

function onCardAction(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const card = btn.closest(".phrase-card");

  if (btn.dataset.action === "english") {
    const box = card.querySelector(".phrase-english");
    box.hidden = !box.hidden;
    btn.setAttribute("aria-pressed", String(!box.hidden));
  } else if (btn.dataset.action === "save") {
    const phrase = db.phrases.find((p) => p.id === card.dataset.id);
    const cityId = state.city?.id;
    if (isSaved(phrase.id, cityId)) {
      removeSaved(phrase.id, cityId);
      setSaveButton(btn, false);
      toast(t("toast.unsaved"));
    } else {
      addSaved(phrase, state.city);
      setSaveButton(btn, true);
      toast(t("toast.saved"));
    }
    updateBadge();
  }
}

/* ---------- 🔊 발음 듣기 버튼 ---------- */
function listenButton(text, lang, small = false) {
  const b = el("button", `btn-listen${small ? " is-small" : ""}`, "🔊");
  b.type = "button";
  b.dataset.speak = text;
  b.dataset.lang = lang;
  b.setAttribute("aria-label", t("card.listen"));
  b.title = t("card.listen");
  return b;
}

const warnedNoVoice = new Set();
function onListenClick(e) {
  const btn = e.target.closest("[data-speak]");
  if (!btn) return;
  const lang = btn.dataset.lang;
  const status = speak(btn.dataset.speak, lang, btn);
  if (status === "unsupported") {
    toast(t("toast.speechUnsupported"));
  } else if (status === "no-voice" && !warnedNoVoice.has(lang)) {
    warnedNoVoice.add(lang);
    toast(t("toast.noVoice", { lang: langName(lang) }));
  }
}

function setSaveButton(btn, saved) {
  btn.textContent = t(saved ? "card.saved" : "card.save");
  btn.classList.toggle("is-saved", saved);
  btn.setAttribute("aria-pressed", String(saved));
}

/* ---------- 토스트 (선택: 되돌리기 같은 버튼 1개) ---------- */
let toastTimer;
function toast(message, action) {
  const box = $("#toast");
  box.replaceChildren(document.createTextNode(message));
  if (action) {
    const b = el("button", "toast-action", action.label);
    b.type = "button";
    b.addEventListener("click", () => {
      box.hidden = true;
      action.onClick();
    });
    box.append(b);
  }
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (box.hidden = true), action ? 4000 : 2200);
}

/* =========================================================
   저장한 표현 화면: 국가 → 도시 → 장소별로 묶어서 보기
   ========================================================= */
const COUNTRY_FLAG = { FR: "🇫🇷", JP: "🇯🇵", ES: "🇪🇸", KR: "🇰🇷", US: "🇺🇸" };
const LANG_COUNTRY = { fr: "FR", ja: "JP", es: "ES", ko: "KR", en: "US" };

function updateBadge() {
  const n = loadSaved().length;
  const badge = $("#tab-badge");
  badge.hidden = n === 0;
  badge.textContent = n > 99 ? "99+" : String(n);
}

// 저장 항목 1개에 국가·도시 정보 붙이기
function describeEntry(entry) {
  const city = cityOfEntry(entry); // savedmap.js: cities.json → 없으면 저장할 때 남긴 도시 사본
  const country = city?.country || LANG_COUNTRY[entry.language];
  const anyCity = city || db.cities.find((c) => c.country === country);
  const countryLabel = anyCity ? countryName(anyCity) : t("saved.otherCountry");
  const phrase = db.phrases.find((p) => p.id === entry.phraseId) || entry.snapshot;
  return { entry, city, country, countryLabel, phrase };
}

function renderSaved() {
  const items = loadSaved().map((entry, order) => ({ ...describeEntry(entry), order }));
  $("#saved-count").textContent = items.length ? t("saved.count", { n: items.length }) : "";
  $("#saved-empty").hidden = items.length > 0;

  // 목록 / 지도 보기 전환 (savedmap.js)
  const view = items.length ? savedMap.view : "list";
  $("#saved-view").hidden = items.length === 0;
  $$("#saved-view [data-view]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.view === view)));
  $("#saved-groups").hidden = view !== "list";
  $("#saved-mapview").hidden = view !== "map";

  if (view === "map") renderSavedMap(items);
  else renderSavedGroups(items, $("#saved-groups"));
}

// 저장 항목들을 국가 → 도시 → 장소로 묶어 root에 그림 (목록 보기, 지도에서 고른 도시 목록 공용)
function renderSavedGroups(items, root) {
  root.replaceChildren();
  if (!items.length) return;

  // 정렬 기준: cities.json 순서 → 장소 순서 → 최근 저장 순
  const cityOrder = (it) => {
    const i = it.city ? db.cities.findIndex((c) => c.id === it.city.id) : -1;
    return i === -1 ? 999 : i;
  };
  const countryOrder = (it) => {
    const i = db.cities.findIndex((c) => c.country === it.country);
    return i === -1 ? 999 : i;
  };
  items.sort((a, b) =>
    countryOrder(a) - countryOrder(b) ||
    cityOrder(a) - cityOrder(b) ||
    PLACE_ORDER.indexOf(a.entry.placeType) - PLACE_ORDER.indexOf(b.entry.placeType) ||
    b.entry.savedAt - a.entry.savedAt ||
    b.order - a.order
  );

  let countrySec, citySec, placeSec;
  let lastCountry, lastCity, lastPlace;
  for (const it of items) {
    if (it.country !== lastCountry) {
      countrySec = el("section", "saved-country");
      countrySec.append(el("h2", null, `${COUNTRY_FLAG[it.country] || "🌍"} ${it.countryLabel}`));
      root.append(countrySec);
      lastCountry = it.country;
      lastCity = lastPlace = undefined;
    }
    const cityId = it.city?.id || "-";
    if (cityId !== lastCity) {
      citySec = el("div", "saved-city");
      citySec.append(el("h3", null, `📍 ${it.city ? cityName(it.city) : t("saved.noCity")}`));
      countrySec.append(citySec);
      lastCity = cityId;
      lastPlace = undefined;
    }
    if (it.entry.placeType !== lastPlace) {
      placeSec = el("div", "saved-place");
      placeSec.append(el("h4", null, `${PLACE_ICON[it.entry.placeType]} ${placeName(it.entry.placeType)}`));
      citySec.append(placeSec);
      lastPlace = it.entry.placeType;
    }
    placeSec.append(renderSavedItem(it));
  }
}

function renderSavedItem({ entry, phrase }) {
  const row = el("div", "saved-item");
  const text = el("p", "saved-phrase", phrase.phrase);
  text.lang = entry.language;
  const remove = el("button", "btn-remove", t("saved.delete"));
  remove.type = "button";
  remove.setAttribute("aria-label", t("saved.deleteAria", { name: phrase.phrase }));
  remove.addEventListener("click", () => {
    const removed = removeSaved(entry.phraseId, entry.cityId);
    renderSaved();
    updateBadge();
    if (!removed) return;
    toast(t("toast.deleted"), {
      label: t("toast.undo"),
      onClick: () => {
        restoreSaved(removed);
        renderSaved();
        updateBadge();
      },
    });
  });
  const actions = el("div", "saved-actions");
  actions.append(listenButton(phrase.phrase, entry.language, true), remove);
  const meaning = localized(phrase, "meaning");
  row.append(
    text,
    actions,
    el("p", "saved-pron", localized(phrase, "pronunciation")),
    el("p", "saved-meaning", meaning),
  );
  // 영어 뜻과 영어 확인 문장이 같으면 한 번만 보여 줌
  if (entry.language !== "en" && phrase.fallback_english && phrase.fallback_english !== meaning) {
    row.append(el("p", "saved-en", `🇬🇧 ${phrase.fallback_english}`));
  }
  return row;
}

/* =========================================================
   설정: 서비스 언어, 읽기 속도, 발음 표시, 기기 음성, 데이터 지우기
   ========================================================= */
const SETTINGS_KEY = "traveltalk.settings";
const DEFAULT_SETTINGS = { rate: 0.9, showPron: true };
const VOICE_SAMPLE = {
  fr: "Bonjour, merci !", ja: "こんにちは。ありがとうございます。", es: "¡Hola, gracias!",
  ko: "안녕하세요, 감사합니다.", en: "Hello, thank you!",
};

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(patch) {
  const next = { ...loadSettings(), ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  applySettings(next);
}

function applySettings(s = loadSettings()) {
  speech.rate = s.rate;
  document.body.classList.toggle("hide-pron", !s.showPron);
}

function renderSettings() {
  const s = loadSettings();

  $$("#uilang-group [role='radio']").forEach((b) =>
    b.setAttribute("aria-checked", String(b.dataset.uilang === uiLang))
  );
  $$("#rate-group [role='radio']").forEach((b) =>
    b.setAttribute("aria-checked", String(Number(b.dataset.rate) === s.rate))
  );

  // 위치 시뮬레이션 목록 (data/spots.json에서 demo가 있는 곳)
  const simSel = $("#sim-select");
  const simNow = getSimSpot();
  simSel.replaceChildren(new Option(t("settings.simOff"), ""));
  for (const spot of simSpotsVisible()) simSel.add(new Option(uiLang === "en" ? spot.demo.en : spot.demo.ko, spot.id));
  simSel.value = simNow && [...simSel.options].some((o) => o.value === simNow.id) ? simNow.id : "";
  $("#toggle-pron").checked = s.showPron;

  // 기기 음성 지원 여부
  const list = $("#voice-list");
  list.replaceChildren();
  if (!speech.supported) {
    list.append(el("li", "voice-missing", t("settings.speechUnsupported")));
  } else {
    refreshVoices();
    for (const lang of Object.keys(LANG_FLAG).filter(isVisibleLang)) {
      const li = el("li");
      const ok = hasVoice(lang);
      li.append(
        el("span", null, `${LANG_FLAG[lang]} ${langName(lang)}`),
        el("span", ok ? "voice-ok" : "voice-missing", t(ok ? "settings.voiceOk" : "settings.voiceMissing")),
        listenButton(VOICE_SAMPLE[lang], lang, true),
      );
      list.append(li);
    }
  }

  // 데이터
  const n = loadSaved().length;
  $("#set-saved-count").textContent = t("saved.count", { n });
  $("#btn-clear-saved").disabled = n === 0;
  $("#set-city").textContent = state.city ? cityLabel(state.city) : t("settings.none");
  $("#btn-clear-city").disabled = !localStorage.getItem(CITY_KEY);

  // 정보
  const info = $("#settings-info");
  info.textContent = t("settings.info", {
    phrases: db.phrases.length,
    cities: db.cities.length,
    source: t(db.source === "json" ? "settings.sourceJson" : "settings.sourceJs"),
  });
  info.style.whiteSpace = "pre-line";
}

// 화면 언어와 같은 언어 칩 숨기기
function renderLangChips() {
  $$("#lang-group [data-lang]").forEach((b) => { b.hidden = !isVisibleLang(b.dataset.lang); });
}

// 화면 언어가 바뀌어 지금 고른 여행지·언어가 숨김 대상이 되면 선택을 풀어 줌
function dropHiddenSelection() {
  if (state.city && !isVisibleLang(state.city.language)) {
    state.city = null;
    state.loc = { status: "idle", located: state.loc.located, note: null };
    $("#country-select").value = "";
    $("#manual-picker").hidden = true;
  }
  if (state.language && !isVisibleLang(state.language)) {
    state.language = null;
    $$("#lang-group [role='radio']").forEach((b) => b.setAttribute("aria-checked", "false"));
  }
  if (result.page.length && !isVisibleLang(result.page[0].phrase.language)) {
    result.page = [];
    if (!$("#screen-result").hidden) showScreen("home");
  }
}

// 서비스 언어를 바꾸면 고정 문구 + 지금 그려진 화면을 모두 다시 그림
function onUiLangChange() {
  renderLangChips();
  dropHiddenSelection();
  buildCountryOptions();
  buildCityOptions($("#country-select").value);
  renderLocation();
  renderNearby();
  updateSubmitState();
  if (result.page.length) {
    renderContext();
    renderFallback();
    drawPage();
  }
  renderSaved();
  renderSettings();
}

function setupSettings() {
  applySettings();

  // 목소리 목록이 늦게 도착하면 설정 화면을 다시 그림
  if (speech.supported) {
    window.speechSynthesis.addEventListener?.("voiceschanged", () => {
      if (!$("#screen-settings").hidden) renderSettings();
    });
  }

  $("#uilang-group").addEventListener("click", (e) => {
    const b = e.target.closest("[data-uilang]");
    if (!b || b.dataset.uilang === uiLang) return;
    setUiLang(b.dataset.uilang);
    onUiLangChange();
  });

  // 위치 시뮬레이션: 고르면 홈으로 가서 바로 그 좌표로 '위치 찾기'
  $("#sim-select").addEventListener("change", (e) => {
    setSimSpot(e.target.value);
    const spot = getSimSpot();
    if (spot) {
      toast(t("toast.simOn", { name: uiLang === "en" ? spot.demo.en : spot.demo.ko }));
      showScreen("home");
      locate({ withPlaces: true });
    } else {
      toast(t("toast.simOff"));
    }
  });

  $("#rate-group").addEventListener("click", (e) => {
    const b = e.target.closest("[data-rate]");
    if (!b) return;
    saveSettings({ rate: Number(b.dataset.rate) });
    renderSettings();
  });

  $("#toggle-pron").addEventListener("change", (e) => {
    saveSettings({ showPron: e.target.checked });
  });

  $("#btn-clear-saved").addEventListener("click", () => {
    const n = loadSaved().length;
    if (!n) return;
    if (!confirm(t("confirm.clearSaved", { n }))) return;
    writeSaved([]);
    updateBadge();
    renderSettings();
    toast(t("toast.clearedSaved"));
  });

  $("#btn-clear-city").addEventListener("click", () => {
    localStorage.removeItem(CITY_KEY);
    state.city = null;
    state.loc = { status: "idle", located: false, note: null };
    $("#country-select").value = "";
    buildCityOptions("");
    $("#manual-picker").hidden = true;
    renderLocation();
    renderSettings();
    toast(t("toast.clearedCity"));
  });
}

/* ---------- 초기화 ---------- */
function init() {
  applyI18n();     // 고정 문구를 현재 화면 언어로
  renderLangChips();
  renderLocation();

  // 하단 탭
  $$(".tab").forEach((tab) =>
    tab.addEventListener("click", () => showScreen(tab.dataset.tab))
  );
  // 뒤로가기 등 data-go 버튼
  $$("[data-go]").forEach((btn) =>
    btn.addEventListener("click", () => showScreen(btn.dataset.go))
  );

  setupRadioGroup($("#lang-group"), "lang", (lang) => selectLanguage(lang));
  setupRadioGroup($("#place-group"), "place", (place) => selectPlaceType(place));

  $("#situation").addEventListener("input", (e) => {
    state.situation = e.target.value;
  });
  $("#hint-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".hint");
    if (chip) appendKeyword(chip.textContent.trim());
  });

  $("#btn-locate").addEventListener("click", () => locate({ withPlaces: true }));

  $("#btn-recommend").addEventListener("click", runRecommend);
  $("#btn-more").addEventListener("click", showMore);
  $("#phrase-list").addEventListener("click", onCardAction);
  document.addEventListener("click", onListenClick);
  setupSettings();

  updateSubmitState();
  updateBadge();

  loadData().then(() => {
    updateSubmitState();
    return initLocation();
  }).catch((err) => {
    console.error(err);
    state.loadError = true;
    updateSubmitState();
    $("#btn-recommend").disabled = true;
  });
}

document.addEventListener("DOMContentLoaded", init);
