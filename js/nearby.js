/* =========================================================
   TravelTalk — 정확한 위치 기반 자동 추천
   1) 좌표(실제 GPS 또는 설정의 '위치 시뮬레이션') 받기
   2) OpenStreetMap Overpass API(키 없음)로 반경 50m 안 장소 조회
      (amenity / shop / tourism / railway 태그, 5초 안에 응답 없으면 포기)
   3) 실패하거나 결과가 없으면 data/spots.json(등록된 명소)에서 반경 200m 안 찾기
   4) 가까운 순 3곳을 "지금 여기 계신가요?"로 보여 주고, 고르면
      data/tag-map.json으로 장소 유형·추천 키워드를 정해 바로 추천
   5) 그래도 없으면 장소 유형을 직접 고르게 안내
   ※ Overpass에는 좌표만 POST 본문으로 보냄 (주소창·URL에는 넣지 않음)
   ========================================================= */
const NEARBY = {
  OVERPASS_URL: "https://overpass-api.de/api/interpreter",
  RADIUS_M: 50,        // Overpass 검색 반경
  SPOT_RADIUS_M: 200,  // 등록된 명소 검색 반경
  TIMEOUT_MS: 5000,    // Overpass 응답 기다리는 최대 시간
  MAX_PLACES: 3,
  SIM_KEY: "traveltalk.simLocation",
  SIM_ACCURACY_M: 8,   // 시뮬레이션 좌표의 '정확도'
  searchId: 0,         // 새로 검색하면 이전 결과는 버림
  abort: null,
};

// 화면 상태: idle(안 보임) | searching | done
const nearby = { status: "idle", source: null, places: [], selectedKey: null };

/* ---------- 태그 → 장소 유형·키워드 (data/tag-map.json) ---------- */
function tagMatches(tags, ruleTag) {
  const eq = ruleTag.indexOf("=");
  const key = ruleTag.slice(0, eq);
  const want = ruleTag.slice(eq + 1);
  if (tags[key] == null) return false;
  if (want === "*") return true;
  const wanted = want.split("|");
  return String(tags[key]).split(";").some((v) => wanted.includes(v.trim()));
}

// → { placeType, typeLabel, detailLabels[], keywords[] } 또는 null(쓸 수 없는 장소)
function classifyTags(tags) {
  const map = db.tagMap;
  if (!map) return null;
  const type = map.placeTypes.find((r) => tagMatches(tags, r.tag));
  if (!type) return null;
  const mods = map.modifiers.filter((r) => tagMatches(tags, r.tag));
  return {
    placeType: type.placeType,
    type,
    mods,
    keywords: [...new Set([...type.keywords, ...mods.flatMap((m) => m.keywords)])],
  };
}

const labelOf = (rule) => (uiLang === "en" ? rule.en : rule.ko);
const metersBetween = (lat1, lng1, lat2, lng2) => distanceKm(lat1, lng1, lat2, lng2) * 1000;

/* ---------- 1) Overpass ---------- */
async function queryOverpass(lat, lng, signal) {
  const around = `around:${NEARBY.RADIUS_M},${lat.toFixed(6)},${lng.toFixed(6)}`;
  const query =
    `[out:json][timeout:5];(` +
    `nwr(${around})[amenity];nwr(${around})[shop];nwr(${around})[tourism];nwr(${around})[railway];` +
    `);out center tags 60;`;
  const res = await fetch(NEARBY.OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query),
    signal,
  });
  if (!res.ok) throw new Error(`overpass ${res.status}`);
  const json = await res.json();
  return (json.elements || []).map((e) => ({
    key: `osm-${e.type}-${e.id}`,
    tags: e.tags || {},
    lat: e.lat ?? e.center?.lat,
    lng: e.lon ?? e.center?.lon,
    name: e.tags?.[`name:${uiLang}`] || e.tags?.name || null,
  }));
}

/* ---------- 2) 등록된 명소 (data/spots.json) ---------- */
function spotsAround(lat, lng) {
  return (db.spots || []).map((s) => ({
    key: `spot-${s.id}`,
    tags: s.tags,
    lat: s.lat,
    lng: s.lng,
    name: uiLang === "en" ? s.name_en : s.name_ko,
    localName: s.name,
    radius: s.radius, // 캠퍼스처럼 넓은 곳은 명소마다 반경을 따로 줄 수 있음 (없으면 200m)
  }));
}

// 후보 → 쓸 수 있는 장소만, 가까운 순, 같은 이름은 하나만, 최대 3곳
function pickPlaces(raw, lat, lng, radius) {
  const seen = new Set();
  return raw
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map((p) => ({ ...p, dist: metersBetween(lat, lng, p.lat, p.lng), info: classifyTags(p.tags) }))
    .filter((p) => p.info && p.dist <= (p.radius ?? radius))
    .sort((a, b) => a.dist - b.dist)
    .filter((p) => {
      const id = (p.name || p.info.type.tag).toLowerCase();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice(0, NEARBY.MAX_PLACES);
}

async function searchNearby(lat, lng) {
  const id = ++NEARBY.searchId;
  NEARBY.abort?.abort();
  const controller = new AbortController();
  NEARBY.abort = controller;
  Object.assign(nearby, { status: "searching", source: null, places: [], selectedKey: null });
  renderNearby();

  let places = [];
  let source = "none";
  const timer = setTimeout(() => controller.abort(), NEARBY.TIMEOUT_MS);
  try {
    places = pickPlaces(await queryOverpass(lat, lng, controller.signal), lat, lng, NEARBY.RADIUS_M);
    if (places.length) source = "osm";
  } catch (err) {
    console.info("[TravelTalk] Overpass 실패 → 등록된 명소로", err.name === "AbortError" ? "timeout" : err.message);
  } finally {
    clearTimeout(timer);
  }
  if (id !== NEARBY.searchId) return; // 그 사이 다시 검색함

  if (!places.length) {
    places = pickPlaces(spotsAround(lat, lng), lat, lng, NEARBY.SPOT_RADIUS_M);
    if (places.length) source = "spots";
  }
  Object.assign(nearby, { status: "done", source, places });
  renderNearby();
  if (source === "none") focusPlaceGrid();
}

/* ---------- "지금 여기 계신가요?" ---------- */
function renderNearby() {
  const card = $("#nearby");
  card.hidden = nearby.status === "idle";
  if (card.hidden) return;

  const status = $("#nearby-status");
  const list = $("#nearby-list");
  list.replaceChildren();
  $("#nearby-title").hidden = nearby.status === "done" && nearby.source === "none";
  $("#nearby-dismiss").hidden = nearby.status !== "done" || nearby.source === "none";

  if (nearby.status === "searching") {
    status.textContent = t("nearby.searching");
    card.classList.add("is-loading");
    return;
  }
  card.classList.remove("is-loading");
  status.textContent = {
    osm: t("nearby.fromOsm", { r: NEARBY.RADIUS_M }),
    spots: t("nearby.fromSpots", { r: NEARBY.SPOT_RADIUS_M }),
    none: t("nearby.noneFound"),
  }[nearby.source];
  status.classList.toggle("is-warn", nearby.source === "none");

  for (const p of nearby.places) {
    const btn = el("button", `nearby-place${p.key === nearby.selectedKey ? " is-selected" : ""}`);
    btn.type = "button";
    btn.setAttribute("aria-pressed", String(p.key === nearby.selectedKey));
    const details = [labelOf(p.info.type), ...p.info.mods.slice(0, 2).map(labelOf)].join(" · ");
    const text = el("span", "nearby-text");
    text.append(el("strong", null, p.name || labelOf(p.info.type)), el("small", null, details));
    btn.append(
      el("span", "nearby-icon", PLACE_ICON[p.info.placeType]),
      text,
      el("span", "nearby-dist", t("nearby.distance", { m: Math.round(p.dist) })),
    );
    btn.addEventListener("click", () => chooseNearbyPlace(p));
    list.append(btn);
  }
}

// 장소를 고르면: 장소 유형 선택 + 태그 키워드로 바로 추천
function chooseNearbyPlace(p) {
  nearby.selectedKey = p.key;
  state.spot = {
    key: p.key,
    name: p.name || labelOf(p.info.type),
    placeType: p.info.placeType,
    keywords: p.info.keywords,
    info: p.info,
  };
  selectPlaceType(p.info.placeType, { keepSpot: true });
  renderNearby();
  runRecommend();
}

function dismissNearby() {
  state.spot = null;
  Object.assign(nearby, { status: "idle", places: [], selectedKey: null });
  renderNearby();
  focusPlaceGrid();
}

function focusPlaceGrid() {
  const grid = $("#place-group");
  grid.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
  grid.querySelector("[role='radio']")?.focus({ preventScroll: true });
}

/* ---------- 위치 시뮬레이션 (설정) ---------- */
function getSimSpot() {
  const id = localStorage.getItem(NEARBY.SIM_KEY);
  return id ? (db.spots || []).find((s) => s.id === id && s.demo) || null : null;
}

// 화면 언어와 같은 언어의 여행지(한국어 화면 → 한국)는 시연 목록에서도 숨김
function simSpotsVisible() {
  return (db.spots || []).filter((s) => {
    if (!s.demo) return false;
    const city = db.cities.reduce((best, c) =>
      !best || distanceKm(s.lat, s.lng, c.lat, c.lng) < distanceKm(s.lat, s.lng, best.lat, best.lng) ? c : best, null);
    return city && isVisibleLang(city.language);
  });
}

function setSimSpot(id) {
  if (id) localStorage.setItem(NEARBY.SIM_KEY, id);
  else localStorage.removeItem(NEARBY.SIM_KEY);
}

document.addEventListener("DOMContentLoaded", () => {
  $("#nearby-dismiss").addEventListener("click", dismissNearby);
});
