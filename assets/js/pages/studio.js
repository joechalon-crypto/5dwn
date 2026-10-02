// ============================================================================
// 5DWN Studio — pagina nascosta (studio.html) per generare grafiche PNG.
// Template 1: calendario settimanale "NFL Calendar", 16:9 (1920×1080) e 9:16 (1080×1920).
// Geometrie, colori e corpi dei testi sono misurati sul file di riferimento
// "NFL Calendar-selection (1).png" (riportato a 1920×1080).
// ============================================================================

import { renderChrome, loading, showError, esc, espnImg, weekLabel, weekRange, tvItalia, dayKey } from "../ui.js?v=202610021944";
import { getScoreboard, getWeek, getStandings, getSummary, getPlayerMedia, getWebPhotos, getTeams, getSchedule, currentWeekIndex } from "../api.js?v=202610021944";

renderChrome("");

const weekSelect = document.getElementById("week-select");
const status = document.getElementById("studio-status");
const stages = {
  wide: { root: document.getElementById("gfx-wide"), wrap: document.getElementById("preview-wide"), W: 1920, H: 1080 },
  tall: { root: document.getElementById("gfx-tall"), wrap: document.getElementById("preview-tall"), W: 1080, H: 1920 },
  afc: { root: document.getElementById("gfx-afc"), wrap: document.getElementById("preview-afc"), W: 1920, H: 1080 },
  nfc: { root: document.getElementById("gfx-nfc"), wrap: document.getElementById("preview-nfc"), W: 1920, H: 1080 },
  afcTall: { root: document.getElementById("gfx-afc-tall"), wrap: document.getElementById("preview-afc-tall"), W: 1080, H: 1920 },
  nfcTall: { root: document.getElementById("gfx-nfc-tall"), wrap: document.getElementById("preview-nfc-tall"), W: 1080, H: 1920 },
  game: { root: document.getElementById("gfx-game"), wrap: document.getElementById("preview-game"), W: 1920, H: 1080 },
  gameTall: { root: document.getElementById("gfx-game-tall"), wrap: document.getElementById("preview-game-tall"), W: 1080, H: 1920 },
  team: { root: document.getElementById("gfx-team"), wrap: document.getElementById("preview-team"), W: 1920, H: 1080 },
  player: { root: document.getElementById("gfx-player"), wrap: document.getElementById("preview-player"), W: 1920, H: 1080 },
};

// ---------------------------------------------------------------------------- palette del riferimento
// Colore di fondo cella (campionato) e colore del testo: scuro solo su fondi chiari.
const TEAM_CELL = {
  ARI: "#c8143c", ATL: "#d21f3c", BAL: "#2b1a72", BUF: "#0b4fc7", CAR: "#0a85d1", CHI: "#0b1f44", CIN: "#fb4f14", CLE: "#ff4a0d",
  DAL: "#0e2a55", DEN: "#fb4f14", DET: "#0076b6", GB: "#1f4a3a", HOU: "#0b2554", IND: "#0a44c2", JAX: "#0f8fa8", KC: "#e31837",
  LAC: "#0a7fe0", LAR: "#0054d6", LV: "#b5babd", MIA: "#139fb0", MIN: "#4f2683", NE: "#0b2552", NO: "#d3bc8d", NYG: "#1c3fc6",
  NYJ: "#125740", PHI: "#035e63", PIT: "#ffb612", SEA: "#0e2550", SF: "#aa0000", TB: "#d50a0a", TEN: "#102a5e", WSH: "#5a1414",
};
const DARK_TEXT = new Set(["PIT", "LV", "NO"]);
const NFL_SHIELD = "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png";
const DAZN_LOGO = "assets/img/dazn.png";
// Logo del sito (5 arancio) con "DWN" scuro per lo sfondo chiaro delle grafiche: ricavato da logo-5dwn.png.
const BRAND_LOGO = "assets/img/logo-5dwn-grafiche.png";

// Città delle partite internazionali (nome italiano, paese italiano).
const INTL = {
  London: ["Londra", "Regno Unito"], Dublin: ["Dublino", "Irlanda"], Munich: ["Monaco di Baviera", "Germania"],
  Berlin: ["Berlino", "Germania"], Frankfurt: ["Francoforte", "Germania"], Madrid: ["Madrid", "Spagna"],
  Paris: ["Parigi", "Francia"], "Mexico City": ["Città del Messico", "Messico"], "São Paulo": ["San Paolo", "Brasile"],
  "Sao Paulo": ["San Paolo", "Brasile"], "Rio de Janeiro": ["Rio de Janeiro", "Brasile"], Melbourne: ["Melbourne", "Australia"],
  Toronto: ["Toronto", "Canada"],
};
const COUNTRY_IT = { England: "Regno Unito", "United Kingdom": "Regno Unito", UK: "Regno Unito", Ireland: "Irlanda", Germany: "Germania", Spain: "Spagna", France: "Francia", Mexico: "Messico", Brazil: "Brasile", Australia: "Australia", Canada: "Canada" };

// ---------------------------------------------------------------------------- stili di testo
// Per ogni stile: famiglia e il campione del riferimento (testo, altezza maiuscole, larghezza inchiostro).
// Corpo e spaziatura vengono ricavati a runtime misurando il font reale.
const STYLES = {
  brand: { cls: "gt-brand", family: "Archivo", weight: 900, stretch: "semi-expanded", ref: ["5DWN", 26.3, 128.1] },
  week: { cls: "gt-week", family: "Archivo", weight: 900, stretch: "expanded", ref: ["WEEK 4", 93.2, 640.0] },
  sub: { cls: "gt-sub", family: "Archivo", weight: 500, stretch: "expanded", ref: ["ORARI ITALIA", 22.5, 408.9] },
  day: { cls: "gt-day", family: "Archivo", weight: 700, stretch: "expanded", ref: ["DOMENICA 4 OTTOBRE", 20.2, 430.4] },
  side: { cls: "gt-side", family: "Archivo", weight: 600, stretch: "normal", ref: ["FOOTBALL", 12.9, 120.3] },
  year: { cls: "gt-year", family: "Archivo", weight: 600, stretch: "normal", ref: ["QUINTO DOWN", 12.9, 153.5] },
  foot: { cls: "gt-foot", family: "Archivo", weight: 600, stretch: "normal", ref: ["TUTTI GLI ORARI IN ORA ITALIANA (CEST)", 12.1, 398.9] },
  team: { cls: "gt-team", family: "Barlow Condensed", weight: 600, stretch: "normal", ref: ["PITTSBURGH", 15.6, 95.3] },
  time: { cls: "gt-time", family: "Archivo", weight: 600, stretch: "normal", ref: ["02:15", 17.3, 64.3] },
  at: { cls: "gt-at", family: "Archivo", weight: 600, stretch: "normal", ref: ["@", 17.2, 18.9], ink: true }, // altezza del simbolo
  vs: { cls: "gt-vs", family: "Archivo", weight: 800, stretch: "normal", ref: ["VS", 14.3, 28.5] },
  band: { cls: "gt-band", family: "Barlow Condensed", weight: 600, stretch: "normal", ref: ["INTERNATIONAL GAME — LONDRA, REGNO UNITO", 15.6, 375.6] },
  score: { cls: "gt-score", family: "Archivo", weight: 900, stretch: "normal", ref: ["28", 23.9, 44.9] }, // misurato su "Risultati"
  // Template "Classifiche" (misurato su "NFL Standings-selection")
  stSub: { cls: "gt-sub", family: "Archivo", weight: 500, stretch: "expanded", ref: ["CLASSIFICA", 21.3, 359.7] },
  stDiv: { cls: "gt-day", family: "Archivo", weight: 700, stretch: "expanded", ref: ["AFC EAST", 21.2, 248.0] },
  stCol: { cls: "gt-st-col", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["PCT", 15.9, 32.0] },
  stNum: { cls: "gt-st-num", family: "Barlow Condensed", weight: 500, stretch: "normal", ref: ["1.000", 20.8, 57.3] },
  stT1: { cls: "gt-st-t1", family: "Barlow Condensed", weight: 500, stretch: "normal", ref: ["BUFFALO", 16.8, 69.1] },
  stT2: { cls: "gt-st-t2", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["BILLS", 18.8, 51.5] },
  stSide: { cls: "gt-st-side", family: "Archivo", weight: 600, stretch: "normal", ref: ["FOOTBALL", 12.3, 116.2] },
  stInk: { cls: "gt-year", family: "Archivo", weight: 600, stretch: "normal", ref: ["QUINTO", 13.5, 78.2] },
  stFoot: { cls: "gt-foot", family: "Archivo", weight: 600, stretch: "normal", ref: ["AMERICAN FOOTBALL CONFERENCE", 13.5, 414.6] },
  // Template "Partita della settimana" (misurato su "NFL Game of the Week-selection (1).png")
  // Template Calendario squadra ("NFL Team Schedule-selection.png", 10984×6180 → 1920×1080)
  tsName: { cls: "gt-ts-name", family: "Archivo", weight: 800, stretch: "normal", ref: ["MIAMI DOLPHINS", 84, 1051] },
  tsCal: { cls: "gt-sub", family: "Archivo", weight: 500, stretch: "expanded", ref: ["CALENDARIO 2026", 21, 519] },
  tsWeek: { cls: "gt-ts-week", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["W10", 20, 42] },
  tsDate: { cls: "gt-ts-date", family: "Barlow Condensed", weight: 600, stretch: "normal", ref: ["DOM 13/09", 18, 91] },
  tsCity: { cls: "gt-ts-city", family: "Barlow Condensed", weight: 600, stretch: "normal", ref: ["INDIANAPOLIS", 17, 114] },
  tsNick: { cls: "gt-ts-nick", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["RAIDERS", 20, 83] },
  tsScore: { cls: "gt-ts-score", family: "Archivo", weight: 700, stretch: "semi-condensed", ref: ["27", 21, 30] },
  tsTime: { cls: "gt-ts-time", family: "Archivo", weight: 800, stretch: "normal", ref: ["22:05", 22, 86] },
  tsBye: { cls: "gt-ts-bye", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["BYE", 19.5, 43] },
  tsBadge: { cls: "gt-ts-badge", family: "Archivo", weight: 800, stretch: "normal", ref: ["L", 18.5, 10] },
  tsFoot: { cls: "gt-foot", family: "Archivo", weight: 600, stretch: "normal", ref: ["TUTTI GLI ORARI IN ORA ITALIANA", 12, 328] },
  tsQd: { cls: "gt-year", family: "Archivo", weight: 600, stretch: "normal", ref: ["QUINTO DOWN 2026", 12.5, 212] },
  tsRecL: { cls: "gt-ts-rec", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["RECORD", 14, 68] },
  tsRecV: { cls: "gt-ts-recv", family: "Archivo", weight: 900, stretch: "normal", ref: ["0-3", 18, 42] },
  // Template Giocatore ("NFL Player Performance-selection.png", 11064×6224 → 1920×1080)
  pName: { cls: "gt-p-name", family: "Archivo", weight: 900, stretch: "condensed", ref: ["JA'MARR CHASE", 111, 1113] },
  pVs: { cls: "gt-p-vs", family: "Archivo", weight: 400, stretch: "normal", ref: ["contro i Texans", 27, 262] },
  pVal: { cls: "gt-p-val", family: "Archivo", weight: 800, stretch: "semi-condensed", ref: ["75", 93, 139], ink: true },
  pLabel: { cls: "gt-p-label", family: "Barlow Condensed", weight: 500, stretch: "normal", ref: ["TD su ricezione", 25, 208] },
  pRes: { cls: "gt-p-label", family: "Barlow Condensed", weight: 500, stretch: "normal", ref: ["Vittoria Bengals 20-6", 28, 314] },
  gCity: { cls: "gt-g-city", family: "Archivo", weight: 600, stretch: "expanded", ref: ["NEW ORLEANS", 13.5, 229.6] },
  gScore: { cls: "gt-g-score", family: "Archivo", weight: 800, stretch: "condensed", ref: ["24", 157.5, 207.4] },
  gVal: { cls: "gt-g-val", family: "Archivo", weight: 700, stretch: "normal", ref: ["298", 18.4, 43.8] },
  gLabel: { cls: "gt-g-label", family: "Archivo", weight: 600, stretch: "normal", ref: ["Yard totali", 14.4, 93.3] },
  gp: { cls: "gt-gp", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["GAME", 15.1, 41.0] },
};

const ctx = document.createElement("canvas").getContext("2d");
const fontStr = (st, size) => `${st.stretch && st.stretch !== "normal" ? `${st.stretch} ` : ""}${st.weight} ${size}px "${st.family}"`;

function calibrate() {
  for (const st of Object.values(STYLES)) {
    const [text, cap, ink] = st.ref;
    ctx.font = fontStr(st, 100);
    const g = ctx.measureText(st.ink ? text : "H");
    const capRatio = (st.ink ? g.actualBoundingBoxAscent + g.actualBoundingBoxDescent : g.actualBoundingBoxAscent) / 100;
    st.size = cap / capRatio;
    ctx.font = fontStr(st, st.size);
    const t = ctx.measureText(text);
    const natural = t.actualBoundingBoxLeft + t.actualBoundingBoxRight;
    const n = [...text].length;
    st.ls = n > 1 ? (ink - natural) / (n - 1) : 0;
    const h = ctx.measureText("H");
    st.cap = h.actualBoundingBoxAscent;
    st.A = t.fontBoundingBoxAscent;
    st.D = t.fontBoundingBoxDescent;
  }
}

/**
 * Testo posizionato per altezza delle maiuscole.
 * align: "left" (x = bordo sinistro dell'inchiostro), "center" (x = centro), "right" (x = bordo destro).
 * maxW: se l'inchiostro supera la larghezza massima il corpo viene ridotto.
 */
function T(style, text, x, capTop, align = "left", { color, maxW, scale = 1 } = {}) {
  const st = STYLES[style];
  let size = st.size * scale;
  let ls = st.ls * scale;
  ctx.font = fontStr(st, size);
  let m = ctx.measureText(text);
  const n = [...text].length;
  let ink = m.actualBoundingBoxLeft + m.actualBoundingBoxRight + ls * (n - 1);
  if (maxW && ink > maxW) {
    const k = maxW / ink;
    size *= k; ls *= k; ink = maxW;
    ctx.font = fontStr(st, size);
    m = ctx.measureText(text);
  }
  const k = size / st.size;
  const A = st.A * k, D = st.D * k;
  const cap = st.ink ? m.actualBoundingBoxAscent : st.cap * k; // stili "ink": capTop = cima del simbolo
  const top = capTop - ((size - (A + D)) / 2 + A - cap);
  const inkLeft = align === "center" ? x - ink / 2 : align === "right" ? x - ink : x;
  const left = inkLeft + m.actualBoundingBoxLeft;
  return `<span class="gt ${st.cls}" style="left:${left.toFixed(2)}px;top:${top.toFixed(2)}px;font-size:${size.toFixed(3)}px;letter-spacing:${ls.toFixed(3)}px${color ? `;color:${color}` : ""}">${esc(text)}</span>`;
}

// ---------------------------------------------------------------------------- geometrie (riferimento 16:9)
const G_WIDE = {
  colW: 856.0, colGap: 40.2,
  rowH: 59.7, pitch: 64.15,
  cells: { a: [0, 282.9], at: [286.8, 46.1], b: [337.2, 283.0], time: [624.0, 104.0], tv: [731.9, 124.2] },
  logoBox: 56, logoCx: 45.4,
  teamTextX: 97.0, teamCap1: 12.0, teamCap2: 34.0,
  timeCap: 21.1, atCap: 21.9, vsCap: 22.4, bandCap: 23.3,
  headerToRow: 32.3, rowToSep: 19.3, sepToHeader: 24.7,
  bodyCapTop: 223.9,
  atTop: 22.0, ts: 1,
  daznBox: 43.5, shield: [20.8, 14.4, 30.7], gpX: 62.9, gpCap: [13.4, 33.7],
  scoreCap: 16.9, dash: { y: 28.8, w: 10.2, h: 4.2, gapL: 9.0, gapR: 9.6 }, // risultati
  titleDy: 0, sideDy: 0, footDy: 0,
};

// 9:16 (storie): misurato su "Calendario storie.png" (1900×3376 → 1080×1920).
// Righe a tutta larghezza, contenuti delle celle al 94,9% del 16:9, titolo e angoli più in basso.
const G_TALL = {
  ...G_WIDE,
  colW: 984.0,
  rowH: 56.6, pitch: 60.9,
  cells: { a: [0, 346.4], at: [350.7, 46.0], b: [400.8, 346.7], time: [752.0, 103.5], tv: [860.0, 123.3] },
  logoBox: 54, logoCx: 42.9,
  teamTextX: 92.7, teamCap1: 12.0, teamCap2: 32.4,
  timeCap: 19.9, atTop: 21.6, vsCap: 21.6, bandCap: 22.1, ts: 0.949,
  daznBox: 40.9, shield: [22.2, 13.5, 29.8], gpX: 62.5, gpCap: [12.5, 32.0],
  scoreCap: 16.0, dash: { y: 27.3, w: 9.7, h: 4.0, gapL: 8.5, gapR: 9.1 },
  headerToRow: 32.4, rowToSep: 19.3, sepToHeader: 24.7,
  bodyCapTop: 389.4, bodyLeft: 48.3, maxBottom: 1690,
  titleDy: 130, sideDy: 117.6, footDy: 712,
};

let G = G_WIDE; // geometria attiva (impostata da renderStage)

// Template attivo: "calendar" (orari + TV) o "results" (punteggi finali, solo partite concluse).
let tpl = { risultati: "results", classifiche: "standings", partita: "game", giocatore: "player", squadra: "team" }[new URLSearchParams(location.search).get("t")] || "calendar";
const SCORE_WIN = "#111111", SCORE_LOSE = "#b9bec8", DASH = "#000000";

// Formato mostrato in anteprima: "wide" (16:9) o "tall" (storie IG 9:16).
let fmt = new URLSearchParams(location.search).get("f") === "storie" ? "tall" : "wide";

/** Mostra solo le anteprime del tipo e del formato scelti, poi le riadatta alla larghezza. */
const isGameLike = () => tpl === "game" || tpl === "player";

// ---------------------------------------------------------------------------- testi personalizzati
// Campi opzionali (titolo, sottotitolo, footer) per template: vuoto = testo automatico, compilato = sostituisce
// il testo nel render e quindi anche nell'export PNG.
const OV_KEYS = ["title", "sub", "foot"];
const OV_FIELDS = {
  calendar: { title: true, sub: true, foot: true },
  results: { title: true, sub: true, foot: true },
  standings: { title: true, sub: true, foot: true },
  team: { title: true, sub: true, foot: true },
  player: { title: true, sub: true },
  game: {},
};
const overrides = {}; // { [tpl]: { title, sub, foot } }
const lastAuto = {}; // testi automatici dell'ultimo render, mostrati come segnaposto
const ovInputs = Object.fromEntries(OV_KEYS.map((k) => [k, document.getElementById(`ov-${k}`)]));
/** Testo da usare nella grafica: quello digitato se presente, altrimenti l'automatico. */
function ovr(key, auto, label) {
  (lastAuto[tpl] ||= {})[key] = label ?? auto;
  const v = overrides[tpl]?.[key];
  return v && v.trim() ? v : auto;
}
function syncOverrideFields() {
  const fields = OV_FIELDS[tpl] || {};
  for (const k of OV_KEYS) {
    const el = ovInputs[k];
    el.disabled = !fields[k];
    el.value = fields[k] ? overrides[tpl]?.[k] || "" : "";
    el.placeholder = fields[k] ? `Automatico: ${lastAuto[tpl]?.[k] ?? "…"}` : "Non presente in questa grafica";
  }
  document.getElementById("ov-note").textContent = Object.keys(fields).length
    ? "Lascia vuoto per usare il testo automatico."
    : "Questa grafica non ha titolo, sottotitolo né footer da sostituire.";
}
for (const k of OV_KEYS) {
  ovInputs[k].addEventListener("input", () => {
    (overrides[tpl] ||= {})[k] = ovInputs[k].value;
    renderAll();
  });
}
document.getElementById("ov-reset").addEventListener("click", () => {
  overrides[tpl] = {};
  renderAll();
  syncOverrideFields();
});
function applyVisibility() {
  document.querySelectorAll(".studio-block[data-fmt]").forEach((el) => {
    let ok;
    if (el.classList.contains("tpl-std")) ok = tpl === "standings" && el.dataset.fmt === fmt;
    else if (el.classList.contains("tpl-game")) ok = tpl === "game" && el.dataset.fmt === fmt;
    else if (el.classList.contains("tpl-player")) ok = tpl === "player"; // per ora solo 16:9
    else if (el.classList.contains("tpl-team")) ok = tpl === "team"; // per ora solo 16:9
    else ok = (tpl === "calendar" || tpl === "results") && el.dataset.fmt === fmt;
    el.hidden = !ok;
  });
  document.querySelectorAll(".game-only").forEach((el) => (el.hidden = !isGameLike()));
  document.querySelectorAll(".player-only").forEach((el) => (el.hidden = tpl !== "player"));
  document.getElementById("fmt-toggle").hidden = tpl === "player" || tpl === "team";
  document.querySelectorAll(".team-only").forEach((el) => (el.hidden = tpl !== "team"));
  weekSelect.closest(".select-field").hidden = tpl === "team";
  syncOverrideFields();
  document.querySelectorAll("#fmt-toggle button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fmt === fmt)));
  Object.values(stages).forEach((st) => st.root.innerHTML && st.wrap.offsetParent && fitPreview(st));
}

// ---------------------------------------------------------------------------- dati della settimana
let sb = null;
let weeks = [];
let currentKey = "";
let selectedKey = "";
let weekData = null;
const keyOf = (e) => `${e.seasonType}-${e.week}`;

const TV_KEY = "5dwn-studio-tv";
let tvOverride = {};
try { tvOverride = JSON.parse(localStorage.getItem(TV_KEY) || "{}"); } catch { tvOverride = {}; }
const tvFor = (g) => tvOverride[g.id] || (/dazn/i.test(tvItalia(g.id) || "") ? "dazn" : "gamepass");

const fItDay = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long" });
const fItTime = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
const fTz = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", timeZoneName: "short" });
const tzName = (d) => (fTz.formatToParts(new Date(d)).find((p) => p.type === "timeZoneName")?.value || "CET").replace("GMT+2", "CEST").replace("GMT+1", "CET");

function intlInfo(g) {
  const v = g.venue || {};
  const country = v.country || "";
  const foreign = country && !/^(USA|United States)$/i.test(country);
  if (!foreign && !INTL[v.city]) return null;
  const [city, nation] = INTL[v.city] || [v.city, COUNTRY_IT[country] || country];
  return { city, nation };
}

function titleFor(entry) {
  if (!entry) return "";
  if (entry.seasonType === 3) return { 1: "WILD CARD", 2: "DIVISIONAL", 3: "CONFERENCE", 4: "SUPER BOWL" }[entry.week] || "PLAYOFF";
  if (entry.seasonType === 1) return `PRESEASON ${entry.week}`;
  return `WEEK ${entry.week}`;
}

/** Raggruppa per giorno italiano; dentro il giorno: internazionali prima, poi per orario e ordine ESPN. */
function buildDays(games) {
  const map = new Map();
  games.forEach((g, i) => {
    const k = dayKey(g.date);
    if (!map.has(k)) map.set(k, { key: k, date: g.date, games: [] });
    map.get(k).games.push({ ...g, _i: i, intl: intlInfo(g) });
  });
  const days = [...map.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
  for (const d of days) {
    d.games.sort((a, b) => (b.intl ? 1 : 0) - (a.intl ? 1 : 0) || new Date(a.date) - new Date(b.date) || a._i - b._i);
    d.label = fItDay.format(new Date(d.date)).toUpperCase();
    d.slots = d.games.flatMap((g) => (g.intl ? [{ game: g }, { band: g.intl }] : [{ game: g }]));
  }
  return days;
}

// ---------------------------------------------------------------------------- disegno
function cellLeft(colX, key) { return colX + G.cells[key][0]; }

function teamCell(team, x, y) {
  const abbr = team.abbr;
  const bg = TEAM_CELL[abbr] || team.color || "#333";
  const ink = DARK_TEXT.has(abbr) ? "#111111" : "#ffffff";
  const w = G.cells.a[1];
  // Loghi ESPN "500-dark" (non la variante scoreboard), come nei riferimenti: es. Jets con la scritta "JETS".
  const logo = espnImg(abbr ? `https://a.espncdn.com/i/teamlogos/nfl/500-dark/${abbr.toLowerCase()}.png` : team.logo, 160);
  const l1 = (team.location || "").toUpperCase();
  const l2 = (team.nickname || team.short || "").toUpperCase();
  return `<div class="g-cell" style="left:${x}px;top:${y}px;width:${w}px;height:${G.rowH}px;background:${bg}"></div>
    <img class="g-logo" crossorigin="anonymous" src="${logo}" alt="" style="left:${x + G.logoCx - G.logoBox / 2}px;top:${y + (G.rowH - G.logoBox) / 2}px;width:${G.logoBox}px;height:${G.logoBox}px">
    ${T("team", l1, x + G.teamTextX, y + G.teamCap1, "left", { color: ink, maxW: w - G.teamTextX - 8, scale: G.ts })}
    ${T("team", l2, x + G.teamTextX, y + G.teamCap2, "left", { color: ink, maxW: w - G.teamTextX - 8, scale: G.ts })}`;
}

function tvCell(g, x, y) {
  const [ox, w] = G.cells.tv;
  const left = x + ox;
  const kind = tvFor(g);
  let inner;
  if (kind === "dazn") {
    // Logo ufficiale DAZN (assets/img/dazn.png, ricavato da DAZN_BoxedLogo_02_RGB.png con fondo trasparente)
    const box = G.daznBox;
    inner = `<img class="g-logo" src="${DAZN_LOGO}" alt="DAZN" style="left:${left + (w - box) / 2}px;top:${y + (G.rowH - box) / 2}px;width:${box}px;height:${box}px">`;
  } else {
    // nfl.png di ESPN è 500×500 con lo scudo alto 477 px: riquadro di 30,7 px per uno scudo alto 29,3 px
    const [sx, sy, ss] = G.shield;
    inner = `<img class="g-logo" crossorigin="anonymous" src="${NFL_SHIELD}" alt="" style="left:${left + sx}px;top:${y + sy}px;width:${ss}px;height:${ss}px">
      ${T("gp", "GAME", left + G.gpX, y + G.gpCap[0], "left", { scale: G.ts })}
      ${T("gp", "PASS", left + G.gpX, y + G.gpCap[1], "left", { scale: G.ts })}`;
  }
  return `<div class="g-cell g-white g-tv" data-game="${g.id}" title="Clic: DAZN / Game Pass" style="left:${left}px;top:${y}px;width:${w}px;height:${G.rowH}px"></div>${inner}`;
}

function gameRow(g, x, y) {
  // Internazionale: casa VS trasferta (come nel riferimento); altrimenti trasferta @ casa.
  const [first, second] = g.intl ? [g.home.team, g.away.team] : [g.away.team, g.home.team];
  const [atX, atW] = G.cells.at;
  const [tX, tW] = G.cells.time;
  return `${teamCell(first, cellLeft(x, "a"), y)}
    <div class="g-cell g-white" style="left:${x + atX}px;top:${y}px;width:${atW}px;height:${G.rowH}px"></div>
    ${g.intl ? T("vs", "VS", x + atX + atW / 2, y + G.vsCap, "center", { scale: G.ts }) : T("at", "@", x + atX + atW / 2, y + G.atTop, "center", { scale: G.ts })}
    ${teamCell(second, cellLeft(x, "b"), y)}
    ${tpl === "results"
      ? scoreCell(g, x, y)
      : `<div class="g-cell g-white" style="left:${x + tX}px;top:${y}px;width:${tW}px;height:${G.rowH}px"></div>
    ${T("time", fItTime.format(new Date(g.date)), x + tX + tW / 2, y + G.timeCap, "center", { scale: G.ts })}
    ${tvCell(g, x, y)}`}`;
}

/** Risultati: un'unica cella bianca (orario + TV) con "punteggio - punteggio", centrata sul trattino. */
function scoreCell(g, x, y) {
  const [tX] = G.cells.time;
  const [tvX, tvW] = G.cells.tv;
  const left = x + tX, w = tvX + tvW - tX;
  const [c1, c2] = g.intl ? [g.home, g.away] : [g.away, g.home]; // stesso ordine delle squadre
  const s1 = c1.score ?? 0, s2 = c2.score ?? 0;
  const col1 = s1 < s2 ? SCORE_LOSE : SCORE_WIN, col2 = s2 < s1 ? SCORE_LOSE : SCORE_WIN; // pareggio: entrambi scuri
  const d = G.dash, cx = left + w / 2;
  return `<div class="g-cell g-white" style="left:${left}px;top:${y}px;width:${w}px;height:${G.rowH}px"></div>
    <div class="g-dash" style="left:${cx - d.w / 2}px;top:${y + d.y}px;width:${d.w}px;height:${d.h}px;background:${DASH}"></div>
    ${T("score", String(s1), cx - d.w / 2 - d.gapL, y + G.scoreCap, "right", { color: col1, scale: G.ts })}
    ${T("score", String(s2), cx + d.w / 2 + d.gapR, y + G.scoreCap, "left", { color: col2, scale: G.ts })}`;
}

function bandRow(info, x, y) {
  return `<div class="g-band" style="left:${x}px;top:${y}px;width:${G.colW}px;height:${G.rowH}px"></div>
    ${T("band", `INTERNATIONAL GAME — ${info.city}, ${info.nation}`.toUpperCase(), x + G.colW / 2, y + G.bandCap, "center", { scale: G.ts })}`;
}

function slotsHtml(slots, x, y) {
  return slots
    .map((s, i) => (s.game ? gameRow(s.game, x, y + i * G.pitch) : bandRow(s.band, x, y + i * G.pitch)))
    .join("");
}
const slotsHeight = (n) => (n ? n * G.pitch - (G.pitch - G.rowH) : 0);

/** Una colonna-giorno: intestazione + righe. Restituisce html e altezza (da cap top a fine righe). */
function dayColumn(day, x, capTop, slots = day.slots, offsetSlots = 0, withHeader = true) {
  const rowsTop = capTop + G.headerToRow;
  const html = (withHeader ? T("day", day.label, x + 2.2, capTop, "left") : "") + slotsHtml(slots, x, rowsTop + offsetSlots * G.pitch);
  return { html, bottom: rowsTop + slotsHeight(slots.length + offsetSlots) };
}

/** Layout 16:9: giorni prima / giorno principale su due colonne bilanciate / giorni dopo. */
function layoutWide(days) {
  const main = days.reduce((best, d) => (d.games.length > (best?.games.length || 0) ? d : best), null);
  const useMain = main && main.games.length >= 6;
  const bands = [];
  const pair = (list) => { for (let i = 0; i < list.length; i += 2) bands.push({ type: "pair", days: list.slice(i, i + 2) }); };
  if (useMain) {
    const i = days.indexOf(main);
    pair(days.slice(0, i));
    bands.push({ type: "main", day: main });
    pair(days.slice(i + 1));
  } else pair(days);

  const xL = 0, xR = G.colW + G.colGap;
  let y = 0, html = "";
  bands.forEach((b, bi) => {
    if (bi > 0) {
      const sepY = y + G.rowToSep;
      html += `<div class="g-sep" style="left:0;top:${sepY}px;width:${2 * G.colW + G.colGap}px"></div>`;
      y = sepY + G.sepToHeader;
    }
    if (b.type === "pair") {
      const cols = b.days.map((d, ci) => dayColumn(d, ci ? xR : xL, y));
      html += cols.map((c) => c.html).join("");
      y = Math.max(...cols.map((c) => c.bottom));
    } else {
      const s = b.day.slots;
      let nL = Math.ceil(s.length / 2);
      if (s[nL - 1]?.game?.intl && s[nL]?.band) nL += 1; // non separare partita e fascetta
      const left = s.slice(0, nL), right = s.slice(nL);
      const c1 = dayColumn(b.day, xL, y, left, 0);
      const c2 = dayColumn(b.day, xR, y, right, Math.max(0, left.length - right.length), false); // allineata in basso
      html += c1.html + c2.html;
      y = Math.max(c1.bottom, c2.bottom);
    }
  });
  return { html, width: 2 * G.colW + G.colGap, height: y };
}

/** Layout 9:16: tutti i giorni in una colonna. */
function layoutTall(days) {
  let y = 0, html = "";
  days.forEach((d, i) => {
    if (i > 0) {
      const sepY = y + G.rowToSep;
      html += `<div class="g-sep" style="left:0;top:${sepY}px;width:${G.colW}px"></div>`;
      y = sepY + G.sepToHeader;
    }
    const c = dayColumn(d, 0, y);
    html += c.html;
    y = c.bottom;
  });
  return { html, width: G.colW, height: y };
}

let bgSeq = 0; // id univoci: con id ripetuti il browser userebbe il pattern di una grafica nascosta (sfondo tutto grigio)
function background(W, H, wide) {
  const uid = `${W}-${++bgSeq}`;
  // Strisce diagonali: bande chiare 79,4 px ogni 192,8 px (misura orizzontale), inclinazione -0,557.
  const deco = wide
    ? `<g opacity="0.55" stroke="#ffffff" stroke-width="26" fill="none">
         <line x1="313" y1="49" x2="492" y2="227"/><line x1="492" y1="49" x2="313" y2="227"/></g>
       <g fill="none" stroke="#ffffff" opacity="0.6">
         <ellipse cx="1567" cy="181" rx="430" ry="200" transform="rotate(-14 1567 181)" stroke-width="10"/>
         <g stroke-width="18" stroke-linecap="round">
           <line x1="1525" y1="146" x2="1540" y2="242"/><line x1="1566" y1="131" x2="1582" y2="226"/>
           <line x1="1611" y1="111" x2="1627" y2="207"/><line x1="1657" y1="97" x2="1672" y2="193"/>
           <line x1="1698" y1="85" x2="1714" y2="181"/></g></g>`
    : `<g opacity="0.55" stroke="#ffffff" stroke-width="26" fill="none">
         <line x1="304" y1="40" x2="464" y2="200"/><line x1="464" y1="40" x2="304" y2="200"/></g>
       <g fill="none" stroke="#ffffff" opacity="0.6">
         <ellipse cx="623" cy="182" rx="451" ry="177" transform="rotate(-12 623 182)" stroke-width="10"/>
         <g stroke-width="17" stroke-linecap="round">
           <line x1="682" y1="148" x2="697" y2="228"/><line x1="728" y1="131" x2="743" y2="211"/>
           <line x1="767" y1="114" x2="782" y2="194"/><line x1="809" y1="102" x2="824" y2="182"/>
           <line x1="853" y1="97" x2="868" y2="177"/></g></g>`;
  const glowCx = W / 2;
  return `<svg class="gfx-bg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="st-${uid}" patternUnits="userSpaceOnUse" width="192.8" height="${H}" patternTransform="skewX(-29.12)">
          <rect x="25.5" y="0" width="79.4" height="${H}" fill="#f4f5f7"/>
        </pattern>
        <radialGradient id="glow-${uid}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="#e7e9ed"/>
      <rect width="${W * 2}" height="${H}" x="${-W / 2}" fill="url(#st-${uid})"/>
      ${deco}
      <ellipse cx="${glowCx}" cy="${112 + (wide ? 0 : 130)}" rx="470" ry="140" fill="url(#glow-${uid})"/>
    </svg>`;
}

function chrome(W, H, title, year, tz) {
  const right = W - 48.3; // margine destro dei testi d'angolo (1871,7 su 1920 · 1031,7 su 1080)
  const t = G.titleDy, sd = G.sideDy, f = G.footDy; // spostamenti verticali del formato 9:16
  const cx = W / 2;
  return `
    ${T("side", "FOOTBALL", 45.3, 46.6 + sd)}${T("side", "MORE", 45.3, 70.7 + sd)}${T("side", "THAN", 45.3, 94.4 + sd)}${T("side", "A GAME", 45.3, 117.7 + sd)}
    <div class="g-bar" style="left:44px;top:${149.2 + sd}px;width:25.4px;height:2.2px"></div>
    <div class="g-bar" style="left:${right - 21.6}px;top:${48.3 + sd}px;width:25.5px;height:2.2px"></div>
    ${T("year", String(year), right, 66.4 + sd, "right")}
    <img class="g-logo" src="${BRAND_LOGO}" alt="5DWN" style="left:${cx - 64}px;top:${22.4 + t}px;width:128px;height:30.74px">
    ${T("week", ovr("title", title), cx, 66.4 + t, "center", { maxW: W - 2 * 200 })}
    ${T("sub", ovr("sub", tpl === "results" ? "RISULTATI" : "ORARI ITALIA"), cx, 182.4 + t, "center", { maxW: W - 2 * 120 })}
    <div class="g-bar" style="left:44px;top:${1025.1 + f}px;width:25.4px;height:2.2px"></div>
    ${T("foot", ovr("foot", tpl === "results" ? "RISULTATI FINALI" : `TUTTI GLI ORARI IN ORA ITALIANA (${tz})`), 78.5, 1041.5 + f, "left", { maxW: W - 78.5 - 260 })}
    ${T("year", "QUINTO DOWN", right, 1008.3 + f, "right")}
    ${T("year", String(year), right, 1032.0 + f, "right")}
    <div class="g-bar" style="left:${right - 21.6}px;top:${1060.9 + f}px;width:25.5px;height:2.6px"></div>`;
}

function renderStage(stage, wide) {
  const { W, H, root } = stage;
  const { entry, days, year } = weekData;
  const title = titleFor(entry);
  const mainDay = days.reduce((b, d) => (d.games.length > (b?.games.length || 0) ? d : b), null);
  const tz = mainDay ? tzName(mainDay.date) : "CET";
  G = wide ? G_WIDE : G_TALL;
  const L = wide ? layoutWide(days) : layoutTall(days);
  // area utile per le partite: dal cap top della prima intestazione al piè di pagina.
  // Come nei riferimenti il blocco parte sempre dalla stessa altezza e si riduce solo se non ci sta.
  const maxBottom = wide ? 985 : G.maxBottom;
  const top = G.bodyCapTop;
  const k = Math.min(1, (maxBottom - top) / Math.max(L.height, 1));
  const left = (W - L.width * k) / 2;
  root.style.width = `${W}px`;
  root.style.height = `${H}px`;
  root.innerHTML = `${background(W, H, wide)}
    <div class="gfx-layer" style="width:${W}px;height:${H}px">${chrome(W, H, title, year, tz)}</div>
    <div class="gfx-body" style="left:${left}px;top:${top}px;width:${L.width}px;height:${L.height}px;transform:scale(${k})">
      ${days.length ? L.html : T("day", "NESSUNA PARTITA IN PROGRAMMA", L.width / 2, 0, "center")}
    </div>`;
  fitPreview(stage);
}

function fitPreview(stage) {
  const { wrap, root, W, H } = stage;
  const scaler = wrap.querySelector(".gfx-scaler");
  const k = wrap.clientWidth / W;
  scaler.style.transform = `scale(${k})`;
  wrap.style.height = `${H * k}px`;
  root.dataset.scale = k;
}

function renderAll() {
  renderAllInner();
  syncOverridePlaceholders();
}
function syncOverridePlaceholders() {
  const fields = OV_FIELDS[tpl] || {};
  for (const k of OV_KEYS) if (fields[k]) ovInputs[k].placeholder = `Automatico: ${lastAuto[tpl]?.[k] ?? "…"}`;
}
function renderAllInner() {
  if (tpl === "team") {
    if (teamSched) renderTeamStage(stages.team);
    return;
  }
  if (tpl === "player") {
    if (gameData && playerSel) renderPlayerStage(stages.player);
    return;
  }
  if (tpl === "game") {
    if (gameData) {
      renderGameStage(stages.game, GW);
      renderGameStage(stages.gameTall, GW_TALL);
    }
    return;
  }
  if (tpl === "standings") {
    if (!standingsData) return;
    renderStandingsStage(stages.afc, "AFC");
    renderStandingsStage(stages.nfc, "NFC");
    renderStandingsTall(stages.afcTall, "AFC");
    renderStandingsTall(stages.nfcTall, "NFC");
    return;
  }
  if (!weekData) return;
  renderStage(stages.wide, true);
  renderStage(stages.tall, false);
}

window.addEventListener("resize", () => Object.values(stages).forEach((s) => s.root.innerHTML && s.wrap.offsetParent && fitPreview(s)));

// Clic sulla cella TV dell'anteprima: alterna DAZN / Game Pass (salvato nel browser).
document.addEventListener("click", (e) => {
  const cell = e.target.closest(".g-tv");
  if (!cell) return;
  const id = cell.dataset.game;
  const g = weekData?.games.find((x) => x.id === id);
  if (!g) return;
  tvOverride[id] = tvFor(g) === "dazn" ? "gamepass" : "dazn";
  try { localStorage.setItem(TV_KEY, JSON.stringify(tvOverride)); } catch { /* solo per questa sessione */ }
  renderAll();
});

// ---------------------------------------------------------------------------- esportazione PNG
// La grafica viene ridisegnata su un <canvas> leggendo posizione e stile di ogni elemento
// dell'anteprima (stessi font già caricati, stesse coordinate): il PNG coincide con l'anteprima.
const isTransparent = (c) => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function drawStage(stage) {
  const { root, W, H } = stage;
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  const R = root.getBoundingClientRect();
  const s = R.width / W; // scala dell'anteprima a schermo
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: (r.left - R.left) / s, y: (r.top - R.top) / s, w: r.width / s, h: r.height / s };
  };

  // 1) sfondo SVG
  const svg = root.querySelector(".gfx-bg");
  const xml = new XMLSerializer().serializeToString(svg).replace("<svg ", `<svg width="${W}" height="${H}" `);
  const bg = await loadImage(URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" })));
  c.drawImage(bg, 0, 0, W, H);

  // 2) elementi nell'ordine del documento (rettangoli, loghi, testi)
  const els = root.querySelectorAll(".g-cell, .g-band, .g-bar, .g-sep, .g-dash, .g-photo, .g-tape, img, .gt");
  for (const el of els) {
    if (el.closest(".g-photo") && !el.classList.contains("g-photo")) continue; // disegnati insieme alla cornice
    if (el.classList.contains("g-photo") || el.classList.contains("g-tape")) {
      drawRotated(c, el);
      continue;
    }
    const b = box(el);
    const cs = getComputedStyle(el);
    if (el.tagName === "IMG") {
      if (!el.naturalWidth) continue;
      const k = Math.min(b.w / el.naturalWidth, b.h / el.naturalHeight); // object-fit: contain
      const w = el.naturalWidth * k, h = el.naturalHeight * k;
      c.globalAlpha = parseFloat(cs.opacity) || 1; // es. logo in filigrana
      c.drawImage(el, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h);
      c.globalAlpha = 1;
    } else if (el.classList.contains("gt")) {
      const eff = b.h / el.offsetHeight; // scala effettiva (es. corpo partite ridotto)
      const size = parseFloat(cs.fontSize) * eff;
      const ls = (parseFloat(cs.letterSpacing) || 0) * eff;
      const fs = parseFloat(cs.fontStretch) || 100;
      const stretch = fs >= 120 ? "expanded " : fs >= 110 ? "semi-expanded " : fs <= 70 ? "extra-condensed " : fs <= 80 ? "condensed " : fs <= 90 ? "semi-condensed " : "";
      const family = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      c.font = `${stretch}${cs.fontWeight} ${size}px "${family}"`;
      c.fillStyle = cs.color;
      c.textBaseline = "alphabetic";
      const m = c.measureText("H");
      const A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent;
      const baseline = b.y + (size - (A + D)) / 2 + A;
      const text = el.textContent;
      const sh = cs.textShadow && cs.textShadow !== "none" ? cs.textShadow.match(/^(rgba?\([^)]*\)|#\w+)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/) : null;
      if (sh) { c.shadowColor = sh[1]; c.shadowOffsetX = +sh[2] * eff; c.shadowOffsetY = +sh[3] * eff; c.shadowBlur = +sh[4] * eff; }
      if ("letterSpacing" in c) {
        c.letterSpacing = `${ls}px`;
        c.fillText(text, b.x, baseline);
        c.letterSpacing = "0px";
      } else {
        let x = b.x;
        for (const ch of text) { c.fillText(ch, x, baseline); x += c.measureText(ch).width + ls; }
      }
      if (sh) { c.shadowColor = "transparent"; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; }
    } else {
      if (!isTransparent(cs.backgroundColor)) {
        c.fillStyle = cs.backgroundColor;
        c.fillRect(b.x, b.y, b.w, b.h);
      }
      const bw = parseFloat(cs.borderTopWidth) || 0;
      if (bw > 0) {
        const k = b.w / el.offsetWidth;
        c.strokeStyle = cs.borderTopColor;
        c.lineWidth = bw * k;
        c.strokeRect(b.x + (bw * k) / 2, b.y + (bw * k) / 2, b.w - bw * k, b.h - bw * k);
      }
    }
  }
  return canvas;
}

/** Cornice foto (polaroid) e scotch: elementi ruotati, disegnati dalle loro misure (data-*). */
function drawRotated(c, el) {
  const d = el.dataset;
  const w = +d.w, h = +d.h;
  c.save();
  c.translate(+d.cx, +d.cy);
  c.rotate((+d.rot * Math.PI) / 180);
  if (el.classList.contains("g-tape")) {
    c.fillStyle = getComputedStyle(el).backgroundColor;
    c.fillRect(-w / 2, -h / 2, w, h);
  } else {
    c.shadowColor = "rgba(0,0,0,0.18)";
    c.shadowBlur = 24;
    c.shadowOffsetY = 10;
    c.fillStyle = "#ffffff";
    c.fillRect(-w / 2, -h / 2, w, h);
    c.shadowColor = "transparent";
    const ins = +d.inset, tw = w - 2 * ins, th = h - 2 * ins;
    const img = el.querySelector("img");
    if (img && img.naturalWidth) {
      // object-fit: cover + zoom e posizione scelti (come photoClip)
      const z = +d.z || 1, px = d.px != null ? +d.px : 0.5, py = d.py != null ? +d.py : 0.5;
      const k = Math.max(tw / img.naturalWidth, th / img.naturalHeight) * z;
      const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
      c.save();
      c.beginPath();
      c.rect(-w / 2 + ins, -h / 2 + ins, tw, th);
      c.clip();
      c.drawImage(img, -w / 2 + ins + (tw - dw) * px, -h / 2 + ins + (th - dh) * py, dw, dh);
      c.restore();
    } else {
      c.fillStyle = "#f5f5f5";
      c.fillRect(-w / 2 + ins, -h / 2 + ins, tw, th);
    }
  }
  c.restore();
}

/** PNG (data URL) della grafica a grandezza reale. */
async function pngData(stage) {
  const canvas = await drawStage(stage);
  return canvas.toDataURL("image/png");
}
window.__5dwnStudioPng = (which) => pngData(stages[which]); // diagnostica

async function exportPng(stage, name) {
  status.textContent = "Preparo il PNG…";
  try {
    const url = await pngData(stage);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    status.textContent = `Scaricato: ${name}`;
  } catch (err) {
    console.error(err);
    status.textContent = "Esportazione non riuscita: riprova.";
  }
}

const fileBase = () => `5dwn-${tpl === "results" ? "risultati" : "calendario"}-${titleFor(weekData.entry).toLowerCase().replace(/\s+/g, "-")}-${weekData.year}`;
document.getElementById("dl-wide").addEventListener("click", () => exportPng(stages.wide, `${fileBase()}-16x9.png`));
document.getElementById("dl-tall").addEventListener("click", () => exportPng(stages.tall, `${fileBase()}-9x16.png`));
const stdFile = (conf, fmt) => {
  const e = weeks.find((x) => keyOf(x) === selectedKey);
  return `5dwn-classifica-${conf.toLowerCase()}-week-${e ? e.week : ""}-${sb.season.year}-${fmt}.png`;
};
const gameFile = (f) => {
  const e = weeks.find((x) => keyOf(x) === selectedKey);
  return `5dwn-partita-${gameData.away.team.abbr.toLowerCase()}-${gameData.home.team.abbr.toLowerCase()}-week-${e ? e.week : ""}-${sb.season.year}-${f}.png`;
};
document.getElementById("dl-game").addEventListener("click", () => gameData && exportPng(stages.game, gameFile("16x9")));
document.getElementById("dl-team").addEventListener("click", () => {
  if (!teamSched) return;
  exportPng(stages.team, `5dwn-calendario-${teamSched.team.abbr.toLowerCase()}-${sb.season.year}.png`);
});
document.getElementById("dl-player").addEventListener("click", () => {
  if (!gameData || !playerSel) return;
  const e = weeks.find((x) => keyOf(x) === selectedKey);
  const slug = playerSel.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  exportPng(stages.player, `5dwn-giocatore-${slug}-week-${e ? e.week : ""}-${sb.season.year}.png`);
});
document.getElementById("dl-game-tall").addEventListener("click", () => gameData && exportPng(stages.gameTall, gameFile("9x16")));
document.getElementById("dl-afc").addEventListener("click", () => exportPng(stages.afc, stdFile("AFC", "16x9")));
document.getElementById("dl-nfc").addEventListener("click", () => exportPng(stages.nfc, stdFile("NFC", "16x9")));
document.getElementById("dl-afc-tall").addEventListener("click", () => exportPng(stages.afcTall, stdFile("AFC", "9x16")));
document.getElementById("dl-nfc-tall").addEventListener("click", () => exportPng(stages.nfcTall, stdFile("NFC", "9x16")));

// ---------------------------------------------------------------------------- template Classifiche
// Misurato su "NFL Standings-selection.png" (AFC) e "(1)" (NFC), 4692×2640 → 1920×1080.
const ST_CELL = {
  BUF: "#00338d", NE: "#002244", NYJ: "#125740", MIA: "#008e97", PIT: "#ffb612", CIN: "#fb4f14", CLE: "#311d00", BAL: "#241773",
  IND: "#002c5f", JAX: "#006778", HOU: "#03202f", TEN: "#0c2340", DEN: "#fb4f14", LAC: "#0080c6", KC: "#e31837", LV: "#1a1a1a",
  DAL: "#0b2a55", PHI: "#004c54", NYG: "#0b3fd0", WSH: "#5a1414", MIN: "#4f2683", CHI: "#0b1f44", DET: "#0e86d4", GB: "#203731",
  NO: "#d3bc8d", CAR: "#0b2a55", ATL: "#c8102e", TB: "#d50a0a", SEA: "#002244", LAR: "#0a3fc2", ARI: "#a6192e", SF: "#aa0000",
};
const ST_DARK_TEXT = new Set(["PIT", "NO"]);
const CONF_NAME = { AFC: "AMERICAN FOOTBALL CONFERENCE", NFC: "NATIONAL FOOTBALL CONFERENCE" };
// Loghi di conference ESPN (500×500): riquadro visibile in px dell'immagine originale.
const CONF_LOGO = { AFC: { src: "https://a.espncdn.com/i/teamlogos/nfl/500/afc.png", x0: 16, x1: 483 }, NFC: { src: "https://a.espncdn.com/i/teamlogos/nfl/500/nfc.png", x0: 20, x1: 479 } };
const SG = {
  blocks: [[116.2, 247.6], [1010.3, 247.6], [116.2, 608.5], [1010.3, 608.5]], // x, cap top intestazione
  order: ["East", "North", "South", "West"],
  hdrToRow: 35.6, pitch: 72.97, rowH: 70.6,
  cells: { team: [0, 466.5], w: [469.0, 95.8], l: [566.8, 86.3], pct: [654.7, 139.1] },
  logoCx: 92.5, logoBox: 70, textX: 185.4, t1: 13.5, t2: 40.5, numCap: 26.6, colCap: 9.0,
};

let standingsData = null; // { divisions: [{conf, short, teams:[{team,w,l,t}]}], live: bool }

function inkWidth(style, text) {
  const st = STYLES[style];
  ctx.font = fontStr(st, st.size);
  const m = ctx.measureText(text);
  return m.actualBoundingBoxLeft + m.actualBoundingBoxRight + st.ls * ([...text].length - 1);
}

const pctOf = (r) => {
  const g = r.w + r.l + r.t;
  return g ? (r.w + r.t / 2) / g : 0;
};

/**
 * Classifica dopo la settimana scelta.
 * Settimana in corso: classifica ufficiale ESPN (come nella pagina Classifiche).
 * Settimane passate: V/S/P ricalcolati dai risultati ESPN fino a quella settimana;
 * ordine per percentuale, poi vittorie, poi l'ordine ESPN attuale (i tiebreaker NFL completi non sono disponibili).
 */
async function standingsAfter(entry) {
  const st = (await getStandings()).data;
  const live = entry.seasonType === Number(sb.season.type) && entry.week === Number(sb.week);
  if (live) {
    return { live, divisions: st.divisions.map((d) => ({ conf: d.conf, short: d.short, teams: d.teams.map((r) => ({ team: r.team, w: r.w, l: r.l, t: r.t })) })) };
  }
  const regular = weeks.filter((e) => e.seasonType === 2 && e.week <= entry.week);
  const res = await Promise.all(regular.map((e) => getWeek(e, sb.season.year)));
  const rec = {};
  const add = (id, k) => { rec[id] = rec[id] || { w: 0, l: 0, t: 0 }; rec[id][k] += 1; };
  for (const r of res) {
    for (const g of r.data.games) {
      if (g.state !== "post" || !g.home || !g.away) continue;
      const h = g.home.score ?? 0, a = g.away.score ?? 0;
      if (h === a) { add(g.home.team.id, "t"); add(g.away.team.id, "t"); }
      else if (h > a) { add(g.home.team.id, "w"); add(g.away.team.id, "l"); }
      else { add(g.away.team.id, "w"); add(g.home.team.id, "l"); }
    }
  }
  return {
    live,
    divisions: st.divisions.map((d) => ({
      conf: d.conf,
      short: d.short,
      teams: d.teams
        .map((r, i) => ({ team: r.team, ...(rec[r.team.id] || { w: 0, l: 0, t: 0 }), _i: i }))
        .sort((x, y) => pctOf(y) - pctOf(x) || y.w - x.w || x._i - y._i),
    })),
  };
}

function stdBlock(div, x, capTop, g = SG) {
  const SG_ = g, ts = g.ts || 1;
  const rowTop = capTop + SG_.hdrToRow;
  const c = SG_.cells;
  let html = T("stDiv", `${div.conf} ${div.short}`.toUpperCase(), x, capTop, "left", { scale: ts });
  for (const [k, label] of [["w", "W"], ["l", "L"], ["pct", "PCT"]]) {
    html += T("stCol", label, x + c[k][0] + c[k][1] / 2, capTop + SG_.colCap, "center", { scale: ts });
  }
  div.teams.slice(0, 4).forEach((r, i) => {
    const y = rowTop + i * SG_.pitch;
    const t = r.team, abbr = t.abbr;
    const ink = ST_DARK_TEXT.has(abbr) ? "#111111" : "#ffffff";
    const logo = espnImg(`https://a.espncdn.com/i/teamlogos/nfl/500-dark/${abbr.toLowerCase()}.png`, 160);
    html += `<div class="g-cell" style="left:${x}px;top:${y}px;width:${c.team[1]}px;height:${SG_.rowH}px;background:${ST_CELL[abbr] || t.color || "#333"}"></div>
      <img class="g-logo" crossorigin="anonymous" src="${logo}" alt="" style="left:${x + SG_.logoCx - SG_.logoBox / 2}px;top:${y + (SG_.rowH - SG_.logoBox) / 2}px;width:${SG_.logoBox}px;height:${SG_.logoBox}px">
      ${T("stT1", (t.location || "").toUpperCase(), x + SG_.textX, y + SG_.t1, "left", { color: ink, scale: ts })}
      ${T("stT2", (t.nickname || t.short || "").toUpperCase(), x + SG_.textX, y + SG_.t2, "left", { color: ink, scale: ts })}`;
    const vals = { w: String(r.w), l: String(r.l), pct: pctOf(r).toFixed(3) };
    for (const k of ["w", "l", "pct"]) {
      html += `<div class="g-cell g-white" style="left:${x + c[k][0]}px;top:${y}px;width:${c[k][1]}px;height:${SG_.rowH}px"></div>
        ${T("stNum", vals[k], x + c[k][0] + c[k][1] / 2, y + SG_.numCap, "center", { scale: ts })}`;
    }
  });
  return html;
}

function renderStandingsStage(stage, conf) {
  const { W, H, root } = stage;
  const year = sb.season.year;
  const divs = SG.order.map((name) => standingsData.divisions.find((d) => d.conf === conf && d.short === name)).filter(Boolean);
  // Titolo: sigla + logo conference, gruppo centrato come nel riferimento (centro a x 952, spazio 40 px).
  const lg = CONF_LOGO[conf], scale = 0.328, box = 500 * scale;
  const visW = (lg.x1 - lg.x0) * scale;
  // "AFC"/"NFC" con lo stesso stile di "WEEK" (lettere spaziate), alla dimensione del riferimento.
  const titleScale = 110.9 / STYLES.week.ref[1];
  const ttl = ovr("title", conf, "AFC / NFC");
  const tW = inkWidth("week", ttl) * titleScale;
  const tLeft = 952 - (tW + 40 + visW) / 2;
  const logoLeft = tLeft + tW + 40 - lg.x0 * scale;
  const right = 1859.8;
  root.style.width = `${W}px`;
  root.style.height = `${H}px`;
  // Stesso sfondo di calendari e risultati.
  root.innerHTML = `${background(W, H, true)}
    <div class="gfx-layer" style="width:${W}px;height:${H}px">
      ${T("stSide", "FOOTBALL", 56.5, 54.4)}${T("stSide", "MORE", 56.5, 81.4)}${T("stSide", "THAN", 56.5, 108.8)}${T("stSide", "A GAME", 56.5, 135.4)}
      <div class="g-bar" style="left:54.8px;top:169.8px;width:27.9px;height:1.7px;background:#b5b8bd"></div>
      <div class="g-bar" style="left:1835.7px;top:59.7px;width:27.8px;height:2.1px;background:#b5b8bd"></div>
      ${T("stInk", String(year), right, 79.4, "right")}
      <img class="g-logo" src="${BRAND_LOGO}" alt="5DWN" style="left:892.1px;top:17px;width:135px;height:32.42px">
      ${T("week", ttl, tLeft, 66.7, "left", { scale: titleScale })}
      <img class="g-logo" crossorigin="anonymous" src="${lg.src}" alt="${conf}" style="left:${logoLeft.toFixed(1)}px;top:41px;width:${box}px;height:${box}px">
      ${T("stSub", ovr("sub", "CLASSIFICA"), 960.25, 201.7, "center", { maxW: 1500 })}
      ${divs.map((d, i) => stdBlock(d, SG.blocks[i][0], SG.blocks[i][1])).join("")}
      <div class="g-sep" style="left:959.9px;top:254.1px;width:1px;height:701.4px;background:#b9bcc2"></div>
      <div class="g-bar" style="left:55.2px;top:984.1px;width:27.5px;height:1.3px"></div>
      ${T("stFoot", ovr("foot", CONF_NAME[conf], "AMERICAN / NATIONAL FOOTBALL CONFERENCE"), 55.2, 1004.2, "left", { maxW: 1500 })}
      <div class="g-bar" style="left:55.2px;top:1036.1px;width:27.5px;height:1.3px"></div>
      ${T("stInk", "QUINTO", 1860.3, 960.0, "right")}${T("stInk", "DOWN", 1860.3, 982.1, "right")}${T("stInk", String(year), 1860.3, 1004.2, "right")}
      <div class="g-bar" style="left:1835.7px;top:1035.7px;width:27.8px;height:2px;background:#b5b8bd"></div>
    </div>`;
  fitPreview(stage);
}

// 9:16 (storie IG): impianto del "Calendario storie" (sfondo, titolo, angoli e piè di pagina più in basso);
// le quattro division una sotto l'altra a tutta larghezza (48,3 → 1032,3).
const SG_TALL = {
  x: 48.3, firstCap: 389.4, maxBottom: 1690, blockGap: 40,
  hdrToRow: 35.6, colCap: 9.0,
  cells: { team: [0, 588], w: [590, 112], l: [704, 112], pct: [818, 166] },
};

function standingsTallGeometry() {
  // passo righe calcolato per far stare 4 division × 4 squadre tra intestazione e piè di pagina
  const avail = SG_TALL.maxBottom - SG_TALL.firstCap - 3 * SG_TALL.blockGap - 4 * SG_TALL.hdrToRow;
  const pitch = Math.min(SG.pitch, avail / 16);
  const rowH = pitch - 2.4;
  const k = rowH / SG.rowH; // riduzione di logo e testi rispetto al 16:9
  return {
    ...SG_TALL, pitch, rowH, ts: Math.min(1, k + 0.04),
    logoBox: SG.logoBox * k, logoCx: 80, textX: 158,
    t1: SG.t1 * k, t2: SG.t2 * k, numCap: (rowH - 20.8 * Math.min(1, k + 0.04)) / 2,
  };
}

function renderStandingsTall(stage, conf) {
  const { W, H, root } = stage;
  const year = sb.season.year;
  const g = standingsTallGeometry();
  const divs = SG.order.map((name) => standingsData.divisions.find((d) => d.conf === conf && d.short === name)).filter(Boolean);
  const t = 130, sd = 117.6, f = 712; // spostamenti del formato storie (come il calendario 9:16)
  const lg = CONF_LOGO[conf], scale = 0.328, box = 500 * scale;
  const visW = (lg.x1 - lg.x0) * scale;
  const titleScale = 110.9 / STYLES.week.ref[1];
  const ttl = ovr("title", conf, "AFC / NFC");
  const tW = inkWidth("week", ttl) * titleScale;
  const tLeft = W / 2 - (tW + 40 + visW) / 2;
  const logoLeft = tLeft + tW + 40 - lg.x0 * scale;
  const right = W - 48.3;
  let y = g.firstCap, blocks = "";
  divs.forEach((d, i) => {
    blocks += stdBlock(d, g.x, y, g);
    y += g.hdrToRow + 4 * g.pitch - 2.4 + g.blockGap;
  });
  root.style.width = `${W}px`;
  root.style.height = `${H}px`;
  root.innerHTML = `${background(W, H, false)}
    <div class="gfx-layer" style="width:${W}px;height:${H}px">
      ${T("side", "FOOTBALL", 45.3, 46.6 + sd)}${T("side", "MORE", 45.3, 70.7 + sd)}${T("side", "THAN", 45.3, 94.4 + sd)}${T("side", "A GAME", 45.3, 117.7 + sd)}
      <div class="g-bar" style="left:44px;top:${149.2 + sd}px;width:25.4px;height:2.2px"></div>
      <div class="g-bar" style="left:${right - 21.6}px;top:${48.3 + sd}px;width:25.5px;height:2.2px"></div>
      ${T("year", String(year), right, 66.4 + sd, "right")}
      <img class="g-logo" src="${BRAND_LOGO}" alt="5DWN" style="left:${W / 2 - 64}px;top:${22.4 + t}px;width:128px;height:30.74px">
      ${T("week", ttl, tLeft, 66.7 + t, "left", { scale: titleScale })}
      <img class="g-logo" crossorigin="anonymous" src="${lg.src}" alt="${conf}" style="left:${logoLeft.toFixed(1)}px;top:${41 + t}px;width:${box}px;height:${box}px">
      ${T("sub", ovr("sub", "CLASSIFICA"), W / 2, 201.7 + t, "center", { maxW: W - 2 * 60 })}
      ${blocks}
      <div class="g-bar" style="left:44px;top:${1025.1 + f}px;width:25.4px;height:2.2px"></div>
      ${T("foot", ovr("foot", CONF_NAME[conf], "AMERICAN / NATIONAL FOOTBALL CONFERENCE"), 78.5, 1041.5 + f, "left", { maxW: W - 78.5 - 260 })}
      ${T("year", "QUINTO DOWN", right, 1008.3 + f, "right")}
      ${T("year", String(year), right, 1032.0 + f, "right")}
      <div class="g-bar" style="left:${right - 21.6}px;top:${1060.9 + f}px;width:25.5px;height:2.6px"></div>
    </div>`;
  fitPreview(stage);
}

// ---------------------------------------------------------------------------- template Partita della settimana
// Misurato su "NFL Game of the Week-selection (1).png" (4692×2640 → 1920×1080). Trasferta a sinistra, casa a destra.
const GW = {
  colL: 400, colR: 1520,
  cityCap: 87.2, nickCap: 120.3, nickRefCap: 69.2,
  logoCy: 317, logoBox: 215,
  scoreCap: 437.4, barY: 615.0, barW: 125.2, barH: 7.4,
  frame: { cx: 959.8, cy: 402.75, w: 539.6, h: 424.1, rot: 3.0, inset: 14 },
  tape: { cx: 958, cy: 200.5, w: 190, h: 46, rot: 1.5 },
  stats: { topLine: 640.0, firstLine: 692.0, pitch: 49.0, x0: 176.0, x1: 1743.6, valL: 177.2, valR: 1742.4, max: 522.5, barH: 7.4, barDy: 7.8, valDy: 37.7, labelX: 959.15 },
  // intestazione
  side: { x: 48.3, tops: [58.1, 83.5, 108.9, 134.2], scale: 1 }, sideDash: [47.9, 167.8, 25.8, 2],
  yearDash: [1832, 56.1, 39.7, 1.6], year: { right: 1867.6, cap: 75.3, scale: 1 },
  brand: [892.1, 29.4, 135, 32.42], at: { x: 960.6, cap: 86.3, h: 66.3 },
  cityScale: 1, nickMaxW: 460, scoreScale: 1,
};
// Misurato su "NFL Game of the Week-selection storia.png" (1448×2576 → 1080×1920).
const GW_TALL = {
  colL: 290, colR: 790,
  cityCap: 302.8, nickCap: 333.4, nickRefCap: 53.7,
  logoCy: 495, logoBox: 182.6,
  scoreCap: 626.5, barY: 786.1, barW: 124.6, barH: 6.8,
  frame: { cx: 539.8, cy: 1043.8, w: 818.5, h: 419.2, rot: 3.0, inset: 12 },
  tape: { cx: 540, cy: 845, w: 160, h: 49, rot: 1.5 },
  stats: { topLine: 1268.0, firstLine: 1338.1, pitch: 49.0, x0: 67.9, x1: 1012.1, valL: 70.1, valR: 1009.9, max: 440.0, barH: 7.4, barDy: 8.2, valDy: 38.8, labelX: 540 },
  side: { x: 49.2, tops: [166.3, 192.4, 217.0, 243.1], scale: 0.911 }, sideDash: [47.7, 276.0, 25.4, 1.6],
  yearDash: [992, 165.6, 39.5, 1.5], year: { right: 1025.3, cap: 185.0, scale: 0.881 },
  brand: [472.1, 152.3, 135, 32.42], at: { x: 540.4, cap: 209.6, h: 53.7 },
  cityScale: 1, nickMaxW: 450, scoreScale: 0.881,
};
const WIN_INK = "#0f1e3f", WIN_SCORE = "#111111", LOSE_INK = "#8a9097", BAR_GREY = "#8a9097";
const ratioNum = (v) => {
  const [m, a] = String(v).split("-").map(Number);
  return a ? m / a : 0;
};
const GAME_STATS = [
  { name: "totalYards", label: "Yard totali" },
  { name: "turnovers", label: "Palle perse", lowerBetter: true },
  { name: "firstDowns", label: "Primi down" },
  { name: "totalPenaltiesYards", label: "Penalità (yard)", lowerBetter: true,
    fmt: (v) => { const [n, y] = String(v).split("-"); return y !== undefined ? `${n} (${y})` : String(v); },
    num: (v) => parseFloat(String(v).split("-")[0]) || 0 },
  { name: "thirdDownEff", label: "Terzi down (convertiti/tentati)", fmt: (v) => String(v).replace("-", "/"), num: ratioNum },
  { name: "fourthDownEff", label: "Quarti down (convertiti/tentati)", fmt: (v) => String(v).replace("-", "/"), num: ratioNum },
  { name: "redZoneAttempts", label: "Red zone", fmt: (v) => String(v).replace("-", "/"), num: ratioNum },
  { name: "possessionTime", label: "Possesso", num: (v) => { const [m, s2] = String(v).split(":").map(Number); return (m || 0) * 60 + (s2 || 0); } },
];

const gameSelect = document.getElementById("game-select");
const photoSelect = document.getElementById("photo-select");
let weekGames = [];
let selectedGame = "";
let gameData = null;
let photoIndex = 0;
let uploadedPhoto = null; // object URL della foto caricata dall'utente

/** Foto che "mette in risalto" la vincente: titolo che cita la squadra vincente (e non la perdente). */
function pickPhoto(photos, win, lose) {
  if (!photos.length || !win) return 0;
  const wn = (win.nickname || win.short || "").toLowerCase(), wl = (win.location || "").toLowerCase();
  const ln = (lose?.nickname || "").toLowerCase();
  let best = 0, bestScore = -Infinity;
  photos.forEach((p, i) => {
    const t = (p.title || "").toLowerCase();
    let sc = 0;
    if (wn && t.includes(wn)) sc += 3;
    if (wl && t.includes(wl)) sc += 1;
    if (ln && t.includes(ln)) sc -= 1;
    if (wn && t.includes(wn) && /\b(win|wins|won|prevail|beat|beats|edge|top|rout|seal|clinch)/.test(t)) sc += 1;
    if (sc > bestScore) { bestScore = sc; best = i; }
  });
  return best;
}

// ---------------------------------------------------------------------------- foto: allineamento e foto dal web
let photoAdj = { x: 50, y: 50, z: 100 }; // posizione (%) e zoom (%) della foto nella cornice
let gameWebPhotos = [];
const adjInputs = { x: document.getElementById("photo-x"), y: document.getElementById("photo-y"), z: document.getElementById("photo-z") };
const adjData = () => `data-px="${photoAdj.x / 100}" data-py="${photoAdj.y / 100}" data-z="${photoAdj.z / 100}"`;
const adjStyle = () => {
  const z = photoAdj.z / 100, px = photoAdj.x / 100, py = photoAdj.y / 100;
  return `left:${(1 - z) * px * 100}%;top:${(1 - z) * py * 100}%;width:${z * 100}%;height:${z * 100}%;object-position:${photoAdj.x}% ${photoAdj.y}%`;
};
/** Foto ritagliata nella cornice: "cover" + posizione e zoom scelti (stessa geometria nell'export). */
function photoClip(f, src) {
  return `<div class="g-photo-clip" style="left:${f.inset}px;top:${f.inset}px;width:${f.w - 2 * f.inset}px;height:${f.h - 2 * f.inset}px">
    <img class="g-photo-img" ${uploadedPhoto ? "" : 'crossorigin="anonymous"'} src="${esc(src)}" alt="" style="${adjStyle()}"></div>`;
}
function applyAdj() {
  document.querySelectorAll(".g-photo").forEach((el) => {
    el.dataset.px = photoAdj.x / 100; el.dataset.py = photoAdj.y / 100; el.dataset.z = photoAdj.z / 100;
    const img = el.querySelector(".g-photo-img");
    if (img) img.setAttribute("style", adjStyle());
  });
  for (const k of ["x", "y", "z"]) adjInputs[k].value = photoAdj[k];
}
function resetAdj() { photoAdj = { x: 50, y: 50, z: 100 }; applyAdj(); }
for (const k of ["x", "y", "z"]) adjInputs[k].addEventListener("input", () => { photoAdj[k] = Number(adjInputs[k].value); applyAdj(); });
document.getElementById("photo-reset").addEventListener("click", resetAdj);
// Trascinare la foto nell'anteprima la sposta nella cornice.
document.addEventListener("pointerdown", (e) => {
  const fr = e.target.closest(".g-photo");
  const img = fr?.querySelector(".g-photo-img");
  if (!img || !img.naturalWidth) return;
  e.preventDefault();
  const stage = Object.values(stages).find((st) => st.root.contains(fr));
  const scale = stage.wrap.getBoundingClientRect().width / stage.W; // px schermo per px grafica
  const tw = +fr.dataset.w - 2 * +fr.dataset.inset, th = +fr.dataset.h - 2 * +fr.dataset.inset;
  const k = Math.max(tw / img.naturalWidth, th / img.naturalHeight) * (photoAdj.z / 100);
  const spanX = img.naturalWidth * k - tw, spanY = img.naturalHeight * k - th; // margine di spostamento
  const start = { x: e.clientX, y: e.clientY, px: photoAdj.x, py: photoAdj.y };
  const move = (ev) => {
    const dx = (ev.clientX - start.x) / scale, dy = (ev.clientY - start.y) / scale;
    if (spanX > 0.5) photoAdj.x = Math.max(0, Math.min(100, start.px - (dx / spanX) * 100));
    if (spanY > 0.5) photoAdj.y = Math.max(0, Math.min(100, start.py - (dy / spanY) * 100));
    applyAdj();
  };
  const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
});
/** Link per cercare altre foto sul web (si scaricano e si caricano con "Carica foto"). */
function renderPhotoLinks(query) {
  const el = document.getElementById("photo-links");
  if (!query) { el.innerHTML = ""; return; }
  const q = encodeURIComponent(query);
  el.innerHTML = `Altre foto sul web: <a href="https://www.google.com/search?tbm=isch&q=${q}" target="_blank" rel="noopener">Google Immagini</a> · <a href="https://www.gettyimages.it/search/2/image?phrase=${q}" target="_blank" rel="noopener">Getty Images</a> · <a href="https://commons.wikimedia.org/w/index.php?search=${q}&title=Special:MediaSearch&type=image" target="_blank" rel="noopener">Wikimedia Commons</a>`;
}
const reEsc = (w) => w.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
const wordIn = (text, w) => new RegExp(`(^|[^a-z0-9])${reEsc(w)}([^a-z0-9]|$)`).test(text);
/** Fino a n foto da Wikimedia Commons (licenze libere, CORS aperto): la prima query che trova, poi le altre. */
async function webPhotos(queries, mustInclude, n) {
  const out = [], seen = new Set();
  for (const q of queries) {
    if (out.length >= n) break;
    try {
      const res = await getWebPhotos(q);
      for (const ph of res.data) {
        const t = ph.title.toLowerCase();
        // tutte le parole richieste, come parole intere (nome e cognome, oppure le due squadre)
        if (!mustInclude.every((w) => wordIn(t, w))) continue;
        if (seen.has(ph.url)) continue;
        seen.add(ph.url);
        out.push({ url: ph.url, title: `Web · ${ph.title} (Wikimedia Commons)` });
        if (out.length >= n) break;
      }
    } catch (err) { console.warn("foto web", err); }
  }
  return out;
}
const gameQuery = (m) => `${m.away.team.nickname} ${m.home.team.nickname} ${new Date(m.date).getFullYear()}`;

const currentPhotos = () => (tpl === "player" ? playerPhotos : [...(gameData?.photos || []), ...gameWebPhotos]);
function renderPhotoSelect() {
  const photos = currentPhotos();
  const opts = photos.map((p, i) => `<option value="${i}">${esc((p.title || `Foto ${i + 1}`).slice(0, 70))}</option>`);
  if (uploadedPhoto) opts.unshift(`<option value="upload">Foto caricata da te</option>`);
  if (!opts.length) opts.push(`<option value="">Nessuna foto ESPN: caricane una</option>`);
  photoSelect.innerHTML = opts.join("");
  photoSelect.value = uploadedPhoto ? "upload" : String(photoIndex);
}

async function loadGame() {
  status.textContent = "Carico statistiche e foto della partita…";
  let res = await getSummary(selectedGame);
  if (!res.data.photos) res = await getSummary(selectedGame, { force: true }); // cache precedente senza foto
  gameData = res.data;
  if (uploadedPhoto) { URL.revokeObjectURL(uploadedPhoto); uploadedPhoto = null; }
  photoAdj = { x: 50, y: 50, z: 100 };
  applyAdj();
  if (tpl === "player") return setupPlayers();
  renderPhotoLinks(gameQuery(gameData));
  gameWebPhotos = await webPhotos([`"${gameData.away.team.nickname} at ${gameData.home.team.nickname}"`, `"${gameData.home.team.nickname} vs ${gameData.away.team.nickname}"`], [gameData.away.team.nickname.toLowerCase(), gameData.home.team.nickname.toLowerCase()], 5);
  const [win, lose] = (gameData.home.score ?? 0) >= (gameData.away.score ?? 0) ? [gameData.home.team, gameData.away.team] : [gameData.away.team, gameData.home.team];
  photoIndex = pickPhoto(gameData.photos || [], win, lose);
  renderPhotoSelect();
  syncUrl();
  renderAll();
  const nPhotos = (gameData.photos || []).length;
  status.textContent = `${gameData.away.team.short} @ ${gameData.home.team.short} · ${gameData.away.score}-${gameData.home.score} · ${nPhotos ? `${nPhotos} foto ESPN, proposta quella sulla vincente` : "nessuna foto ESPN: puoi caricarne una"}`;
}

gameSelect.addEventListener("change", () => {
  selectedGame = gameSelect.value;
  if (selectedGame) loadGame().catch((err) => { console.error(err); status.textContent = "Non riesco a caricare la partita: riprova."; });
});
photoSelect.addEventListener("change", () => {
  if (photoSelect.value === "upload") return;
  if (uploadedPhoto) { URL.revokeObjectURL(uploadedPhoto); uploadedPhoto = null; }
  photoIndex = Number(photoSelect.value) || 0;
  photoAdj = { x: 50, y: 50, z: 100 };
  applyAdj();
  renderPhotoSelect();
  renderAll();
});
document.getElementById("photo-upload").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (uploadedPhoto) URL.revokeObjectURL(uploadedPhoto);
  uploadedPhoto = URL.createObjectURL(file);
  photoAdj = { x: 50, y: 50, z: 100 };
  applyAdj();
  e.target.value = "";
  renderPhotoSelect();
  renderAll();
});

const nickOf = (t) => (t.nickname || t.short || "").toUpperCase();
/** I due nickname hanno sempre la stessa dimensione: se uno non ci sta, si riducono entrambi dello stesso fattore. */
function nickScaleFor(GW, m) {
  const base = GW.nickRefCap / STYLES.week.ref[1];
  const widest = base * Math.max(inkWidth("week", nickOf(m.away.team)), inkWidth("week", nickOf(m.home.team)));
  return base * Math.min(1, GW.nickMaxW / widest);
}

function gameTeamColumn(GW, side, cx, isWinner, tie, nickScale) {
  const t = side.team, abbr = t.abbr;
  const color = ST_CELL[abbr] || t.color || "#333";
  const logo = espnImg(`https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`, 430);
  return `${T("gCity", (t.location || "").toUpperCase(), cx, GW.cityCap, "center", { scale: GW.cityScale })}
    ${T("week", nickOf(t), cx, GW.nickCap, "center", { scale: nickScale })}
    <img class="g-logo" crossorigin="anonymous" src="${logo}" alt="" style="left:${cx - GW.logoBox / 2}px;top:${GW.logoCy - GW.logoBox / 2}px;width:${GW.logoBox}px;height:${GW.logoBox}px">
    ${T("gScore", String(side.score ?? 0), cx, GW.scoreCap, "center", { scale: GW.scoreScale, color: isWinner || tie ? WIN_SCORE : LOSE_INK })}
    <div class="g-bar" style="left:${cx - GW.barW / 2}px;top:${GW.barY}px;width:${GW.barW}px;height:${GW.barH}px;background:${color}"></div>`;
}

function statRows(GW, m) {
  const S = GW.stats;
  const byName = Object.fromEntries((m.teamStats || []).map((r) => [r.name, r]));
  const colA = ST_CELL[m.away.team.abbr] || m.away.team.color || "#333";
  const colH = ST_CELL[m.home.team.abbr] || m.home.team.color || "#333";
  let html = `<div class="g-sep" style="left:${S.x0}px;top:${S.topLine}px;width:${S.x1 - S.x0}px;height:1px;background:#dcdddf"></div>`;
  GAME_STATS.forEach((st, i) => {
    const line = S.firstLine + i * S.pitch;
    const r = byName[st.name];
    const va = r ? r.away : "–", vh = r ? r.home : "–";
    const num = st.num || ((v) => parseFloat(v) || 0);
    const a = r ? num(va) : 0, h = r ? num(vh) : 0;
    const sum = a + h;
    let shA = 0, shH = 0;
    if (sum > 0) [shA, shH] = st.lowerBetter ? [h / sum, a / sum] : [a / sum, h / sum];
    const lenA = Math.max(5, shA * S.max), lenH = Math.max(5, shH * S.max);
    const aBetter = st.lowerBetter ? a < h : a > h, hBetter = st.lowerBetter ? h < a : h > a;
    const cA = a === h || aBetter ? colA : BAR_GREY, cH = a === h || hBetter ? colH : BAR_GREY;
    const fmt = st.fmt || ((v) => String(v));
    html += `${T("gVal", fmt(va), S.valL, line - S.valDy, "left", { color: WIN_INK })}
      ${T("gLabel", st.label, S.labelX, line - 32.8, "center")}
      ${T("gVal", fmt(vh), S.valR, line - S.valDy, "right", { color: WIN_INK })}
      <div class="g-bar" style="left:${S.x0}px;top:${line - S.barDy}px;width:${lenA}px;height:${S.barH}px;background:${cA}"></div>
      <div class="g-bar" style="left:${S.x1 - lenH}px;top:${line - S.barDy}px;width:${lenH}px;height:${S.barH}px;background:${cH}"></div>
      <div class="g-sep" style="left:${S.x0}px;top:${line}px;width:${S.x1 - S.x0}px;height:1px;background:#dcdddf"></div>`;
  });
  return html;
}

const rectBar = ([l, t, w, h], c) => `<div class="g-bar" style="left:${l}px;top:${t}px;width:${w}px;height:${h}px;background:${c}"></div>`;

function renderGameStage(stage, GW) {
  const { W, H, root } = stage;
  const m = gameData;
  const year = sb.season.year;
  const as = m.away.score ?? 0, hs = m.home.score ?? 0;
  const tie = as === hs;
  const f = GW.frame, tp = GW.tape;
  const photos = currentPhotos();
  const src = uploadedPhoto || photos[photoIndex]?.url || "";
  const photo = src
    ? photoClip(f, src)
    : `<div class="g-photo-empty" style="left:${f.inset}px;top:${f.inset}px;right:${f.inset}px;bottom:${f.inset}px">Foto principale</div>`;
  root.style.width = `${W}px`;
  root.style.height = `${H}px`;
  root.innerHTML = `${background(W, H, W > H)}
    <div class="gfx-layer" style="width:${W}px;height:${H}px">
      ${["FOOTBALL", "MORE", "THAN", "A GAME"].map((w, i) => T("stSide", w, GW.side.x, GW.side.tops[i], "left", { scale: GW.side.scale })).join("")}
      ${rectBar(GW.sideDash, "#5e6574")}
      ${rectBar(GW.yearDash, "#222222")}
      ${T("stInk", String(year), GW.year.right, GW.year.cap, "right", { scale: GW.year.scale })}
      <img class="g-logo" src="${BRAND_LOGO}" alt="5DWN" style="left:${GW.brand[0]}px;top:${GW.brand[1]}px;width:${GW.brand[2]}px;height:${GW.brand[3]}px">
      ${T("at", m.neutral ? "VS" : "@", GW.at.x, GW.at.cap, "center", { scale: GW.at.h / STYLES.at.ref[1], color: "#111111" })}
      ${gameTeamColumn(GW, m.away, GW.colL, as > hs, tie, nickScaleFor(GW, m))}
      ${gameTeamColumn(GW, m.home, GW.colR, hs > as, tie, nickScaleFor(GW, m))}
      <div class="g-photo" data-cx="${f.cx}" data-cy="${f.cy}" data-w="${f.w}" data-h="${f.h}" data-rot="${f.rot}" data-inset="${f.inset}" ${adjData()}
        style="left:${f.cx - f.w / 2}px;top:${f.cy - f.h / 2}px;width:${f.w}px;height:${f.h}px;transform:rotate(${f.rot}deg)">${photo}</div>
      <div class="g-tape" data-cx="${tp.cx}" data-cy="${tp.cy}" data-w="${tp.w}" data-h="${tp.h}" data-rot="${tp.rot}"
        style="left:${tp.cx - tp.w / 2}px;top:${tp.cy - tp.h / 2}px;width:${tp.w}px;height:${tp.h}px;transform:rotate(${tp.rot}deg)"></div>
      ${statRows(GW, m)}
    </div>`;
  fitPreview(stage);
}

// ---------------------------------------------------------------------------- template Giocatore (Player Performance)
// Misurato su "NFL Player Performance-selection.png" (11064×6224 → 1920×1080). Solo 16:9.
const PW = {
  name: { cap: 94, maxW: 1500 }, brand: [892, 37.3, 135, 32.42],
  vs: { cap: 232 }, logo: { cx: 961, cy: 308.5, box: 66 },
  lineL: [748, 306, 122, 5], lineR: [1050, 306, 122, 5],
  cols: [276, 1644], valCap: [311.5, 533, 754], labelCap: [433, 655, 876.5], resCap: [873, 873, 873],
  bar: { w: 260, h: 7.6, y: [478, 700, 922] },
  mark: { cx: 978, cy: 560, box: 1100, opacity: 0.08 },
  frame: { cx: 959.75, cy: 695.85, w: 820.4, h: 648.9, rot: -2.42, inset: 16 },
  tape: { cx: 940, cy: 389, w: 256, h: 70, rot: -2.4 },
};
const NAVY = "#0f1e3f";
const decIt = (v) => String(v).replace(".", ",");
const firstNum = (v) => String(v).split("-")[0];
const dash = (v) => String(v).replace("/", "-");
// Statistiche disponibili per giocatore (boxscore ESPN): categoria, etichetta ESPN, testo italiano.
const PSTATS = [
  { id: "pass-catt", cat: "passing", col: "C/ATT", label: "passaggi completati/tentati", f: dash },
  { id: "pass-yds", cat: "passing", col: "YDS", label: "yard su passaggio" },
  { id: "pass-td", cat: "passing", col: "TD", label: "TD su passaggio" },
  { id: "pass-int", cat: "passing", col: "INT", label: "intercetti subiti" },
  { id: "pass-avg", cat: "passing", col: "AVG", label: "yard per tentativo", f: decIt },
  { id: "pass-rtg", cat: "passing", col: "RTG", label: "passer rating", f: decIt },
  { id: "pass-qbr", cat: "passing", col: "QBR", label: "QBR", f: decIt },
  { id: "pass-sacks", cat: "passing", col: "SACKS", label: "sack subiti", f: firstNum },
  { id: "rush-car", cat: "rushing", col: "CAR", label: "corse" },
  { id: "rush-yds", cat: "rushing", col: "YDS", label: "yard su corsa" },
  { id: "rush-avg", cat: "rushing", col: "AVG", label: "yard per corsa", f: decIt },
  { id: "rush-td", cat: "rushing", col: "TD", label: "TD su corsa" },
  { id: "rush-long", cat: "rushing", col: "LONG", label: "corsa più lunga" },
  { id: "rec-rt", cat: "receiving", label: "ricezioni/target", get: (g) => g("REC") != null && g("TGTS") != null ? `${g("REC")}-${g("TGTS")}` : null },
  { id: "rec-rec", cat: "receiving", col: "REC", label: "ricezioni" },
  { id: "rec-tgt", cat: "receiving", col: "TGTS", label: "target" },
  { id: "rec-yds", cat: "receiving", col: "YDS", label: "yard su ricezione" },
  { id: "rec-td", cat: "receiving", col: "TD", label: "TD su ricezione" },
  { id: "rec-long", cat: "receiving", col: "LONG", label: "ricezione più lunga" },
  { id: "rec-avg", cat: "receiving", col: "AVG", label: "yard per ricezione", f: decIt },
  { id: "scrim", cat: "rushing+receiving", label: "yard totali (corsa + ricezione)", get: (g, all) => {
      const r = all.rushing ? Number(all.rushing("YDS")) || 0 : 0, c = all.receiving ? Number(all.receiving("YDS")) || 0 : 0;
      return all.rushing && all.receiving ? String(r + c) : null; } },
  { id: "def-tot", cat: "defensive", col: "TOT", label: "placcaggi totali" },
  { id: "def-solo", cat: "defensive", col: "SOLO", label: "placcaggi solitari" },
  { id: "def-sacks", cat: "defensive", col: "SACKS", label: "sack", f: decIt },
  { id: "def-tfl", cat: "defensive", col: "TFL", label: "placcaggi con perdita di yard" },
  { id: "def-pd", cat: "defensive", col: "PD", label: "passaggi deviati" },
  { id: "def-qbh", cat: "defensive", col: "QB HTS", label: "colpi sul quarterback" },
  { id: "def-td", cat: "defensive", col: "TD", label: "TD difensivi" },
  { id: "int-int", cat: "interceptions", col: "INT", label: "intercetti" },
  { id: "int-yds", cat: "interceptions", col: "YDS", label: "yard su intercetto" },
  { id: "int-td", cat: "interceptions", col: "TD", label: "TD su intercetto" },
  { id: "fum-fum", cat: "fumbles", col: "FUM", label: "fumble" },
  { id: "fum-lost", cat: "fumbles", col: "LOST", label: "fumble persi" },
  { id: "fum-rec", cat: "fumbles", col: "REC", label: "fumble recuperati" },
  { id: "kr-no", cat: "kickReturns", col: "NO", label: "ritorni di kickoff" },
  { id: "kr-yds", cat: "kickReturns", col: "YDS", label: "yard su ritorno di kickoff" },
  { id: "kr-avg", cat: "kickReturns", col: "AVG", label: "media per ritorno di kickoff", f: decIt },
  { id: "kr-long", cat: "kickReturns", col: "LONG", label: "ritorno di kickoff più lungo" },
  { id: "kr-td", cat: "kickReturns", col: "TD", label: "TD su ritorno di kickoff" },
  { id: "pr-no", cat: "puntReturns", col: "NO", label: "ritorni di punt" },
  { id: "pr-yds", cat: "puntReturns", col: "YDS", label: "yard su ritorno di punt" },
  { id: "pr-avg", cat: "puntReturns", col: "AVG", label: "media per ritorno di punt", f: decIt },
  { id: "pr-long", cat: "puntReturns", col: "LONG", label: "ritorno di punt più lungo" },
  { id: "pr-td", cat: "puntReturns", col: "TD", label: "TD su ritorno di punt" },
  { id: "k-fg", cat: "kicking", col: "FG", label: "field goal segnati/tentati", f: dash },
  { id: "k-pct", cat: "kicking", col: "PCT", label: "% field goal", f: decIt },
  { id: "k-long", cat: "kicking", col: "LONG", label: "field goal più lungo" },
  { id: "k-xp", cat: "kicking", col: "XP", label: "extra point segnati/tentati", f: dash },
  { id: "k-pts", cat: "kicking", col: "PTS", label: "punti segnati" },
  { id: "p-no", cat: "punting", col: "NO", label: "punt" },
  { id: "p-yds", cat: "punting", col: "YDS", label: "yard su punt" },
  { id: "p-avg", cat: "punting", col: "AVG", label: "media per punt", f: decIt },
  { id: "p-tb", cat: "punting", col: "TB", label: "touchback" },
  { id: "p-in20", cat: "punting", col: "In 20", label: "punt dentro le 20 yard" },
  { id: "p-long", cat: "punting", col: "LONG", label: "punt più lungo" },
];
const CAT_ORDER = ["passing", "rushing", "receiving", "defensive", "interceptions", "kicking", "punting", "kickReturns", "puntReturns", "fumbles"];
// Slot: sinistra 1-3, destra 1-3 (come nel riferimento: il risultato in basso a sinistra).
const SLOT_DEFAULTS = {
  qb: ["pass-catt", "pass-td", "result", "pass-yds", "pass-int", "pass-rtg"],
  rb: ["rush-car", "rush-long", "result", "rush-yds", "rush-td", "rush-avg"],
  wr: ["rec-rt", "rec-long", "result", "rec-yds", "rec-td", "rec-avg"],
  def: ["def-tot", "def-tfl", "result", "def-sacks", "int-int", "def-qbh"],
  k: ["k-fg", "k-long", "result", "k-pts", "k-xp", "k-pct"],
  p: ["p-no", "p-long", "result", "p-yds", "p-in20", "p-avg"],
  ret: ["kr-no", "kr-long", "result", "kr-yds", "kr-td", "kr-avg"],
};

const playerSelect = document.getElementById("player-select");
const slotSelects = [...document.querySelectorAll(".slot-select")];
let gamePlayers = []; // giocatori della partita con statistiche
let playerSel = null;
let playerPhotos = [];
let slots = [];

function buildPlayers(m) {
  const map = new Map();
  for (const side of [m.away, m.home]) {
    const cats = m.players?.[side.team.id] || {};
    for (const cat of CAT_ORDER) {
      const c = cats[cat];
      if (!c) continue;
      for (const a of c.athletes) {
        if (!a.id) continue;
        if (!map.has(a.id)) map.set(a.id, { id: a.id, name: a.name, headshot: a.headshot, side, opp: side === m.away ? m.home : m.away, cats: {} });
        const p = map.get(a.id);
        p.cats[cat] = (col) => { const i = c.labels.indexOf(col); return i >= 0 && a.stats[i] != null && a.stats[i] !== "" ? a.stats[i] : null; };
      }
    }
  }
  return [...map.values()];
}
function statValue(p, st) {
  if (st.get) {
    const g = p.cats[st.cat] || (() => null);
    return st.get(g, p.cats);
  }
  const g = p.cats[st.cat];
  if (!g) return null;
  const v = g(st.col);
  return v == null ? null : (st.f || String)(v);
}
const availableStats = (p) => PSTATS.filter((st) => statValue(p, st) != null);
function roleOf(p) {
  const n = (cat, col) => Number(p.cats[cat]?.(col)) || 0;
  if (p.cats.passing && Number(String(p.cats.passing("C/ATT") || "0/0").split("/")[1]) >= 5) return "qb";
  const ry = n("rushing", "YDS"), cy = n("receiving", "YDS");
  if (p.cats.rushing || p.cats.receiving) return p.cats.receiving && (cy >= ry || !p.cats.rushing) ? "wr" : "rb";
  if (p.cats.defensive || p.cats.interceptions) return "def";
  if (p.cats.kicking) return "k";
  if (p.cats.punting) return "p";
  if (p.cats.kickReturns || p.cats.puntReturns) return "ret";
  return "def";
}
function playerSummary(p) {
  const c = p.cats;
  if (c.passing) return `${c.passing("C/ATT")}, ${c.passing("YDS")} yd`;
  if (c.rushing && (!c.receiving || Number(c.rushing("YDS")) >= Number(c.receiving("YDS")))) return `${c.rushing("CAR")} corse, ${c.rushing("YDS")} yd`;
  if (c.receiving) return `${c.receiving("REC")} ric., ${c.receiving("YDS")} yd`;
  if (c.defensive) return `${c.defensive("TOT")} placcaggi`;
  if (c.interceptions) return `${c.interceptions("INT")} int.`;
  if (c.kicking) return `FG ${c.kicking("FG")}`;
  if (c.punting) return `${c.punting("NO")} punt`;
  if (c.kickReturns) return `${c.kickReturns("NO")} ritorni`;
  if (c.puntReturns) return `${c.puntReturns("NO")} ritorni`;
  return "";
}
function defaultSlots(p) {
  const avail = new Set(availableStats(p).map((s) => s.id));
  const wanted = SLOT_DEFAULTS[roleOf(p)];
  const used = new Set();
  const out = wanted.map((id) => (id === "result" || avail.has(id) ? id : null));
  if (out[4] === null && wanted === SLOT_DEFAULTS.def && avail.has("def-pd")) out[4] = "def-pd";
  out.forEach((id) => id && used.add(id));
  const spare = [...avail].filter((id) => !used.has(id));
  return out.map((id) => id ?? spare.shift() ?? "");
}

function renderPlayerSelect() {
  const m = gameData;
  const grp = (side) => {
    const list = gamePlayers.filter((p) => p.side === side);
    return list.length ? `<optgroup label="${esc(side.team.short)}">${list.map((p) => `<option value="${p.id}">${esc(p.name)} · ${esc(playerSummary(p))}</option>`).join("")}</optgroup>` : "";
  };
  playerSelect.innerHTML = grp(m.away) + grp(m.home) || `<option value="">Nessun giocatore con statistiche</option>`;
  if (playerSel) playerSelect.value = playerSel.id;
}
function renderSlotSelects() {
  const avail = playerSel ? availableStats(playerSel) : [];
  const opts = `<option value="">— vuoto —</option><option value="result">Risultato della partita</option>` +
    avail.map((st) => `<option value="${st.id}">${esc(st.label)} (${esc(statValue(playerSel, st))})</option>`).join("");
  slotSelects.forEach((sel, i) => { sel.innerHTML = opts; sel.value = slots[i] || ""; });
}

/** Foto del giocatore in quella partita: foto ESPN con il suo nome in didascalia, pubblicate nei giorni della partita. */
async function playerPhotosFor(p) {
  const last = p.name.split(" ").filter((w) => !/^(jr\.?|sr\.?|ii|iii|iv)$/i.test(w)).pop()?.toLowerCase() || "";
  const t0 = new Date(gameData.date).getTime();
  const teamWords = [p.side.team, p.opp.team].flatMap((t) => [t.nickname, t.location]).filter(Boolean).map((w) => w.toLowerCase());
  const inWindow = (d) => { const t = new Date(d).getTime(); return t >= t0 - 12 * 3600e3 && t <= t0 + 5 * 86400e3; };
  const cands = [];
  try {
    const media = (await getPlayerMedia(p.id)).data || [];
    for (const im of media) {
      if (!inWindow(im.published)) continue;
      const cap = im.caption.toLowerCase(), head = im.headline.toLowerCase();
      // con il suo nome in didascalia/titolo prima; poi le altre foto dei servizi su quella partita
      const named = cap.includes(last) ? 6 : head.includes(last) ? 3 : teamWords.some((w) => cap.includes(w) || head.includes(w)) ? 1 : 0;
      if (!named) continue;
      cands.push({ url: im.url, title: im.caption || im.headline, score: named + (named > 1 && im.width >= 1000 ? 1 : 0) });
    }
  } catch (err) { console.warn("foto giocatore", err); }
  for (const ph of gameData.photos || []) {
    const t = (ph.title || "").toLowerCase();
    cands.push({ url: ph.url, title: ph.title, score: t.includes(last) ? 5 : 0 });
  }
  if (p.headshot) cands.push({ url: p.headshot, title: "Foto profilo ESPN (non della partita)", score: -3 });
  const nameWords = p.name.toLowerCase().split(" ").filter((w) => !/^(jr\.?|sr\.?|ii|iii|iv)$/.test(w));
  const web = await webPhotos([`"${p.name}"`], nameWords, 5);
  web.forEach((w) => cands.push({ ...w, score: -2 }));
  const seen = new Set();
  return cands
    .sort((a, b) => b.score - a.score)
    .filter((c) => { const k = c.url.split("?")[0].split("/").pop(); if (seen.has(k)) return false; seen.add(k); return true; })
    .map((c) => ({ url: c.url, title: c.score === -2 ? c.title : `${c.score >= 3 ? "" : "Partita · "}${c.title}` }));
}

async function setupPlayers() {
  gamePlayers = buildPlayers(gameData);
  const wanted = playerSel?.id || new URLSearchParams(location.search).get("p");
  const m = gameData;
  const winSide = (m.home.score ?? 0) >= (m.away.score ?? 0) ? m.home : m.away;
  playerSel = gamePlayers.find((p) => p.id === wanted) || gamePlayers.find((p) => p.side === winSide) || gamePlayers[0] || null;
  renderPlayerSelect();
  await selectPlayer();
}
async function selectPlayer() {
  if (!playerSel) { stages.player.root.innerHTML = ""; status.textContent = "Nessun giocatore con statistiche in questa partita."; return; }
  slots = defaultSlots(playerSel);
  renderSlotSelects();
  status.textContent = `Cerco le foto di ${playerSel.name} in questa partita…`;
  if (uploadedPhoto) { URL.revokeObjectURL(uploadedPhoto); uploadedPhoto = null; }
  renderPhotoLinks(`${playerSel.name} ${playerSel.side.team.nickname} ${playerSel.opp.team.nickname}`);
  playerPhotos = await playerPhotosFor(playerSel);
  photoAdj = { x: 50, y: 50, z: 100 };
  photoIndex = 0;
  renderPhotoSelect();
  syncUrl();
  renderAll();
  const own = playerPhotos.filter((ph) => !ph.title.startsWith("Partita · ") && !ph.title.startsWith("Web · ")).length;
  status.textContent = `${playerSel.name} · ${own ? `${own} foto ESPN di questa partita con il suo nome` : "nessuna foto ESPN con il suo nome: proposte le foto della partita, oppure caricane una"}`;
}
playerSelect.addEventListener("change", () => {
  playerSel = gamePlayers.find((p) => p.id === playerSelect.value) || null;
  selectPlayer().catch((err) => { console.error(err); status.textContent = "Non riesco a caricare il giocatore: riprova."; });
});
slotSelects.forEach((sel, i) => sel.addEventListener("change", () => { slots[i] = sel.value; renderAll(); }));

/** Articolo italiano davanti al nome della squadra avversaria: "i Texans", "gli Eagles", "gli Steelers". */
function articleFor(nick) {
  const n = nick.toLowerCase();
  return /^([aeiou]|s[^aeiou]|z|gn|ps|x|y)/.test(n) ? "gli" : "i";
}
function resultText(p) {
  const my = p.side.score ?? 0, op = p.opp.score ?? 0;
  const nick = p.side.team.nickname || p.side.team.short;
  return my === op ? `Pareggio ${my}-${op}` : `${my > op ? "Vittoria" : "Sconfitta"} ${nick} ${my}-${op}`;
}

function renderPlayerStage(stage) {
  const { W, H, root } = stage;
  const p = playerSel, team = p.side.team, opp = p.opp.team;
  const abbr = team.abbr.toLowerCase();
  const col = ST_CELL[team.abbr] || team.color || "#333";
  const col2 = team.alt && team.alt.toLowerCase() !== (team.color || "").toLowerCase() ? team.alt : "#111111";
  const f = PW.frame, tp = PW.tape, mk = PW.mark, lg = PW.logo;
  const photos = playerPhotos;
  const src = uploadedPhoto || photos[photoIndex]?.url || "";
  const photo = src
    ? photoClip(f, src)
    : `<div class="g-photo-empty" style="left:${f.inset}px;top:${f.inset}px;right:${f.inset}px;bottom:${f.inset}px">Foto del giocatore</div>`;
  let cells = "";
  slots.forEach((id, i) => {
    if (!id) return;
    const side = i < 3 ? 0 : 1, row = i % 3, cx = PW.cols[side];
    if (id === "result") {
      cells += T("pRes", resultText(p), cx, PW.resCap[row], "center", { color: NAVY, maxW: 330 });
    } else {
      const st = PSTATS.find((x) => x.id === id);
      if (!st) return;
      const v = statValue(p, st);
      if (v == null) return;
      cells += `${T("pVal", v, cx, PW.valCap[row], "center", { color: NAVY, maxW: 330 })}
        ${T("pLabel", st.label, cx, PW.labelCap[row], "center", { color: NAVY, maxW: 330 })}`;
    }
    cells += `<div class="g-bar" style="left:${cx - PW.bar.w / 2}px;top:${PW.bar.y[row]}px;width:${PW.bar.w}px;height:${PW.bar.h}px;background:${col}"></div>`;
  });
  root.style.width = `${W}px`;
  root.style.height = `${H}px`;
  root.innerHTML = `${background(W, H, true)}
    <div class="gfx-layer" style="width:${W}px;height:${H}px">
      <img class="g-logo" crossorigin="anonymous" src="${espnImg(`https://a.espncdn.com/i/teamlogos/nfl/500/${abbr}.png`, 500)}" alt="" style="left:${mk.cx - mk.box / 2}px;top:${mk.cy - mk.box / 2}px;width:${mk.box}px;height:${mk.box}px;opacity:${mk.opacity}">
      ${T("stSide", "FOOTBALL", 48.3, 58.1)}${T("stSide", "MORE", 48.3, 83.5)}${T("stSide", "THAN", 48.3, 108.9)}${T("stSide", "A GAME", 48.3, 134.2)}
      ${rectBar([47.9, 167.8, 25.8, 2], "#5e6574")}
      ${rectBar([1832, 56.1, 39.7, 1.6], "#222222")}
      ${T("stInk", String(sb.season.year), 1867.6, 75.3, "right")}
      <img class="g-logo" src="${BRAND_LOGO}" alt="5DWN" style="left:${PW.brand[0]}px;top:${PW.brand[1]}px;width:${PW.brand[2]}px;height:${PW.brand[3]}px">
      ${T("pName", ovr("title", p.name.toUpperCase()), W / 2, PW.name.cap, "center", { maxW: PW.name.maxW })}
      ${T("pVs", ovr("sub", `contro ${articleFor(opp.nickname || opp.short)} ${opp.nickname || opp.short}`), W / 2, PW.vs.cap, "center", { color: NAVY, maxW: 1100 })}
      ${rectBar(PW.lineL, col)}${rectBar(PW.lineR, col2)}
      <img class="g-logo" crossorigin="anonymous" src="${espnImg(`https://a.espncdn.com/i/teamlogos/nfl/500/${abbr}.png`, 200)}" alt="" style="left:${lg.cx - lg.box / 2}px;top:${lg.cy - lg.box / 2}px;width:${lg.box}px;height:${lg.box}px">
      <div class="g-photo" data-cx="${f.cx}" data-cy="${f.cy}" data-w="${f.w}" data-h="${f.h}" data-rot="${f.rot}" data-inset="${f.inset}" ${adjData()}
        style="left:${f.cx - f.w / 2}px;top:${f.cy - f.h / 2}px;width:${f.w}px;height:${f.h}px;transform:rotate(${f.rot}deg)">${photo}</div>
      <div class="g-tape" data-cx="${tp.cx}" data-cy="${tp.cy}" data-w="${tp.w}" data-h="${tp.h}" data-rot="${tp.rot}"
        style="left:${tp.cx - tp.w / 2}px;top:${tp.cy - tp.h / 2}px;width:${tp.w}px;height:${tp.h}px;transform:rotate(${tp.rot}deg)"></div>
      ${cells}
    </div>`;
  fitPreview(stage);
}

// ---------------------------------------------------------------------------- template Calendario squadra
// Misurato su "NFL Team Schedule-selection.png" (10984×6180 → 1920×1080). Solo 16:9.
const TS = {
  colX: [85, 980], top0: 238, pitch: 85, rowH: 80.5, colW: 855,
  cells: { week: [0, 62.8], date: [67.6, 127], at: [199, 49.6], opp: [253, 421.8], res: [679, 176] },
  weekCap: 32, dateCap: 33, atTop: 32, atH: 21, vsCap: 32, vsScale: 17 / 14.3,
  logoCx: 53.5, logoBox: 75, textX: 112.5, cap1: 19.5, cap2: 44.5,
  badge: { x: 13, y: 23, s: 36, cap: 33 }, scoreCap: 30, timeCap: 29, byeCap: 32,
  dash: { cx: 109.5, y: 39, w: 13, h: 5, gapL: 6, gapR: 8 },
  name: { cap: 74, groupCx: 950.5, gap: 49, logoBox: 135, logoCy: 116, maxW: 1240 },
  cal: { cap: 193, groupCx: 968, gap: 39 }, brand: [895, 18.9, 130, 31.2],
  rec: { top: 184.5, h: 39.5, labelW: 97, pad: 14.5, labelCap: 198, valCap: 196 },
};
const TS_BLUE = "#1e3fae";
const BADGE = { W: "#1f9d4b", L: "#d62828", T: "#8a9097" };
const fItDow = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "short" });
const fItDM = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit" });
const teamSelect = document.getElementById("team-select");
let teamList = [];
let teamId = new URLSearchParams(location.search).get("s") || "";
let teamSched = null;
let teamTimer = null;

function tsRow(ev, wk, x, y) {
  const C = TS.cells;
  const cell = (k, extra = "") => `<div class="g-cell g-white" style="left:${x + C[k][0]}px;top:${y}px;width:${C[k][1]}px;height:${TS.rowH}px${extra}"></div>`;
  const mid = (k) => x + C[k][0] + C[k][1] / 2;
  let html = cell("week") + T("tsWeek", `W${wk}`, mid("week"), y + TS.weekCap, "center", { color: TS_BLUE });
  if (!ev) {
    const bx = x + C.date[0], bw = TS.colW - C.date[0];
    return html + `<div class="g-band" style="left:${bx}px;top:${y}px;width:${bw}px;height:${TS.rowH}px"></div>
      ${T("tsBye", "BYE", bx + bw / 2, y + TS.byeCap, "center")}`;
  }
  const d = new Date(ev.date);
  const date = ev.timeValid ? `${fItDow.format(d).replace(".", "").slice(0, 3).toUpperCase()} ${fItDM.format(d)}` : "DA DEFINIRE";
  html += cell("date") + T("tsDate", date, mid("date"), y + TS.dateCap, "center", { maxW: C.date[1] - 10 });
  html += cell("at") + (ev.home
    ? T("vs", "VS", mid("at"), y + TS.vsCap, "center", { scale: TS.vsScale, color: TS_BLUE })
    : T("at", "@", mid("at"), y + TS.atTop, "center", { scale: TS.atH / STYLES.at.ref[1], color: TS_BLUE }));
  // avversaria: cella colorata con logo e nome su due righe (come il calendario settimanale)
  const t = ev.opp, abbr = t.abbr, ox = x + C.opp[0], ow = C.opp[1];
  const ink = DARK_TEXT.has(abbr) ? "#111111" : "#ffffff";
  const logo = espnImg(abbr ? `https://a.espncdn.com/i/teamlogos/nfl/500-dark/${abbr.toLowerCase()}.png` : t.logo, 200);
  html += `<div class="g-cell" style="left:${ox}px;top:${y}px;width:${ow}px;height:${TS.rowH}px;background:${TEAM_CELL[abbr] || t.color || "#333"}"></div>
    <img class="g-logo" crossorigin="anonymous" src="${logo}" alt="" style="left:${ox + TS.logoCx - TS.logoBox / 2}px;top:${y + (TS.rowH - TS.logoBox) / 2}px;width:${TS.logoBox}px;height:${TS.logoBox}px">
    ${T("tsCity", (t.location || "").toUpperCase(), ox + TS.textX, y + TS.cap1, "left", { color: ink, maxW: ow - TS.textX - 12 })}
    ${T("tsNick", (t.nickname || t.short || "").toUpperCase(), ox + TS.textX, y + TS.cap2, "left", { color: ink, maxW: ow - TS.textX - 12 })}`;
  // risultato (W/L + punteggio, prima il nostro) oppure orario italiano
  const rx = x + C.res[0];
  html += cell("res");
  if (ev.state === "post" || ev.state === "in") {
    const r = ev.state === "post" ? ev.result || "T" : "";
    const b = TS.badge, dd = TS.dash;
    const us = ev.us ?? 0, them = ev.them ?? 0;
    if (r) {
      html += `<div class="g-bar" style="left:${rx + b.x}px;top:${y + b.y}px;width:${b.s}px;height:${b.s}px;background:${BADGE[r]}"></div>
        ${T("tsBadge", r, rx + b.x + b.s / 2, y + b.cap, "center", { color: "#ffffff" })}`;
    } else {
      html += `<div class="g-bar" style="left:${rx + b.x}px;top:${y + b.y}px;width:${b.s}px;height:${b.s}px;background:#f7b263"></div>
        ${T("tsBadge", "•", rx + b.x + b.s / 2, y + b.cap, "center", { color: "#ffffff" })}`;
    }
    const cUs = ev.state === "post" && us < them ? SCORE_LOSE : SCORE_WIN, cThem = ev.state === "post" && them < us ? SCORE_LOSE : SCORE_WIN;
    const cx = rx + dd.cx;
    html += `<div class="g-dash" style="left:${cx - dd.w / 2}px;top:${y + dd.y}px;width:${dd.w}px;height:${dd.h}px;background:#111111"></div>
      ${T("tsScore", String(us), cx - dd.w / 2 - dd.gapL, y + TS.scoreCap, "right", { color: cUs })}
      ${T("tsScore", String(them), cx + dd.w / 2 + dd.gapR, y + TS.scoreCap, "left", { color: cThem })}`;
  } else {
    html += T("tsTime", ev.timeValid ? fItTime.format(d) : "TBD", mid("res"), y + TS.timeCap, "center");
  }
  return html;
}

/** "CALENDARIO 2026" + box RECORD (blu) e valore (bianco), centrati come gruppo. */
function recordGroup(record, year) {
  const c = TS.cal, r = TS.rec;
  const calText = ovr("sub", `CALENDARIO ${year}`);
  const calW = inkWidth("tsCal", calText), valW = inkWidth("tsRecV", record);
  const whiteW = valW + 2 * r.pad;
  const left = c.groupCx - (calW + c.gap + r.labelW + whiteW) / 2;
  const nx = left + calW + c.gap, wx = nx + r.labelW;
  return `${T("tsCal", calText, left, c.cap, "left")}
    <div class="g-bar" style="left:${nx}px;top:${r.top}px;width:${r.labelW}px;height:${r.h}px;background:#0f1e3f"></div>
    ${T("tsRecL", "RECORD", nx + r.labelW / 2, r.labelCap, "center", { color: "#ffffff" })}
    <div class="g-bar" style="left:${wx}px;top:${r.top}px;width:${whiteW}px;height:${r.h}px;background:#ffffff"></div>
    ${T("tsRecV", record, wx + whiteW / 2, r.valCap, "center", { color: "#0f1e3f" })}`;
}

function renderTeamStage(stage) {
  const { W, H, root } = stage;
  const { team, events } = teamSched;
  const year = sb.season.year;
  const byWeek = new Map(events.filter((e) => e.seasonType === 2 && e.week).map((e) => [e.week, e]));
  const nWeeks = Math.max(18, ...byWeek.keys());
  const half = Math.ceil(nWeeks / 2);
  let rows = "";
  for (let w = 1; w <= nWeeks; w++) {
    const col = w <= half ? 0 : 1, i = (w - 1) % half;
    rows += tsRow(byWeek.get(w), w, TS.colX[col], TS.top0 + i * TS.pitch);
  }
  const done = events.filter((e) => e.seasonType === 2 && e.state === "post");
  const wins = done.filter((e) => e.result === "W").length, losses = done.filter((e) => e.result === "L").length, ties = done.length - wins - losses;
  const record = `${wins}-${losses}${ties ? `-${ties}` : ""}`;
  // nome + logo centrati come gruppo; il nome si riduce solo se non ci sta
  const nm = TS.name, name = ovr("title", (team.name || "").toUpperCase());
  const k = Math.min(1, nm.maxW / inkWidth("tsName", name));
  const nameW = inkWidth("tsName", name) * k;
  const left = nm.groupCx - (nameW + nm.gap + nm.logoBox) / 2;
  root.style.width = `${W}px`;
  root.style.height = `${H}px`;
  root.innerHTML = `${background(W, H, true)}
    <div class="gfx-layer" style="width:${W}px;height:${H}px">
      ${["FOOTBALL", "MORE", "THAN", "A GAME"].map((w, i) => T("stSide", w, 46, [47, 71, 95, 118][i], "left", { scale: 1.06 })).join("")}
      ${rectBar([45, 149, 25, 3], TS_BLUE)}
      ${rectBar([1850, 48, 25, 3], TS_BLUE)}
      ${T("stInk", String(year), 1872, 67, "right", { scale: 1.04 })}
      <img class="g-logo" src="${BRAND_LOGO}" alt="5DWN" style="left:${TS.brand[0]}px;top:${TS.brand[1]}px;width:${TS.brand[2]}px;height:${TS.brand[3]}px">
      ${T("tsName", name, left, nm.cap, "left", { scale: k })}
      <img class="g-logo" crossorigin="anonymous" src="${espnImg(`https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbr.toLowerCase()}.png`, 300)}" alt="" style="left:${left + nameW + nm.gap}px;top:${nm.logoCy - nm.logoBox / 2}px;width:${nm.logoBox}px;height:${nm.logoBox}px">
      ${recordGroup(record, year)}
      ${rows}
      ${T("tsFoot", ovr("foot", "TUTTI GLI ORARI IN ORA ITALIANA"), 45, 1026, "left", { color: TS_BLUE, maxW: 1500 })}
      ${rectBar([45, 1055, 25, 2.5], TS_BLUE)}
      ${T("tsQd", `QUINTO DOWN ${year}`, 1872, 1026, "right")}
      ${rectBar([1850, 1054, 25, 3], TS_BLUE)}
    </div>`;
  fitPreview(stage);
}

async function loadTeamSchedule({ quiet = false } = {}) {
  try {
    if (!teamList.length) {
      teamList = (await getTeams()).data.slice().sort((a, b) => a.name.localeCompare(b.name));
      teamSelect.innerHTML = teamList.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("");
    }
    if (!teamList.some((t) => t.id === teamId)) teamId = teamList[0]?.id || "";
    teamSelect.value = teamId;
    if (!quiet) status.textContent = "Carico il calendario della squadra…";
    // Sempre dati freschi da ESPN (risultati e orari aggiornati al minuto).
    const res = await getSchedule(teamId, { force: true }, { seasonType: 2 });
    const team = teamList.find((t) => t.id === teamId);
    const sig = JSON.stringify(res.data.events.map((e) => [e.id, e.state, e.us, e.them, e.date, e.timeValid]));
    if (quiet && teamSched && teamSched.sig === sig && teamSched.team.id === teamId) return;
    teamSched = { team, events: res.data.events, sig };
    syncUrl();
    renderAll();
    status.textContent = `${team.name} · calendario ${sb.season.year} da ESPN · aggiornato alle ${fItTime.format(new Date())} (si aggiorna da solo ogni minuto)`;
  } catch (err) {
    console.error(err);
    if (!quiet) status.textContent = "Non riesco a caricare il calendario della squadra: riprova.";
  }
}
teamSelect.addEventListener("change", () => { teamId = teamSelect.value; loadTeamSchedule(); });
// aggiornamento automatico ogni minuto mentre è aperto questo template
teamTimer = setInterval(() => { if (tpl === "team" && !document.hidden) loadTeamSchedule({ quiet: true }); }, 60 * 1000);

// ---------------------------------------------------------------------------- tendina e caricamento
let lastPlayedKey = ""; // ultima settimana completa (risultati)
let standingsKey = ""; // settimana proposta per le classifiche
let gameKey = ""; // settimana proposta per la partita (ultima con partite concluse)
const defaultKey = () => (tpl === "results" ? lastPlayedKey : tpl === "standings" ? standingsKey : isGameLike() ? gameKey : currentKey);

/** Calendario: tutte le settimane. Risultati: solo quelle già iniziate (con partite giocate). */
const visibleWeeks = () =>
  tpl === "results"
    ? weeks.filter((e) => new Date(e.start).getTime() <= Date.now())
    : tpl === "standings"
      ? weeks.filter((e) => e.seasonType === 2 && new Date(e.start).getTime() <= Date.now()) // classifica: solo regular season giocata
      : isGameLike()
        ? weeks.filter((e) => new Date(e.start).getTime() <= Date.now()) // partita: settimane già iniziate
        : weeks;

function renderSelect() {
  const list = visibleWeeks();
  if (!list.some((e) => keyOf(e) === selectedKey)) selectedKey = defaultKey();
  const group = (type, label) => {
    const items = list.filter((e) => e.seasonType === type);
    return items.length
      ? `<optgroup label="${label}">${items.map((e) => {
          const k = keyOf(e);
          return `<option value="${k}"${k === selectedKey ? " selected" : ""}>${esc(weekLabel(e))} · ${esc(weekRange(e))}${k === currentKey ? " — in corso" : ""}</option>`;
        }).join("")}</optgroup>`
      : "";
  };
  weekSelect.innerHTML = group(2, "Regular season") + group(3, "Playoff");
  weekSelect.classList.toggle("is-current", selectedKey === currentKey);
  document.querySelectorAll(".tpl-name").forEach((el) => (el.textContent = tpl === "results" ? "Risultati settimanali" : "Calendario settimanale"));
  applyVisibility();
  tplToggle.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tpl === tpl)));
}

function syncUrl() {
  const url = new URL(location.href);
  url.searchParams.set("w", selectedKey);
  url.searchParams.set("t", { results: "risultati", standings: "classifiche", game: "partita", player: "giocatore", team: "squadra" }[tpl] || "calendario");
  if (isGameLike() && selectedGame) url.searchParams.set("g", selectedGame);
  else url.searchParams.delete("g");
  if (tpl === "player" && playerSel) url.searchParams.set("p", playerSel.id);
  else url.searchParams.delete("p");
  url.searchParams.set("f", fmt === "tall" ? "storie" : "16-9");
  if (tpl === "team" && teamId) url.searchParams.set("s", teamId);
  else url.searchParams.delete("s");
  history.replaceState(null, "", url);
}

weekSelect.addEventListener("change", () => {
  selectedKey = weekSelect.value;
  syncUrl();
  renderSelect();
  loadWeek();
});

document.getElementById("fmt-toggle").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-fmt]");
  if (!b || b.dataset.fmt === fmt) return;
  fmt = b.dataset.fmt;
  applyVisibility();
  syncUrl();
});

const tplToggle = document.getElementById("tpl-toggle");
tplToggle.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tpl]");
  if (!b || b.dataset.tpl === tpl) return;
  tpl = b.dataset.tpl;
  selectedKey = defaultKey();
  renderSelect();
  syncUrl();
  loadWeek();
});

async function loadWeek() {
  if (tpl === "team") return loadTeamSchedule();
  const entry = weeks.find((e) => keyOf(e) === selectedKey);
  if (!entry) return;
  status.textContent = "Carico le partite…";
  if (isGameLike()) {
    try {
      const res = await getWeek(entry, sb.season.year);
      weekGames = res.data.games.filter((g) => g.state === "post");
      gameSelect.innerHTML = weekGames.length
        ? weekGames.map((g) => `<option value="${g.id}">${esc(g.away.team.short)} @ ${esc(g.home.team.short)} · ${g.away.score}-${g.home.score} · ${esc(fItDay.format(new Date(g.date)))}</option>`).join("")
        : `<option value="">Nessuna partita conclusa</option>`;
      if (!weekGames.length) {
        gameData = null;
        stages.game.root.innerHTML = "";
        stages.gameTall.root.innerHTML = "";
        stages.player.root.innerHTML = "";
        playerSel = null;
        status.textContent = `Nessuna partita conclusa in ${weekLabel(entry)}.`;
        return;
      }
      const wanted = selectedGame || new URLSearchParams(location.search).get("g");
      selectedGame = weekGames.some((g) => g.id === wanted) ? wanted : weekGames[0].id;
      gameSelect.value = selectedGame;
      await loadGame();
    } catch (err) {
      console.error(err);
      status.textContent = "Non riesco a caricare le partite: riprova.";
    }
    return;
  }
  if (tpl === "standings") {
    try {
      standingsData = await standingsAfter(entry);
      renderAll();
      status.textContent = `Classifica dopo la ${weekLabel(entry)} ${sb.season.year} · ${standingsData.live ? "classifica ufficiale ESPN" : "ricalcolata dai risultati ESPN fino a questa settimana"}`;
    } catch (err) {
      console.error(err);
      status.textContent = "Non riesco a caricare la classifica: riprova.";
    }
    return;
  }
  try {
    // Titolo e contenuto seguono sempre la settimana scelta nella tendina (dati ESPN via api.js).
    const res = await getWeek(entry, sb.season.year);
    const all = res.data.games;
    const games = tpl === "results" ? all.filter((g) => g.state === "post") : all;
    weekData = { entry, year: sb.season.year, games, days: buildDays(games) };
    renderAll();
    status.textContent =
      tpl === "results"
        ? `${games.length} risultati su ${all.length} partite · ${weekLabel(entry)} ${sb.season.year}${games.length < all.length ? " · le partite non ancora concluse non compaiono" : ""}`
        : `${games.length} partite · ${weekLabel(entry)} ${sb.season.year} · clic su una cella TV per alternare DAZN / Game Pass`;
  } catch (err) {
    console.error(err);
    status.textContent = "Non riesco a caricare la settimana: riprova.";
  }
}

async function init() {
  status.textContent = "Carico calendario e font…";
  try {
    const fontsToLoad = Object.values(STYLES).map((st) => document.fonts.load(fontStr(st, 40), st.ref[0]));
    const [scoreboard] = await Promise.all([getScoreboard(), ...fontsToLoad]);
    sb = scoreboard.data;
  } catch (err) {
    console.error(err);
    status.textContent = "Errore nel caricamento iniziale: ricarica la pagina.";
    return;
  }
  await document.fonts.ready;
  calibrate();
  // Anno e settimane dalle API ESPN.
  weeks = sb.calendar.filter((e) => e.seasonType === 2 || e.seasonType === 3);
  const idx = currentWeekIndex(sb);
  const cur = sb.calendar[idx];
  currentKey = cur && (cur.seasonType === 2 || cur.seasonType === 3) ? keyOf(cur) : cur?.seasonType === 1 ? keyOf(weeks[0]) : keyOf(weeks[weeks.length - 1] || {});
  // Risultati, settimana proposta: la corrente se è tutta conclusa, altrimenti l'ultima completa.
  // (La settimana in corso resta comunque selezionabile con i risultati già disponibili.)
  const curPos = weeks.findIndex((e) => keyOf(e) === currentKey);
  const curDone = sb.games.length > 0 && sb.games.every((g) => g.state === "post") && cur && keyOf(cur) === currentKey;
  lastPlayedKey = keyOf(weeks[Math.max(0, curDone ? curPos : curPos - 1)] || weeks[0]);
  const fromUrl = new URLSearchParams(location.search).get("w");
  // Classifiche: la settimana in corso se ha già partite giocate, altrimenti la precedente.
  const curHasGames = sb.games.some((g) => g.state !== "pre") && cur && keyOf(cur) === currentKey && cur.seasonType === 2;
  standingsKey = keyOf(weeks[Math.max(0, curHasGames ? curPos : curPos - 1)] || weeks[0]);
  const curHasFinals = sb.games.some((g) => g.state === "post") && cur && keyOf(cur) === currentKey;
  gameKey = keyOf(weeks[Math.max(0, curHasFinals ? curPos : curPos - 1)] || weeks[0]);
  selectedKey = visibleWeeks().some((e) => keyOf(e) === fromUrl) ? fromUrl : defaultKey();
  renderSelect();
  loadWeek();
}

init();
