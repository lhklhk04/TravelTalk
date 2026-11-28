/* =========================================================
   TravelTalk — 출발(서울) → 도착 도시 비행 애니메이션
   - 지도: data/countries-110m.json (world-atlas 110m TopoJSON)
           → topojson-client로 GeoJSON 변환 → d3-geo로 SVG 렌더링
   - 순서: 곡선 경로가 그려지며 비행기가 따라 이동 → 목적지로 확대 → 결과 화면
   - 전체 2초 이내, '건너뛰기' 버튼 / Esc로 바로 넘어가기
   - 기기의 '동작 줄이기'(prefers-reduced-motion)가 켜져 있으면 재생하지 않음
   - 외부 API 호출 없음 (라이브러리는 js/vendor/, 지도는 data/에 포함)
   ========================================================= */
const TRIP = {
  ORIGIN_ID: "seoul",
  DRAW_MS: 1000,  // 경로 그리기 + 비행기 이동
  ZOOM_MS: 550,   // 목적지로 확대
  HOLD_MS: 80,    // 확대 후 잠깐 멈춤
  FADE_MS: 150,   // 화면 사라지기 (CSS와 맞춤) → 합계 약 1.8초
  played: new Set(), // 이번 접속에서 이미 보여 준 도시 (도시당 1번)
};
// 지도 데이터 불러오기(loadWorld)·바탕 지도 그리기(drawWorldBase)는 world.js에 있어요.

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// 재생할지: 도시가 있고, 출발지와 다르고, 아직 안 봤고, 동작 줄이기가 꺼져 있을 때
function shouldPlayTrip(city) {
  if (!city || city.id === TRIP.ORIGIN_ID) return false;
  if (TRIP.played.has(city.id)) return false;
  if (prefersReducedMotion() || !worldLibsReady()) return false;
  return true;
}

const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2); // easeInOutCubic
const lerp = (a, b, u) => a + (b - a) * u;

// 비행기 모양 (오른쪽을 향함, 가운데가 0,0)
const PLANE_PATH =
  "M12 0 L-2 -2.6 L-6 -10 L-9 -10 L-6.4 -2.6 L-11 -2.2 L-13.5 -5.5 L-15.5 -5.5 L-14 0 " +
  "L-15.5 5.5 L-13.5 5.5 L-11 2.2 L-6.4 2.6 L-9 10 L-6 10 L-2 2.6 Z";

/**
 * 애니메이션 재생
 * @param {object} origin  출발 도시 (cities.json)
 * @param {object} dest    도착 도시
 * @param {{from:string,to:string,route:string}} labels  화면에 보일 이름
 * @param {Function} onArrive  끝나거나 건너뛰면 한 번 호출 (결과 화면 보여 주기)
 * @returns {Promise<void>}
 */
async function playTrip(origin, dest, labels, onArrive) {
  const world = await loadWorld();
  if (!world) { onArrive(); return; }

  const overlay = document.getElementById("trip");
  const box = document.getElementById("trip-map");
  const skipBtn = document.getElementById("trip-skip");
  document.getElementById("trip-route").textContent = labels.route;

  overlay.hidden = false;
  overlay.classList.remove("is-leaving");
  const W = box.clientWidth;
  const H = box.clientHeight;

  // ---- 투영: 두 도시의 중간을 가운데로, 둘이 넉넉히 들어오게 ----
  const a = [origin.lng, origin.lat];
  const b = [dest.lng, dest.lat];
  const distDeg = (d3.geoDistance(a, b) * 180) / Math.PI;
  const mid = d3.geoInterpolate(a, b)(0.5);
  // 화면에 맞출 범위: 두 도시를 잇는 대권 + 각 도시 주변 여백
  // (가까운 도시(서울-부산)도 너무 확대되지 않게 여백은 최소 4°)
  const margin = Math.max(4, distDeg * 0.15);
  const frame = {
    type: "GeometryCollection",
    geometries: [
      { type: "LineString", coordinates: [a, b] },
      d3.geoCircle().center(a).radius(margin)(),
      d3.geoCircle().center(b).radius(margin)(),
    ],
  };
  const projection = d3.geoNaturalEarth1()
    .rotate([-mid[0], 0]) // 경로 가운데를 화면 가운데로 (날짜변경선에서 지도가 끊기지 않게)
    .fitExtent([[20, 70], [W - 20, H - 80]], frame);
  const geoPath = d3.geoPath(projection);

  const p0 = projection(a);
  const p1 = projection(b);
  // 곡선(2차 베지어): 두 점의 가운데에서 위쪽으로 휜 제어점
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len;
  if (ny > 0) { nx = -nx; ny = -ny; } // 항상 위로 휘게
  const bend = Math.min(len * 0.28, H * 0.22);
  const c = [(p0[0] + p1[0]) / 2 + nx * bend, (p0[1] + p1[1]) / 2 + ny * bend];
  const bez = (u) => [
    (1 - u) ** 2 * p0[0] + 2 * (1 - u) * u * c[0] + u ** 2 * p1[0],
    (1 - u) ** 2 * p0[1] + 2 * (1 - u) * u * c[1] + u ** 2 * p1[1],
  ];
  const bezAngle = (u) => {
    const tx = 2 * (1 - u) * (c[0] - p0[0]) + 2 * u * (p1[0] - c[0]);
    const ty = 2 * (1 - u) * (c[1] - p0[1]) + 2 * u * (p1[1] - c[1]);
    return (Math.atan2(ty, tx) * 180) / Math.PI;
  };

  // ---- SVG 그리기 ----
  box.replaceChildren();
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, "aria-hidden": "true" }, box);
  const mapLayer = drawWorldBase(svg, geoPath, world, W, H); // 확대될 층 (지도 + 경로)
  const route = svgEl("path", { class: "trip-route-line", d: `M${p0} Q${c} ${p1}` }, mapLayer);
  const routeLen = route.getTotalLength();
  route.style.strokeDasharray = `${routeLen}`;
  route.style.strokeDashoffset = `${routeLen}`;

  // 점·이름·비행기는 확대해도 크기가 그대로이도록 따로 둠
  const marks = svgEl("g", {}, svg);
  const originDot = svgEl("circle", { class: "trip-dot", r: 4.5 }, marks);
  const originText = svgEl("text", { class: "trip-label", "text-anchor": "middle" }, marks);
  originText.textContent = labels.from;
  const destPulse = svgEl("circle", { class: "trip-pulse", r: 6 }, marks);
  const destDot = svgEl("circle", { class: "trip-dot is-dest", r: 6 }, marks);
  const destText = svgEl("text", { class: "trip-label is-dest", "text-anchor": "middle" }, marks);
  destText.textContent = labels.to;
  const plane = svgEl("g", { class: "trip-plane" }, marks);
  svgEl("path", { d: PLANE_PATH }, plane);

  // 확대 상태(k, tx, ty)에서 지도 좌표 → 화면 좌표
  let k = 1, tx = 0, ty = 0;
  const toScreen = ([x, y]) => [x * k + tx, y * k + ty];
  const place = (node, [x, y], dyText = 0) => {
    if (node.tagName === "text") { node.setAttribute("x", x); node.setAttribute("y", y + dyText); }
    else { node.setAttribute("cx", x); node.setAttribute("cy", y); }
  };

  const K = Math.min(3, Math.max(1.6, distDeg / 25)); // 최종 확대 배율 (먼 도시일수록 크게)
  const targetTx = W / 2 - K * p1[0];
  const targetTy = H / 2 - K * p1[1];
  const T1 = TRIP.DRAW_MS;
  const T2 = T1 + TRIP.ZOOM_MS;
  const T3 = T2 + TRIP.HOLD_MS;

  return new Promise((resolve) => {
    let raf = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      skipBtn.removeEventListener("click", finish);
      document.removeEventListener("keydown", onKey);
      TRIP.played.add(dest.id);
      onArrive();                         // 뒤에 결과 화면을 먼저 그려 두고
      overlay.classList.add("is-leaving"); // 지도는 살짝 사라지게
      setTimeout(() => {
        overlay.hidden = true;
        overlay.classList.remove("is-leaving");
        box.replaceChildren();
        resolve();
      }, TRIP.FADE_MS);
    };
    const onKey = (e) => { if (e.key === "Escape") finish(); };
    skipBtn.addEventListener("click", finish);
    document.addEventListener("keydown", onKey);
    skipBtn.focus({ preventScroll: true });

    const start = performance.now();
    const frame = (now) => {
      const t = now - start;

      // 1) 경로 그리기 + 비행기 이동
      const u = ease(Math.min(1, t / T1));
      route.style.strokeDashoffset = `${routeLen * (1 - u)}`;

      // 2) 목적지로 확대
      const v = t <= T1 ? 0 : ease(Math.min(1, (t - T1) / (T2 - T1)));
      k = lerp(1, K, v);
      tx = lerp(0, targetTx, v);
      ty = lerp(0, targetTy, v);
      mapLayer.setAttribute("transform", `translate(${tx} ${ty}) scale(${k})`);

      const s0 = toScreen(p0), s1 = toScreen(p1);
      place(originDot, s0); place(originText, s0, -10);
      place(destDot, s1); place(destPulse, s1); place(destText, s1, -14);
      const [px, py] = toScreen(bez(u));
      plane.setAttribute("transform", `translate(${px} ${py}) rotate(${bezAngle(Math.min(u, 0.999))})`);
      plane.style.opacity = `${1 - v}`;
      destPulse.classList.toggle("is-on", u >= 1);

      if (t >= T3) finish();
      else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  });
}
