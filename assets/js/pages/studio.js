// ============================================================================
// 5DWN Studio — pagina nascosta (studio.html) per generare grafiche PNG.
// Template 1: calendario settimanale "NFL Calendar", 16:9 (1920×1080) e 9:16 (1080×1920).
// Geometrie, colori e corpi dei testi sono misurati sul file di riferimento
// "NFL Calendar-selection (1).png" (riportato a 1920×1080).
// ============================================================================

import { renderChrome, loading, showError, esc, espnImg, weekLabel, weekRange, tvItalia, dayKey } from "../ui.js?v=202610061127";
import { getScoreboard, getWeek, getStandings, getSummary, getPlayerMedia, getWebPhotos, getTeams, getSchedule, getRoster, getGamelog, getAthleteRanking, getTeamSeason, getQualified, getEventTeamStats, getSeasonPlayers, getTeamHistory, setCurrentSeason, currentWeekIndex } from "../api.js?v=202610061127";

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
  tfocus: { root: document.getElementById("gfx-tfocus"), wrap: document.getElementById("preview-tfocus"), W: 1920, H: 1080 },
  tcompare: { root: document.getElementById("gfx-tcompare"), wrap: document.getElementById("preview-tcompare"), W: 1920, H: 1080 },
  compare: { root: document.getElementById("gfx-compare"), wrap: document.getElementById("preview-compare"), W: 1920, H: 1080 },
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
  week: { cls: "gt-week", family: "Archivo Bold", weight: 700, stretch: "normal", natural: true, ref: ["WEEK 4", 93.2, 640.0] },
  sub: { cls: "gt-sub", family: "Archivo Thin", weight: 100, stretch: "normal", natural: true, ref: ["ORARI ITALIA", 22.5, 408.9] },
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
  stSub: { cls: "gt-sub", family: "Archivo Thin", weight: 100, stretch: "normal", natural: true, ref: ["CLASSIFICA", 21.3, 359.7] },
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
  tsName: { cls: "gt-ts-name", family: "Archivo Bold", weight: 700, stretch: "normal", natural: true, ref: ["MIAMI DOLPHINS", 84, 1051] },
  tsCal: { cls: "gt-sub", family: "Archivo Thin", weight: 100, stretch: "normal", natural: true, ref: ["CALENDARIO 2026", 21, 519] },
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
  // Template Confronto squadre ("NFL Team Comparison-selection.png", 7640×4296 → 1920×1080)
  tcCity: { cls: "gt-cmp-first", family: "Barlow Condensed", weight: 500, stretch: "normal", ref: ["BUFFALO", 24, 98] },
  tcNick: { cls: "gt-cmp-last", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["BILLS", 39, 107] },
  tcRec: { cls: "gt-cmp-last", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["3-1", 15, 24] },
  tcHdr: { cls: "gt-cmp-last", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["STATISTICA", 12, 88] },
  tcLabel: { cls: "gt-cmp-label", family: "Barlow Condensed", weight: 500, stretch: "normal", ref: ["PUNTI A PARTITA", 21, 163] },
  tcVal: { cls: "gt-cmp-val", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["29.5", 28, 60] },
  tcRank: { cls: "gt-cmp-last", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["4°", 22, 23] },
  tcLeg: { cls: "gt-cmp-last", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["TOP 10", 11.5, 43] },
  // Template Confronto giocatori ("NFL Player Comparison-selection.png", 10984×6180 → 1920×1080)
  cmpFirst: { cls: "gt-cmp-first", family: "Barlow Condensed", weight: 500, stretch: "normal", ref: ["JUSTIN", 22, 76] },
  cmpLast: { cls: "gt-cmp-last", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["HERBERT", 28, 132] },
  cmpLabel: { cls: "gt-cmp-label", family: "Barlow Condensed", weight: 500, stretch: "normal", ref: ["COMP/ATT", 20, 92] },
  cmpVal: { cls: "gt-cmp-val", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["32/54", 33, 99] },
  cmpNote: { cls: "gt-cmp-note", family: "Barlow", weight: 400, stretch: "normal", italic: true, ref: ["* 3 fumble, tutti recuperati dall'attacco (0 persi)", 12.5, 318] },
  cmpSub: { cls: "gt-sub", family: "Archivo Thin", weight: 100, stretch: "normal", natural: true, ref: ["STATISTICHE AGGREGATE", 21, 680] },
  cmpFoot: { cls: "gt-foot", family: "Archivo", weight: 600, stretch: "normal", ref: ["NFL 2026 REGULAR SEASON", 13, 272] },
  // Template Giocatore ("NFL Player Performance-selection.png", 11064×6224 → 1920×1080)
  pName: { cls: "gt-p-name", family: "Archivo Bold", weight: 700, stretch: "normal", natural: true, ref: ["JA'MARR CHASE", 111, 1113] },
  pVs: { cls: "gt-p-vs", family: "Archivo Thin", weight: 100, stretch: "normal", natural: true, ref: ["contro i Texans", 27, 262] },
  pVal: { cls: "gt-p-val", family: "Archivo", weight: 800, stretch: "semi-condensed", ref: ["75", 93, 139], ink: true },
  pLabel: { cls: "gt-p-label", family: "Barlow Condensed", weight: 500, stretch: "normal", ref: ["TD su ricezione", 25, 208] },
  pRes: { cls: "gt-p-label", family: "Barlow Condensed", weight: 500, stretch: "normal", ref: ["Vittoria Bengals 20-6", 28, 314] },
  gCity: { cls: "gt-g-city", family: "Archivo", weight: 600, stretch: "expanded", ref: ["NEW ORLEANS", 13.5, 229.6] },
  gScore: { cls: "gt-g-score", family: "Archivo", weight: 800, stretch: "condensed", ref: ["24", 157.5, 207.4] },
  gVal: { cls: "gt-g-val", family: "Archivo", weight: 700, stretch: "normal", ref: ["298", 18.4, 43.8] },
  gLabel: { cls: "gt-g-label", family: "Archivo", weight: 600, stretch: "normal", ref: ["Yard totali", 14.4, 93.3] },
  gp: { cls: "gt-gp", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["GAME", 15.1, 41.0] },
};

// ---- font di titoli e sottotitoli, scelti dalle tendine "Font titolo" / "Font sottotitolo" (salvati nel browser)
const TITLE_KEYS = ["week", "tsName", "pName"], SUB_KEYS = ["sub", "stSub", "tsCal", "cmpSub", "pVs"];
// valori dei master (Archivo variabile, spaziatura misurata sul riferimento)
const MASTER_FONT = {
  week: { family: "Archivo", weight: 900, stretch: "expanded" }, tsName: { family: "Archivo", weight: 800, stretch: "normal" },
  pName: { family: "Archivo", weight: 900, stretch: "condensed" }, pVs: { family: "Archivo", weight: 400, stretch: "normal" },
  ...Object.fromEntries(["sub", "stSub", "tsCal", "cmpSub"].map((k) => [k, { family: "Archivo", weight: 500, stretch: "expanded" }])),
};
const FONT_CHOICES = {
  title: [
    ["archivo-bold", "Archivo Bold", { family: "Archivo Bold", weight: 700 }],
    ["archivo-extrabold", "Archivo ExtraBold", { family: "Archivo", weight: 800 }],
    ["archivo-black", "Archivo Black", { family: "Archivo", weight: 900 }],
    ["barlow-cond", "Barlow Condensed Bold", { family: "Barlow Condensed", weight: 700 }],
    ["master", "Come i master (Archivo espanso)", null],
  ],
  sub: [
    ["archivo-thin", "Archivo Thin", { family: "Archivo Thin", weight: 100 }],
    ["archivo-light", "Archivo Light", { family: "Archivo", weight: 300 }],
    ["archivo-regular", "Archivo Regular", { family: "Archivo", weight: 400 }],
    ["archivo-medium", "Archivo Medium", { family: "Archivo", weight: 500 }],
    ["barlow-cond", "Barlow Condensed Medium", { family: "Barlow Condensed", weight: 500 }],
    ["master", "Come i master (Archivo espanso)", null],
  ],
};
const FONT_KEY = "5dwn:studio-fonts";
const fontPick = (() => {
  const def = { title: "archivo-bold", sub: "archivo-thin" };
  try { return Object.assign(def, JSON.parse(localStorage.getItem(FONT_KEY) || "{}")); } catch { return def; }
})();
const STRETCH_PCT = { "ultra-condensed": 50, "extra-condensed": 62.5, condensed: 75, "semi-condensed": 87.5, normal: 100, "semi-expanded": 112.5, expanded: 125 };
/** Applica la scelta ai relativi STYLES (va seguito da calibrate()). */
function applyFonts() {
  for (const [group, keys] of [["title", TITLE_KEYS], ["sub", SUB_KEYS]]) {
    const ch = (FONT_CHOICES[group].find(([id]) => id === fontPick[group]) || FONT_CHOICES[group][0])[2];
    for (const k of keys) {
      // scelta libera: spaziatura propria del font (natural); master: spaziatura misurata sul riferimento
      Object.assign(STYLES[k], ch ? { ...ch, stretch: "normal", natural: true } : { ...MASTER_FONT[k], natural: false }, { dyn: true });
    }
  }
}
applyFonts();

const ctx = document.createElement("canvas").getContext("2d");
const fontStr = (st, size) => `${st.italic ? "italic " : ""}${st.stretch && st.stretch !== "normal" ? `${st.stretch} ` : ""}${st.weight} ${size}px "${st.family}"`;

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
    // natural: titoli (Archivo Bold) e sottotitoli (Archivo Thin) con la spaziatura del font, stessa altezza del master
    st.ls = n > 1 && !st.natural ? (ink - natural) / (n - 1) : 0;
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
  const font = st.dyn ? `;font-family:&quot;${st.family}&quot;;font-weight:${st.weight};font-stretch:${STRETCH_PCT[st.stretch] || 100}%` : "";
  return `<span class="gt ${st.cls}" style="left:${left.toFixed(2)}px;top:${top.toFixed(2)}px;font-size:${size.toFixed(3)}px;letter-spacing:${ls.toFixed(3)}px${font}${color ? `;color:${color}` : ""}">${esc(text)}</span>`;
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
let tpl = { risultati: "results", classifiche: "standings", partita: "game", giocatore: "player", squadra: "team", confronto: "compare", "confronto-squadre": "tcompare" }[new URLSearchParams(location.search).get("t")] || "calendar";
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
  compare: { title: true, sub: true, foot: true },
  tcompare: { title: true, sub: true, foot: true },
  game: {},
};
// Testi senza valore automatico: vanno sempre scritti (Confronto giocatori).
// Confronti: titolo automatico con le stagioni (sostituibile), sottotitolo da scrivere sempre.
const OV_REQUIRED = { compare: { sub: true }, tcompare: { sub: true } };
// Focus squadra (1 squadra): il titolo è il nome della squadra (sostituibile), il sottotitolo va scritto.
const ovRequired = (k) => !!OV_REQUIRED[tpl]?.[k];
const ovPlaceholder = (k) => (ovRequired(k) ? "Obbligatorio: scrivi il testo" : `Automatico: ${lastAuto[tpl]?.[k] ?? "…"}`);
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
    el.placeholder = fields[k] ? ovPlaceholder(k) : "Non presente in questa grafica";
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
    else if (el.classList.contains("tpl-compare")) ok = tpl === "compare"; // per ora solo 16:9
    else if (el.classList.contains("tpl-tcompare")) ok = tpl === "tcompare" && tc.n > 1; // per ora solo 16:9
    else if (el.classList.contains("tpl-tfocus")) ok = tpl === "tcompare" && tc.n === 1;
    else ok = (tpl === "calendar" || tpl === "results") && el.dataset.fmt === fmt;
    el.hidden = !ok;
  });
  document.querySelectorAll(".game-only").forEach((el) => (el.hidden = !isGameLike()));
  document.querySelectorAll(".player-only").forEach((el) => (el.hidden = tpl !== "player"));
  document.getElementById("fmt-toggle").hidden = ["player", "team", "compare", "tcompare"].includes(tpl);
  document.querySelectorAll(".tcompare-only").forEach((el) => (el.hidden = tpl !== "tcompare"));
  document.querySelectorAll(".tfocus-only").forEach((el) => (el.hidden = !(tpl === "tcompare" && tc.n === 1)));
  document.querySelectorAll(".team-only").forEach((el) => (el.hidden = tpl !== "team"));
  document.querySelectorAll(".compare-only").forEach((el) => (el.hidden = tpl !== "compare"));
  weekSelect.closest(".select-field").hidden = ["team", "compare", "tcompare"].includes(tpl);
  if (tpl === "compare" || tpl === "tcompare") document.querySelector(".studio-texts").open = true; // titolo e sottotitolo vanno sempre scritti
  syncOverrideFields();
  document.getElementById("fmt-select").value = fmt;
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

// ---- loghi con contorno: Broncos (cresta arancione su box arancione) con bordo blu, in anteprima e nel PNG
const OUTLINE_LOGOS = { den: { color: "#0a2a6b", width: 0.03 } }; // width: spessore in frazione del lato del logo
const outlinedLogo = {}; // sigla → data URL del logo con contorno
async function prepareOutlinedLogos() {
  await Promise.all(Object.entries(OUTLINE_LOGOS).map(async ([abbr, { color, width }]) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr}.png`;
      await img.decode();
      const S = img.naturalWidth, pad = Math.ceil(S * width) + 2, r = S * width;
      // sagoma del logo nel colore del bordo
      const sil = document.createElement("canvas");
      sil.width = S; sil.height = S;
      const sc = sil.getContext("2d");
      sc.drawImage(img, 0, 0);
      sc.globalCompositeOperation = "source-in";
      sc.fillStyle = color;
      sc.fillRect(0, 0, S, S);
      // contorno = sagoma ripetuta tutto intorno, poi il logo sopra (stesso centro, lato aumentato di 2×pad)
      const out = document.createElement("canvas");
      out.width = S + 2 * pad; out.height = S + 2 * pad;
      const oc = out.getContext("2d");
      for (let a = 0; a < 360; a += 10) oc.drawImage(sil, pad + r * Math.cos((a * Math.PI) / 180), pad + r * Math.sin((a * Math.PI) / 180));
      oc.drawImage(sil, pad, pad);
      oc.drawImage(img, pad, pad);
      outlinedLogo[abbr] = { url: out.toDataURL("image/png"), k: out.width / S };
    } catch (err) { console.warn("contorno logo", abbr, err); } // senza contorno: resta il logo ESPN
  }));
}
/** Sostituisce nei loghi della grafica le squadre con contorno (il riquadro si allarga del bordo, centro invariato). */
function applyOutlinedLogos(root) {
  for (const im of root.querySelectorAll("img.g-logo")) {
    const m = (im.getAttribute("src") || "").match(/teamlogos\/nfl\/500(?:-dark)?\/(\w+)\.png/);
    const o = m && outlinedLogo[m[1]];
    if (!o || im.dataset.outlined) continue;
    const w = parseFloat(im.style.width), h = parseFloat(im.style.height);
    const l = parseFloat(im.style.left), t = parseFloat(im.style.top);
    im.dataset.outlined = "1";
    im.removeAttribute("crossorigin");
    im.src = o.url;
    if ([w, h, l, t].every(Number.isFinite)) { // il logo resta della stessa misura: si aggiunge solo il bordo
      im.style.width = `${w * o.k}px`; im.style.height = `${h * o.k}px`;
      im.style.left = `${l - (w * (o.k - 1)) / 2}px`; im.style.top = `${t - (h * (o.k - 1)) / 2}px`;
    }
  }
}

function fitPreview(stage) {
  const { wrap, root, W, H } = stage;
  applyOutlinedLogos(root);
  const scaler = wrap.querySelector(".gfx-scaler");
  const k = wrap.clientWidth / W;
  scaler.style.transform = `scale(${k})`;
  wrap.style.height = `${H * k}px`;
  root.dataset.scale = k;
}

/** Tendine "Font titolo" / "Font sottotitolo": cambiano titoli e sottotitoli di tutte le grafiche. */
function initFontControls() {
  for (const group of ["title", "sub"]) {
    const el = document.getElementById(`font-${group}`);
    if (!el) continue;
    el.innerHTML = FONT_CHOICES[group].map(([id, label]) => `<option value="${id}">${esc(label)}</option>`).join("");
    el.value = fontPick[group];
    el.addEventListener("change", async () => {
      fontPick[group] = el.value;
      try { localStorage.setItem(FONT_KEY, JSON.stringify(fontPick)); } catch { /* storage bloccato: vale solo per questa visita */ }
      applyFonts();
      await Promise.all([...TITLE_KEYS, ...SUB_KEYS].map((k) => document.fonts.load(fontStr(STYLES[k], 40), STYLES[k].ref[0])));
      calibrate();
      STYLES.tcRank.ls = Math.max(STYLES.tcRank.ls, 1.5);
      renderAll();
    });
  }
}

function renderAll() {
  renderAllInner();
  syncOverridePlaceholders();
}
function syncOverridePlaceholders() {
  const fields = OV_FIELDS[tpl] || {};
  for (const k of OV_KEYS) if (fields[k]) ovInputs[k].placeholder = ovPlaceholder(k);
}
function renderAllInner() {
  if (tpl === "tcompare") {
    if (tc.loaded) (tc.n === 1 ? renderFocusStage(stages.tfocus) : renderTCompareStage(stages.tcompare));
    return;
  }
  if (tpl === "compare") {
    if (cmpReady()) renderCompareStage(stages.compare);
    return;
  }
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
      const cover = cs.objectFit === "cover";
      const k = (cover ? Math.max : Math.min)(b.w / el.naturalWidth, b.h / el.naturalHeight); // object-fit: contain / cover
      const w = el.naturalWidth * k, h = el.naturalHeight * k;
      c.globalAlpha = parseFloat(cs.opacity) || 1; // es. logo in filigrana
      const clipEl = cover ? el : el.closest(".g-clip"); // immagine ritagliata (cover: dal proprio box; foto profilo: dal contenitore)
      if (clipEl) { const cb = box(clipEl); c.save(); c.beginPath(); c.rect(cb.x, cb.y, cb.w, cb.h); c.clip(); }
      if (el.classList.contains("g-sil")) {
        // sagoma: immagine riempita di nero (come filter: brightness(0)) con l'opacità del CSS
        const off = document.createElement("canvas");
        off.width = Math.ceil(w); off.height = Math.ceil(h);
        const oc = off.getContext("2d");
        oc.drawImage(el, 0, 0, w, h);
        oc.globalCompositeOperation = "source-in";
        oc.fillStyle = "#000000";
        oc.fillRect(0, 0, off.width, off.height);
        c.drawImage(off, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h);
      } else {
        c.drawImage(el, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h);
      }
      if (clipEl) c.restore();
      c.globalAlpha = 1;
    } else if (el.classList.contains("gt")) {
      const eff = b.h / el.offsetHeight; // scala effettiva (es. corpo partite ridotto)
      const size = parseFloat(cs.fontSize) * eff;
      const ls = (parseFloat(cs.letterSpacing) || 0) * eff;
      const fs = parseFloat(cs.fontStretch) || 100;
      const stretch = fs >= 120 ? "expanded " : fs >= 110 ? "semi-expanded " : fs <= 70 ? "extra-condensed " : fs <= 80 ? "condensed " : fs <= 90 ? "semi-condensed " : "";
      const family = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      c.font = `${cs.fontStyle === "italic" ? "italic " : ""}${stretch}${cs.fontWeight} ${size}px "${family}"`;
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
document.getElementById("dl-tfocus").addEventListener("click", () => {
  if (!tc.loaded) return;
  const o = overrides.tcompare || {};
  if (!o.sub?.trim()) {
    status.textContent = "Prima di scaricare scrivi il sottotitolo in \"Testi personalizzati\".";
    document.querySelector(".studio-texts").open = true;
    ovInputs.sub.focus();
    return;
  }
  const t = tc.info[0];
  exportPng(stages.tfocus, `5dwn-focus-${t.abbr.toLowerCase()}-${tc.seasons[0] || sb.season.year}.png`);
});
document.getElementById("dl-tcompare").addEventListener("click", () => {
  if (!tc.loaded) return;
  const o = overrides.tcompare || {};
  if (!o.sub?.trim()) {
    status.textContent = "Prima di scaricare scrivi il sottotitolo in \"Testi personalizzati\".";
    document.querySelector(".studio-texts").open = true;
    ovInputs.sub.focus();
    return;
  }
  const slug = tc.info.slice(0, tc.n).map((t, i) => `${tcAnon(i) ? `anonima${"abc"[i]}` : t.abbr.toLowerCase()}${tc.seasons[i] || ""}`).join("-vs-");
  exportPng(stages.tcompare, `5dwn-confronto-squadre-${slug}-${sb.season.year}.png`);
});
document.getElementById("dl-compare").addEventListener("click", () => {
  if (!cmpReady()) return;
  const o = overrides.compare || {};
  if (!o.sub?.trim()) {
    status.textContent = "Prima di scaricare scrivi il sottotitolo in \"Testi personalizzati\".";
    document.querySelector(".studio-texts").open = true;
    ovInputs.sub.focus();
    return;
  }
  const slug = cmp.slots.slice(0, cmp.nPlayers).map((sl) => `${(sl.anon ? "anonimo" : sl.player?.last || sl.player?.name || "").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")}-${sl.season || sb.season.year}`).join("-vs-");
  exportPng(stages.compare, `5dwn-confronto-${slug}.png`);
});
document.getElementById("dl-team").addEventListener("click", () => {
  if (!teamSched) return;
  exportPng(stages.team, `5dwn-calendario-${teamSched.team.abbr.toLowerCase()}-${teamSched.season || sb.season.year}.png`);
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

/** "WEEK 4 · 28 SET": settimana della classifica e domenica di quella settimana (ora italiana). */
const fItDayMon = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", day: "numeric", month: "short" });
function standingsWeekTag() {
  const e = weeks.find((x) => keyOf(x) === selectedKey);
  if (!e) return "";
  const d = new Date(e.start);
  for (let k = 0; k < 7 && new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome", weekday: "short" }).format(d) !== "Sun"; k++) d.setUTCDate(d.getUTCDate() + 1);
  return `${weekLabel(e).toUpperCase()} · ${fItDayMon.format(d).replace(".", "").toUpperCase()}`;
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
      ${T("stSub", ovr("sub", `CLASSIFICA · ${standingsWeekTag()}`), 960.25, 201.7, "center", { maxW: 1500 })}
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
      ${T("sub", ovr("sub", `CLASSIFICA · ${standingsWeekTag()}`), W / 2, 201.7 + t, "center", { maxW: W - 2 * 60 })}
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

// ---------------------------------------------------------------------------- template Confronto squadre
// Misurato su "NFL Team Comparison-selection.png" (7640×4296 → 1920×1080). Solo 16:9.
// Dati: statistiche stagionali ESPN di tutte le 32 squadre (proprie e concesse); il rank NFL è calcolato
// confrontando le 32 squadre (ESPN non lo espone), con la direzione giusta per ogni statistica.
const TC = {
  panelTop: 241, hdrTop: 471, hdrH: 34, rowsTop: 505.5, rowsBot: 871, barH: 5.5,
  logo: { cx: 119.5, cy: 356, box: 185 }, textX: 227, cityCap: 294, nickCap: 337,
  rec: { top: 395, h: 29, pad: 10.5, cap: 404 },
  hdrCap: 483, labelX: 43, rowRef: 61, labelDy: 20.5, valDy: 17.5, rankBox: { w: 70, h: 38, dy: 10.5 }, rankDy: 19.5,
  legend: { y: 907, sq: 14, cap: 909 },
};
const RANK_COL = { top: "#1e9e4a", mid: "#c9cdd3", low: "#d62828" };
const g0 = (d) => d.own["general.gamesPlayed"] || d.own["passing.teamGamesPlayed"] || 0;
const O = (k) => (d) => d.own[k], OP = (k) => (d) => d.opp[k];
const ratio = (a, b) => (d) => (d.own[b] ? d.own[a] / d.own[b] : null);
const ratioOpp = (a, b) => (d) => (d.opp[b] ? d.opp[a] / d.opp[b] : null);
const passerRating = (c, att, y, td, it) => {
  if (!att) return null;
  const cl = (x) => Math.max(0, Math.min(2.375, x));
  return ((cl((c / att - 0.3) * 5) + cl((y / att - 3) * 0.25) + cl((td / att) * 20) + cl(2.375 - (it / att) * 25)) / 6) * 100;
};
const fracDisp = (m, a) => (d) => (d.own[a] != null ? `${d.own[m] ?? 0}/${d.own[a]}` : null);
// count: convertibile a partita · better: direzione del rank (null = nessun rank) · fmt: int | dec | pct | time
const TC_STATS = [
  ["ATTACCO", [
    { key: "pts", label: "PUNTI SEGNATI", v: O("scoring.totalPoints"), count: true, better: "high" },
    { key: "yds", label: "YARD TOTALI", v: O("rushing.totalYards"), count: true, better: "high" },
    { key: "passYds", label: "YARD SU PASSAGGIO", v: O("passing.netPassingYards"), count: true, better: "high" },
    { key: "rushYds", label: "YARD SU CORSA", v: O("rushing.rushingYards"), count: true, better: "high" },
    // efficienze (medie per giocata: stesso valore in "per partita" e "totale")
    { key: "ypp", label: "YARD/GIOCATA", v: ratio("rushing.totalYards", "rushing.totalOffensivePlays"), fmt: "dec", better: "high" },
    { key: "ypaO", label: "YARD/TENTATIVO", v: O("passing.yardsPerPassAttempt"), fmt: "dec", better: "high" },
    { key: "ypc", label: "YARD/PORTATA", v: O("rushing.yardsPerRushAttempt"), fmt: "dec", better: "high" },
    { key: "fd", label: "PRIMI DOWN", v: O("miscellaneous.firstDowns"), count: true, better: "high" },
    { key: "fdPass", label: "PRIMI DOWN SU PASSAGGIO", v: O("miscellaneous.firstDownsPassing"), count: true, better: "high" },
    { key: "fdRush", label: "PRIMI DOWN SU CORSA", v: O("miscellaneous.firstDownsRushing"), count: true, better: "high" },
    { key: "fdPen", label: "PRIMI DOWN DA PENALITÀ", v: O("miscellaneous.firstDownsPenalty"), count: true, better: "high" },
    { key: "third", label: "TERZI DOWN %", v: O("miscellaneous.thirdDownConvPct"), fmt: "pct", better: "high" },
    { key: "fourth", label: "QUARTI DOWN %", v: O("miscellaneous.fourthDownConvPct"), fmt: "pct", better: "high" },
    { key: "rz", label: "RED ZONE % (TD)", v: O("miscellaneous.redzoneTouchdownPct"), fmt: "pct", better: "high" },
    { key: "td", label: "TD TOTALI", v: O("scoring.totalTouchdowns"), count: true, better: "high" },
    { key: "tdPass", label: "TD SU PASSAGGIO", v: O("passing.passingTouchdowns"), count: true, better: "high" },
    { key: "tdRush", label: "TD SU CORSA", v: O("rushing.rushingTouchdowns"), count: true, better: "high" },
    { key: "top", label: "POSSESSO/PARTITA", v: (d) => (g0(d) ? d.own["miscellaneous.possessionTimeSeconds"] / g0(d) : null), fmt: "time", better: "high" },
    { key: "cmpAtt", label: "COMPLETATI/TENTATI", v: O("passing.completionPct"), disp: fracDisp("passing.completions", "passing.passingAttempts"), better: "high" },
    { key: "cmpPct", label: "COMPLETAMENTI %", v: O("passing.completionPct"), fmt: "pct", better: "high" },
    { key: "rtg", label: "PASSER RATING", v: O("passing.QBRating"), fmt: "dec", better: "high" },
    { key: "sacked", label: "SACK SUBITI", v: O("passing.sacks"), count: true, better: "low" },
    { key: "sackYds", label: "YARD PERSE IN SACK", v: O("passing.sackYardsLost"), count: true, better: "low" },
    { key: "bigPass", label: "BIG PLAY SU PASSAGGIO", v: O("receiving.receivingBigPlays"), count: true, better: "high" },
    { key: "bigRush", label: "BIG PLAY SU CORSA", v: O("rushing.rushingBigPlays"), count: true, better: "high" },
    { key: "fum", label: "FUMBLE", v: O("general.fumbles"), count: true, better: "low" },
    { key: "fumLost", label: "FUMBLE PERSI", v: O("miscellaneous.fumblesLost"), count: true, better: "low" },
    { key: "give", label: "PALLE PERSE", v: O("miscellaneous.totalGiveaways"), count: true, better: "low" },
    { key: "toDiff", label: "DIFFERENZIALE TURNOVER", v: O("miscellaneous.turnOverDifferential"), count: true, better: "high", signed: true },
    { key: "pen", label: "PENALITÀ", v: O("miscellaneous.totalPenalties"), count: true, better: "low" },
    { key: "penYds", label: "YARD DI PENALITÀ", v: O("miscellaneous.totalPenaltyYards"), count: true, better: "low" },
  ]],
  ["DIFESA", [
    { key: "ptsA", label: "PUNTI CONCESSI", v: OP("scoring.totalPoints"), count: true, better: "low" },
    { key: "ydsA", label: "YARD CONCESSE", v: OP("rushing.totalYards"), count: true, better: "low" },
    { key: "passA", label: "YARD SU PASSAGGIO CONCESSE", v: OP("passing.netPassingYards"), count: true, better: "low" },
    { key: "rushA", label: "YARD SU CORSA CONCESSE", v: OP("rushing.rushingYards"), count: true, better: "low" },
    { key: "yppA", label: "YARD/GIOCATA CONCESSA", v: ratioOpp("rushing.totalYards", "rushing.totalOffensivePlays"), fmt: "dec", better: "low" },
    { key: "ypaA", label: "YARD/TENTATIVO CONCESSO", v: OP("passing.yardsPerPassAttempt"), fmt: "dec", better: "low" },
    { key: "ypcA", label: "YARD/PORTATA CONCESSA", v: OP("rushing.yardsPerRushAttempt"), fmt: "dec", better: "low" },
    { key: "fdA", label: "PRIMI DOWN CONCESSI", v: OP("miscellaneous.firstDowns"), count: true, better: "low" },
    { key: "thirdA", label: "TERZI DOWN % CONCESSI", v: OP("miscellaneous.thirdDownConvPct"), fmt: "pct", better: "low" },
    { key: "fourthA", label: "QUARTI DOWN % CONCESSI", v: OP("miscellaneous.fourthDownConvPct"), fmt: "pct", better: "low" },
    { key: "rzA", label: "RED ZONE % CONCESSA", v: OP("miscellaneous.redzoneTouchdownPct"), fmt: "pct", better: "low" },
    { key: "tdPassA", label: "TD SU PASSAGGIO CONCESSI", v: OP("passing.passingTouchdowns"), count: true, better: "low" },
    { key: "tdRushA", label: "TD SU CORSA CONCESSI", v: OP("rushing.rushingTouchdowns"), count: true, better: "low" },
    { key: "rtgA", label: "PASSER RATING AGAINST", v: (d) => passerRating(d.opp["passing.completions"], d.opp["passing.passingAttempts"], d.opp["passing.passingYards"], d.opp["passing.passingTouchdowns"], d.opp["passing.interceptions"]), fmt: "dec", better: "low" },
    { key: "tkl", label: "TACKLE TOTALI", v: O("defensive.totalTackles"), count: true, better: "high" },
    { key: "tklSolo", label: "TACKLE SOLO", v: O("defensive.soloTackles"), count: true, better: "high" },
    { key: "tklAst", label: "TACKLE ASSISTITI", v: O("defensive.assistTackles"), count: true, better: "high" },
    { key: "sacks", label: "SACK", v: O("defensive.sacks"), count: true, better: "high" },
    { key: "sackYdsD", label: "YARD DA SACK", v: O("defensive.sackYards"), count: true, better: "high" },
    { key: "tfl", label: "TACKLE FOR LOSS", v: O("defensive.tacklesForLoss"), count: true, better: "high" },
    { key: "int", label: "INTERCETTI", v: O("defensiveInterceptions.interceptions"), count: true, better: "high" },
    { key: "intYds", label: "YARD SU INTERCETTO", v: O("defensiveInterceptions.interceptionYards"), count: true, better: "high" },
    { key: "intTd", label: "TD SU INTERCETTO", v: O("defensiveInterceptions.interceptionTouchdowns"), count: true, better: "high" },
    { key: "pd", label: "PASSAGGI DEVIATI", v: O("defensive.passesDefended"), count: true, better: "high" },
    { key: "ff", label: "FUMBLE FORZATI", v: O("general.fumblesForced"), count: true, better: "high" },
    { key: "fr", label: "FUMBLE RECUPERATI", v: O("general.fumblesRecovered"), count: true, better: "high" },
    { key: "take", label: "PALLE RECUPERATE", v: O("miscellaneous.totalTakeaways"), count: true, better: "high" },
    { key: "tdDef", label: "TD DIFENSIVI", v: (d) => {
        const ks = ["defensiveInterceptions.interceptionTouchdowns", "general.fumblesTouchdowns", "defensive.miscTouchdowns"].filter((k) => d.own[k] != null);
        return ks.length ? ks.reduce((a, k) => a + d.own[k], 0) : null; // nessun campo: dato assente, non 0
      }, count: true, better: "high" },
  ]],
  ["SPECIAL TEAMS", [
    { key: "fg", label: "FIELD GOAL", v: O("kicking.fieldGoalPct"), disp: fracDisp("kicking.fieldGoalsMade", "kicking.fieldGoalAttempts"), better: "high" },
    { key: "fgPct", label: "FIELD GOAL %", v: O("kicking.fieldGoalPct"), fmt: "pct", better: "high" },
    ...[["1_19", "1-19"], ["20_29", "20-29"], ["30_39", "30-39"], ["40_49", "40-49"], ["50", "50+"]].map(([k, l]) => ({
      key: `fg${k}`, label: `FIELD GOAL ${l} YARD`, v: ratio(`kicking.fieldGoalsMade${k}`, `kicking.fieldGoalAttempts${k}`),
      disp: fracDisp(`kicking.fieldGoalsMade${k}`, `kicking.fieldGoalAttempts${k}`), better: "high" })),
    { key: "fgLong", label: "FIELD GOAL PIÙ LUNGO", v: O("kicking.longFieldGoalMade"), better: "high" },
    { key: "xp", label: "EXTRA POINT", v: O("kicking.extraPointPct"), disp: fracDisp("kicking.extraPointsMade", "kicking.extraPointAttempts"), better: "high" },
    { key: "xpPct", label: "EXTRA POINT %", v: O("kicking.extraPointPct"), fmt: "pct", better: "high" },
    { key: "punts", label: "PUNT", v: O("punting.punts"), count: true, better: null },
    { key: "puntYds", label: "YARD SU PUNT", v: O("punting.puntYards"), count: true, better: null },
    { key: "puntAvg", label: "MEDIA PUNT", v: O("punting.grossAvgPuntYards"), fmt: "dec", better: "high" },
    { key: "puntNet", label: "MEDIA NETTA PUNT", v: O("punting.netAvgPuntYards"), fmt: "dec", better: "high" },
    { key: "puntTb", label: "TOUCHBACK SU PUNT", v: O("punting.touchbacks"), count: true, better: "low" },
    { key: "punt20", label: "PUNT DENTRO LE 20", v: O("punting.puntsInside20"), count: true, better: "high" },
    { key: "puntLong", label: "PUNT PIÙ LUNGO", v: O("punting.longPunt"), better: "high" },
    { key: "puntBlk", label: "PUNT BLOCCATI", v: O("punting.puntsBlocked"), count: true, better: "low" },
    { key: "kr", label: "KICK RETURN", v: O("returning.kickReturns"), count: true, better: null },
    { key: "krYds", label: "YARD SU KICK RETURN", v: O("returning.kickReturnYards"), count: true, better: "high" },
    { key: "krAvg", label: "MEDIA KICK RETURN", v: O("returning.yardsPerKickReturn"), fmt: "dec", better: "high" },
    { key: "krTd", label: "TD SU KICK RETURN", v: O("returning.kickReturnTouchdowns"), count: true, better: "high" },
    { key: "krLong", label: "KICK RETURN PIÙ LUNGO", v: O("returning.longKickReturn"), better: "high" },
    { key: "pr", label: "PUNT RETURN", v: O("returning.puntReturns"), count: true, better: null },
    { key: "prYds", label: "YARD SU PUNT RETURN", v: O("returning.puntReturnYards"), count: true, better: "high" },
    { key: "prAvg", label: "MEDIA PUNT RETURN", v: O("returning.yardsPerPuntReturn"), fmt: "dec", better: "high" },
    { key: "prTd", label: "TD SU PUNT RETURN", v: O("returning.puntReturnTouchdowns"), count: true, better: "high" },
    { key: "prLong", label: "PUNT RETURN PIÙ LUNGO", v: O("returning.longPuntReturn"), better: "high" },
    { key: "prFc", label: "FAIR CATCH", v: O("returning.puntReturnFairCatches"), count: true, better: null },
  ]],
];
// Ogni conteggio compare due volte nella lista: totale ("PUNTI SEGNATI") e a partita ("PUNTI SEGNATI/PARTITA").
const TC_LISTS = TC_STATS.map(([g, list]) => [g, list.flatMap((st) => (st.count
  ? [{ ...st, perGame: false }, { ...st, key: `${st.key}G`, label: `${st.label}/PARTITA`, perGame: true }]
  : [st]))]);
const TC_ALL = TC_LISTS.flatMap(([, list]) => list);
const tc = { n: 2, nStats: 6, show: "both", period: "season", seasons: [0, 0, 0], seasonPools: {}, pools: [], box: [], info: [], periodCache: {}, peopleByKey: {}, focusByKey: {}, teams: [], anon: [false, false, false], periodInfo: [], stats: ["ptsG", "ydsG", "passYdsG", "rushYdsG", "third", "give", "tdG"], data: {}, records: {}, loaded: false };
const tcEls = {
  seasons: [0, 1, 2].map((i) => document.getElementById(`tc-season${i}`)),
  n: document.getElementById("tc-n"), nStats: document.getElementById("tc-nstats"), show: document.getElementById("tc-show"), period: document.getElementById("tc-period"),
  teams: [0, 1, 2].map((i) => document.getElementById(`tc-team${i}`)), stats: [...document.querySelectorAll(".tc-stat")],
  anon: [0, 1, 2].map((i) => document.getElementById(`tc-anon${i}`)),
};
// loghi dello stesso colore del box squadra: si usa la variante ESPN "500-dark" (bianca)
const TC_WHITE_LOGO = new Set(["LAR"]);
const TC_QMARK = 150; // altezza del "?" che sostituisce il logo (squadra anonima)
const tcAnon = (i) => tc.n > 1 && !!tc.anon[i]; // nel Focus (1 squadra) l'anonimo non si applica
const tcAnonName = (i) => `SQUADRA ${"ABC"[i]}`;
/**
 * Etichetta del periodo nelle card dei confronti: "STAGIONE 2026" (intera stagione), "ULTIME 3 PARTITE",
 * oppure con una sola partita "WEEK 4 VS CHIEFS". games = partite davvero usate, last = l'ultima (week, opp).
 */
function periodLabel(period, season, games, last) {
  if (period === "season") return `STAGIONE ${season}`;
  const n = Math.min(period, games ?? period);
  if (n >= 2) return `ULTIME ${n} PARTITE`;
  if (!last) return "ULTIMA PARTITA";
  // il gamelog dei giocatori ha solo la sigla dell'avversario: nome dalla lista squadre
  const full = last.opp?.nickname ? last.opp : teamList.find((t) => t.abbr === last.opp?.abbr || t.id === last.opp?.id) || last.opp || {};
  const opp = (full.nickname || full.short || full.abbr || "").toUpperCase();
  return `${last.week ? `WEEK ${last.week}` : "ULTIMA PARTITA"}${opp ? ` VS ${opp}` : ""}`;
}

/** Valore numerico (per il rank): le voci "/PARTITA" dividono il totale per le partite giocate. */
function tcNum(st, d) {
  if (!d) return null;
  const v = st.v(d);
  if (v == null || Number.isNaN(v)) return null;
  return st.perGame ? (g0(d) ? v / g0(d) : null) : v;
}
function tcDisp(st, d) {
  if (st.disp) return st.disp(d);
  const v = tcNum(st, d);
  if (v == null) return null;
  const sign = st.signed && v > 0 ? "+" : "";
  if (st.fmt === "time") return `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, "0")}`;
  if (st.fmt === "pct") return `${v.toFixed(1)}%`;
  if (st.fmt === "dec" || st.perGame) return sign + v.toFixed(1);
  return sign + String(Math.round(v));
}
/** Rank NFL fra le 32 squadre (pari merito = stesso rank). */
function tcRank(st, i) {
  if (!st.better) return null;
  const mine = tcNum(st, tc.box[i]);
  if (mine == null) return null;
  // rank dentro la stagione (e il periodo) del box: tutte le squadre di quell'anno
  const vals = Object.values(tc.pools[i] || {}).map((d) => tcNum(st, d)).filter((v) => v != null);
  const better = vals.filter((v) => (st.better === "high" ? v > mine + 1e-9 : v < mine - 1e-9)).length;
  return better + 1;
}
const tcLabel = (st) => st.label;
/** La statistica esiste nella stagione del box? No se nessuna squadra di quell'anno ha il dato, o se in una
 * stagione conclusa vale 0 per tutte (campo non tracciato). In quel caso la riga si nasconde. */
function tcFieldExists(st, i) {
  const vals = Object.values(tc.pools[i] || {}).map((d) => tcNum(st, d)).filter((v) => v != null);
  if (!vals.length) return false;
  return seasonArg(tc.seasons[i] || curSeason()) ? vals.some((v) => v !== 0) : true;
}
const tcExistsAll = (st) => tc.teams.slice(0, tc.n).every((_, i) => tcFieldExists(st, i));

let tcLoadSeq = 0;
async function loadTCompare() {
  const seq = ++tcLoadSeq; // conta solo l'ultimo caricamento
  try {
    status.textContent = "Carico le statistiche delle squadre…";
    if (!teamList.length) teamList = (await getTeams()).data.slice().sort((a, b) => a.name.localeCompare(b.name));
    const opts = teamList.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("");
    tcEls.teams.forEach((el) => { if (el.options.length !== teamList.length) el.innerHTML = opts; });
    tcEls.seasons.forEach((el) => { if (!el.options.length) el.innerHTML = seasonOptions(); });
    if (!tc.teams.length) {
      const byAbbr = (a) => teamList.find((t) => t.abbr === a)?.id;
      tc.teams = [byAbbr("BUF"), byAbbr("KC"), byAbbr("PHI")].map((id, i) => id || teamList[i].id);
    }
    tc.seasons = tc.seasons.map((y) => y || curSeason());
    const boxes = tc.teams.slice(0, tc.n).map((id, i) => ({ i, id, season: tc.seasons[i] }));
    // squadra com'era in quella stagione + record nel periodo scelto (intera stagione o ultime N partite)
    await Promise.all(boxes.map(async ({ i, id, season }) => {
      tc.info[i] = await teamInSeason(teamList.find((t) => t.id === id), season);
      try {
        const games = await tcLastGames(id, season);
        tc.periodInfo[i] = { games: games.length, last: games[0] || null };
        const w = games.filter((e) => e.result === "W").length, l = games.filter((e) => e.result === "L").length, t = games.length - w - l;
        tc.records[i] = `${w}-${l}${t ? `-${t}` : ""}`;
      } catch { tc.records[i] = ""; tc.periodInfo[i] = null; }
    }));
    // statistiche: per ogni stagione presente, tutte le squadre di quell'anno (per il rank) o solo quelle scelte
    for (const season of [...new Set(boxes.map((b) => b.season))]) {
      const mine = boxes.filter((b) => b.season === season).map((b) => b.id);
      let pool;
      if (tc.period === "season") {
        const ids = tc.show === "value" ? mine : teamList.map((t) => t.id);
        const cache = (tc.seasonPools[season] ||= {});
        const todo = ids.filter((id) => !cache[id]);
        // al massimo 8 richieste insieme (ESPN risponde 503 se sono troppe)
        const queue = todo.slice();
        await Promise.all(Array.from({ length: 8 }, async () => {
          while (queue.length) {
            const id = queue.shift();
            try { cache[id] = (await getTeamSeason(id, {}, seasonArg(season))).data; } catch { /* squadra senza dati */ }
          }
        }));
        pool = Object.fromEntries(ids.map((id) => [id, cache[id]]).filter(([, d]) => d));
      } else {
        const ids = tc.show === "value" ? mine : teamList.map((t) => t.id);
        pool = await tcPeriodData(tc.period, ids, season);
      }
      boxes.filter((b) => b.season === season).forEach((b) => { tc.pools[b.i] = pool; tc.box[b.i] = pool[b.id]; });
    }
    tc.data = tc.pools[0] || {};
    if (tc.n === 1) {
      try { await tfEnsurePeople(); } catch (err) { console.warn("card focus", err); } // le card non devono bloccare la grafica
    }
    if (seq !== tcLoadSeq) return;
    tc.loaded = true;
    tcRenderControls();
    renderAll();
    tcStatus();
  } catch (err) {
    console.error(err);
    status.textContent = "Non riesco a caricare il confronto squadre: riprova.";
  }
}
function tcRenderControls() {
  tcEls.teams.forEach((el, i) => { el.closest(".select-field").hidden = i >= tc.n; el.value = tc.teams[i] || ""; tcEls.seasons[i].value = String(tc.seasons[i] || curSeason()); });
  tcEls.anon.forEach((el, i) => { el.checked = !!tc.anon[i]; el.closest(".tc-anon").hidden = tc.n === 1; });
  if (tc.n === 1) tfRenderControls();
  // solo le statistiche disponibili in tutte le stagioni scelte (niente valori vuoti o zero inventati)
  const avail = TC_LISTS.map(([g, list]) => [g, list.filter(tcExistsAll)]).filter(([, l]) => l.length);
  const keys = new Set(avail.flatMap(([, l]) => l.map((st) => st.key)));
  tc.stats = tc.stats.map((k) => (keys.has(k) ? k : [...keys].find((x) => !tc.stats.includes(x)) || k));
  const opts = avail.map(([g, list]) => `<optgroup label="${g}">${list.map((st) => `<option value="${st.key}">${esc(st.label)}</option>`).join("")}</optgroup>`).join("");
  tcEls.stats.forEach((el, i) => {
    el.closest(".select-field").hidden = i >= tc.nStats;
    el.innerHTML = opts;
    el.value = tc.stats[i] || "";
  });
}
function tcStatus() {
  const o = overrides.tcompare || {};
  const n = Object.keys(tc.data).length;
  const per = tc.period === "season" ? "intera stagione" : tc.period === 1 ? "ultima partita" : `ultime ${tc.period} partite`;
  const yrs = [...new Set(tc.seasons.slice(0, tc.n))].join(", ");
  status.textContent = `Statistiche ESPN · stagione ${yrs} · ${per} · ${tc.show === "value" ? "senza rank" : `rank calcolato tra le ${n} squadre della stessa stagione`}${!o.sub?.trim() ? ' · scrivi il sottotitolo in "Testi personalizzati"' : ""}`;
}
tcEls.n.addEventListener("change", async () => {
  tc.n = Number(tcEls.n.value);
  applyVisibility();
  while (tc.teams.length < tc.n) tc.teams.push(teamList.find((t) => !tc.teams.includes(t.id)).id);
  await loadTCompare();
});
tcEls.nStats.addEventListener("change", () => { tc.nStats = Number(tcEls.nStats.value); tcRenderControls(); renderAll(); });
tcEls.show.addEventListener("change", () => { tc.show = tcEls.show.value; if (tc.period === "season") renderAll(); else loadTCompare(); });
tcEls.period.addEventListener("change", () => { tc.period = tcEls.period.value === "season" ? "season" : Number(tcEls.period.value); loadTCompare(); });
tcEls.stats.forEach((el, i) => el.addEventListener("change", () => { tc.stats[i] = el.value; renderAll(); }));
tcEls.teams.forEach((el, i) => el.addEventListener("change", () => { tc.teams[i] = el.value; loadTCompare(); }));
tcEls.seasons.forEach((el, i) => el.addEventListener("change", () => { tc.seasons[i] = Number(el.value); loadTCompare(); }));
tcEls.anon.forEach((el, i) => el.addEventListener("change", () => { tc.anon[i] = el.checked; renderAll(); }));
for (const k of ["title", "sub"]) ovInputs[k].addEventListener("input", () => { if (tpl === "tcompare" && tc.loaded) tcStatus(); });

function tcCard(bi, x, w, stats) {
  const t = tc.info[bi], d = tc.box[bi];
  const anon = tcAnon(bi); // anonima: colore neutro, "?" al posto del logo, "SQUADRA A/B/C" al posto del nome
  const col = anon ? CMP_ANON : cellColor(t);
  const ink = !anon && DARK_TEXT.has(ABBR_ALIAS[t.abbr] || t.abbr) ? "#111111" : "#ffffff";
  const showV = tc.show !== "rank", showR = tc.show !== "value";
  const rankCx = w - 76, valCx = showR ? w - 230 : w - 110;
  const rCx = showV ? rankCx : w - 110;
  const lg = TC.logo, rec = tc.records[bi] || "";
  const recW = inkWidth("tcRec", rec) + 2 * TC.rec.pad;
  const n = stats.length, pitch = (TC.rowsBot - TC.rowsTop) / n, kt = Math.min(1, (pitch / TC.rowRef) * 1.1);
  const labelMax = (showV ? valCx : rCx) - 50 - TC.labelX;
  let rows = "";
  stats.forEach((st, i) => {
    const y = TC.rowsTop + i * pitch;
    const v = tcDisp(st, d), r = tcRank(st, bi);
    rows += `<div class="g-cell" style="left:${x}px;top:${y}px;width:${w}px;height:${pitch + 0.5}px;background:${i % 2 ? CMP_GREY : "#ffffff"}"></div>
      ${T("tcLabel", tcLabel(st), x + TC.labelX, y + (pitch - STYLES.tcLabel.ref[1] * kt) / 2, "left", { scale: kt, maxW: labelMax, color: "#1d2026" })}`;
    if (showV && v != null) rows += T("tcVal", v, x + valCx, y + (pitch - STYLES.tcVal.ref[1] * kt) / 2, "center", { scale: kt, maxW: 170, color: "#0b0b0b" });
    if (v == null) rows += T("tcVal", "N/D", x + (showV ? valCx : rCx), y + (pitch - STYLES.tcVal.ref[1] * kt) / 2, "center", { scale: kt, color: "#8a9097" });
    if (showR && v != null) { // dato mancante: N/D senza rank
      const bw = TC.rankBox.w * Math.max(kt, 0.85), bh = TC.rankBox.h * kt;
      const bg = r == null ? RANK_COL.mid : r <= 10 ? RANK_COL.top : r <= 22 ? RANK_COL.mid : RANK_COL.low;
      const fg = r != null && (r <= 10 || r > 22) ? "#ffffff" : "#1a1a1a";
      rows += `<div class="g-bar" style="left:${x + rCx - bw / 2}px;top:${y + (pitch - bh) / 2}px;width:${bw}px;height:${bh}px;background:${bg}"></div>
        ${T("tcRank", r == null ? "–" : `${r}°`, x + rCx, y + (pitch - STYLES.tcRank.ref[1] * kt) / 2, "center", { scale: kt, color: fg })}`;
    }
  });
  const hdr = `<div class="g-bar" style="left:${x}px;top:${TC.hdrTop}px;width:${w}px;height:${TC.hdrH}px;background:#0f1e3f"></div>
    ${T("tcHdr", "STATISTICA", x + 41, TC.hdrCap, "left", { color: "#ffffff" })}
    ${showV ? T("tcHdr", "VALORE", x + valCx, TC.hdrCap, "center", { color: "#ffffff" }) : ""}
    ${showR ? T("tcHdr", "RANK NFL", x + rCx, TC.hdrCap, "center", { color: "#ffffff" }) : ""}`;
  return `<div class="g-cell" style="left:${x}px;top:${TC.panelTop}px;width:${w}px;height:${TC.hdrTop - TC.panelTop}px;background:${col}"></div>
    ${anon
      ? T("cmpLast", "?", x + lg.cx, lg.cy - TC_QMARK / 2, "center", { color: "#ffffff", scale: TC_QMARK / STYLES.cmpLast.ref[1] })
      : `<img class="g-logo" crossorigin="anonymous" src="${teamLogoUrl(t, 400, TC_WHITE_LOGO.has(ABBR_ALIAS[t.abbr] || t.abbr))}" alt="" style="left:${x + lg.cx - lg.box / 2}px;top:${lg.cy - lg.box / 2}px;width:${lg.box}px;height:${lg.box}px">`}
    ${T("tcCity", anon ? "SQUADRA" : (t.location || "").toUpperCase(), x + TC.textX, TC.cityCap, "left", { color: ink, maxW: w - TC.textX - 20 })}
    ${T("tcNick", anon ? "ABC"[bi] : (t.nickname || "").toUpperCase(), x + TC.textX, TC.nickCap, "left", { color: ink, maxW: w - TC.textX - 20 })}
    ${rec ? `<div class="g-bar" style="left:${x + TC.textX - 2}px;top:${TC.rec.top}px;width:${recW}px;height:${TC.rec.h}px;background:#ffffff"></div>
    ${T("tcRec", rec, x + TC.textX - 2 + recW / 2, TC.rec.cap, "center", { color: "#0f1e3f" })}` : ""}
    ${T("tcHdr", periodLabel(tc.period, tc.seasons[bi] || curSeason(), tc.periodInfo[bi]?.games, tc.periodInfo[bi]?.last), x + TC.textX - 2 + (rec ? recW + 14 : 0), TC.rec.cap + 1, "left", { color: ink, scale: 14 / STYLES.tcHdr.ref[1], maxW: w - TC.textX - 20 - (rec ? recW + 14 : 0) })}
    ${hdr}${rows}
    <div class="g-bar" style="left:${x}px;top:${TC.rowsBot}px;width:${w}px;height:${TC.barH}px;background:${col}"></div>`;
}

// ---- periodo "ultime N partite" per le squadre: somma delle statistiche partita per partita (API core ESPN)
async function tcLastGames(id, season = curSeason()) {
  const ev = (await getSchedule(id, {}, { seasonType: 2, season: seasonArg(season), past: !!seasonArg(season) })).data.events
    .filter((e) => e.state === "post")
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return tc.period === "season" ? ev : ev.slice(0, tc.period);
}
function tcSumMaps(maps) {
  const out = {};
  for (const m of maps) for (const [k, v] of Object.entries(m)) {
    if (/\.long/.test(k)) out[k] = Math.max(out[k] ?? -Infinity, v);
    else out[k] = (out[k] || 0) + v;
  }
  const n = maps.length;
  const div = (a, b, m = 1) => (out[b] ? (out[a] || 0) / out[b] * m : out[b] === 0 ? 0 : null); // base assente: dato assente
  // medie e percentuali ricalcolate sui totali (le altre medie: media semplice delle partite)
  for (const k of Object.keys(out)) if (/Pct|avg|Avg|yardsPer|PerGame|QBRating|adjQBR/.test(k)) out[k] = out[k] / n;
  out["passing.completionPct"] = div("passing.completions", "passing.passingAttempts", 100);
  out["passing.yardsPerPassAttempt"] = div("passing.passingYards", "passing.passingAttempts");
  out["passing.QBRating"] = out["passing.passingAttempts"] == null ? null : passerRating(out["passing.completions"] || 0, out["passing.passingAttempts"] || 0, out["passing.passingYards"] || 0, out["passing.passingTouchdowns"] || 0, out["passing.interceptions"] || 0);
  out["rushing.yardsPerRushAttempt"] = div("rushing.rushingYards", "rushing.rushingAttempts");
  out["miscellaneous.thirdDownConvPct"] = div("miscellaneous.thirdDownConvs", "miscellaneous.thirdDownAttempts", 100);
  out["miscellaneous.fourthDownConvPct"] = div("miscellaneous.fourthDownConvs", "miscellaneous.fourthDownAttempts", 100);
  out["miscellaneous.redzoneTouchdownPct"] = div("miscellaneous.redzoneTouchdowns", "miscellaneous.redzoneAttempts", 100);
  out["kicking.fieldGoalPct"] = div("kicking.fieldGoalsMade", "kicking.fieldGoalAttempts", 100);
  out["kicking.extraPointPct"] = div("kicking.extraPointsMade", "kicking.extraPointAttempts", 100);
  out["punting.grossAvgPuntYards"] = div("punting.puntYards", "punting.punts");
  out["returning.yardsPerKickReturn"] = div("returning.kickReturnYards", "returning.kickReturns");
  out["returning.yardsPerPuntReturn"] = div("returning.puntReturnYards", "returning.puntReturns");
  if (out["miscellaneous.fumblesLost"] == null && out["general.fumblesLost"] != null) out["miscellaneous.fumblesLost"] = out["general.fumblesLost"];
  for (const k of Object.keys(out)) if (out[k] == null) delete out[k]; // niente zeri per campi non presenti
  out["general.gamesPlayed"] = n;
  return out;
}
async function tcPeriodData(N, ids, season = curSeason()) {
  const key = `${season}:${N}`;
  const cache = (tc.periodCache[key] ||= {});
  const todo = ids.filter((id) => !cache[id]);
  if (todo.length) {
    const lists = await Promise.all(todo.map(async (id) => [id, await tcLastGames(id, season)]));
    const jobs = [];
    for (const [id, games] of lists) for (const g of games) jobs.push([g.id, id], [g.id, g.opp.id]);
    const uniq = [...new Map(jobs.map((j) => [j.join(":"), j])).values()];
    let done = 0;
    const queue = uniq.slice();
    const worker = async () => {
      while (queue.length) {
        const [eid, tid] = queue.shift();
        try { await getEventTeamStats(eid, tid); } catch { /* partita senza dati: esclusa */ }
        done += 1;
        if (done % 8 === 0) status.textContent = `Calcolo le ultime ${N} partite di ${todo.length} squadre: ${done}/${uniq.length} statistiche partita…`;
      }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
    for (const [id, games] of lists) {
      const own = [], opp = [];
      for (const g of games) {
        try { own.push(await getEventTeamStats(g.id, id)); opp.push(await getEventTeamStats(g.id, g.opp.id)); } catch { /* esclusa */ }
      }
      cache[id] = { id, own: tcSumMaps(own), opp: tcSumMaps(opp) };
    }
  }
  return Object.fromEntries(ids.map((id) => [id, cache[id]]).filter(([, d]) => d));
}

// ---- Focus squadra (1 squadra): "NFL Team Focus-selection.png" (7720×4344 → 1920×1080)
const TF = {
  title: { cap: 79, cx: 964.5, maxW: 1500 }, sub: { cap: 189, groupCx: 971.5, gap: 35 },
  rec: { top: 181, h: 39, labelW: 96, pad: 14.5, labelCap: 194, valCap: 192 },
  cardX: [120, 1360], cardW: 440, cardTop: 262, photoTop: 216, cardBot: 849.5, stripBot: 955, barH: 6,
  slogo: { cx: 54, cy: 901.5, box: 58 }, roleX: 101, roleCap: 874, nameCap: 902, mark: { cy: 520, box: 420, op: 0.16 },
  table: { x: 600, w: 720, hdrTop: 262, hdrH: 64, rowsTop: 326.5, rowsBot: 876.5, barH: 6.5, logo: { cx: 49.5, cy: 293, box: 44 },
    hdrCap: 289, hdrX: 85, labelX: 33, valCx: 450, rankCx: 635, rowRef: 91.8, rank: { w: 76, h: 50 } },
  legendY: 915, legendCap: 917, footCap: 1008, footDash: 1037,
};
const tfEls = [0, 1].map((i) => ({ person: document.getElementById(`tf-person${i}`), photo: document.getElementById(`tf-photo${i}`), upload: document.getElementById(`tf-upload${i}`), url: document.getElementById(`tf-url${i}`) }));

/** Persone selezionabili (head coach + roster) e foto proposte per le due card laterali. */
// Persone e scelte delle card salvate per "squadra:stagione": caricamenti sovrapposti non si mescolano.
const focusKey = () => `${tc.teams[0]}:${tc.seasons[0] || curSeason()}`;
const tfPeople = () => tc.peopleByKey[focusKey()] || [];
const tfFocus = () => (tc.focusByKey[focusKey()] ||= [{}, {}]);
async function tfEnsurePeople() {
  const teamId = tc.teams[0], season = tc.seasons[0] || curSeason(), fkey = `${teamId}:${season}`;
  if (!tc.peopleByKey[fkey]) {
    const roster = await seasonRosterGroups(teamId, season); // stagioni passate: giocatori con statistiche quell'anno (ESPN non ha il coach storico)
    const people = [];
    if (roster.coach) people.push({ id: "coach", name: roster.coach.name, role: "HEAD COACH", coach: true });
    for (const g of roster.groups) for (const p of g.players) people.push({ id: p.id, name: p.name, role: (p.posName || p.pos || "").toUpperCase(), pos: p.pos, group: g.label });
    tc.peopleByKey[fkey] = people;
  }
  const people = tc.peopleByKey[fkey];
  const focus = (tc.focusByKey[fkey] ||= [{}, {}]);
  if (!focus[0].person || !people.some((p) => p.id === focus[0].person)) {
    // proposta: il QB titolare (il primo QB della squadra tra i qualificati) e l'head coach;
    // stagioni passate (niente coach ESPN): il ricevitore principale
    let qb = null;
    try {
      const pool = qualifyPool("passing", (await getQualified(...CMP_POOLS.passing, {}, seasonArg(season))).data);
      qb = people.find((p) => p.pos === "QB" && pool.some((q) => q.id === p.id));
    } catch { /* senza classifica: primo QB del roster */ }
    qb ||= people.find((p) => p.pos === "QB") || people.find((p) => !p.coach);
    const second = people.find((p) => p.coach) || people.find((p) => (p.pos === "WR" || p.pos === "TE") && p !== qb) || people.find((p) => !p.coach && p !== qb);
    tc.focusByKey[fkey] = [{ person: qb?.id }, { person: second?.id }];
  }
  await Promise.all([0, 1].map((i) => (tc.focusByKey[fkey][i].photos ? null : tfLoadPhotos(i, fkey))));
}
async function tfLoadPhotos(i, fkey = focusKey()) {
  const f = tc.focusByKey[fkey][i];
  const p = (tc.peopleByKey[fkey] || []).find((x) => x.id === f.person);
  if (!p) { f.photos = []; return; }
  const words = p.name.toLowerCase().split(" ").filter((w) => !/^(jr\.?|sr\.?|ii|iii|iv)$/.test(w));
  // ricerca con squadra / NFL accanto al nome, per evitare omonimi (es. un altro "Joe Brady")
  const nick = tc.info[0]?.nickname || "";
  const web = await webPhotos([`"${p.name}" ${nick}`, `"${p.name}" NFL`, `"${p.name}" football`], words, 5);
  f.photos = [
    ...(p.coach ? [] : [{ url: `https://a.espncdn.com/i/headshots/nfl/players/full/${p.id}.png`, title: "Foto profilo ESPN (scontornata)", cutout: true }]),
    ...web,
  ];
  f.photoIdx = f.photos.length ? 0 : -1;
}
function tfRenderControls() {
  const people = tfPeople();
  const coach = people.filter((p) => p.coach), groups = {};
  for (const p of people.filter((x) => !x.coach)) (groups[p.group] ||= []).push(p);
  const opts = coach.map((p) => `<option value="coach">Head coach · ${esc(p.name)}</option>`).join("") +
    Object.entries(groups).map(([g, list]) => `<optgroup label="${esc(g)}">${list.map((p) => `<option value="${p.id}">${esc(p.name)}${p.pos ? ` · ${esc(p.pos)}` : ""}</option>`).join("")}</optgroup>`).join("");
  tfEls.forEach((el, i) => {
    const f = tfFocus()[i];
    el.person.innerHTML = opts;
    el.person.value = f.person || "";
    el.url.value = f.url || "";
    const ph = (f.photos || []).map((x, j) => `<option value="${j}">${esc(x.title.slice(0, 70))}</option>`);
    if (f.upload) ph.unshift(`<option value="upload">Foto caricata da te</option>`);
    ph.push(`<option value="-1">Nessuna foto</option>`);
    el.photo.innerHTML = ph.join("");
    el.photo.value = f.upload ? "upload" : String(f.photoIdx ?? -1);
  });
}
tfEls.forEach((el, i) => {
  el.person.addEventListener("change", async () => {
    tfFocus()[i] = { person: el.person.value };
    await tfLoadPhotos(i);
    tfRenderControls();
    renderAll();
  });
  el.photo.addEventListener("change", () => {
    const f = tfFocus()[i];
    if (el.photo.value !== "upload") { if (f.upload) URL.revokeObjectURL(f.upload); f.upload = null; f.photoIdx = Number(el.photo.value); }
    renderAll();
  });
  el.url.addEventListener("change", async () => {
    const f = tfFocus()[i], url = el.url.value.trim();
    if (!url) { f.url = null; renderAll(); return; }
    if (await customPhotoOk(url)) { f.url = url; renderAll(); }
    else status.textContent = "Questa immagine non si può usare nel PNG (il sito che la ospita non lo permette): scaricala e caricala con \"Carica foto\".";
  });
  el.upload.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const f = tfFocus()[i];
    if (f.upload) URL.revokeObjectURL(f.upload);
    f.upload = URL.createObjectURL(file);
    e.target.value = "";
    tfRenderControls();
    renderAll();
  });
});

function tfSideCard(i, team) {
  const x = TF.cardX[i], w = TF.cardW, f = tfFocus()[i] || {};
  const p = tfPeople().find((pp) => pp.id === f.person);
  const col = cellColor(team);
  const logo = (sz) => teamLogoUrl(team, sz);
  // priorità: foto caricata > URL incollato > foto proposta
  const ph = f.upload ? { url: f.upload, upload: true } : f.url ? { url: f.url } : f.photos?.[f.photoIdx];
  let photo = "";
  if (ph?.cutout) {
    // foto profilo ESPN scontornata: larga più della card, appoggiata in basso, ritagliata ai lati
    const pw = w * 1.3, phH = pw * (436 / 600);
    photo = `<div class="g-clip" style="position:absolute;overflow:hidden;left:${x}px;top:${TF.photoTop}px;width:${w}px;height:${TF.cardBot - TF.photoTop}px">
      <img class="g-logo" crossorigin="anonymous" src="${ph.url}" alt="" onerror="this.remove()" style="left:${(w - pw) / 2}px;top:${TF.cardBot - TF.photoTop - phH}px;width:${pw}px;height:${phH}px"></div>`;
  } else if (ph?.url) {
    photo = `<img class="g-logo g-cover" ${ph.upload ? "" : 'crossorigin="anonymous"'} src="${esc(ph.url)}" alt="" style="left:${x}px;top:${TF.cardTop}px;width:${w}px;height:${TF.cardBot - TF.cardTop}px">`;
  }
  const mk = TF.mark, sl = TF.slogo;
  return `<div class="g-cell" style="left:${x}px;top:${TF.cardTop}px;width:${w}px;height:${TF.cardBot - TF.cardTop}px;background:${col}"></div>
    <img class="g-logo" crossorigin="anonymous" src="${logo(500)}" alt="" style="left:${x + w / 2 - mk.box / 2}px;top:${mk.cy - mk.box / 2}px;width:${mk.box}px;height:${mk.box}px;opacity:${mk.op}">
    ${photo}
    <div class="g-cell g-white" style="left:${x}px;top:${TF.cardBot}px;width:${w}px;height:${TF.stripBot - TF.cardBot}px"></div>
    <img class="g-logo" crossorigin="anonymous" src="${logo(200)}" alt="" style="left:${x + sl.cx - sl.box / 2}px;top:${sl.cy - sl.box / 2}px;width:${sl.box}px;height:${sl.box}px">
    ${p ? T("tcHdr", p.role, x + TF.roleX, TF.roleCap, "left", { color: col === "#ffffff" ? "#111111" : col, scale: 15 / STYLES.tcHdr.ref[1], maxW: w - TF.roleX - 20 }) : ""}
    ${p ? T("tcNick", p.name.toUpperCase(), x + TF.roleX, TF.nameCap, "left", { color: "#111111", scale: 30 / STYLES.tcNick.ref[1], maxW: w - TF.roleX - 20 }) : ""}
    <div class="g-bar" style="left:${x}px;top:${TF.stripBot}px;width:${w}px;height:${TF.barH}px;background:${col}"></div>`;
}

function renderFocusStage(stage) {
  const { W, H, root } = stage;
  const year = sb.season.year;
  const team = tc.info[0], d = tc.box[0], season = tc.seasons[0] || curSeason();
  const col = cellColor(team);
  const stats = tc.stats.slice(0, tc.nStats).map((k) => TC_ALL.find((s) => s.key === k)).filter(Boolean).filter(tcExistsAll);
  const tb = TF.table, showV = tc.show !== "rank", showR = tc.show !== "value";
  const valCx = showR ? tb.valCx : tb.rankCx - 60, rCx = showV ? tb.rankCx : tb.valCx + 40;
  const n = stats.length, pitch = (tb.rowsBot - tb.rowsTop) / n, kt = Math.min(1, (pitch / tb.rowRef) * 1.1);
  let rows = "";
  stats.forEach((st, i) => {
    const y = tb.rowsTop + i * pitch, v = tcDisp(st, d), r = tcRank(st, 0);
    rows += `<div class="g-cell" style="left:${tb.x}px;top:${y}px;width:${tb.w}px;height:${pitch + 0.5}px;background:${i % 2 ? CMP_GREY : "#ffffff"}"></div>
      ${T("tcLabel", tcLabel(st), tb.x + tb.labelX, y + (pitch - 24 * kt) / 2, "left", { scale: (24 / STYLES.tcLabel.ref[1]) * kt, maxW: (showV ? valCx : rCx) - 70 - tb.labelX, color: "#1d2026" })}`;
    if (showV && v != null) rows += T("tcVal", v, tb.x + valCx, y + (pitch - 34 * kt) / 2, "center", { scale: (34 / STYLES.tcVal.ref[1]) * kt, maxW: 200, color: "#0b0b0b" });
    if (v == null) rows += T("tcVal", "N/D", tb.x + (showV ? valCx : rCx), y + (pitch - 34 * kt) / 2, "center", { scale: (34 / STYLES.tcVal.ref[1]) * kt, color: "#8a9097" });
    if (showR && v != null) { // dato mancante: N/D senza rank
      const bw = tb.rank.w * Math.max(kt, 0.85), bh = tb.rank.h * kt;
      const bg = r == null ? RANK_COL.mid : r <= 10 ? RANK_COL.top : r <= 22 ? RANK_COL.mid : RANK_COL.low;
      const fg = r != null && (r <= 10 || r > 22) ? "#ffffff" : "#1a1a1a";
      rows += `<div class="g-bar" style="left:${tb.x + rCx - bw / 2}px;top:${y + (pitch - bh) / 2}px;width:${bw}px;height:${bh}px;background:${bg}"></div>
        ${T("tcRank", r == null ? "–" : `${r}°`, tb.x + rCx, y + (pitch - 23 * kt) / 2, "center", { scale: (23 / STYLES.tcRank.ref[1]) * kt, color: fg })}`;
    }
  });
  const hs = 14 / STYLES.tcHdr.ref[1];
  const table = `<div class="g-bar" style="left:${tb.x}px;top:${tb.hdrTop}px;width:${tb.w}px;height:${tb.hdrH}px;background:${col}"></div>
    <img class="g-logo" crossorigin="anonymous" src="${teamLogoUrl(team, 120, true)}" alt="" style="left:${tb.x + tb.logo.cx - tb.logo.box / 2}px;top:${tb.logo.cy - tb.logo.box / 2}px;width:${tb.logo.box}px;height:${tb.logo.box}px">
    ${T("tcHdr", "STATISTICA", tb.x + tb.hdrX, tb.hdrCap, "left", { color: "#ffffff", scale: hs })}
    ${showV ? T("tcHdr", "VALORE", tb.x + valCx, tb.hdrCap, "center", { color: "#ffffff", scale: hs }) : ""}
    ${showR ? T("tcHdr", "RANK NFL", tb.x + rCx, tb.hdrCap, "center", { color: "#ffffff", scale: hs }) : ""}
    ${rows}
    <div class="g-bar" style="left:${tb.x}px;top:${tb.rowsBot}px;width:${tb.w}px;height:${tb.barH}px;background:${col}"></div>`;
  // legenda centrata
  let legend = "";
  if (showR) {
    const items = [["top", "TOP 10"], ["mid", "11-22"], ["low", "BOTTOM 10"]];
    const ws = items.map(([, t]) => inkWidth("tcLeg", t));
    let lx = W / 2 - (ws.reduce((a, b) => a + b, 0) + items.length * 20 + (items.length - 1) * 22) / 2;
    legend = items.map(([c, t], j) => {
      const h = `<div class="g-bar" style="left:${lx}px;top:${TF.legendY}px;width:14px;height:14px;background:${RANK_COL[c]}"></div>${T("tcLeg", t, lx + 20, TF.legendCap, "left", { color: "#4b5058" })}`;
      lx += 20 + ws[j] + 22;
      return h;
    }).join("");
  }
  // sottotitolo + box RECORD (record del periodo scelto), centrati come gruppo
  const sub = ovr("sub", ""), rec = tc.records[0] || "";
  const r = TF.rec, sW = sub ? inkWidth("tsCal", sub) : 0, vW = inkWidth("tsRecV", rec), whiteW = vW + 2 * r.pad;
  const gLeft = TF.sub.groupCx - (sW + (sub ? TF.sub.gap : 0) + r.labelW + whiteW) / 2;
  const nx = gLeft + sW + (sub ? TF.sub.gap : 0), wx = nx + r.labelW;
  const header = `${sub ? T("tsCal", sub, gLeft, TF.sub.cap, "left") : ""}
    <div class="g-bar" style="left:${nx}px;top:${r.top}px;width:${r.labelW}px;height:${r.h}px;background:#0f1e3f"></div>
    ${T("tsRecL", "RECORD", nx + r.labelW / 2, r.labelCap, "center", { color: "#ffffff" })}
    <div class="g-bar" style="left:${wx}px;top:${r.top}px;width:${whiteW}px;height:${r.h}px;background:#ffffff"></div>
    ${T("tsRecV", rec, wx + whiteW / 2, r.valCap, "center", { color: "#0f1e3f" })}`;
  const seasonLabel = "REGULAR SEASON"; // statistiche e rank sono sempre di regular season
  root.style.width = `${W}px`;
  root.style.height = `${H}px`;
  root.innerHTML = `${background(W, H, true)}
    <div class="gfx-layer" style="width:${W}px;height:${H}px">
      ${["FOOTBALL", "MORE", "THAN", "A GAME"].map((w2, j) => T("stSide", w2, 46, [47, 71, 95, 118][j], "left", { scale: 1.06 })).join("")}
      ${rectBar([45, 149, 25, 3], TS_BLUE)}
      ${rectBar([1850, 48, 25, 3], TS_BLUE)}
      ${T("stInk", String(year), 1872, 67, "right", { scale: 1.04 })}
      <img class="g-logo" src="${BRAND_LOGO}" alt="5DWN" style="left:${CP.brand[0]}px;top:${CP.brand[1]}px;width:${CP.brand[2]}px;height:${CP.brand[3]}px">
      ${T("tsName", ovr("title", `${(team.name || "").toUpperCase()}${seasonArg(season) ? ` ${season}` : ""}`), TF.title.cx, TF.title.cap, "center", { maxW: TF.title.maxW })}
      ${header}
      ${tfSideCard(0, team)}${tfSideCard(1, team)}
      ${table}
      ${legend}
      ${T("cmpFoot", ovr("foot", seasonsFoot([season], seasonLabel)), 46, TF.footCap, "left", { color: TS_BLUE, maxW: 900 })}
      ${rectBar([45, TF.footDash, 25, 2.5], TS_BLUE)}
      ${T("tsQd", `QUINTO DOWN ${year}`, 1872, TF.footCap, "right")}
      ${rectBar([1850, TF.footDash, 25, 2.5], TS_BLUE)}
    </div>`;
  fitPreview(stage);
}

function renderTCompareStage(stage) {
  const { W, H, root } = stage;
  const year = sb.season.year;
  const n = tc.n, w = n === 2 ? 635.5 : 526, gap = n === 2 ? 20 : 21;
  const total = n * w + (n - 1) * gap;
  const x0 = n === 2 ? 296 : W / 2 - total / 2; // 2 squadre: posizione del riferimento
  const stats = tc.stats.slice(0, tc.nStats).map((k) => TC_ALL.find((s) => s.key === k)).filter(Boolean).filter(tcExistsAll);
  const cards = tc.teams.slice(0, n).map((id, i) => tcCard(i, x0 + i * (w + gap), w, stats)).join("");
  const L = TC.legend;
  const legend = tc.show === "value" ? "" : [["top", "TOP 10", 0, 20], ["mid", "11-22", 86, 105], ["low", "BOTTOM 10", 156, 177]]
    .map(([c, txt, sx, tx]) => `<div class="g-bar" style="left:${x0 + sx}px;top:${L.y}px;width:${L.sq}px;height:${L.sq}px;background:${RANK_COL[c]}"></div>
      ${T("tcLeg", txt, x0 + tx, L.cap, "left", { color: "#4b5058" })}`).join("");
  const autoTitle = tc.info.slice(0, n).map((t, i) => `${tcAnon(i) ? tcAnonName(i) : (t.nickname || t.name || "").toUpperCase()} ${tc.seasons[i] || curSeason()}`).join(" VS ");
  const title = ovr("title", autoTitle), sub = ovr("sub", "");
  const seasonLabel = "REGULAR SEASON"; // statistiche e rank sono sempre di regular season
  root.style.width = `${W}px`;
  root.style.height = `${H}px`;
  root.innerHTML = `${background(W, H, true)}
    <div class="gfx-layer" style="width:${W}px;height:${H}px">
      ${["FOOTBALL", "MORE", "THAN", "A GAME"].map((w2, i) => T("stSide", w2, 46, [47, 71, 95, 118][i], "left", { scale: 1.06 })).join("")}
      ${rectBar([45, 149, 25, 3], TS_BLUE)}
      ${rectBar([1850, 48, 25, 3], TS_BLUE)}
      ${T("stInk", String(year), 1872, 67, "right", { scale: 1.04 })}
      <img class="g-logo" src="${BRAND_LOGO}" alt="5DWN" style="left:${CP.brand[0]}px;top:${CP.brand[1]}px;width:${CP.brand[2]}px;height:${CP.brand[3]}px">
      ${title ? T("week", title, W / 2, CP.title.cap, "center", { scale: CP.title.h / STYLES.week.ref[1], maxW: CP.title.maxW }) : ""}
      ${sub ? T("cmpSub", sub, W / 2, CP.sub.cap, "center", { maxW: 1500 }) : ""}
      ${cards}
      ${legend}
      ${T("cmpFoot", ovr("foot", seasonsFoot(tc.seasons.slice(0, n), seasonLabel)), 46, 966, "left", { color: TS_BLUE, maxW: 900 })}
      ${rectBar([45, 995, 25, 2.5], TS_BLUE)}
      ${T("tsQd", `QUINTO DOWN ${year}`, 1872, 966, "right")}
      ${rectBar([1850, 995, 25, 2.5], TS_BLUE)}
    </div>`;
  fitPreview(stage);
}

// ---------------------------------------------------------------------------- template Confronto giocatori
// Misurato su "NFL Player Comparison-selection.png" (10984×6180 → 1920×1080). Solo 16:9.
const CP = {
  cardW: 526, gap: 21, panelTop: 241, panelBot: 527.5, rowsBot: 872, barH: 5.5,
  photo: { x: 0, w: 320, top: 222, h: 305.5 }, // box della foto profilo (relativo alla card), sotto il sottotitolo
  logo: { cx: 421.5, cy: 333, box: 180 }, // logo squadra ingrandito
  nameX: 346, firstCap: 433, lastCap: 469, seasonCap: 505, nameMaxW: 164, // nome staccato di ~26 px dal box foto (che finisce a 320)
  qMark: 120, // altezza del "?" che sostituisce il logo (anonimo)
  labelX: 36, valCx: 421.5, rowRef: 68.8, labelDy: 26, valDy: 20,
  title: { cap: 81, h: 86, maxW: 1500 }, sub: { cap: 191 }, note: { x: 152, cap: 898 },
  brand: [892, 29.3, 136, 32.66],
};
const CMP_GREY = "#f3f4f6";
const CMP_ANON = "#5b616e"; // sfondo neutro dei giocatori anonimi
// Statistiche confrontabili (chiave "categoria.nome" del gamelog ESPN; combinazioni calcolate).
const CMP_STATS = [
  { key: "cmpatt", label: "COMP/ATT", num: (a) => (a["passing.passingAttempts"] ? ((a["passing.completions"] || 0) / a["passing.passingAttempts"]) * 100 : null), get: (a) => (a["passing.passingAttempts"] != null ? `${a["passing.completions"] ?? 0}/${a["passing.passingAttempts"]}` : null) },
  { key: "passing.completionPct", label: "COMP %", dec: 1 },
  { key: "passing.passingYards", label: "PASS YDS" },
  { key: "passYdsG", label: "PASS YDS/G", num: (a) => (a["passing.passingYards"] != null && a.games ? a["passing.passingYards"] / a.games : null), get: (a) => (a["passing.passingYards"] != null && a.games ? (a["passing.passingYards"] / a.games).toFixed(1) : null) },
  { key: "passing.yardsPerPassAttempt", label: "YDS/ATT", dec: 1 },
  { key: "passing.passingTouchdowns", label: "PASS TD" },
  { key: "passing.interceptions", label: "INT" },
  { key: "passing.QBRating", label: "PASSER RTG", dec: 1 },
  { key: "passing.adjQBR", label: "QBR", dec: 1 },
  { key: "passing.sacks", label: "SACK SUBITI" },
  { key: "passing.longPassing", label: "PASS LNG" },
  { key: "rushing.rushingAttempts", label: "RUSH ATT" },
  { key: "rushing.rushingYards", label: "RUSH YDS" },
  { key: "rushing.yardsPerRushAttempt", label: "YDS/CAR", dec: 1 },
  { key: "rushing.rushingTouchdowns", label: "RUSH TD" },
  { key: "rushing.longRushing", label: "RUSH LNG" },
  { key: "receiving.receptions", label: "REC" },
  { key: "receiving.receivingTargets", label: "TARGET" },
  { key: "rectgt", label: "REC/TGT", num: (a) => (a["receiving.receivingTargets"] ? (a["receiving.receptions"] || 0) / a["receiving.receivingTargets"] : null), get: (a) => (a["receiving.receivingTargets"] != null ? `${a["receiving.receptions"] ?? 0}/${a["receiving.receivingTargets"]}` : null) },
  { key: "receiving.receivingYards", label: "REC YDS" },
  { key: "receiving.yardsPerReception", label: "YDS/REC", dec: 1 },
  { key: "receiving.receivingTouchdowns", label: "REC TD" },
  { key: "receiving.longReception", label: "REC LNG" },
  { key: "scrimYds", label: "YDS TOTALI", num: (a) => (a["rushing.rushingYards"] != null || a["receiving.receivingYards"] != null ? (a["rushing.rushingYards"] || 0) + (a["receiving.receivingYards"] || 0) : null), get: (a) => (a["rushing.rushingYards"] != null || a["receiving.receivingYards"] != null ? String((a["rushing.rushingYards"] || 0) + (a["receiving.receivingYards"] || 0)) : null) },
  { key: "totTd", label: "TD TOTALI", num: (a) => (a["rushing.rushingTouchdowns"] != null || a["receiving.receivingTouchdowns"] != null ? (a["rushing.rushingTouchdowns"] || 0) + (a["receiving.receivingTouchdowns"] || 0) : null), get: (a) => (a["rushing.rushingTouchdowns"] != null || a["receiving.receivingTouchdowns"] != null ? String((a["rushing.rushingTouchdowns"] || 0) + (a["receiving.receivingTouchdowns"] || 0)) : null) },
  { key: "tackles.totalTackles", label: "TACKLE" },
  { key: "tackles.soloTackles", label: "TACKLE SOLO" },
  { key: "tackles.assistTackles", label: "TACKLE ASSISTITI" },
  { key: "tackles.sacks", label: "SACK", dec: 1 },
  { key: "tackles.stuffs", label: "STUFF" },
  { key: "interceptions.interceptions", label: "INT" },
  { key: "interceptions.passesDefended", label: "PASS DEF" },
  { key: "interceptions.interceptionTouchdowns", label: "INT TD" },
  { key: "fumbles.fumbles", label: "FUMBLE" },
  { key: "fumbles.fumblesLost", label: "FUMBLE PERSI" },
  { key: "fumbles.fumblesForced", label: "FUMBLE FORZATI" },
  { key: "fumbles.fumblesRecovered", label: "FUMBLE RECUPERATI" },
];
const CMP_DEFAULTS = {
  QB: ["cmpatt", "passing.passingYards", "passing.passingTouchdowns", "passing.interceptions", "passing.QBRating", "passing.completionPct", "passing.yardsPerPassAttempt"],
  RB: ["rushing.rushingAttempts", "rushing.rushingYards", "rushing.yardsPerRushAttempt", "rushing.rushingTouchdowns", "receiving.receivingYards", "receiving.receptions", "scrimYds"],
  WR: ["receiving.receptions", "receiving.receivingTargets", "receiving.receivingYards", "receiving.yardsPerReception", "receiving.receivingTouchdowns", "receiving.longReception", "rectgt"],
  DEF: ["tackles.totalTackles", "tackles.soloTackles", "tackles.sacks", "tackles.stuffs", "interceptions.interceptions", "interceptions.passesDefended", "fumbles.fumblesForced"],
};
const posGroup = (pos) => (pos === "QB" ? "QB" : ["RB", "FB"].includes(pos) ? "RB" : ["WR", "TE"].includes(pos) ? "WR" : "DEF");
const cmp = { period: "season", nPlayers: 3, nStats: 5, show: "both", slots: [{}, {}, {}], stats: [], note: "", loaded: false };

// ---- stagioni storiche (Confronto giocatori / squadre): ogni box ha la sua stagione
const curSeason = () => Number(sb.season.year);
/** Footer automatico con le stagioni dei box (es. "NFL 2010 / 2007 REGULAR SEASON"). */
const seasonsFoot = (years, label) => `NFL ${[...new Set(years.map((y) => y || curSeason()))].join(" / ")} ${label}`;
const seasonArg = (y) => (Number(y) === curSeason() ? undefined : Number(y)); // stagione corrente = richieste "normali"
const seasonOptions = () => Array.from({ length: 20 }, (_, k) => curSeason() - k).map((y) => `<option value="${y}">${y}</option>`).join("");
// Sigle storiche → colori della palette attuale (es. Oakland Raiders = Las Vegas Raiders)
const ABBR_ALIAS = { OAK: "LV", SD: "LAC", STL: "LAR" };
const cellColor = (t) => TEAM_CELL[ABBR_ALIAS[t.abbr] || t.abbr] || t.color || "#333";
/** Squadra come era in quella stagione (nome, sigla, logo); stagione corrente = dati attuali. */
async function teamInSeason(team, season) {
  if (!seasonArg(season)) return team;
  try {
    const h = (await getTeamHistory(team.id, season)).data;
    return { ...team, ...h, histLogo: h.logo, histLogoDark: h.logoDark };
  } catch { return team; }
}
const teamLogoUrl = (t, size, dark) => (dark ? t.histLogoDark : t.histLogo) || espnImg(`https://a.espncdn.com/i/teamlogos/nfl/${dark ? "500-dark" : "500"}/${(ABBR_ALIAS[t.abbr] || t.abbr).toLowerCase()}.png`, size);

// ---- rank NFL nel Confronto giocatori: tra i "qualificati" ESPN del ruolo, sullo stesso periodo scelto.
const CMP_POOLS = {
  passing: ["offense:passing", "passing.passingYards"],
  rushing: ["offense:rushing", "rushing.rushingYards"],
  receiving: ["offense:receiving", "receiving.receivingYards"],
  defense: ["defense:defensive", "defensive.totalTackles"],
};
const POOL_LAST_N = 60; // ultime N partite: si sommano i gamelog dei primi 60 qualificati del ruolo
const CMP_LOW = new Set(["passing.interceptions", "passing.sacks", "fumbles.fumbles", "fumbles.fumblesLost"]); // meno = meglio
const cmpRankData = { raw: {}, qualified: {}, logs: {} };
/**
 * La statistica esiste in quella stagione? No se il campo manca nei dati ESPN dell'anno o se, in una
 * stagione conclusa, vale 0 per tutti (campo non tracciato: es. TFL negli anni vecchi). Mai 0 o rank finti.
 */
function cmpFieldExists(st, y) {
  const pools = poolsOf(st).map((p) => cmpRankData.raw[`${y}|${p}`]).filter(Boolean);
  if (!pools.length) return true; // dati della stagione non ancora caricati
  const past = !!seasonArg(y);
  const vals = pools.flat().map((q) => cmpNum(st, seasonAgg(q.stats))).filter((v) => v != null);
  if (vals.length) return past ? vals.some((v) => v !== 0) : true;
  // campo assente nelle statistiche stagionali ESPN (es. stuff): decide il gamelog dei giocatori di quella stagione
  return cmp.slots.slice(0, cmp.nPlayers).some((sl) => (sl.season || curSeason()) === y && (() => { const v = cmpNum(st, sl.agg); return v != null && (!past || v !== 0); })());
}
const cmpSeasons = () => [...new Set(cmp.slots.slice(0, cmp.nPlayers).map((sl) => sl.season || curSeason()))];
const cmpExistsAll = (st) => cmpSeasons().every((y) => cmpFieldExists(st, y));
function poolsOf(st) {
  const k = st.key;
  if (k.startsWith("passing.") || k === "cmpatt" || k === "passYdsG") return ["passing"];
  if (k.startsWith("rushing.")) return ["rushing"];
  if (k.startsWith("receiving.") || k === "rectgt") return ["receiving"];
  if (k === "scrimYds" || k === "totTd") return ["rushing", "receiving"];
  if (k === "fumbles.fumbles" || k === "fumbles.fumblesLost") return ["passing", "rushing", "receiving"];
  return ["defense"];
}
/** Statistiche stagionali "byathlete" → stesse chiavi del gamelog sommato. */
function seasonAgg(stats) {
  const a = { games: stats["general.gamesPlayed"] || 0 };
  for (const [k, v] of Object.entries(stats)) {
    const [c, n] = k.split(".");
    if (c === "passing" || c === "rushing" || c === "receiving") a[k] = v;
    else if (c === "defensive") a[n === "passesDefended" ? `interceptions.${n}` : `tackles.${n}`] = v;
    else if (c === "defensiveinterceptions") a[`interceptions.${n}`] = v;
    else if (c === "general" && (n === "fumblesForced" || n === "fumblesRecovered")) a[`fumbles.${n}`] = v;
  }
  return a;
}
const cmpNum = (st, a) => {
  if (!a) return null;
  const v = st.num ? st.num(a) : a[st.key];
  return v == null || Number.isNaN(v) ? null : v;
};
// Soglie NFL ufficiali per essere "qualificati" (per partita della squadra). ESPN non le applica alle stagioni passate.
const QUAL_MIN = { passing: ["passing.passingAttempts", 14], rushing: ["rushing.rushingAttempts", 6.25], receiving: ["receiving.receptions", 1.875] };
function qualifyPool(p, list) {
  const rule = QUAL_MIN[p];
  if (!rule) return list; // difesa: nessuna soglia
  const teamGames = Math.max(1, ...list.map((q) => q.stats["general.gamesPlayed"] || 0)); // partite giocate dalle squadre finora
  return list.filter((q) => (q.stats[rule[0]] || 0) >= rule[1] * teamGames);
}
/** Carica i dati della lega che servono ai rank delle statistiche scelte (con il periodo attuale). */
async function ensureRankData(withLogs = true) {
  const stats = cmp.stats.slice(0, cmp.nStats).map((k) => CMP_STATS.find((s) => s.key === k)).filter(Boolean);
  const pools = [...new Set(stats.flatMap(poolsOf))];
  const seasons = [...new Set(cmp.slots.slice(0, cmp.nPlayers).map((sl) => sl.season || curSeason()))];
  // dati stagionali di tutti i ruoli: servono anche a capire quali statistiche esistono in quella stagione
  for (const y of seasons) for (const p of Object.keys(CMP_POOLS)) {
    const k = `${y}|${p}`;
    if (!cmpRankData.raw[k]) {
      cmpRankData.raw[k] = (await getQualified(...CMP_POOLS[p], {}, seasonArg(y))).data;
      cmpRankData.qualified[k] = qualifyPool(p, cmpRankData.raw[k]);
    }
  }
  if (!withLogs || cmp.period === "season") return;
  const ids = [...new Set(seasons.flatMap((y) => pools.flatMap((p) => cmpRankData.qualified[`${y}|${p}`].slice(0, POOL_LAST_N).map((q) => `${y}|${q.id}`))))].filter((k) => !(k in cmpRankData.logs));
  let done = 0;
  const queue = ids.slice();
  const worker = async () => {
    while (queue.length) {
      const key = queue.shift();
      const [y, id] = key.split("|");
      try {
        let res = await getGamelog(id, {}, seasonArg(y));
        if (!res.data.keys) res = await getGamelog(id, { force: true }, seasonArg(y));
        cmpRankData.logs[key] = res.data;
      } catch { cmpRankData.logs[key] = null; }
      done += 1;
      if (done % 10 === 0) status.textContent = `Calcolo i rank NFL sulle ultime ${cmp.period} partite: ${done}/${ids.length} giocatori…`;
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
}
/** Rank del giocatore nella stat (1 = migliore); "NQ" se non è tra i qualificati del ruolo. */
function cmpRank(st, sl) {
  const pools = poolsOf(st), y = sl.season || curSeason(); // rank dentro la stagione del box
  if (!pools.every((p) => cmpRankData.qualified[`${y}|${p}`])) return null;
  const members = new Map();
  for (const p of pools) {
    const list = cmpRankData.qualified[`${y}|${p}`];
    (cmp.period === "season" ? list : list.slice(0, POOL_LAST_N)).forEach((q) => members.set(q.id, q));
  }
  const pid = String(sl.player?.id);
  if (!members.has(pid)) return { nq: true };
  const aggOf = (q) => (cmp.period === "season" ? seasonAgg(q.stats) : cmpRankData.logs[`${y}|${q.id}`] ? aggregateGamelog(cmpRankData.logs[`${y}|${q.id}`], cmp.period) : null);
  const vals = [...members.values()].map((q) => ({ id: q.id, v: cmpNum(st, q.id === pid && cmp.period !== "season" ? sl.agg : aggOf(q)) })).filter((x) => x.v != null);
  const mine = vals.find((x) => x.id === pid)?.v;
  if (mine == null) return null;
  const low = CMP_LOW.has(st.key);
  const better = vals.filter((x) => (low ? x.v < mine - 1e-9 : x.v > mine + 1e-9)).length;
  return { r: better + 1, of: vals.length };
}
let cmpRefreshSeq = 0;
async function cmpRefresh() {
  const seq = ++cmpRefreshSeq; // conta solo l'ultimo aggiornamento (cambi rapidi di stagione/giocatore)
  try {
    status.textContent = cmp.show !== "value" ? "Calcolo i rank NFL…" : "Carico i dati della stagione…";
    await ensureRankData(cmp.show !== "value");
  } catch (err) { console.warn("rank", err); }
  if (seq !== cmpRefreshSeq) return;
  renderCmpStatSelects();
  renderAll();
  cmpStatus();
}
const cmpReady = () => cmp.loaded && cmp.slots.slice(0, cmp.nPlayers).every((sl) => sl.player && sl.team);

/** Somma le ultime n partite (o tutta la stagione) dal gamelog; medie e percentuali ricalcolate. */
function aggregateGamelog(gl, n) {
  const keys = [];
  let i = 0;
  for (const g of gl.groups) for (let j = 0; j < g.count; j++, i++) keys.push(`${g.name}.${gl.keys[i]}`);
  // solo regular season (come le classifiche ESPN usate per il rank)
  const regular = gl.blocks.filter((b) => /regular/i.test(b.title || ""));
  const rows = (regular.length ? regular : gl.blocks).flatMap((b) => b.rows)
    .filter((r) => gl.events[r.eventId])
    .sort((a, b) => new Date(gl.events[b.eventId].date) - new Date(gl.events[a.eventId].date));
  const used = n === "season" ? rows : rows.slice(0, n);
  const agg = { games: used.length };
  // ultima partita usata (week e avversario per l'etichetta del periodo), non enumerabile: non è una statistica
  Object.defineProperty(agg, "lastEvent", { value: used[0] ? gl.events[used[0].eventId] : null, enumerable: false });
  const sums = {}, cnt = {};
  for (const r of used) {
    r.stats.forEach((raw, idx) => {
      const k = keys[idx];
      if (!k) return;
      const v = parseFloat(String(raw).replace(",", ""));
      if (Number.isNaN(v)) return;
      if (/\.long/.test(k)) sums[k] = Math.max(sums[k] ?? -Infinity, v);
      else sums[k] = (sums[k] || 0) + v;
      cnt[k] = (cnt[k] || 0) + 1;
    });
  }
  for (const k of Object.keys(sums)) agg[k] = /Pct|yardsPer|avg|QBRating|adjQBR/.test(k) ? sums[k] / cnt[k] : sums[k];
  const div = (a, b) => (b ? a / b : 0);
  const P = (k) => agg[`passing.${k}`] || 0;
  if (agg["passing.passingAttempts"] != null) {
    const att = P("passingAttempts"), c = P("completions"), y = P("passingYards"), td = P("passingTouchdowns"), it = P("interceptions");
    agg["passing.completionPct"] = div(c, att) * 100;
    agg["passing.yardsPerPassAttempt"] = div(y, att);
    // passer rating NFL
    const cl = (x) => Math.max(0, Math.min(2.375, x));
    agg["passing.QBRating"] = att ? ((cl((c / att - 0.3) * 5) + cl((y / att - 3) * 0.25) + cl((td / att) * 20) + cl(2.375 - (it / att) * 25)) / 6) * 100 : 0;
  }
  if (agg["rushing.rushingAttempts"] != null) agg["rushing.yardsPerRushAttempt"] = div(agg["rushing.rushingYards"] || 0, agg["rushing.rushingAttempts"]);
  if (agg["receiving.receptions"] != null) agg["receiving.yardsPerReception"] = div(agg["receiving.receivingYards"] || 0, agg["receiving.receptions"]);
  return agg;
}
function cmpValue(st, agg) {
  if (!agg) return null;
  if (st.get) return st.get(agg);
  const v = agg[st.key];
  if (v == null) return null;
  return st.dec ? v.toFixed(st.dec) : Number.isInteger(v) ? String(v) : v.toFixed(1);
}

const cmpEls = {
  period: document.getElementById("cmp-period"),
  nPlayers: document.getElementById("cmp-nplayers"),
  nStats: document.getElementById("cmp-nstats"),
  show: document.getElementById("cmp-show"),
  note: document.getElementById("cmp-note"),
  slots: [0, 1, 2].map((i) => ({ wrap: document.getElementById(`cmp-p${i}`), season: document.getElementById(`cmp-season${i}`), photoUrl: document.getElementById(`cmp-photourl${i}`), photoFile: document.getElementById(`cmp-photofile${i}`), photoReset: document.getElementById(`cmp-photoreset${i}`), team: document.getElementById(`cmp-team${i}`), player: document.getElementById(`cmp-player${i}`), anon: document.getElementById(`cmp-anon${i}`) })),
  stats: [...document.querySelectorAll(".cmp-stat")],
};

/** Giocatori di una squadra in una stagione: roster attuale, oppure (stagioni passate) chi ha statistiche quell'anno. */
async function seasonRosterGroups(teamId, season) {
  if (!seasonArg(season)) {
    const roster = (await getRoster(teamId)).data;
    const order = ["offense", "defense", "specialTeam"];
    return { groups: roster.groups.slice().sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)), coach: roster.coach };
  }
  const all = (await getSeasonPlayers(season)).data.filter((p) => p.teamId === String(teamId));
  const off = all.filter((p) => ["QB", "RB", "FB", "WR", "TE"].includes(p.pos)), def = all.filter((p) => !off.includes(p));
  return { groups: [{ key: "offense", label: "Attacco", players: off }, { key: "defense", label: "Difesa", players: def }].filter((g) => g.players.length), coach: null };
}
async function fillRoster(i) {
  const sl = cmp.slots[i], el = cmpEls.slots[i];
  sl.season ||= curSeason();
  const { groups } = await seasonRosterGroups(sl.team.id, sl.season);
  sl.teamInfo = await teamInSeason(sl.team, sl.season);
  sl.roster = groups.flatMap((g) => g.players.map((p) => ({ ...p, teamId: sl.team.id })));
  el.player.innerHTML = groups.map((g) => `<optgroup label="${esc(g.label)}">${g.players
    .slice().sort((a, b) => ["QB", "RB", "WR", "TE"].indexOf(a.pos) - ["QB", "RB", "WR", "TE"].indexOf(b.pos) || a.name.localeCompare(b.name))
    .map((p) => `<option value="${p.id}">${esc(p.name)}${p.pos ? ` · ${esc(p.pos)}` : ""}</option>`).join("")}</optgroup>`).join("");
  if (sl.player) el.player.value = sl.player.id;
}
async function loadSlotStats(i) {
  const sl = cmp.slots[i];
  if (!sl.player) return;
  const sa = seasonArg(sl.season || curSeason());
  let res = await getGamelog(sl.player.id, {}, sa);
  if (!res.data.keys || res.data.groups.some((g) => !g.name)) res = await getGamelog(sl.player.id, { force: true }, sa); // cache precedente senza nomi categoria
  sl.gamelog = res.data;
  sl.agg = aggregateGamelog(res.data, cmp.period);
}
function cmpAvailable() {
  const aggs = cmp.slots.slice(0, cmp.nPlayers).map((sl) => sl.agg);
  // in tendina: statistiche che esistono in tutte le stagioni scelte e che almeno un giocatore ha
  return CMP_STATS.filter((st) => cmpExistsAll(st) && aggs.some((a) => cmpValue(st, a) != null));
}
function renderCmpStatSelects() {
  const avail = cmpAvailable();
  const opts = avail.map((st) => `<option value="${st.key}">${esc(st.label)}</option>`).join("");
  cmpEls.stats.forEach((sel, i) => {
    sel.closest(".select-field").hidden = i >= cmp.nStats;
    sel.innerHTML = opts;
    sel.value = cmp.stats[i] || "";
  });
}
function defaultCmpStats() {
  const first = cmp.slots[0].player;
  const wanted = CMP_DEFAULTS[posGroup(first?.pos || "QB")];
  const availKeys = new Set(cmpAvailable().map((s) => s.key));
  const out = wanted.filter((k) => availKeys.has(k));
  for (const k of availKeys) if (out.length < 7 && !out.includes(k)) out.push(k);
  cmp.stats = out.slice(0, 7);
}
function renderCmpSlotsVisibility() {
  cmpEls.slots.forEach((el, i) => (el.wrap.hidden = i >= cmp.nPlayers));
}

async function loadCompare() {
  try {
    status.textContent = "Carico squadre, giocatori e statistiche…";
    if (!teamList.length) teamList = (await getTeams()).data.slice().sort((a, b) => a.name.localeCompare(b.name));
    const teamOpts = teamList.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("");
    cmpEls.slots.forEach((el) => {
      if (!el.team.options.length) el.team.innerHTML = teamOpts;
      if (!el.season.options.length) el.season.innerHTML = seasonOptions();
    });
    if (!cmp.loaded) {
      // Giocatori proposti: i 3 leader stagionali in yard su passaggio (poi si cambiano dalle tendine).
      const rk = (await getAthleteRanking({ category: "offense:passing", group: "passing", field: "passingYards" })).data.rows;
      rk.slice(0, 3).forEach((r, i) => {
        const team = teamList.find((t) => t.id === r.team?.id) || teamList[i];
        const parts = r.name.split(" ");
        cmp.slots[i] = { team, season: curSeason(), player: { id: r.id, name: r.name, first: parts[0], last: parts.slice(1).join(" "), pos: r.pos || "QB" } };
      });
    }
    await Promise.all(cmp.slots.map(async (sl, i) => {
      cmpEls.slots[i].team.value = sl.team.id;
      cmpEls.slots[i].season.value = String(sl.season || curSeason());
      await fillRoster(i);
      await loadSlotStats(i);
    }));
    if (!cmp.loaded || !cmp.stats.length) defaultCmpStats();
    cmp.loaded = true;
    renderCmpSlotsVisibility();
    renderCmpStatSelects();
    await cmpRefresh();
  } catch (err) {
    console.error(err);
    status.textContent = "Non riesco a caricare il confronto: riprova.";
  }
}
function cmpStatus() {
  const per = cmp.period === "season" ? "intera stagione" : cmp.period === 1 ? "ultima partita" : `ultime ${cmp.period} partite`;
  const games = cmp.slots.slice(0, cmp.nPlayers).map((sl) => `${sl.player?.name}: ${sl.agg?.games ?? 0} partite`).join(" · ");
  const o = overrides.compare || {};
  const rk = cmp.show === "value" ? "" : ` · rank NFL tra i qualificati ESPN del ruolo${cmp.period === "season" ? "" : ` (primi ${POOL_LAST_N} del ruolo, stesse ultime ${cmp.period} partite)`}`;
  status.textContent = `Statistiche ESPN, ${per} · ${games}${rk}${!o.sub?.trim() ? " · scrivi il sottotitolo in \"Testi personalizzati\"" : ""}`;
}

cmpEls.period.addEventListener("change", () => {
  cmp.period = cmpEls.period.value === "season" ? "season" : Number(cmpEls.period.value);
  cmp.slots.forEach((sl) => { if (sl.gamelog) sl.agg = aggregateGamelog(sl.gamelog, cmp.period); });
  cmpRefresh();
});
cmpEls.nPlayers.addEventListener("change", async () => {
  cmp.nPlayers = Number(cmpEls.nPlayers.value);
  renderCmpSlotsVisibility();
  renderCmpStatSelects();
  renderAll();
  cmpStatus();
});
cmpEls.nStats.addEventListener("change", () => {
  cmp.nStats = Number(cmpEls.nStats.value);
  renderCmpStatSelects();
  cmpRefresh();
});
cmpEls.show.addEventListener("change", () => { cmp.show = cmpEls.show.value; cmpRefresh(); });
cmpEls.note.addEventListener("input", () => { cmp.note = cmpEls.note.value; renderAll(); });
cmpEls.stats.forEach((sel, i) => sel.addEventListener("change", () => { cmp.stats[i] = sel.value; cmpRefresh(); }));
cmpEls.slots.forEach((el, i) => {
  el.anon.addEventListener("change", () => { cmp.slots[i].anon = el.anon.checked; renderAll(); });
  // foto personalizzata (URL o file): priorità sulla foto automatica, finisce anche nel PNG
  el.photoUrl.addEventListener("change", async () => {
    const sl = cmp.slots[i], url = el.photoUrl.value.trim();
    if (!url) { sl.photoUrl = null; renderAll(); return; }
    if (await customPhotoOk(url)) { sl.photoUrl = url; renderAll(); }
    else status.textContent = "Questa immagine non si può usare nel PNG (il sito che la ospita non lo permette): scaricala e caricala con \"File\".";
  });
  el.photoFile.addEventListener("change", (e) => {
    const sl = cmp.slots[i], file = e.target.files?.[0];
    if (!file) return;
    if (sl.photoUpload) URL.revokeObjectURL(sl.photoUpload);
    sl.photoUpload = URL.createObjectURL(file);
    e.target.value = "";
    renderAll();
  });
  el.photoReset.addEventListener("click", () => {
    const sl = cmp.slots[i];
    if (sl.photoUpload) URL.revokeObjectURL(sl.photoUpload);
    sl.photoUpload = null; sl.photoUrl = null; el.photoUrl.value = "";
    renderAll();
  });
  el.season.addEventListener("change", async () => {
    const sl = cmp.slots[i];
    sl.season = Number(el.season.value);
    status.textContent = `Carico la stagione ${sl.season}…`;
    await fillRoster(i);
    // stesso giocatore se ha giocato quella stagione con la squadra scelta, altrimenti uno dello stesso ruolo
    const all = sl.roster || [];
    const pick = all.find((p) => p.id === sl.player?.id) || all.find((p) => p.pos === sl.player?.pos) || all[0];
    sl.player = pick ? { ...pick } : null;
    el.player.value = sl.player?.id || "";
    await loadSlotStats(i);
    renderCmpStatSelects();
    cmpRefresh();
  });
  el.team.addEventListener("change", async () => {
    const sl = cmp.slots[i];
    sl.team = teamList.find((t) => t.id === el.team.value);
    await fillRoster(i);
    // stesso ruolo del giocatore precedente, se c'è; altrimenti il primo della lista
    const pos = sl.player?.pos;
    const pick = sl.roster.find((p) => p.pos === pos) || sl.roster[0];
    sl.player = pick ? { ...pick } : null;
    el.player.value = sl.player?.id || "";
    await loadSlotStats(i);
    renderCmpStatSelects();
    cmpRefresh();
  });
  el.player.addEventListener("change", async () => {
    const sl = cmp.slots[i];
    sl.player = { ...(sl.roster.find((p) => p.id === el.player.value) || {}) };
    await loadSlotStats(i);
    renderCmpStatSelects();
    cmpRefresh();
  });
});

function cmpCard(sl, x, stats) {
  const t = sl.teamInfo || sl.team, p = sl.player;
  const anon = !!sl.anon; // anonimo: sagoma, "?" al posto del logo, niente nome, colore neutro
  const col = anon ? CMP_ANON : cellColor(t);
  const ink = !anon && DARK_TEXT.has(ABBR_ALIAS[t.abbr] || t.abbr) ? "#111111" : "#ffffff";
  const ph = CP.photo, lg = CP.logo;
  const first = (p.first || p.name.split(" ")[0] || "").toUpperCase();
  const last = (p.last || p.name.split(" ").slice(1).join(" ") || "").toUpperCase();
  // foto profilo ESPN (scontornata): altezza del box, centrata, ritagliata ai bordi della card
  const hsH = ph.h, hsW = hsH * (600 / 436);
  const headshot = `https://a.espncdn.com/i/headshots/nfl/players/full/${p.id}.png`;
  const custom = !anon && (sl.photoUpload || sl.photoUrl); // foto scelta dall'utente: ha la priorità
  const photoHtml = custom
    ? `<img class="g-logo g-cover" ${sl.photoUpload ? "" : 'crossorigin="anonymous"'} src="${esc(custom)}" alt="" style="left:${x + ph.x}px;top:${ph.top}px;width:${ph.w}px;height:${ph.h}px">`
    : `<div class="g-clip" style="position:absolute;overflow:hidden;left:${x + ph.x}px;top:${ph.top}px;width:${ph.w}px;height:${ph.h}px">
      <img class="g-logo${anon ? " g-sil" : ""}" crossorigin="anonymous" src="${headshot}" alt="" onerror="this.remove()" style="left:${ph.w / 2 - hsW / 2}px;top:0;width:${hsW}px;height:${hsH}px">
    </div>`;
  const n = stats.length, pitch = (CP.rowsBot - CP.panelBot) / n;
  const kt = Math.min(1, (pitch / CP.rowRef) * 1.15);
  let rows = "";
  stats.forEach((st, i) => {
    const y = CP.panelBot + i * pitch;
    const v = cmpValue(st, sl.agg);
    const showV = cmp.show !== "rank", showR = cmp.show !== "value";
    const valCx = showR ? CP.cardW - 190 : CP.valCx, rCx = showV ? CP.cardW - 62 : CP.valCx;
    rows += `<div class="g-cell" style="left:${x}px;top:${y}px;width:${CP.cardW}px;height:${pitch + 0.5}px;background:${i % 2 ? CMP_GREY : "#ffffff"}"></div>
      ${T("cmpLabel", st.label, x + CP.labelX, y + (pitch - STYLES.cmpLabel.ref[1] * kt) / 2, "left", { scale: kt, maxW: (showV ? valCx : rCx) - 60 - CP.labelX })}
      ${showV && v != null ? T("cmpVal", v, x + valCx, y + (pitch - STYLES.cmpVal.ref[1] * kt) / 2, "center", { scale: kt, maxW: showR ? 150 : 190 }) : ""}
      ${v == null ? T("cmpVal", "N/D", x + (showV ? valCx : rCx), y + (pitch - STYLES.cmpVal.ref[1] * kt) / 2, "center", { scale: kt, color: "#8a9097" }) : ""}`;
    if (showR && v != null) { // dato mancante: N/D senza rank
      const rk = v != null ? cmpRank(st, sl) : null;
      const r = rk && !rk.nq ? rk.r : null;
      const txt = rk?.nq ? "NQ" : r == null ? "–" : `${r}°`;
      const bg = r == null ? RANK_COL.mid : r <= 10 ? RANK_COL.top : r > rk.of - 10 ? RANK_COL.low : RANK_COL.mid;
      const fg = r != null && bg !== RANK_COL.mid ? "#ffffff" : "#1a1a1a";
      const bw = 64 * Math.max(kt, 0.85), bh = 38 * kt;
      rows += `<div class="g-bar" style="left:${x + rCx - bw / 2}px;top:${y + (pitch - bh) / 2}px;width:${bw}px;height:${bh}px;background:${bg}"></div>
        ${T("tcRank", txt, x + rCx, y + (pitch - STYLES.tcRank.ref[1] * kt) / 2, "center", { scale: kt, color: fg, maxW: bw - 8 })}`;
    }
  });
  return `<div class="g-cell" style="left:${x}px;top:${CP.panelTop}px;width:${CP.cardW}px;height:${CP.panelBot - CP.panelTop}px;background:${col}"></div>
    ${photoHtml}
    ${anon
      ? T("cmpLast", "?", x + lg.cx, lg.cy - CP.qMark / 2, "center", { color: "#ffffff", scale: CP.qMark / STYLES.cmpLast.ref[1] })
      : `<img class="g-logo" crossorigin="anonymous" src="${teamLogoUrl(t, 400, true)}" alt="" style="left:${x + lg.cx - lg.box / 2}px;top:${lg.cy - lg.box / 2}px;width:${lg.box}px;height:${lg.box}px">
    ${T("cmpFirst", first, x + CP.nameX, CP.firstCap, "left", { color: ink, maxW: CP.nameMaxW })}
    ${T("cmpLast", last, x + CP.nameX, CP.lastCap, "left", { color: ink, maxW: CP.nameMaxW })}`}
    ${T("tcHdr", periodLabel(cmp.period, sl.season || curSeason(), sl.agg?.games, sl.agg?.lastEvent), x + CP.nameX, CP.seasonCap, "left", { color: anon ? "#ffffff" : ink, maxW: CP.nameMaxW })}
    ${rows}
    <div class="g-bar" style="left:${x}px;top:${CP.rowsBot}px;width:${CP.cardW}px;height:${CP.barH}px;background:${col}"></div>`;
}

/** Un'immagine da URL si può disegnare nel PNG solo se il sito che la ospita permette l'uso (CORS). */
function customPhotoOk(url) {
  return new Promise((res) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      try { const c = document.createElement("canvas"); c.width = c.height = 2; const x = c.getContext("2d"); x.drawImage(im, 0, 0, 2, 2); x.getImageData(0, 0, 1, 1); res(true); } catch { res(false); }
    };
    im.onerror = () => res(false);
    im.src = url;
  });
}

/** Legenda dei rank (allineata a destra sotto le card) + "NQ = non qualificato". */
function cmpLegend(right) {
  const items = [["top", "TOP 10"], ["mid", "INTERMEDI"], ["low", "ULTIMI 10"], [null, "NQ = NON QUALIFICATO"]];
  const L = TC.legend;
  const widths = items.map(([, t]) => inkWidth("tcLeg", t));
  let x = right - widths.reduce((a, w, i) => a + w + (items[i][0] ? 20 : 0), 0) - (items.length - 1) * 18;
  return items.map(([c, t], i) => {
    let h = "";
    if (c) { h += `<div class="g-bar" style="left:${x}px;top:${L.y}px;width:${L.sq}px;height:${L.sq}px;background:${RANK_COL[c]}"></div>`; x += 20; }
    h += T("tcLeg", t, x, L.cap, "left", { color: "#4b5058" });
    x += widths[i] + 18;
    return h;
  }).join("");
}

function renderCompareStage(stage) {
  const { W, H, root } = stage;
  const year = sb.season.year;
  const n = cmp.nPlayers;
  // righe di statistiche che non esistono in una delle stagioni scelte: nascoste del tutto
  const stats = cmp.stats.slice(0, cmp.nStats).map((k) => CMP_STATS.find((s) => s.key === k)).filter(Boolean).filter(cmpExistsAll);
  const total = n * CP.cardW + (n - 1) * CP.gap;
  const x0 = W / 2 - total / 2;
  const cards = cmp.slots.slice(0, n).map((sl, i) => cmpCard(sl, x0 + i * (CP.cardW + CP.gap), stats)).join("");
  // titolo automatico con la stagione di ogni box (es. "MAHOMES 2023 VS BRADY 2010"), sostituibile
  const autoTitle = cmp.slots.slice(0, n).map((sl) => `${sl.anon ? "???" : (sl.player?.last || sl.player?.name?.split(" ").slice(1).join(" ") || "").toUpperCase()} ${sl.season || curSeason()}`).join(" VS ");
  const title = ovr("title", autoTitle), sub = ovr("sub", "");
  const seasonLabel = "REGULAR SEASON"; // statistiche e rank sono sempre di regular season
  root.style.width = `${W}px`;
  root.style.height = `${H}px`;
  root.innerHTML = `${background(W, H, true)}
    <div class="gfx-layer" style="width:${W}px;height:${H}px">
      ${["FOOTBALL", "MORE", "THAN", "A GAME"].map((w, i) => T("stSide", w, 46, [47, 71, 95, 118][i], "left", { scale: 1.06 })).join("")}
      ${rectBar([45, 149, 25, 3], TS_BLUE)}
      ${rectBar([1850, 48, 25, 3], TS_BLUE)}
      ${T("stInk", String(year), 1872, 67, "right", { scale: 1.04 })}
      <img class="g-logo" src="${BRAND_LOGO}" alt="5DWN" style="left:${CP.brand[0]}px;top:${CP.brand[1]}px;width:${CP.brand[2]}px;height:${CP.brand[3]}px">
      ${title ? T("week", title, W / 2, CP.title.cap, "center", { scale: CP.title.h / STYLES.week.ref[1], maxW: CP.title.maxW }) : ""}
      ${sub ? T("cmpSub", sub, W / 2, CP.sub.cap, "center", { maxW: 1500 }) : ""}
      ${cards}
      ${cmp.note.trim() ? T("cmpNote", cmp.note, x0, CP.note.cap, "left", { color: "#474c54", maxW: total - 420 }) : ""}
      ${cmp.show === "value" ? "" : cmpLegend(x0 + total)}
      ${T("cmpFoot", ovr("foot", seasonsFoot(cmp.slots.slice(0, n).map((sl) => sl.season), seasonLabel)), 46, 966, "left", { color: TS_BLUE, maxW: 900 })}
      ${rectBar([45, 995, 25, 2.5], TS_BLUE)}
      ${T("tsQd", `QUINTO DOWN ${year}`, 1872, 966, "right")}
      ${rectBar([1850, 995, 25, 2.5], TS_BLUE)}
    </div>`;
  fitPreview(stage);
}
// titolo/sottotitolo: aggiorna anche l'avviso nello stato
for (const k of ["title", "sub"]) ovInputs[k].addEventListener("input", () => { if (tpl === "compare" && cmp.loaded) cmpStatus(); });

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
  const cur = ABBR_ALIAS[abbr] || abbr; // stagioni passate: OAK → LV, SD → LAC, STL → LAR (colori e loghi)
  const ink = DARK_TEXT.has(cur) ? "#111111" : "#ffffff";
  const logo = t.histLogo || espnImg(cur ? `https://a.espncdn.com/i/teamlogos/nfl/500-dark/${cur.toLowerCase()}.png` : t.logo, 200);
  html += `<div class="g-cell" style="left:${ox}px;top:${y}px;width:${ow}px;height:${TS.rowH}px;background:${TEAM_CELL[cur] || t.color || "#333"}"></div>
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
  const season = teamSched.season || curSeason();
  const nWeeks = Math.max(season >= 2021 ? 18 : 17, ...byWeek.keys()); // 18 settimane dal 2021, prima 17
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
      <img class="g-logo" crossorigin="anonymous" src="${teamLogoUrl(team, 300)}" alt="" style="left:${left + nameW + nm.gap}px;top:${nm.logoCy - nm.logoBox / 2}px;width:${nm.logoBox}px;height:${nm.logoBox}px">
      ${recordGroup(record, season)}
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
    if (!teamList.length) teamList = (await getTeams()).data.slice().sort((a, b) => a.name.localeCompare(b.name));
    // la lista squadre può essere già stata caricata da un altro template (es. Confronto giocatori)
    if (teamSelect.options.length !== teamList.length) teamSelect.innerHTML = teamList.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("");
    if (!teamList.some((t) => t.id === teamId)) teamId = teamList[0]?.id || "";
    teamSelect.value = teamId;
    if (!quiet) status.textContent = "Carico il calendario della squadra…";
    if (!teamSeasonSel.options.length) { teamSeasonSel.innerHTML = seasonOptions(); teamSeasonSel.value = String(teamSeason || curSeason()); }
    const season = teamSeason || curSeason(), past = !!seasonArg(season);
    if (quiet && past) return; // le stagioni concluse non cambiano: niente aggiornamento automatico
    // Stagione corrente: sempre dati freschi da ESPN (risultati e orari aggiornati al minuto).
    const res = await getSchedule(teamId, { force: !past }, { seasonType: 2, season: seasonArg(season), past });
    const team = await teamInSeason(teamList.find((t) => t.id === teamId), season);
    if (past) {
      // avversarie com'erano quell'anno (logo dell'epoca)
      await Promise.all(res.data.events.map(async (e) => {
        try { const h = (await getTeamHistory(e.opp.id, season)).data; e.opp = { ...e.opp, histLogo: h.logoDark }; } catch { /* logo attuale */ }
      }));
    }
    const sig = JSON.stringify([season, ...res.data.events.map((e) => [e.id, e.state, e.us, e.them, e.date, e.timeValid])]);
    if (quiet && teamSched && teamSched.sig === sig && teamSched.team.id === teamId) return;
    teamSched = { team, events: res.data.events, sig, season };
    syncUrl();
    renderAll();
    status.textContent = past
      ? `${team.name} · calendario ${season} da ESPN (stagione conclusa)`
      : `${team.name} · calendario ${season} da ESPN · aggiornato alle ${fItTime.format(new Date())} (si aggiorna da solo ogni minuto)`;
  } catch (err) {
    console.error(err);
    if (!quiet) status.textContent = "Non riesco a caricare il calendario della squadra: riprova.";
  }
}
teamSelect.addEventListener("change", () => { teamId = teamSelect.value; loadTeamSchedule(); });
const teamSeasonSel = document.getElementById("team-season");
let teamSeason = 0;
teamSeasonSel.addEventListener("change", () => { teamSeason = Number(teamSeasonSel.value); loadTeamSchedule(); });
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
  tplToggle.value = tpl;
}

function syncUrl() {
  const url = new URL(location.href);
  url.searchParams.set("w", selectedKey);
  url.searchParams.set("t", { results: "risultati", standings: "classifiche", game: "partita", player: "giocatore", team: "squadra", compare: "confronto", tcompare: "confronto-squadre" }[tpl] || "calendario");
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

// Selettori solo a tendina (regola del sito): grafica e formato.
document.getElementById("fmt-select").addEventListener("change", (e) => {
  if (e.target.value === fmt) return;
  fmt = e.target.value;
  applyVisibility();
  syncUrl();
});

const tplToggle = document.getElementById("tpl-select");
tplToggle.addEventListener("change", () => {
  if (tplToggle.value === "lowerthird") { tplToggle.value = tpl; location.href = "lower-third.html"; return; } // pagina a parte
  if (tplToggle.value === tpl) return;
  tpl = tplToggle.value;
  weeks = tpl === "player" && plWeeks ? plWeeks : curWeeks; // Giocatore: settimane della stagione scelta
  selectedKey = defaultKey();
  renderSelect();
  syncUrl();
  loadWeek();
});

// ---- Giocatore: stagione storica (settimane e partite dell'anno scelto, dati ESPN)
let curWeeks = [];
let plSeason = 0; // 0 = stagione corrente
let plWeeks = null;
const plSeasonSel = document.getElementById("pl-season");
plSeasonSel.addEventListener("change", async () => {
  const y = Number(plSeasonSel.value);
  plSeason = y === curSeason() ? 0 : y;
  status.textContent = `Carico le settimane della stagione ${y}…`;
  try {
    if (!plSeason) plWeeks = null;
    else {
      const res = await getScoreboard({ year: y, seasonType: 2, week: 1 }, { ttl: 30 * 24 * 3600e3 });
      plWeeks = (res.data.calendar || []).filter((e) => e.seasonType === 2 || e.seasonType === 3);
    }
    weeks = plWeeks || curWeeks;
    // stagione passata: si propone l'ultima settimana di regular season
    const reg = weeks.filter((e) => e.seasonType === 2);
    selectedKey = plSeason ? keyOf(reg[reg.length - 1] || weeks[0]) : gameKey;
    selectedGame = "";
    playerSel = null;
    renderSelect();
    syncUrl();
    loadWeek();
  } catch (err) {
    console.error(err);
    status.textContent = "Non riesco a caricare quella stagione: riprova.";
  }
});

async function loadWeek() {
  if (tpl === "team") return loadTeamSchedule();
  if (tpl === "compare") return loadCompare();
  if (tpl === "tcompare") return loadTCompare();
  const entry = weeks.find((e) => keyOf(e) === selectedKey);
  if (!entry) return;
  status.textContent = "Carico le partite…";
  if (isGameLike()) {
    try {
      const res = await getWeek(entry, tpl === "player" ? plSeason || sb.season.year : sb.season.year);
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
    const [scoreboard] = await Promise.all([getScoreboard(), ...fontsToLoad, prepareOutlinedLogos()]);
    sb = scoreboard.data;
    setCurrentSeason(sb.season.year);
  } catch (err) {
    console.error(err);
    status.textContent = "Errore nel caricamento iniziale: ricarica la pagina.";
    return;
  }
  await document.fonts.ready;
  calibrate();
  initFontControls();
  STYLES.tcRank.ls = Math.max(STYLES.tcRank.ls, 1.5); // il "°" non deve toccare le cifre (es. 11°)
  // Anno e settimane dalle API ESPN.
  weeks = sb.calendar.filter((e) => e.seasonType === 2 || e.seasonType === 3);
  curWeeks = weeks;
  plSeasonSel.innerHTML = seasonOptions();
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
