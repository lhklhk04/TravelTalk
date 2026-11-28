/* =========================================================
   TravelTalk — '저장한 표현' 지도 보기
   - 저장한 표현이 있는 도시마다 핀 (크기 + 숫자 = 저장 개수)
   - 핀을 누르면 그 도시에서 저장한 표현 목록이 지도 아래에 열림
   - 목록 / 지도 보기 전환 (마지막 선택을 기억)
   - 지도는 비행 애니메이션과 같은 world-atlas 데이터 사용 (world.js)
   ========================================================= */
const SAVED_VIEW_KEY = "traveltalk.savedView";

const savedMap = {
  view: localStorage.getItem(SAVED_VIEW_KEY) === "map" ? "map" : "list",
  selected: null, // 고른 도시 id
  drawId: 0,      // 그리는 도중 다시 그리면 이전 것은 버림
};

// 저장 항목의 도시: cities.json에서 찾고, 없으면 저장할 때 남긴 사본(이름·좌표)을 씀
function cityOfEntry(entry) {
  if (!entry.cityId) return null;
  return db.cities.find((c) => c.id === entry.cityId) || entry.city || null;
}

const hasCoords = (city) => city && Number.isFinite(city.lat) && Number.isFinite(city.lng);

// 핀 반지름: 1개 11px, 많을수록 커짐 (최대 22px) — 숫자가 들어가고 손가락으로 누를 수 있는 크기
const pinRadius = (n) => Math.min(22, 11 + 4 * Math.sqrt(n - 1));

// 겹치는 핀을 살짝 밀어서 떼어 놓기 (파리·바르셀로나·마드리드처럼 가까운 도시)
// pins: [{ x, y, r }] → 각 핀에 px, py(그릴 위치) 추가. 실제 위치(x, y)는 그대로 둠
function spreadPins(pins, W, H) {
  for (const p of pins) { p.px = p.x; p.py = p.y; }
  for (let iter = 0; iter < 80; iter++) {
    let moved = false;
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const a = pins[i], b = pins[j];
        let dx = b.px - a.px, dy = b.py - a.py;
        let d = Math.hypot(dx, dy);
        const min = a.r + b.r + 3;
        if (d >= min) continue;
        if (d < 0.01) { dx = Math.cos(i + j); dy = Math.sin(i + j); d = 1; } // 완전히 같은 위치
        const push = (min - d) / 2;
        a.px -= (dx / d) * push; a.py -= (dy / d) * push;
        b.px += (dx / d) * push; b.py += (dy / d) * push;
        moved = true;
      }
    }
    for (const p of pins) { // 지도 밖으로 나가지 않게
      p.px = Math.min(W - p.r - 2, Math.max(p.r + 2, p.px));
      p.py = Math.min(H - p.r - 2, Math.max(p.r + 2, p.py));
    }
    if (!moved) break;
  }
  return pins;
}

// items: renderSaved가 만든 [{ entry, city, country, countryLabel, phrase, order }]
async function renderSavedMap(items) {
  const drawId = ++savedMap.drawId;
  const pinHadFocus = document.activeElement?.classList?.contains("map-pin") ?? false;
  const mapBox = $("#saved-map");
  const listBox = $("#saved-map-list");
  const hint = $("#saved-map-hint");

  // 도시별로 묶기 (좌표가 있는 것만 핀으로)
  const groups = new Map();
  let noCity = 0;
  for (const it of items) {
    if (!hasCoords(it.city)) { noCity++; continue; }
    if (!groups.has(it.city.id)) groups.set(it.city.id, { city: it.city, items: [], latest: 0, lastOrder: -1 });
    const g = groups.get(it.city.id);
    g.items.push(it);
    g.latest = Math.max(g.latest, it.entry.savedAt || 0);
    g.lastOrder = Math.max(g.lastOrder, it.order); // 같은 시각이면 나중에 저장한 쪽
  }

  $("#saved-map-note").textContent = noCity ? t("saved.noCityNote", { n: noCity }) : "";

  if (!groups.size) {
    mapBox.replaceChildren();
    listBox.replaceChildren();
    hint.textContent = "";
    return;
  }

  const world = await loadWorld();
  if (drawId !== savedMap.drawId) return; // 그 사이 다시 그리기 요청이 옴
  if (!world) {
    // 지도를 못 쓰면 목록 보기로
    toast(t("saved.mapUnavailable"));
    setSavedView("list");
    return;
  }

  // 고른 도시가 없거나 사라졌으면 가장 최근에 저장한 도시
  if (!groups.has(savedMap.selected)) {
    savedMap.selected = [...groups.values()]
      .sort((a, b) => b.latest - a.latest || b.lastOrder - a.lastOrder)[0].city.id;
  }

  // ---- 투영: 모든 핀이 들어오게 ----
  const W = Math.max(280, $(".app").clientWidth - 40); // 화면이 아직 숨겨져 있어도 폭을 알 수 있게
  const H = Math.round(Math.min(340, Math.max(220, W * 0.68)));
  const cities = [...groups.values()].map((g) => g.city);
  const frame = {
    type: "GeometryCollection",
    geometries: cities.map((c) => d3.geoCircle().center([c.lng, c.lat]).radius(12)()),
  };
  const projection = d3.geoNaturalEarth1()
    .rotate([bestRotation(cities.map((c) => c.lng)), 0])
    .fitExtent([[14, 30], [W - 14, H - 14]], frame);
  const geoPath = d3.geoPath(projection);

  const svg = svgEl("svg", {
    viewBox: `0 0 ${W} ${H}`, width: W, height: H,
    role: "group", "aria-label": t("saved.mapAria"),
  });
  drawWorldBase(svg, geoPath, world, W, H);

  // 핀 위치 계산 → 겹치면 떼어 놓기 → 원래 위치에서 옮겨졌으면 가는 선으로 연결
  const layout = spreadPins(
    [...groups.values()].map((g) => {
      const [x, y] = projection([g.city.lng, g.city.lat]);
      return { g, x, y, r: pinRadius(g.items.length) };
    }),
    W, H,
  );
  const leaders = svgEl("g", {}, svg);
  for (const p of layout) {
    if (Math.hypot(p.px - p.x, p.py - p.y) < 2) continue;
    svgEl("line", { class: "map-pin-leader", x1: p.x, y1: p.y, x2: p.px, y2: p.py }, leaders);
    svgEl("circle", { class: "map-pin-anchor", cx: p.x, cy: p.y, r: 2.5 }, leaders);
  }

  // 큰 핀부터 그려서 작은 핀이 위에 오게
  const pins = svgEl("g", {}, svg);
  const ordered = [...layout].sort((a, b) => b.g.items.length - a.g.items.length);
  let selectedPos = null;
  for (const { g, px: x, py: y, r } of ordered) {
    const n = g.items.length;
    const isSel = g.city.id === savedMap.selected;
    if (isSel) selectedPos = [x, y, r];

    const pin = svgEl("g", {
      class: `map-pin${isSel ? " is-selected" : ""}`,
      transform: `translate(${x} ${y})`,
      role: "button",
      tabindex: "0",
      "aria-pressed": String(isSel),
      "aria-label": t("saved.pinAria", { city: cityName(g.city), n }),
    }, pins);
    svgEl("circle", { class: "map-pin-hit", r: r + 4 }, pin); // 손가락으로 누르기 쉽게 (옆 핀을 가리지 않을 만큼만)
    svgEl("circle", { class: "map-pin-dot", r }, pin);
    const label = svgEl("text", { class: "map-pin-count", "text-anchor": "middle", dy: "0.35em" }, pin);
    label.textContent = n > 99 ? "99+" : String(n);

    const select = () => {
      if (savedMap.selected === g.city.id) return;
      savedMap.selected = g.city.id;
      renderSavedMap(items);
    };
    pin.addEventListener("click", select);
    pin.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); }
    });
  }

  // 고른 도시 이름표 (핀 위)
  if (selectedPos) {
    const [x, y, r] = selectedPos;
    const name = svgEl("text", { class: "map-pin-name", x, y: y - r - 6, "text-anchor": "middle" }, svg);
    name.textContent = cityName(groups.get(savedMap.selected).city);
  }

  mapBox.replaceChildren(svg);
  hint.textContent = groups.size > 1 ? t("saved.mapHint") : "";

  // 고른 도시의 표현 목록
  renderSavedGroups(groups.get(savedMap.selected).items, listBox);

  // 다시 그린 뒤에도 키보드 포커스 유지
  if (pinHadFocus) pins.querySelector(".map-pin.is-selected")?.focus();
}

function setSavedView(view) {
  savedMap.view = view === "map" ? "map" : "list";
  localStorage.setItem(SAVED_VIEW_KEY, savedMap.view);
  renderSaved();
}

document.addEventListener("DOMContentLoaded", () => {
  $("#saved-view").addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]");
    if (b && b.dataset.view !== savedMap.view) setSavedView(b.dataset.view);
  });
});
