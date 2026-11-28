/* =========================================================
   TravelTalk — 세계지도 데이터 (비행 애니메이션·저장 지도 공용)
   - data/countries-110m.json (world-atlas 110m TopoJSON)
     → topojson-client로 GeoJSON 변환 (한 번만 하고 다시 씀)
   - JSON을 못 읽으면(file://) data/countries-110m.js 사본 사용
   ========================================================= */
const WORLD = {
  data: null,    // { land, borders } GeoJSON
  loading: null, // 불러오는 중인 Promise (동시에 여러 번 불러도 한 번만)
};

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}, parent) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.append(node);
  return node;
}

function worldLibsReady() {
  return typeof d3 !== "undefined" && typeof d3.geoPath === "function" && typeof topojson !== "undefined";
}

async function loadWorld() {
  if (WORLD.data) return WORLD.data;
  if (!worldLibsReady()) return null;
  WORLD.loading ||= (async () => {
    let topo = null;
    try {
      topo = await fetch("data/countries-110m.json").then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    } catch {
      topo = window.TRAVELTALK_DATA?.world || null;
    }
    if (!topo) return null;
    return {
      land: topojson.feature(topo, topo.objects.land),
      borders: topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b),
    };
  })();
  WORLD.data = await WORLD.loading;
  if (!WORLD.data) WORLD.loading = null; // 실패하면 다음에 다시 시도
  return WORLD.data;
}

// 바다·경위선·육지·국경을 그린 지도 층을 만들어 돌려줌
function drawWorldBase(svg, geoPath, world, W, H) {
  svgEl("rect", { class: "map-ocean", width: W, height: H }, svg);
  const layer = svgEl("g", {}, svg);
  svgEl("path", { class: "map-graticule", d: geoPath(d3.geoGraticule10()) }, layer);
  svgEl("path", { class: "map-land", d: geoPath(world.land) }, layer);
  svgEl("path", { class: "map-borders", d: geoPath(world.borders) }, layer);
  return layer;
}

// 여러 점이 경도로 넓게 퍼져 있을 때: 점이 없는 가장 넓은 구간을 지도 가장자리로 보내는 회전값
// (예: 뉴욕·서울·파리 → 태평양 가운데가 아니라 대서양/태평양 중 빈 쪽이 가장자리로)
function bestRotation(lngs) {
  if (!lngs.length) return 0;
  const s = [...lngs].sort((a, b) => a - b);
  let widest = -1, gapMid = 0;
  for (let i = 0; i < s.length; i++) {
    const next = i === s.length - 1 ? s[0] + 360 : s[i + 1];
    if (next - s[i] > widest) { widest = next - s[i]; gapMid = s[i] + (next - s[i]) / 2; }
  }
  return -(gapMid + 180); // 빈 구간 반대편을 가운데로
}
