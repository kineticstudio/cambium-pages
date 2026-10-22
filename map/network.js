/* Cambium supply network map. Generated from the Studio design
   (clients/cambium/designs/03-Sawmills-Page-V3.html); do not edit by hand.
   Needs d3 7.9 and topojson-client 3.1 loaded first (see embed.html). */
(() => {
"use strict";

/* =====================================================================
   1. DATA
   Straight from the "Supplier Landing Page Data" Google Sheet.
   To update: on each Display tab, select the header row plus every data
   row, copy, and paste between the backticks. A paste from the sheet
   comes in tab-separated and works as-is.
   Only the columns named in the header below are read, so a stray
   internal column (like real mill names) never reaches the page.
   Rows without a region stay off the map.
   ===================================================================== */
const SAWMILLS = (window.CAMBIUM_NETWORK || {}).sawmills || `
Number | Display Name | Region | Cambium Status | Program Status | Capacity Status | Species
01 | Southern Preferred Mill | South | Preferred | Active | Available | White Pine, Red Oak, White Oak, Poplar
02 | Southern Preferred Mill | South | Preferred | Active | Available | Southern Yellow Pine, Ash, Red Oak, White Oak, Poplar, Hickory, Maple, Cypress
03 | Midwestern Preferred Mill | Midwest | Preferred | Active | Available | TBD
04 | Northeastern Preferred Mill | Northeast | Preferred | Active | Available | Ash, Basswood, Beech, Cherry, Hickory, Poplar, Red Oak, Soft Maple, Walnut, White Oak
05 | Western Preferred Mill | West | Preferred | Active | Available | Douglas Fir, Western Red Cedar, Hemlock, Alaska Yellow Cedar, Southern Yellow Pine, Oregon White Oak, Maple, Tanoak, Madrone, Chinquapin, Myrtle, Oregon Ash
06 | Western Qualified Mill | West | Qualified | Active | Full | Ponderosa Pine, Douglas Fir, Western Red Cedar, Incense Cedar, Hemlock, Western Juniper
07 | Western Qualified Mill | West | Qualified | Active | Full | Orchard Walnut, Almond
08 | Northeastern Qualified Mill | Northeast | Qualified | Active | Available | Poplar, White Oak, Red Oak, Hickory
09 | Northeastern Qualified Mill | Northeast | Qualified | Active | Full | White Oak
10 | Western Qualified Mill | West | Qualified | Validation | Available | Hemlock, White Fir
11 | Midwestern Qualified Mill | Midwest | Qualified | Active | Available | SPF-S, Eastern White Pine
12 | Midwestern Qualified Mill | Midwest | Qualified | Active | Available | SPF-S, Eastern White Pine
13 | Western Qualified Mill | West | Qualified | Active | Available | Ponderosa Pine, Aspen
14 | Midwestern Qualified Mill | Midwest | Qualified | Active | Available | White Oak, Ash, Elm, Black Walnut
`;

const PROGRAMS = (window.CAMBIUM_NETWORK || {}).programs || `
Number | Display Name | Region | Species | Annual BF | Program Type | Program Status
01 | Furniture Program | Northeast | Thermal Oak | 44,380 | Recurring | Active
02 | Furniture Program | West | English Walnut | 30,000 | Recurring | Active
03 | Furniture Program | Midwest | Red Oak | 25,000 | Recurring | Active
04 | Furniture Program | West | Doug Fir | 25,000 | Recurring | Active
05 | Furniture Program | West | English Walnut | 2,000 | Recurring | Active
06 | Sauna Program | Northeast | Thermal Poplar | 15,000 | Recurring | Active
07 | Sauna Program | Midwest | Thermal Ash | 10,000 | Recurring | Active
08 | CSW Millwork Program | West | Silky Cedar | 30,000 | Recurring | Active
09 | CSW Millwork Program | Northeast | Thermal Oak | 50,000 | Recurring | Active
10 | Finished Goods Program | Northeast | Poplar | 480,000 | Recurring | Active
11 | Furniture Program | Northeast | White Oak | 5,000 | Recurring | Active
12 | Furniture Program | Northeast | White Oak | 5,000 | Recurring | Active
13 | Mass Timber Stock Program | South | Southern Yellow Pine | 100,000 | Recurring | Active
14 | Countertop Program | West | Alder, Oregon White Oak | 5,000 | Recurring | Active
15 | CSW Millwork Program | West | Hemlock, White Fir | 5,000 | Recurring | Active
16 | CSW Finished Goods Program | West | Western Red Cedar | 5,000 | Recurring | Active
17 | Mass Timber Stock Program | West | Ponderosa Pine | 40,000 | Recurring | Testing
18 | Mass Timber Stock Program | West | Aspen | 40,000 | Recurring | Testing
19 | CSW Millwork Program | Midwest | White Oak, Ash | 30,000 | Recurring | Active
20 | CSW Millwork Program | Midwest | White Oak, Ash, Elm, Maple | 50,000 | Recurring | Active
21 | Millwork Program | Midwest | White Oak, Ash | 60,000 | Recurring | Active
22 | Furniture Program | Midwest | Cherry, White Oak, Red Oak, Ash, WalNOT, Maple | 20,000 | Recurring | Active
`;

/* "220+ mills and supply partners" comes from the page copy */
const PARTNERS = "220+";

/* Four regional hubs. Nothing finer than a region is ever plotted. */
const HUBS = [
  {name:"West",      lat:43.85, lng:-114.45},
  {name:"Midwest",   lat:41.89, lng:-96.80},
  {name:"South",     lat:31.17, lng:-87.89},
  {name:"Northeast", lat:44.17, lng:-76.03},
];

/* The states each hub lights up when it opens (FIPS codes) */
const REGION_STATES = {
  West:      "04 06 08 16 30 32 35 41 49 53 56",
  Midwest:   "17 18 19 20 26 27 29 31 38 39 46 55",
  South:     "01 05 12 13 21 22 28 37 40 45 47 48",
  Northeast: "09 10 11 23 24 25 33 34 36 42 44 50 51 54",
};

/* Sources: approximate native ranges. [lat, lng, radius in degrees] */
const SPECIES_RANGES = [
  {name:"Big Leaf Maple",       areas:[[47.2,-122.4,1.9],[44.2,-123.2,1.8],[39.6,-122.9,1.7]]},
  {name:"Black Walnut",         areas:[[39.2,-88.0,3.6],[36.2,-84.5,3.0],[41.4,-93.4,2.6],[39.4,-77.6,2.2],[35.6,-79.8,2.2],[38.6,-92.4,3.0],[39.8,-86.2,2.4]]},
  {name:"Cherry",               areas:[[41.6,-78.2,2.8],[38.2,-80.4,2.3],[43.2,-74.6,2.3],[44.6,-70.4,2.2],[41.8,-72.6,1.8],[40.4,-83.4,2.2]]},
  {name:"Eastern White Pine",   areas:[[44.8,-70.2,2.4],[43.6,-73.4,2.2],[45.4,-84.6,2.6],[46.4,-90.4,2.6],[41.6,-78.6,2.4],[35.8,-82.8,2.0]]},
  {name:"Douglas Fir",          areas:[[46.4,-122.3,2.2],[44.0,-121.8,2.2],[47.4,-116.2,2.2],[40.2,-121.4,1.8]]},
  {name:"English Walnut",       areas:[[38.6,-121.8,1.1],[36.6,-119.9,1.1]]},
  {name:"Juniper",              areas:[[43.6,-120.6,1.9],[40.2,-117.2,2.0],[39.2,-111.4,1.9]]},
  {name:"Madrone",              areas:[[38.6,-122.7,1.5],[42.4,-123.1,1.5]]},
  {name:"Oregon Ash",           areas:[[44.7,-123.1,1.1],[46.5,-122.9,1.0]]},
  {name:"Oregon White Oak",     areas:[[44.9,-123.2,1.3],[47.2,-122.7,1.1],[41.2,-123.1,1.1]]},
  {name:"Poplar",               areas:[[36.2,-82.2,2.8],[38.6,-79.4,2.3],[34.2,-85.4,2.6],[35.0,-80.6,2.4],[32.8,-83.4,2.4],[37.4,-77.4,2.0],[32.4,-88.6,2.2]]},
  {name:"Silky Cedar",          areas:[[46.6,-123.4,1.7],[44.2,-123.7,1.5]]},
  {name:"Soft Maple",           areas:[[43.2,-75.2,2.8],[44.4,-84.6,2.6],[40.2,-79.2,2.3],[45.2,-69.6,2.2],[43.6,-72.4,1.9],[39.4,-75.4,1.9],[45.0,-91.4,2.6],[31.4,-92.2,2.2]]},
  {name:"Southern Yellow Pine", areas:[[31.4,-92.4,2.8],[32.4,-88.2,2.6],[31.2,-83.6,2.8],[34.0,-79.6,2.6],[30.6,-95.2,2.6]]},
  {name:"Western Red Cedar",    areas:[[47.4,-122.6,1.9],[45.6,-123.4,1.7],[47.6,-116.2,1.7]]},
  {name:"Tanoak",               areas:[[40.2,-123.6,1.3],[42.4,-123.6,1.1]]},
  {name:"Western Larch",        areas:[[47.4,-114.6,1.7],[48.0,-117.4,1.4]]},
  {name:"White Oak",            areas:[[38.2,-83.2,3.2],[41.2,-77.2,2.6],[35.2,-88.2,2.8],[42.4,-85.4,2.6],[36.8,-78.8,2.4],[42.6,-73.2,2.2],[33.6,-82.2,2.4],[37.4,-92.6,3.0],[33.0,-86.8,2.4]]},
];

/* Autoplay tour: runs while the map is on screen, until someone touches it */
const TOUR_STEPS = [
  {hub:"West"}, {species:"Douglas Fir"},
  {hub:"Northeast"}, {species:"White Oak"},
  {hub:"South"}, {species:"Southern Yellow Pine"},
  {hub:"Midwest"}, {species:"Black Walnut"},
];

/* =====================================================================
   2. Parse the sheet rows
   ===================================================================== */
function readSheet(text){
  const rows = text.split(/\r?\n/).filter(r => r.trim());
  if(!rows.length) return [];
  const sep = rows[0].includes("\t") ? "\t" : "|";
  const cols = rows[0].split(sep).map(c => c.trim().toLowerCase());
  return rows.slice(1).map(r => {
    const cells = r.split(sep), o = {};
    cols.forEach((c, i) => { o[c] = (cells[i] || "").trim(); });
    return o;
  });
}
const clean = v => { v = (v || "").trim(); return /^(tbd|n\/a|na|-)$/i.test(v) ? "" : v; };
const listOf = v => clean(v) ? clean(v).split(/\s*,\s*/).filter(Boolean) : [];
const regionOf = v => (HUBS.find(h => h.name.toLowerCase() === (v || "").trim().toLowerCase()) || {}).name || null;

const MILLS = readSheet(SAWMILLS).map(r => ({
  cat:"sawmill", name:[clean(r["number"]), clean(r["display name"])].filter(Boolean).join(" "), region:regionOf(r["region"]),
  status:clean(r["cambium status"]), program:clean(r["program status"]),
  capacity:clean(r["capacity status"]), species:listOf(r["species"]),
})).filter(m => m.name);

const PROGS = readSheet(PROGRAMS).map(r => ({
  cat:"program", name:[clean(r["number"]), clean(r["display name"])].filter(Boolean).join(" "), region:regionOf(r["region"]),
  species:listOf(r["species"]), bf:clean(r["annual bf"]),
  type:clean(r["program type"]), status:clean(r["program status"]),
})).filter(p => p.name);

const offMap = [...MILLS, ...PROGS].filter(x => !x.region);
if(offMap.length) console.info("Not on the map (no region in the sheet):", offMap.map(x => x.name).join(", "));

/* Each hub holds its own mills and programs, spread evenly around its fan */
HUBS.forEach((h, i) => {
  h.idx = i;
  h.mills = MILLS.filter(m => m.region === h.name);
  h.progs = PROGS.filter(p => p.region === h.name);
  const spread = list => list.map((x, j) => [(j + .5) / list.length, x]);
  h.items = [...spread(h.mills), ...spread(h.progs)].sort((a, b) => a[0] - b[0]).map(e => e[1]);
  h.items.forEach(it => { it.hub = h; });
});

/* =====================================================================
   3. Elements + helpers
   ===================================================================== */
const $ = id => document.getElementById(id);
const root = $("net-map"), stage = $("net-stage"), canvas = $("net-dots"), svgEl = $("net-svg"), layer = $("net-layer");
const tip = $("net-tip"), peek = $("net-peek"), statusEl = $("net-status"), statusTx = $("net-status-text");
const regEl = $("net-regions");

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const TOUCH = matchMedia("(hover: none)").matches;

/* Scrolling the page under a resting cursor fires hover events too. Only
   treat a hover as a person when the mouse has actually moved. */
let LAST_MOVE = -1e9, LAST_XY = [NaN, NaN];
document.addEventListener("pointermove", e => {
  if(e.pointerType !== "mouse") return;
  if(Math.abs(e.clientX - LAST_XY[0]) + Math.abs(e.clientY - LAST_XY[1]) > .5) LAST_MOVE = performance.now();
  LAST_XY = [e.clientX, e.clientY];
}, {capture:true, passive:true});
const realHover = e => e.pointerType === "mouse" && performance.now() - LAST_MOVE < 150;

const GLYPH = {
  factory:"M2 20a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V8l-6 4V8l-6 4V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v3M2 20V9m3 12v-5h4v5",
  recurring:"M21 8a9 9 0 0 0-15.6-3.4L3 7M3 4v3.5h3.5M3 16a9 9 0 0 0 15.6 3.4L21 17M21 20v-3.5h-3.5",
  tree:"m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17zM12 22v-3",
};
const CAT = {
  sawmill:{label:"Sawmill", icon:"factory", ink:"var(--brown-mid)"},
  program:{label:"Recurring program", icon:"recurring", ink:"var(--brown-dark)"},
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + "s")}`;
const pct = (v, of) => `${(v / of * 100).toFixed(3)}%`;
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${GLYPH[name]}"/></svg>`;

/* The detail content: title + checklist, like the homepage hero tooltips */
const speciesLine = list => list.length <= 3 ? list.join(", ") : `${list.slice(0, 3).join(", ")} +${list.length - 3} more`;
function facts(p){
  if(p.cat === "sawmill") return [
    p.status && [`${p.status} partner`],
    p.program && [/active/i.test(p.program) ? "Active in recurring programs" : /valid/i.test(p.program) ? "In validation for programs" : `Programs ${p.program.toLowerCase()}`],
    p.capacity && (/full/i.test(p.capacity) ? ["At capacity", "no"] : [`Capacity ${p.capacity.toLowerCase()}`]),
    p.species.length && [speciesLine(p.species)],
  ].filter(Boolean);
  return [
    p.species.length && [speciesLine(p.species)],
    p.bf && [`${p.bf} BF per year`],
    (p.type || p.status) && [[p.type || "Program", p.status && (/active/i.test(p.status) ? "currently active" : p.status.toLowerCase())].filter(Boolean).join(", ")],
  ].filter(Boolean);
}
const detailHTML = p => `<p class="tip-title">${icon(CAT[p.cat].icon)}<span>${esc(p.name)}</span></p>` +
  `<ul class="checks">${facts(p).map(([t, kind]) => `<li${kind === "no" ? ' class="is-no"' : ""}>${esc(t)}</li>`).join("")}</ul>`;
const itemLabel = p => `${p.name}. ${CAT[p.cat].label} in the ${p.region} hub. ${facts(p).map(f => f[0]).join(". ")}.`;

/* Screen reader summary straight from the data */
$("net-sr").innerHTML = `<h3>The network by hub</h3>` + HUBS.map(h =>
  `<h4>${esc(h.name)}</h4><ul>${h.items.map(p => `<li>${esc(itemLabel(p))}</li>`).join("") || "<li>No featured partners yet</li>"}</ul>`).join("");

if(!window.d3 || !window.topojson){
  stage.insertAdjacentHTML("beforeend", `<p class="net-fallback">The network map could not load.</p>`);
  return;
}

/* =====================================================================
   4. State
   ===================================================================== */
const W = 960;
let H = 520, MODE = null, K = 1, DPR = 1, STEP = 0;
let STATES = null, NATION = null, HIT = null, DOTS = [], LAND = [], SRC = [];
let OPEN = null, PINNED = false, SP_HOVER = null, ACTIVE = null, SEL = null;
let REVEAL_T = null, IN_VIEW = false;
const PTR = {x:0, y:0, on:false}, LENS = {x:0, y:0, s:0}, RIPPLES = [];
const INK = {land:"#fffcf6", src:"#b9e4f8", lit:"#e8702f"};

const projection = d3.geoAlbersUsa();
const ctx = canvas.getContext("2d");
const svg = d3.select(svgEl);
const gLabels = svg.append("g");
const gSpokes = svg.append("g");
const gConn = svg.append("g");

/* =====================================================================
   5. Layout: the grid is sized in screen pixels, so the texture reads
   the same on a phone and on a wide monitor
   ===================================================================== */
function layout(force){
  const width = stage.clientWidth || 960;
  const mode = width < 720 ? "compact" : "full";
  const modeChanged = mode !== MODE;
  if(modeChanged){
    MODE = mode;
    root.classList.toggle("is-compact", MODE === "compact");
    H = MODE === "full" ? 520 : 600;
    stage.style.aspectRatio = `${W} / ${H}`;
    svgEl.setAttribute("viewBox", `0 0 ${W} ${H}`);
    projection.fitExtent(MODE === "full" ? [[124, 64], [W - 108, H - 6]] : [[14, 24], [W - 14, H - 30]], NATION);
    HUBS.forEach(h => { const p = projection([h.lng, h.lat]); h.cx = p[0]; h.cy = p[1]; });
    buildHit();
  }
  K = width / W;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * DPR);
  canvas.height = Math.round(width * H / W * DPR);
  const step = MODE === "full" ? Math.min(12, Math.max(7, 10.5 / K)) : 6.5 / K;
  if(modeChanged || force || Math.abs(step - STEP) / STEP > .12){
    STEP = step;
    buildDots(); buildSources(); buildLabels();
  }
  if(modeChanged){
    TOUR.token++; TOUR.on = false;
    OPEN = null; PINNED = false; SP_HOVER = null; ACTIVE = null;
    tip.classList.remove("is-shown"); gConn.selectAll("*").remove();
    drawHubs(); syncLabels(); syncStatus();
    layer.querySelectorAll(".pin").forEach(n => n.remove()); gSpokes.selectAll("*").remove();
    if(MODE === "compact"){
      SEL = SEL || HUBS.slice().sort((a, b) => b.items.length - a.items.length)[0];
      setHub(SEL, true); renderRegions();
    } else {
      regEl.innerHTML = "";
      syncHubs();
      setTimeout(() => { if(IN_VIEW) runTour(); }, 600);
    }
  } else if(ACTIVE){
    placeTip(ACTIVE);
  }
  requestDraw();
}

/* Offscreen "hit map": every state painted in its hub's color, so each grid
   point can ask which region it belongs to in one lookup */
function buildHit(){
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", {willReadFrequently:true});
  const path = d3.geoPath(projection, g);
  STATES.forEach(f => { g.beginPath(); path(f); g.fillStyle = `rgb(${(f.reg + 1) * 50},0,0)`; g.fill(); });
  HIT = g.getImageData(0, 0, W, H).data;
}
function regionAt(x, y){
  const xi = Math.min(W - 1, Math.max(0, Math.round(x))), yi = Math.min(H - 1, Math.max(0, Math.round(y)));
  const i = (yi * W + xi) * 4;
  if(HIT[i + 3] < 140) return -1;
  return Math.min(3, Math.max(0, Math.round(HIT[i] / 50) - 1));
}
function buildDots(){
  DOTS = [];
  const rowH = STEP * Math.sqrt(3) / 2;
  let row = 0;
  for(let y = rowH / 2; y < H; y += rowH, row++){
    for(let x = row % 2 ? STEP : STEP / 2; x < W; x += STEP){
      const reg = regionAt(x, y);
      if(reg < 0) continue;
      DOTS.push({x, y, reg, sp:null, a:-1, r:0, appear:140 + x / W * 950 + y / H * 160});
    }
  }
}
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/* Sources snap to the grid: a seeded pick of grid points inside each range */
function buildSources(){
  DOTS.forEach(d => { d.sp = null; });
  SPECIES_RANGES.forEach((sp, si) => {
    const rnd = mulberry32(si * 9973 + 17), cand = new Set();
    sp.areas.forEach(([lat, lng, rad]) => {
      const c = projection([lng, lat]);
      if(!c) return;
      const e = projection([lng, lat + rad * .72]);
      const R = e ? Math.hypot(e[0] - c[0], e[1] - c[1]) : 20;
      DOTS.forEach((d, i) => { if((d.x - c[0]) ** 2 + (d.y - c[1]) ** 2 <= R * R) cand.add(i); });
    });
    const arr = [...cand];
    for(let i = arr.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    const want = Math.round(Math.min(34, Math.max(14, sp.areas.length * 6)) * (MODE === "full" ? 1.15 : .8));
    arr.slice(0, want).forEach(i => { const d = DOTS[i]; (d.sp || (d.sp = [])).push(si); });
  });
  LAND = DOTS.filter(d => !d.sp);
  SRC = DOTS.filter(d => d.sp);
}

/* =====================================================================
   6. Canvas: dot field, cursor lens, ripples, region glow
   ===================================================================== */
let RAF = 0, LAST_T = 0;
const requestDraw = () => { if(!RAF) RAF = requestAnimationFrame(frame); };
function frame(now){
  RAF = 0;
  const dt = Math.min(50, now - (LAST_T || now)); LAST_T = now;
  const k = 1 - Math.pow(.8, dt / 16.7);
  let busy = false;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if(REVEAL_T == null || !DOTS.length) return;
  ctx.setTransform(K * DPR, 0, 0, K * DPR, 0, 0);

  const rt = now - REVEAL_T, revealing = !REDUCED && rt < 1900;
  if(revealing) busy = true;

  const lensOn = PTR.on && MODE === "full" ? 1 : 0;
  LENS.s += (lensOn - LENS.s) * k;
  LENS.x += (PTR.x - LENS.x) * Math.min(1, k * 1.7);
  LENS.y += (PTR.y - LENS.y) * Math.min(1, k * 1.7);
  if(Math.abs(lensOn - LENS.s) > .01 || (LENS.s > .01 && Math.hypot(PTR.x - LENS.x, PTR.y - LENS.y) > .4)) busy = true;
  const LR = STEP * 6.5, LR2 = LR * LR;

  for(let i = RIPPLES.length - 1; i >= 0; i--) if(now - RIPPLES[i].t0 > RIPPLE_MS) RIPPLES.splice(i, 1);
  if(RIPPLES.length) busy = true;

  const rLand = STEP * .16, rSrc = STEP * .26;
  const openReg = OPEN ? OPEN.idx : -1;
  const lit = SP_HOVER, dimLand = lit != null;

  for(let pass = 0; pass < 3; pass++){
    ctx.fillStyle = pass === 0 ? INK.land : pass === 1 ? INK.src : INK.lit;
    const list = pass === 0 ? LAND : SRC;
    for(let n = 0; n < list.length; n++){
      const d = list[n];
      const isLit = lit != null && d.sp && d.sp.includes(lit);
      if((pass === 1 && isLit) || (pass === 2 && !isLit)) continue;
      let ta, tr;
      if(pass === 0){
        ta = openReg >= 0 ? (d.reg === openReg ? .46 : .08) : .21;
        if(dimLand) ta = Math.min(ta, .14);
        tr = rLand;
      } else if(pass === 1){
        ta = openReg >= 0 ? (d.reg === openReg ? .95 : .28) : .88;
        if(lit != null) ta = .16;
        tr = rSrc;
      } else { ta = 1; tr = rSrc * 1.4; }
      if(d.a < 0){ d.a = ta; d.r = tr; }
      d.a += (ta - d.a) * k; d.r += (tr - d.r) * k;
      if(Math.abs(ta - d.a) > .004 || Math.abs(tr - d.r) > .004) busy = true;
      let a = d.a, r = d.r;
      if(revealing){
        const t = (rt - d.appear) / 460;
        if(t <= 0) continue;
        if(t < 1){ const e = t * t * (3 - 2 * t); a *= e; r *= .3 + .7 * e; }
      }
      if(LENS.s > .01){
        const dx = d.x - LENS.x, dy = d.y - LENS.y, dd = dx * dx + dy * dy;
        if(dd < LR2){ const f = (1 - Math.sqrt(dd) / LR) ** 2 * LENS.s; a += (pass === 0 ? .16 : .05) * f; r *= 1 + .3 * f; }
      }
      for(let q = 0; q < RIPPLES.length; q++){
        const rp = RIPPLES[q], t = now - rp.t0, dist = Math.hypot(d.x - rp.x, d.y - rp.y) - t * .42;
        const g = Math.exp(-(dist * dist) / 260) * (1 - t / RIPPLE_MS) ** 2;
        if(g > .01){ a += .14 * g; r *= 1 + .22 * g; }
      }
      if(a < .01) continue;
      ctx.globalAlpha = Math.min(1, a);
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, 6.2832); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  if(busy) requestDraw();
}
/* Kept deliberately quiet: a faint ring that fades before it crosses the map */
const RIPPLE_MS = 1100;
function ripple(x, y){ if(!REDUCED){ RIPPLES.push({x, y, t0:performance.now()}); requestDraw(); } }

/* =====================================================================
   7. Hubs (buttons on the map)
   ===================================================================== */
function drawHubs(){
  layer.querySelectorAll(".hub").forEach(n => n.remove());
  HUBS.forEach((h, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "hub glass";
    b.style.cssText = `--x:${pct(h.cx, W)};--y:${pct(h.cy, H)};--i:${i};--d:${(1.1 + i * .12).toFixed(2)}s`;
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-label", `${h.name} hub: ${plural(h.mills.length, "featured sawmill")}, ${plural(h.progs.length, "recurring program")}`);
    b.innerHTML = `<span class="hub__mark" aria-hidden="true">${icon("tree")}</span><span class="hub__name">${esc(h.name)}</span>`;
    const hover = e => {
      if(e.pointerType !== "mouse" || MODE !== "full") return;
      /* staying on an open hub always keeps it open; opening one needs a real move */
      if(OPEN === h && TOUR.stopped){ cancelClose(); return; }
      if(!realHover(e)) return;
      userTookOver(); cancelClose();
      if(OPEN !== h){ PINNED = false; setHub(h); }
    };
    b.addEventListener("pointerenter", hover);
    b.addEventListener("pointermove", hover);
    b.addEventListener("pointerleave", e => { if(e.pointerType === "mouse" && TOUR.stopped && MODE === "full" && !PINNED) scheduleClose(); });
    b.addEventListener("click", e => { e.stopPropagation(); userTookOver(); pressHub(h); });
    b.addEventListener("focus", () => {
      if(MODE !== "full" || !b.matches(":focus-visible")) return;
      userTookOver(); cancelClose();
      if(OPEN !== h){ PINNED = false; setHub(h); }
    });
    b.addEventListener("blur", e => {
      if(MODE === "full" && !PINNED && !(e.relatedTarget && layer.contains(e.relatedTarget))) scheduleClose();
    });
    layer.appendChild(b);
    h.el = b;
  });
}
function syncHubs(){
  layer.classList.toggle("has-open", !!OPEN);
  HUBS.forEach(h => { if(h.el) h.el.setAttribute("aria-expanded", h === OPEN ? "true" : "false"); });
}
function pressHub(h){
  if(MODE === "compact"){ selectRegion(h); return; }
  cancelClose();
  if(OPEN === h && PINNED){ PINNED = false; setHub(null); }
  else { PINNED = true; setHub(h); }
}
let CLOSE_T = null;
function cancelClose(){ clearTimeout(CLOSE_T); CLOSE_T = null; }
function scheduleClose(){ cancelClose(); CLOSE_T = setTimeout(() => { CLOSE_T = null; hideTip(); setHub(null); }, 380); }
function setHub(h, quiet){
  if(h === OPEN){ syncHubs(); return; }
  OPEN = h;
  hideTip(); syncHubs(); drawPins(); syncLabels(); syncStatus();
  if(h && !quiet) ripple(h.cx, h.cy);
  requestDraw();
}
function closeAll(){ cancelClose(); PINNED = false; hideTip(); setHub(null); hoverSpecies(null); }
/* Everything within reach of the open hub: the pill, every pin, and the
   space between them, with a comfortable margin */
function inFan(x, y){
  if(!OPEN) return false;
  let reach = 0;
  OPEN.items.forEach(p => { if(p.x != null) reach = Math.max(reach, Math.hypot(p.x - OPEN.cx, p.y - OPEN.cy)); });
  return Math.hypot(x - OPEN.cx, y - OPEN.cy) <= reach + (pinPx() / 2 + 34) / K;
}

/* =====================================================================
   8. Spokes + pins
   ===================================================================== */
const pinPx = () => MODE === "full" ? Math.min(34, Math.max(24, stage.clientWidth * .0235)) : 23;
/* A ring that would run off the map slides back in as one piece, so pins
   never bunch up against an edge */
function fitRing(items, pts, h){
  const m = (pinPx() / 2 + 6) / K;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const dx = Math.min(0, W - m - Math.max(...xs)) || Math.max(0, m - Math.min(...xs));
  const dy = Math.min(0, H - m - Math.max(...ys)) || Math.max(0, m - Math.min(...ys));
  return items.map((p, i) => Object.assign(p, {x:pts[i][0] + dx, y:pts[i][1] + dy, ox:h.cx, oy:h.cy}));
}
function fanLayout(h){
  const [r1, r2] = MODE === "full" ? [86, 124] : [54 / K, 80 / K], sq = MODE === "full" ? .78 : .9;
  const n = h.items.length, inner = Math.min(n, 10), pts = [];
  [[r1, inner, 0], [r2, n - inner, 1]].forEach(([rad, cap, ri]) => {
    for(let i = 0; i < cap; i++){
      const a = -Math.PI / 2 + (i / cap) * Math.PI * 2 + (ri ? Math.PI / cap : 0);
      pts.push([h.cx + Math.cos(a) * rad, h.cy + Math.sin(a) * rad * sq]);
    }
  });
  return fitRing(h.items, pts, h);
}
function spokeItems(){ return OPEN ? fanLayout(OPEN) : []; }
function drawPins(){
  layer.querySelectorAll(".pin:not(.is-gone)").forEach(el => {
    const p = el._p;
    el.classList.add("is-gone"); el.classList.remove("is-active", "is-dim"); el.tabIndex = -1;
    el.style.setProperty("--x", pct(p.ox, W)); el.style.setProperty("--y", pct(p.oy, H));
    setTimeout(() => el.remove(), 520);
  });
  gSpokes.selectAll("g.spoke:not(.is-gone)").classed("is-gone", true).classed("is-in", false)
    .each(function(){ const n = this; setTimeout(() => n.remove(), 450); });

  const items = spokeItems();
  if(!items.length) return;
  const anim = !REDUCED && !document.hidden;
  const after = new Map();
  const made = items.map((p, i) => {
    const d = `M${p.ox.toFixed(1)},${p.oy.toFixed(1)}L${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const g = gSpokes.append("g").attr("class", `spoke spoke--${p.cat}`).style("--fd", `${(-i * .41).toFixed(2)}s`);
    g.node().__p = p;
    g.append("path").attr("class", "ln-base").attr("d", d).attr("pathLength", 100);
    g.append("path").attr("class", "ln-flow").attr("d", d).attr("pathLength", 100);

    const b = document.createElement("button");
    b.type = "button";
    b.className = `pin pin--${p.cat}${anim ? " is-out" : ""}`;
    b._p = p;
    b.style.setProperty("--x", pct(anim ? p.ox : p.x, W));
    b.style.setProperty("--y", pct(anim ? p.oy : p.y, H));
    b.style.setProperty("--dl", `${i * 28}ms`);
    b.setAttribute("aria-label", itemLabel(p));
    if(MODE !== "full") b.tabIndex = -1;
    b.innerHTML = icon(CAT[p.cat].icon);
    const enter = e => {
      if(e.pointerType !== "mouse" || MODE !== "full") return;
      if(TOUR.stopped) cancelClose();
      if(!realHover(e) || (ACTIVE === p && TOUR.stopped)) return;
      userTookOver(); cancelClose(); showTip(p);
    };
    b.addEventListener("pointerenter", enter);
    b.addEventListener("pointermove", enter);
    b.addEventListener("pointerleave", e => {
      if(e.pointerType !== "mouse" || !TOUR.stopped || MODE !== "full") return;
      hideTip(); if(!PINNED) scheduleClose();
    });
    b.addEventListener("click", e => {
      e.stopPropagation(); userTookOver();
      if(MODE === "compact"){ flashCard(p); return; }
      cancelClose(); PINNED = true;
      if(ACTIVE === p && TOUCH) hideTip(); else showTip(p);
    });
    b.addEventListener("focus", () => { if(MODE === "full" && b.matches(":focus-visible")){ userTookOver(); cancelClose(); showTip(p); } });
    b.addEventListener("blur", e => {
      if(MODE !== "full") return;
      if(e.relatedTarget && e.relatedTarget.classList && e.relatedTarget.classList.contains("pin")) return;
      hideTip();
      if(!PINNED && !(e.relatedTarget && layer.contains(e.relatedTarget))) scheduleClose();
    });
    /* keep tab order: a hub, then its own pins */
    const anchor = after.get(p.hub) || p.hub.el;
    anchor.after(b); after.set(p.hub, b);
    return [b, g, p];
  });
  const go = () => made.forEach(([b, g, p]) => {
    b.classList.remove("is-out");
    b.style.setProperty("--x", pct(p.x, W)); b.style.setProperty("--y", pct(p.y, H));
    g.classed("is-in", true);
  });
  if(anim) requestAnimationFrame(() => requestAnimationFrame(go)); else go();
  setTimeout(() => made.forEach(([b]) => b.style.setProperty("--dl", "0s")), 900);
}

/* =====================================================================
   9. Tooltip + connector
   ===================================================================== */
function showTip(p){
  if(MODE !== "full") return;
  if(ACTIVE !== p){
    ACTIVE = p;
    tip.classList.remove("is-shown");
    tip.innerHTML = detailHTML(p);
    void tip.offsetWidth;
  }
  hidePeek();
  placeTip(p);
  tip.classList.add("is-shown");
  layer.querySelectorAll(".pin:not(.is-gone)").forEach(el => {
    el.classList.toggle("is-active", el._p === p);
    el.classList.toggle("is-dim", el._p !== p);
  });
  gSpokes.selectAll("g.spoke").classed("is-dim", function(){ return this.__p !== p; });
}
function hideTip(){
  if(!ACTIVE && !tip.classList.contains("is-shown")) return;
  ACTIVE = null;
  tip.classList.remove("is-shown");
  layer.querySelectorAll(".pin").forEach(el => el.classList.remove("is-active", "is-dim"));
  gSpokes.selectAll("g.spoke").classed("is-dim", false);
  gConn.selectAll("*").remove();
}
/* Sit beside the point, on the far side from its hub, clear of the status
   pill and the open hub. Covering a few other pins is fine. */
function placeTip(d){
  const pw = tip.offsetWidth, ph = tip.offsetHeight, CW = stage.clientWidth, CH = stage.clientHeight, gap = 30, m = 8;
  const px = d.x * K, py = d.y * K, hx = d.hub.cx * K, hy = d.hub.cy * K;
  const sr = stage.getBoundingClientRect();
  const blocks = [statusEl, OPEN && OPEN.el].filter(Boolean).map(el => {
    const r = el.getBoundingClientRect();
    return {l:r.left - sr.left - 8, t:r.top - sr.top - 8, r:r.right - sr.left + 8, b:r.bottom - sr.top + 8};
  });
  /* keep clear of the site's floating nav (anything marked data-net-avoid) */
  document.querySelectorAll("[data-net-avoid]").forEach(el => {
    const bottom = Math.max(0, ...[...el.querySelectorAll("*")].map(c => c.getBoundingClientRect().bottom).filter(b => b > 0));
    if(bottom) blocks.push({l:-1e4, t:-1e4, r:1e4, b:bottom - sr.top + 10});
  });
  const others = [...layer.querySelectorAll(".pin:not(.is-gone)")].filter(el => el._p !== d).map(el => [el._p.x * K, el._p.y * K]);
  const overlap = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
  const out = Math.atan2(py - hy, px - hx);
  /* candidates fan around the point, plus straight beside it; every one is
     scored, so the least-bad spot wins instead of a blind fallback */
  const cands = [];
  for(let k = 0; k < 16; k++){
    const ang = out + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 8);
    cands.push([px + Math.cos(ang) * (gap + pw / 2) - pw / 2, py + Math.sin(ang) * (gap + ph / 2) - ph / 2, k * 6]);
  }
  [-1, 1].forEach(s => [.15, .5, .85].forEach(f => cands.push([s < 0 ? px - gap - pw : px + gap, py - ph * f, 30])));
  let best = null;
  cands.forEach(([x, y, cost]) => {
    const l = Math.max(m, Math.min(x, CW - pw - m)), t = Math.max(m, Math.min(y, CH - ph - m));
    const rect = {l, t, r:l + pw, b:t + ph};
    const buried = px > rect.l - 18 && px < rect.r + 18 && py > rect.t - 18 && py < rect.b + 18;
    const blocked = blocks.reduce((s, b) => s + overlap(rect, b), 0);
    const covered = others.filter(([ox, oy]) => ox > rect.l - 14 && ox < rect.r + 14 && oy > rect.t - 14 && oy < rect.b + 14).length;
    const score = cost + covered * 14 + blocked * .08 + Math.hypot(l - x, t - y) * .5 + (buried ? 1e6 : 0);
    if(!best || score < best.score) best = {l, t, score};
  });
  tip.style.left = best.l + "px";
  tip.style.top = best.t + "px";
  drawConn(d, best.l, best.t, pw, ph);
}
function drawConn(d, l, t, pw, ph){
  gConn.selectAll("*").remove();
  const L = l / K, T = t / K, R = (l + pw) / K, B = (t + ph) / K;
  if(d.x > L && d.x < R && d.y > T && d.y < B) return;
  const cx = (L + R) / 2, cy = (T + B) / 2, vx = cx - d.x, vy = cy - d.y;
  let s = 0;
  if(vx > 0) s = Math.max(s, (L - d.x) / vx); else if(vx < 0) s = Math.max(s, (R - d.x) / vx);
  if(vy > 0) s = Math.max(s, (T - d.y) / vy); else if(vy < 0) s = Math.max(s, (B - d.y) / vy);
  s = Math.min(1, Math.max(0, s));
  const ax = d.x + vx * s, ay = d.y + vy * s, len = Math.hypot(ax - d.x, ay - d.y), r0 = (pinPx() / 2 + 5) / K;
  if(len <= r0 + 3) return;
  const sx = d.x + (ax - d.x) / len * r0, sy = d.y + (ay - d.y) / len * r0;
  const path = `M${sx.toFixed(1)},${sy.toFixed(1)}L${ax.toFixed(1)},${ay.toFixed(1)}`;
  const g = gConn.append("g").attr("class", "conn");
  g.append("path").attr("class", "ln-base").attr("d", path).attr("pathLength", 100);
  g.append("path").attr("class", "ln-flow").attr("d", path).attr("pathLength", 100);
  requestAnimationFrame(() => g.classed("is-in", true));
}

/* Species under a resting cursor */
let PEEK_T = 0;
function schedulePeek(){
  clearTimeout(PEEK_T);
  peek.classList.remove("is-shown");
  if(MODE !== "full" || OPEN || ACTIVE || SP_HOVER != null) return;
  PEEK_T = setTimeout(showPeek, 170);
}
function showPeek(){
  if(!PTR.on || OPEN || ACTIVE || SP_HOVER != null) return;
  const R2 = (STEP * 1.6) ** 2, found = new Set();
  for(const d of SRC) if((d.x - PTR.x) ** 2 + (d.y - PTR.y) ** 2 <= R2) d.sp.forEach(si => found.add(si));
  if(!found.size) return;
  const names = [...found].map(si => SPECIES_RANGES[si].name);
  peek.textContent = names.slice(0, 2).join(" · ") + (names.length > 2 ? ` +${names.length - 2}` : "");
  const px = PTR.x * K, py = PTR.y * K, w = peek.offsetWidth;
  const x = px + 18 + w > stage.clientWidth ? px - 18 - w : px + 18;
  peek.style.transform = `translate(${x.toFixed(0)}px,${(py + 16).toFixed(0)}px)`;
  peek.classList.add("is-shown");
}
function hidePeek(){ clearTimeout(PEEK_T); peek.classList.remove("is-shown"); }

/* =====================================================================
   10. Species names in the margins (field-guide annotation)
   ===================================================================== */
const KEEP = 36;
const hubCenters = () => HUBS.map(h => [h.cx, h.cy]);
const hubClear = (x, y) => d3.min(hubCenters(), c => Math.hypot(c[0] - x, c[1] - y)) ?? 1e6;
function buildLabels(){
  gLabels.selectAll("*").remove();
  if(MODE !== "full") return;
  const labels = [], dots = [];
  SPECIES_RANGES.forEach((sp, si) => {
    const mine = SRC.filter(d => d.sp.includes(si)).map(d => ({si, x:d.x, y:d.y}));
    dots.push(...mine);
    if(!mine.length) return;
    const side = d3.mean(mine, p => p.x) < W / 2 ? -1 : 1;
    const free = mine.filter(p => hubClear(p.x, p.y) >= KEEP + 4);
    let ax, ay;
    if(free.length){
      const pick = free.reduce((a, b) => (b.x * side > a.x * side ? b : a)); ax = pick.x; ay = pick.y;
    } else {
      const pick = mine.reduce((a, b) => hubClear(b.x, b.y) > hubClear(a.x, a.y) ? b : a);
      const h = hubCenters().reduce((a, b) => Math.hypot(b[0] - pick.x, b[1] - pick.y) < Math.hypot(a[0] - pick.x, a[1] - pick.y) ? b : a);
      const ang = Math.atan2(pick.y - h[1], pick.x - h[0]);
      ax = h[0] + Math.cos(ang) * (KEEP + 8); ay = h[1] + Math.sin(ang) * (KEEP + 8);
    }
    labels.push({si, name:sp.name, ax, ay});
  });
  layoutLabels(labels, dots);
  const g = gLabels.selectAll("g.splab").data(labels).join("g").attr("class", "splab")
    .style("--d", (d, i) => `${(.95 + i * .035).toFixed(3)}s`)
    .on("pointerenter pointermove", (e, d) => {
      if(!realHover(e) || MODE !== "full") return;
      if(SP_HOVER === d.si && TOUR.stopped) return;
      userTookOver();
      if(OPEN) setHub(null);
      hoverSpecies(d.si);
    })
    .on("pointerleave", e => { if(e.pointerType === "mouse" && TOUR.stopped) hoverSpecies(null); })
    .on("click", (e, d) => { e.stopPropagation(); userTookOver(); if(OPEN) setHub(null); hoverSpecies(SP_HOVER === d.si ? null : d.si); });
  g.each(function(d){
    const el = d3.select(this), L = d.side === "L";
    el.append("path").attr("class", "ldr").attr("d", leaderPath(d));
    el.append("circle").attr("class", "anch").attr("cx", d.ax).attr("cy", d.ay).attr("r", 1.8);
    const w = d.name.length * 6.3 + 10;
    el.append("rect").attr("class", "hit").attr("x", L ? d.lx - w : d.lx - 5).attr("y", d.ly - 8).attr("width", w + 5).attr("height", 16);
    el.append("text").attr("x", d.lx).attr("y", d.ly + 3.5).attr("text-anchor", L ? "end" : "start").text(d.name);
  });
  syncLabels();
}
function segHit(p, q, cs){
  for(const c of cs){
    const vx = q[0] - p[0], vy = q[1] - p[1], L2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((c[0] - p[0]) * vx + (c[1] - p[1]) * vy) / L2));
    if(Math.hypot(p[0] + vx * t - c[0], p[1] + vy * t - c[1]) < KEEP) return c;
  }
  return null;
}
function pathOK(pts, cs){ for(let i = 0; i < pts.length - 1; i++) if(segHit(pts[i], pts[i + 1], cs)) return false; return true; }
function leaderPath(d){
  const L = d.side === "L", ex = L ? d.lx + 10 : d.lx - 10, cs = hubCenters(), sx = L ? -1 : 1, R = KEEP + 12;
  const cands = [
    [[d.ax, d.ay], [(d.ax + ex) / 2, d.ly], [ex, d.ly]],
    [[d.ax, d.ay], [d.ax, d.ly], [ex, d.ly]],
  ];
  const near = cs.slice().sort((a, b) => Math.hypot(a[0] - d.ax, a[1] - d.ay) - Math.hypot(b[0] - d.ax, b[1] - d.ay))[0];
  if(near){
    const ang = Math.atan2(d.ay - near[1], d.ax - near[0]);
    const out = [near[0] + Math.cos(ang) * R, near[1] + Math.sin(ang) * R];
    const vy = d.ly < near[1] ? -1 : 1;
    cands.push(
      [[d.ax, d.ay], out, [ex, d.ly]],
      [[d.ax, d.ay], out, [near[0] + sx * R, d.ly], [ex, d.ly]],
      [[d.ax, d.ay], out, [near[0] + sx * R, near[1] + vy * R], [ex, d.ly]]
    );
  }
  let pts = cands.find(c => pathOK(c, cs)) || cands[cands.length - 1];
  pts = pts.filter((p, i, a) => !i || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 1);
  return "M" + pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L");
}
function layoutLabels(labels, dots){
  const MID = W / 2, COL_L = 114, COL_R = W - 140, GAP = 21;
  ["L", "R"].forEach(side => {
    const set = labels.filter(l => (l.ax < MID ? "L" : "R") === side).sort((a, b) => a.ay - b.ay);
    const span = H - 112, top = 76, lx = side === "L" ? COL_L : COL_R;
    let free = [[top, top + span]];
    HUBS.filter(h => Math.abs(h.cx - lx) < 150).forEach(h => {
      const a = h.cy - 52, b = h.cy + 52, out = [];
      free.forEach(([s, e]) => {
        if(b <= s || a >= e){ out.push([s, e]); return; }
        if(a > s) out.push([s, a]);
        if(b < e) out.push([b, e]);
      });
      free = out;
    });
    if(free.length > 1) free = free.filter(([s, e]) => e - s >= GAP * 3);
    if(!free.length) free = [[top, top + span]];
    const total = free.reduce((t, [s, e]) => t + (e - s), 0) || span;
    if(side === "R"){
      const west = labels.filter(l => l.side === "L").sort((a, b) => a.ly - b.ly);
      const PITCH = west.length > 1 ? (west[west.length - 1].ly - west[0].ly) / (west.length - 1) : GAP;
      const need = (set.length - 1) * PITCH;
      const bands = HUBS.filter(h => Math.abs(h.cx - lx) < 150).map(h => [h.cy - 52, h.cy + 52]);
      const clamp = v => Math.max(top, Math.min(top + span - need, v));
      let start = clamp(west.length ? west[0].ly : top);
      bands.forEach(([a, b]) => {
        if(start + need <= a || start >= b) return;
        const up = clamp(a - need), down = clamp(b);
        const upOK = up + need <= a, downOK = down >= b;
        if(upOK && (!downOK || Math.abs(up - start) <= Math.abs(down - start))) start = up;
        else if(downOK) start = down;
      });
      set.forEach((l, i) => { l.ly = start + i * PITCH; l.side = side; l.lx = lx; });
      return;
    }
    set.forEach((l, i) => {
      let t = (set.length > 1 ? (i + .5) / set.length : .5) * total, y = free.length ? free[free.length - 1][1] : top + span;
      for(const [s, e] of free){ if(t <= e - s){ y = s + t; break; } t -= (e - s); }
      l.ly = y; l.side = side; l.lx = lx;
    });
    for(let pass = 0; pass < 40; pass++){
      set.forEach((l, i) => {
        const seg = free.find(([s, e]) => l.ly >= s - .5 && l.ly <= e + .5) || [top, top + span];
        const lo = Math.max(seg[0], i ? set[i - 1].ly + GAP : seg[0]);
        const hi = Math.min(seg[1], i < set.length - 1 ? set[i + 1].ly - GAP : seg[1]);
        if(hi >= lo) l.ly = Math.max(lo, Math.min(hi, l.ly + (l.ay - l.ly) * .35));
      });
    }
  });
  labels.filter(l => l.side === "R").forEach(l => {
    const mine = dots.filter(d => d.si === l.si && hubClear(d.x, d.y) >= KEEP + 4);
    if(!mine.length) return;
    const pick = mine.reduce((a, b) => Math.abs(b.y - l.ly) < Math.abs(a.y - l.ly) ? b : a);
    l.ax = pick.x; l.ay = pick.y;
  });
}
function hoverSpecies(si){
  if(SP_HOVER === si) return;
  SP_HOVER = si;
  if(si != null) hidePeek();
  syncLabels(); syncStatus(); syncChips(); requestDraw();
}
function syncLabels(){
  const any = SP_HOVER != null;
  gLabels.selectAll("g.splab").classed("lit", d => any && d.si === SP_HOVER).classed("off", d => any && d.si !== SP_HOVER);
  svgEl.classList.toggle("is-back", !any && !!OPEN);
}

/* =====================================================================
   11. Status pill, key, note
   ===================================================================== */
function syncStatus(){
  if(!statusTx) return; /* the pill was removed at Cambium's request, Oct 8 */
  let t;
  if(OPEN) t = `${OPEN.name} · ${plural(OPEN.mills.length, "sawmill")} · ${plural(OPEN.progs.length, "program")}`;
  else if(SP_HOVER != null) t = `${SPECIES_RANGES[SP_HOVER].name} sources`;
  else t = `${PARTNERS} mills and supply partners`;
  if(statusTx.textContent === t) return;
  statusTx.textContent = t;
  if(!REDUCED && REVEAL_T != null) statusTx.animate([{opacity:0, transform:"translateY(6px)"}, {opacity:1, transform:"none"}], {duration:360, easing:"cubic-bezier(.22,1,.36,1)"});
}
/* =====================================================================
   12. Phones: region tabs, swipeable cards, species chips
   ===================================================================== */
function renderRegions(){
  const tabs = HUBS.map(h => `<button type="button" role="tab" class="net-tab glass" data-hub="${esc(h.name)}" aria-selected="${h === SEL}">${esc(h.name)} <b>${h.items.length}</b></button>`).join("");
  const cards = SEL.items.length
    ? SEL.items.map(p => `<article class="nc glass" data-name="${esc(p.name)}">${detailHTML(p)}</article>`).join("")
    : `<p class="net-empty">No featured partners in this hub yet.</p>`;
  const chips = SPECIES_RANGES.map((s, i) => `<button type="button" class="net-chip" data-si="${i}" aria-pressed="${SP_HOVER === i}">${esc(s.name)}</button>`).join("");
  regEl.innerHTML = `<div class="net-tabs" role="tablist" aria-label="Hubs">${tabs}</div>` +
    `<div class="net-cards" role="tabpanel" aria-label="${esc(SEL.name)} hub">${cards}</div>` +
    `<p class="net-sub">Sources</p><div class="net-chips">${chips}</div>`;
  regEl.querySelectorAll(".net-tab").forEach(b => b.addEventListener("click", () => selectRegion(HUBS.find(h => h.name === b.dataset.hub))));
  regEl.querySelectorAll(".net-chip").forEach(b => b.addEventListener("click", () => {
    const si = +b.dataset.si;
    hoverSpecies(SP_HOVER === si ? null : si);
  }));
}
function selectRegion(h){
  if(!h) return;
  SEL = h;
  hoverSpecies(null);
  if(OPEN === h){ ripple(h.cx, h.cy); } else { OPEN = null; setHub(h); }
  renderRegions();
}
function syncChips(){
  regEl.querySelectorAll(".net-chip").forEach(b => b.setAttribute("aria-pressed", +b.dataset.si === SP_HOVER ? "true" : "false"));
}
function flashCard(p){
  const el = [...regEl.querySelectorAll(".nc")].find(n => n.dataset.name === p.name);
  if(!el) return;
  const row = el.parentElement;
  row.scrollTo({left:el.offsetLeft - row.offsetLeft - parseFloat(getComputedStyle(row).paddingLeft), behavior:REDUCED ? "auto" : "smooth"});
  el.classList.add("flash");
  setTimeout(() => el.classList.remove("flash"), 1100);
}

/* =====================================================================
   13. Tour + first reveal
   ===================================================================== */
const TOUR = {on:false, stopped:REDUCED, i:0, token:0};
const wait = (ms, tok) => new Promise((res, rej) => setTimeout(() => tok === TOUR.token ? res() : rej(0), ms));
async function runTour(){
  if(TOUR.on || TOUR.stopped || MODE !== "full" || REVEAL_T == null) return;
  const tok = ++TOUR.token;
  TOUR.on = true;
  let skipped = 0;
  try{
    while(skipped < TOUR_STEPS.length){
      const s = TOUR_STEPS[TOUR.i++ % TOUR_STEPS.length];
      if(s.hub){
        const h = HUBS.find(x => x.name === s.hub);
        if(!h || !h.items.length){ skipped++; continue; }
        skipped = 0;
        setHub(h); await wait(1200, tok);
        const m = h.items.find(x => x.cat === "sawmill"), p = h.items.find(x => x.cat === "program");
        if(m){ showTip(m); await wait(3600, tok); }
        if(p){ showTip(p); await wait(3600, tok); }
        hideTip(); setHub(null); await wait(900, tok);
      } else {
        const si = SPECIES_RANGES.findIndex(x => x.name === s.species);
        if(si < 0){ skipped++; continue; }
        skipped = 0;
        hoverSpecies(si); await wait(2800, tok);
        hoverSpecies(null); await wait(800, tok);
      }
    }
  } catch(e){ /* cancelled */ }
}
function pauseTour(){
  if(!TOUR.on) return;
  TOUR.token++; TOUR.on = false;
  hideTip(); setHub(null); hoverSpecies(null);
}
/* The first real touch hands the map over for good; whatever hub is open
   stays open and the caller decides what happens next */
function userTookOver(){
  if(TOUR.stopped) return;
  TOUR.stopped = true;
  if(TOUR.on){ TOUR.token++; TOUR.on = false; cancelClose(); hideTip(); hoverSpecies(null); }
}
function reveal(){
  if(REVEAL_T != null) return;
  REVEAL_T = performance.now();
  root.classList.remove("pre");
  requestDraw();
  setTimeout(() => root.classList.add("settled"), 2300);
  setTimeout(() => { if(IN_VIEW) runTour(); }, REDUCED ? 0 : 2500);
}

/* =====================================================================
   14. Wiring
   ===================================================================== */
stage.addEventListener("pointermove", e => {
  if(e.pointerType !== "mouse" || MODE !== "full") return;
  const r = stage.getBoundingClientRect();
  PTR.x = (e.clientX - r.left) / K; PTR.y = (e.clientY - r.top) / K;
  if(!PTR.on){ PTR.on = true; LENS.x = PTR.x; LENS.y = PTR.y; }
  /* the trip from a hub out to one of its pins crosses empty map; stay open
     the whole time the cursor is around the fan, close once it leaves */
  if(OPEN && TOUR.stopped && !PINNED){
    if(inFan(PTR.x, PTR.y)) cancelClose(); else if(!CLOSE_T) scheduleClose();
  }
  requestDraw();
  schedulePeek();
});
stage.addEventListener("pointerleave", e => {
  PTR.on = false; hidePeek(); requestDraw();
  if(e.pointerType === "mouse" && OPEN && TOUR.stopped && !PINNED && MODE === "full") scheduleClose();
});
stage.addEventListener("click", e => {
  userTookOver();
  const r = stage.getBoundingClientRect();
  ripple((e.clientX - r.left) / K, (e.clientY - r.top) / K);
  if(MODE === "full") closeAll();
  else hoverSpecies(null);
});
document.addEventListener("keydown", e => {
  if(e.key !== "Escape" || MODE !== "full" || !(OPEN || ACTIVE || SP_HOVER != null)) return;
  userTookOver();
  const back = OPEN && OPEN.el;
  closeAll();
  if(back && root.contains(document.activeElement)) back.focus({preventScroll:true});
});

new ResizeObserver(() => { if(NATION) layout(); }).observe(stage);
new IntersectionObserver(entries => {
  entries.forEach(en => {
    IN_VIEW = en.isIntersecting && en.intersectionRatio >= .35;
    if(!NATION) return;
    if(IN_VIEW){ if(REVEAL_T == null) reveal(); else runTour(); }
    else pauseTour();
  });
}, {threshold:[0, .35, .7]}).observe(stage);

fetch("https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json")
  .then(r => r.json())
  .then(us => {
    const regionIdx = {};
    HUBS.forEach((h, i) => REGION_STATES[h.name].split(" ").forEach(id => { regionIdx[id] = i; }));
    const geoms = us.objects.states.geometries.filter(g => g.id in regionIdx);
    STATES = topojson.feature(us, {type:"GeometryCollection", geometries:geoms}).features;
    STATES.forEach(f => { f.reg = regionIdx[f.id]; });
    NATION = {type:"Feature", properties:{}, geometry:topojson.merge(us, geoms)};
    layout(true);
    if(IN_VIEW) reveal();
  })
  .catch(err => {
    console.error("Network map failed to load", err);
    stage.insertAdjacentHTML("beforeend", `<p class="net-fallback">The network map could not load.</p>`);
  });
})();
