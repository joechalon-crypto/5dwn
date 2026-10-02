// ============================================================================
// 5DWN Studio — pagina nascosta (studio.html) per generare grafiche PNG.
// Template 1: calendario settimanale "NFL Calendar", 16:9 (1920×1080) e 9:16 (1080×1920).
// Geometrie, colori e corpi dei testi sono misurati sul file di riferimento
// "NFL Calendar-selection (1).png" (riportato a 1920×1080).
// ============================================================================

import { renderChrome, loading, showError, esc, espnImg, weekLabel, weekRange, tvItalia, dayKey } from "../ui.js?v=202610021751";
import { getScoreboard, getWeek, currentWeekIndex } from "../api.js?v=202610021751";

renderChrome("");

const weekSelect = document.getElementById("week-select");
const status = document.getElementById("studio-status");
const stages = {
  wide: { root: document.getElementById("gfx-wide"), wrap: document.getElementById("preview-wide"), W: 1920, H: 1080 },
  tall: { root: document.getElementById("gfx-tall"), wrap: document.getElementById("preview-tall"), W: 1080, H: 1920 },
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
  brand: { cls: "gt-brand", family: "Archivo", weight: 900, stretch: "expanded", ref: ["5DWN", 26.3, 128.1] },
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
  gp: { cls: "gt-gp", family: "Barlow Condensed", weight: 700, stretch: "normal", ref: ["GAME", 15.1, 41.0] },
};

const ctx = document.createElement("canvas").getContext("2d");
const fontStr = (st, size) => `${st.stretch === "expanded" ? "expanded " : ""}${st.weight} ${size}px "${st.family}"`;

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
  headerToRow: 32.4, rowToSep: 19.3, sepToHeader: 24.7,
  bodyCapTop: 389.4, bodyLeft: 48.3, maxBottom: 1690,
  titleDy: 130, sideDy: 117.6, footDy: 712,
};

let G = G_WIDE; // geometria attiva (impostata da renderStage)

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
    <div class="g-cell g-white" style="left:${x + tX}px;top:${y}px;width:${tW}px;height:${G.rowH}px"></div>
    ${T("time", fItTime.format(new Date(g.date)), x + tX + tW / 2, y + G.timeCap, "center", { scale: G.ts })}
    ${tvCell(g, x, y)}`;
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

function background(W, H, wide) {
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
        <pattern id="st-${W}" patternUnits="userSpaceOnUse" width="192.8" height="${H}" patternTransform="skewX(-29.12)">
          <rect x="25.5" y="0" width="79.4" height="${H}" fill="#f4f5f7"/>
        </pattern>
        <radialGradient id="glow-${W}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="#e7e9ed"/>
      <rect width="${W * 2}" height="${H}" x="${-W / 2}" fill="url(#st-${W})"/>
      ${deco}
      <ellipse cx="${glowCx}" cy="${112 + (wide ? 0 : 130)}" rx="470" ry="140" fill="url(#glow-${W})"/>
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
    ${T("brand", "5DWN", cx, 24.6 + t, "center")}
    ${T("week", title, cx, 66.4 + t, "center", { maxW: W - 2 * 200 })}
    ${T("sub", "ORARI ITALIA", cx, 182.4 + t, "center")}
    <div class="g-bar" style="left:44px;top:${1025.1 + f}px;width:25.4px;height:2.2px"></div>
    ${T("foot", `TUTTI GLI ORARI IN ORA ITALIANA (${tz})`, 78.5, 1041.5 + f)}
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
  if (!weekData) return;
  renderStage(stages.wide, true);
  renderStage(stages.tall, false);
}

window.addEventListener("resize", () => Object.values(stages).forEach((s) => s.root.innerHTML && fitPreview(s)));

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
  const els = root.querySelectorAll(".g-cell, .g-band, .g-bar, .g-sep, img, .gt");
  for (const el of els) {
    const b = box(el);
    const cs = getComputedStyle(el);
    if (el.tagName === "IMG") {
      if (!el.naturalWidth) continue;
      const k = Math.min(b.w / el.naturalWidth, b.h / el.naturalHeight); // object-fit: contain
      const w = el.naturalWidth * k, h = el.naturalHeight * k;
      c.drawImage(el, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h);
    } else if (el.classList.contains("gt")) {
      const eff = b.h / el.offsetHeight; // scala effettiva (es. corpo partite ridotto)
      const size = parseFloat(cs.fontSize) * eff;
      const ls = (parseFloat(cs.letterSpacing) || 0) * eff;
      const stretch = parseFloat(cs.fontStretch) >= 112 ? "expanded " : "";
      const family = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      c.font = `${stretch}${cs.fontWeight} ${size}px "${family}"`;
      c.fillStyle = cs.color;
      c.textBaseline = "alphabetic";
      const m = c.measureText("H");
      const A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent;
      const baseline = b.y + (size - (A + D)) / 2 + A;
      const text = el.textContent;
      if ("letterSpacing" in c) {
        c.letterSpacing = `${ls}px`;
        c.fillText(text, b.x, baseline);
        c.letterSpacing = "0px";
      } else {
        let x = b.x;
        for (const ch of text) { c.fillText(ch, x, baseline); x += c.measureText(ch).width + ls; }
      }
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

const fileBase = () => `5dwn-${titleFor(weekData.entry).toLowerCase().replace(/\s+/g, "-")}-${weekData.year}`;
document.getElementById("dl-wide").addEventListener("click", () => exportPng(stages.wide, `${fileBase()}-16x9.png`));
document.getElementById("dl-tall").addEventListener("click", () => exportPng(stages.tall, `${fileBase()}-9x16.png`));

// ---------------------------------------------------------------------------- tendina e caricamento
function renderSelect() {
  const group = (type, label) => {
    const list = weeks.filter((e) => e.seasonType === type);
    return list.length
      ? `<optgroup label="${label}">${list.map((e) => {
          const k = keyOf(e);
          return `<option value="${k}"${k === selectedKey ? " selected" : ""}>${esc(weekLabel(e))} · ${esc(weekRange(e))}${k === currentKey ? " — in corso" : ""}</option>`;
        }).join("")}</optgroup>`
      : "";
  };
  weekSelect.innerHTML = group(2, "Regular season") + group(3, "Playoff");
  weekSelect.classList.toggle("is-current", selectedKey === currentKey);
}

weekSelect.addEventListener("change", () => {
  selectedKey = weekSelect.value;
  const url = new URL(location.href);
  url.searchParams.set("w", selectedKey);
  history.replaceState(null, "", url);
  renderSelect();
  loadWeek();
});

async function loadWeek() {
  const entry = weeks.find((e) => keyOf(e) === selectedKey);
  if (!entry) return;
  status.textContent = "Carico le partite…";
  try {
    // Titolo e contenuto seguono sempre la settimana scelta nella tendina (dati ESPN).
    const res = await getWeek(entry, sb.season.year);
    const games = res.data.games;
    weekData = { entry, year: sb.season.year, games, days: buildDays(games) };
    renderAll();
    status.textContent = `${games.length} partite · ${weekLabel(entry)} ${sb.season.year} · clic su una cella TV per alternare DAZN / Game Pass`;
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
  const cur = sb.calendar[currentWeekIndex(sb)];
  currentKey = cur && (cur.seasonType === 2 || cur.seasonType === 3) ? keyOf(cur) : cur?.seasonType === 1 ? keyOf(weeks[0]) : keyOf(weeks[weeks.length - 1] || {});
  const fromUrl = new URLSearchParams(location.search).get("w");
  selectedKey = weeks.some((e) => keyOf(e) === fromUrl) ? fromUrl : currentKey;
  renderSelect();
  loadWeek();
}

init();
