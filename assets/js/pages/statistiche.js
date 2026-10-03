import { renderChrome, loading, showError, staleNotice, updatedLine, teamLogo, teamHref, playerHref, espnImg, every, esc } from "../ui.js?v=202610031604";
import { getAthleteRanking, getTeamStats, getRedZone } from "../api.js?v=202610031604";

window.__5dwnStatsStarted = true;
renderChrome("statistiche");

const box = document.getElementById("ranking");
const select = document.getElementById("stat-select");
const toggle = document.getElementById("mode-toggle");
const titleEl = document.getElementById("rank-title");
const eyebrowEl = document.getElementById("rank-eyebrow");
const countEl = document.getElementById("rank-count");
const seasonEl = document.getElementById("season-label");

const PAGE = 50; // righe mostrate prima di "Mostra tutti"

// ============================================================================ definizioni
// Soglie minime (anti-outlier), ispirate ai criteri NFL e rapportate alle partite di
// squadra giocate finora (T = massimo di partite giocate nella lista):
//   passaggi: 5 tentativi a partita per i totali, 14 per rating e medie a partita
//   corse: 1 a partita per i totali, 6,25 per le medie a partita
//   ricezioni: 1,875 a partita per le medie a partita
//   field goal: 0,75 tentativi a partita per la percentuale
//   medie a partita: almeno metà delle partite di squadra giocate
const P = (group, field) => ({ group, field });
const QUAL = {
  passing: { ...P("passing", "passingAttempts"), noun: "tentativi di passaggio", total: 5, rate: 14 },
  rushing: { ...P("rushing", "rushingAttempts"), noun: "corse", total: 1, rate: 6.25 },
  receiving: { ...P("receiving", "receptions"), noun: "ricezioni", total: 0, rate: 1.875 },
  kicking: { ...P("kicking", "fieldGoalAttempts"), noun: "tentativi di field goal", total: 0, rate: 0.75 },
};

// Ogni statistica a conteggio ha anche la versione "a partita" (pg: true).
const BASE_PLAYER = [
  { group: "Quarterback", items: [
    { key: "passYds", title: "Yard su passaggio", category: "offense:passing", ...P("passing", "passingYards"), q: QUAL.passing, pg: true, extra: [P("passing", "passingAttempts")], extraLabel: (x) => `${x[0] ?? 0} tentativi` },
    { key: "passTd", title: "Touchdown su passaggio", category: "offense:passing", ...P("passing", "passingTouchdowns"), q: QUAL.passing, pg: true, nonzero: true, extra: [P("passing", "interceptions")], extraLabel: (x) => `${x[0] ?? 0} INT` },
    { key: "passInt", title: "Intercetti lanciati", asc: true, category: "offense:passing", ...P("passing", "interceptions"), q: QUAL.passing, rateQual: true, pg: true, extra: [P("passing", "passingAttempts")], extraLabel: (x) => `${x[0] ?? 0} tentativi` },
    { key: "rating", title: "Passer rating", decimals: 1, category: "offense:passing", ...P("passing", "QBRating"), q: QUAL.passing, rateQual: true, extra: [P("passing", "passingAttempts")], extraLabel: (x) => `${x[0] ?? 0} tentativi` },
  ]},
  { group: "Running back", items: [
    { key: "rushYds", title: "Yard su corsa", category: "offense:rushing", ...P("rushing", "rushingYards"), q: QUAL.rushing, pg: true, extra: [P("rushing", "rushingAttempts")], extraLabel: (x) => `${x[0] ?? 0} corse` },
    { key: "rushTd", title: "Touchdown su corsa", category: "offense:rushing", ...P("rushing", "rushingTouchdowns"), q: QUAL.rushing, pg: true, nonzero: true, extra: [P("rushing", "rushingAttempts")], extraLabel: (x) => `${x[0] ?? 0} corse` },
    { key: "rushAvg", title: "Yard per corsa", decimals: 1, category: "offense:rushing", ...P("rushing", "yardsPerRushAttempt"), q: QUAL.rushing, rateQual: true, extra: [P("rushing", "rushingAttempts")], extraLabel: (x) => `${x[0] ?? 0} corse` },
  ]},
  { group: "Wide receiver / Tight end", items: [
    { key: "rec", title: "Ricezioni", category: "offense:receiving", ...P("receiving", "receptions"), q: QUAL.receiving, pg: true, nonzero: true, extra: [P("receiving", "receivingTargets")], extraLabel: (x) => `${x[0] ?? 0} target` },
    { key: "recYds", title: "Yard su ricezione", category: "offense:receiving", ...P("receiving", "receivingYards"), q: QUAL.receiving, pg: true, extra: [P("receiving", "receptions")], extraLabel: (x) => `${x[0] ?? 0} ricezioni` },
    { key: "recTd", title: "Touchdown su ricezione", category: "offense:receiving", ...P("receiving", "receivingTouchdowns"), q: QUAL.receiving, pg: true, nonzero: true, extra: [P("receiving", "receptions")], extraLabel: (x) => `${x[0] ?? 0} ricezioni` },
  ]},
  { group: "Difesa", items: [
    { key: "sacks", title: "Sack", decimals: 1, trimInt: true, category: "defense:defensive", ...P("defensive", "sacks"), pg: true, nonzero: true, extra: [P("defensive", "tacklesForLoss")], extraLabel: (x) => `${x[0] ?? 0} TFL` },
    { key: "int", title: "Intercetti", category: "defense:defensiveInterceptions", ...P("defensiveInterceptions", "interceptions"), pg: true, nonzero: true, extra: [P("defensiveInterceptions", "interceptionYards")], extraLabel: (x) => `${x[0] ?? 0} yd di ritorno` },
    { key: "tackles", title: "Placcaggi (tackle)", category: "defense:defensive", ...P("defensive", "totalTackles"), pg: true, nonzero: true, extra: [P("defensive", "soloTackles")], extraLabel: (x) => `${x[0] ?? 0} solitari` },
  ]},
  { group: "Kicker", items: [
    { key: "fgPct", title: "Field goal %", unit: "%", decimals: 1, category: "specialTeams:kicking", ...P("kicking", "fieldGoalPct"), q: QUAL.kicking, rateQual: true, extra: [P("kicking", "fieldGoalsMade"), P("kicking", "fieldGoalAttempts")], extraLabel: (x) => `${x[0] ?? 0}/${x[1] ?? 0} FG` },
  ]},
];

const PLAYER_STATS = BASE_PLAYER.map((g) => ({
  group: g.group,
  items: g.items.flatMap((s) =>
    s.pg ? [s, { ...s, key: `${s.key}Pg`, title: `${s.title} a partita`, perGame: true, decimals: 1, trimInt: false }] : [s]
  ),
}));

// Squadra: dove leggere il valore (proprie = own, concesse agli avversari = opp) e se "meno è meglio".
const TEAM_STATS = [
  { group: "Punti", items: [
    { key: "pts", title: "Punti fatti", get: (t) => t.own.passing?.totalPoints },
    { key: "ppg", title: "Punti fatti a partita", decimals: 1, get: (t) => t.own.passing?.totalPointsPerGame },
    { key: "ptsAg", title: "Punti concessi", asc: true, get: (t) => t.opp.passing?.totalPoints },
    { key: "papg", title: "Punti concessi a partita", decimals: 1, asc: true, get: (t) => t.opp.passing?.totalPointsPerGame },
  ]},
  { group: "Attacco · yard guadagnate", items: [
    { key: "yds", title: "Yard totali", get: (t) => t.own.passing?.totalYards },
    { key: "ydsPg", title: "Yard totali a partita", decimals: 1, get: (t) => t.own.passing?.yardsPerGame },
    { key: "pass", title: "Yard su passaggio", get: (t) => t.own.passing?.netPassingYards },
    { key: "passPg", title: "Yard su passaggio a partita", decimals: 1, get: (t) => t.own.passing?.netPassingYardsPerGame },
    { key: "rush", title: "Yard su corsa", get: (t) => t.own.rushing?.rushingYards },
    { key: "rushPg", title: "Yard su corsa a partita", decimals: 1, get: (t) => t.own.rushing?.rushingYardsPerGame },
  ]},
  { group: "Difesa · yard concesse", items: [
    { key: "ydsAg", title: "Yard totali concesse", asc: true, get: (t) => t.opp.passing?.totalYards },
    { key: "ydsAgPg", title: "Yard totali concesse a partita", decimals: 1, asc: true, get: (t) => t.opp.passing?.yardsPerGame },
    { key: "passAg", title: "Yard su passaggio concesse", asc: true, get: (t) => t.opp.passing?.netPassingYards },
    { key: "passAgPg", title: "Yard su passaggio concesse a partita", decimals: 1, asc: true, get: (t) => t.opp.passing?.netPassingYardsPerGame },
    { key: "rushAg", title: "Yard su corsa concesse", asc: true, get: (t) => t.opp.rushing?.rushingYards },
    { key: "rushAgPg", title: "Yard su corsa concesse a partita", decimals: 1, asc: true, get: (t) => t.opp.rushing?.rushingYardsPerGame },
  ]},
  { group: "Efficienza", items: [
    { key: "third", title: "Conversioni sul terzo down %", unit: "%", decimals: 1, get: (t) => t.own.miscellaneous?.thirdDownConvPct },
    { key: "redzone", title: "Red zone % (touchdown)", unit: "%", decimals: 1, redzone: true },
    { key: "toDiff", title: "Turnover differential", signed: true, get: (t) => t.own.miscellaneous?.turnOverDifferential },
  ]},
  { group: "Sack", items: [
    { key: "sackFor", title: "Sack fatti", decimals: 1, trimInt: true, get: (t) => t.opp.passing?.sacks },
    { key: "sackForPg", title: "Sack fatti a partita", decimals: 1, get: (t) => perGame(t.opp.passing?.sacks, t.own.general?.gamesPlayed) },
    { key: "sackAgainst", title: "Sack subiti", decimals: 1, trimInt: true, asc: true, get: (t) => t.own.passing?.sacks },
    { key: "sackAgainstPg", title: "Sack subiti a partita", decimals: 1, asc: true, get: (t) => perGame(t.own.passing?.sacks, t.own.general?.gamesPlayed) },
  ]},
];

function perGame(v, gp) {
  return v == null || !gp ? null : v / gp;
}

/** Applica soglia minima e calcola i valori a partita. Restituisce righe + testo della soglia. */
function qualify(rows, stat) {
  const T = Math.max(0, ...rows.map((r) => r.gp || 0)) || 1;
  const notes = [];
  let out = rows.map((r) => ({ ...r, value: stat.perGame ? perGame(r.value, r.gp) : r.value }));
  out = out.filter((r) => r.value != null && !Number.isNaN(r.value));
  if (stat.nonzero) out = out.filter((r) => r.value !== 0);
  if (stat.q) {
    const per = stat.perGame || stat.rateQual ? stat.q.rate : stat.q.total;
    const min = Math.ceil(per * T);
    if (min > 0) {
      out = out.filter((r) => (r.qual || 0) >= min);
      notes.push(`almeno ${min} ${stat.q.noun} (${String(per).replace(".", ",")} per partita di squadra)`);
    }
  }
  if (stat.perGame) {
    const minGp = Math.ceil(T / 2);
    if (minGp > 1) {
      out = out.filter((r) => (r.gp || 0) >= minGp);
      notes.push(`almeno ${minGp} partite giocate`);
    }
  }
  return { rows: out, note: notes.length ? `Soglia minima: ${notes.join(" e ")}.` : "" };
}

const all = (groups) => groups.flatMap((g) => g.items);
const findStat = (mode, key) => all(mode === "teams" ? TEAM_STATS : PLAYER_STATS).find((s) => s.key === key);

// ============================================================================ stato (URL)
const params = new URLSearchParams(location.search);
let mode = params.get("tipo") === "squadra" ? "teams" : "players";
let key = params.get("stat");
if (!findStat(mode, key)) key = (mode === "teams" ? TEAM_STATS : PLAYER_STATS)[0].items[0].key;

function syncUrl() {
  const url = new URL(location.href);
  url.searchParams.set("tipo", mode === "teams" ? "squadra" : "individuali");
  url.searchParams.set("stat", key);
  history.replaceState(null, "", url);
}

function renderControls() {
  toggle.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  const groups = mode === "teams" ? TEAM_STATS : PLAYER_STATS;
  select.innerHTML = groups
    .map((g) => `<optgroup label="${esc(g.group)}">${g.items.map((s) => `<option value="${s.key}"${s.key === key ? " selected" : ""}>${esc(s.title)}</option>`).join("")}</optgroup>`)
    .join("");
}

toggle.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-mode]");
  if (!b || b.dataset.mode === mode) return;
  mode = b.dataset.mode;
  key = (mode === "teams" ? TEAM_STATS : PLAYER_STATS)[0].items[0].key;
  renderControls();
  syncUrl();
  load();
});

select.addEventListener("change", () => {
  key = select.value;
  syncUrl();
  load();
});

// ============================================================================ formattazione
const nf = (d) => new Intl.NumberFormat("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
function fmtValue(v, stat) {
  if (v == null || Number.isNaN(v)) return "–";
  const d = stat.decimals ?? 0;
  const n = d ? Math.round(v * 10 ** d) / 10 ** d : Math.round(v);
  // Solo i sack totali (es. 6 o 5,5) tolgono il decimale quando è intero; le medie lo tengono sempre.
  const txt = nf(stat.trimInt && Number.isInteger(n) ? 0 : d).format(n);
  return `${stat.signed && n > 0 ? "+" : ""}${txt}${stat.unit === "%" ? "%" : ""}`;
}

/** Posizioni con ex aequo ("T"). */
function ranks(rows) {
  const out = [];
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    out.push(prev && prev.value === r.value ? out[i - 1] : i + 1);
  });
  return out.map((rank) => ({ rank, tied: out.filter((x) => x === rank).length > 1 }));
}

const NO_PHOTO = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

function playerRow(r, pos, stat) {
  return `<li class="ld-row${pos.rank === 1 && !pos.tied ? " first" : ""}">
      <span class="ld-rank">${pos.tied ? "<small>T</small>" : ""}${pos.rank}</span>
      <a class="ld-player" href="${playerHref(r.id)}">
        <img class="ld-photo" src="${r.headshot ? espnImg(r.headshot, 96, 70) : NO_PHOTO}" alt="" loading="lazy" width="40" height="40">
        <span class="ld-who">
          <span class="ld-name">${esc(r.name)}</span>
          <span class="ld-meta">${esc(r.pos)}${stat.extraLabel ? ` · ${esc(stat.extraLabel(r.extra))}` : ""}${r.gp ? ` · ${r.gp} PG` : ""}</span>
        </span>
      </a>
      ${r.team ? `<a class="ld-team" href="${teamHref(r.team)}" title="${esc(r.team.name)}">${teamLogo(r.team, 22)}<span>${esc(r.team.abbr)}</span></a>` : "<span></span>"}
      <span class="ld-value">${fmtValue(r.value, stat)}</span>
    </li>`;
}

function teamRow(r, pos, stat) {
  return `<li class="ld-row${pos.rank === 1 && !pos.tied ? " first" : ""}">
      <span class="ld-rank">${pos.tied ? "<small>T</small>" : ""}${pos.rank}</span>
      <a class="ld-player" href="${teamHref(r.team)}">
        ${teamLogo(r.team, 40, "logo ld-teamlogo")}
        <span class="ld-who">
          <span class="ld-name">${esc(r.team.name)}</span>
          <span class="ld-meta">${esc(r.team.abbr)}${r.gp ? ` · ${r.gp} partite` : ""}</span>
        </span>
      </a>
      <span></span>
      <span class="ld-value">${fmtValue(r.value, stat)}</span>
    </li>`;
}

function renderList(rows, stat, rowFn, res, note = "") {
  const pos = ranks(rows);
  const shown = rows.length > PAGE + 10 ? PAGE : rows.length;
  box.innerHTML = `${staleNotice(res)}
    ${note ? `<p class="rank-note">${esc(note)}</p>` : ""}
    <div class="leader-card rank-card">
      ${rows.length ? `<ol class="ld-list">${rows.slice(0, shown).map((r, i) => rowFn(r, pos[i], stat)).join("")}</ol>` : `<div class="placeholder">Nessun dato disponibile per questa statistica.</div>`}
      ${shown < rows.length ? `<button type="button" class="btn show-all">Mostra tutti (${rows.length})</button>` : ""}
    </div>
    ${updatedLine(res)}`;
  const more = box.querySelector(".show-all");
  if (more) {
    more.addEventListener("click", () => {
      box.querySelector(".ld-list").insertAdjacentHTML("beforeend", rows.slice(shown).map((r, i) => rowFn(r, pos[shown + i], stat)).join(""));
      more.remove();
    });
  }
}

function seasonText(year, type) {
  const t = type === "Regular Season" ? "Regular season" : type === "Postseason" ? "Playoff" : type;
  return `Stagione ${year || ""}${t ? ` · ${t}` : ""}`;
}

// ============================================================================ caricamento
let reqId = 0;

async function load({ quiet = false } = {}) {
  const stat = findStat(mode, key);
  const my = ++reqId;
  titleEl.textContent = stat.title;
  eyebrowEl.textContent = `${mode === "teams" ? "Squadre · tutte le 32" : "Individuali · classifica completa"}${stat.asc ? " · meno è meglio" : ""}${stat.perGame ? " · media a partita" : ""}`;
  if (!quiet) {
    countEl.textContent = "";
    loading(box, mode === "teams" ? "Carichiamo le statistiche delle squadre…" : "Carichiamo la classifica…");
  }
  try {
    if (mode === "players") {
      const res = await getAthleteRanking({ category: stat.category, group: stat.group, field: stat.field, qual: stat.q ? P(stat.q.group, stat.q.field) : null, extra: stat.extra });
      if (my !== reqId) return;
      const { rows, note } = qualify(res.data.rows, stat);
      rows.sort((a, b) => (stat.asc ? a.value - b.value : b.value - a.value));
      seasonEl.textContent = seasonText(res.data.year, res.data.seasonType);
      countEl.textContent = `${rows.length} giocatori`;
      renderList(rows, stat, playerRow, res, note);
    } else {
      const res = await getTeamStats();
      if (my !== reqId) return;
      let rows;
      if (stat.redzone) {
        const vals = await Promise.all(res.data.teams.map((t) => getRedZone(t.team.id).then((r) => r.data).catch(() => null)));
        if (my !== reqId) return;
        rows = res.data.teams.map((t, i) => ({ team: t.team, gp: t.own.general?.gamesPlayed, value: vals[i] }));
      } else {
        rows = res.data.teams.map((t) => ({ team: t.team, gp: t.own.general?.gamesPlayed, value: stat.get(t) ?? null }));
      }
      rows = rows.filter((r) => r.value != null && !Number.isNaN(r.value));
      rows.sort((a, b) => (stat.asc ? a.value - b.value : b.value - a.value));
      seasonEl.textContent = seasonText(res.data.year, res.data.seasonType);
      countEl.textContent = `${rows.length} squadre`;
      renderList(rows, stat, teamRow, res);
    }
  } catch (err) {
    console.error(err);
    if (!quiet && my === reqId) showError(box, () => load());
  }
}

renderControls();
syncUrl();
load();
every(15 * 60 * 1000, () => load({ quiet: true }));
