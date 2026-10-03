import { renderChrome, loading, showError, staleNotice, teamLogo, teamHref, gameHref, espnImg, fmtShort, esc } from "../ui.js?v=202610030341";
import { getAthlete, getAthleteStats, getGamelog, getTeams } from "../api.js?v=202610030341";

renderChrome("squadre");

const root = document.getElementById("player");
const id = new URLSearchParams(location.search).get("id");
const SEASONS_SHOWN = 6;

// ----------------------------------------------------------------- conversioni
function cm(display) {
  const m = /(\d+)'\s*(\d+)?/.exec(display || "");
  return m ? `${Math.round((Number(m[1]) * 12 + Number(m[2] || 0)) * 2.54)} cm` : "—";
}
function kg(display) {
  const m = /(\d+)/.exec(display || "");
  return m ? `${Math.round(Number(m[1]) * 0.4536)} kg` : "—";
}
const expIt = (s) => {
  const m = /(\d+)\w*\s+Season/i.exec(s || "");
  if (/rookie/i.test(s || "")) return "Rookie";
  return m ? `${m[1]}ª stagione NFL` : s || "—";
};
const draftIt = (s) => {
  const m = /(\d{4}):\s*Rd\s*(\d+),\s*Pk\s*(\d+)\s*\((\w+)\)/.exec(s || "");
  return m ? `${m[1]} · ${m[2]}° giro, scelta ${m[3]} (${m[4]})` : s || "Undrafted";
};
const isLight = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
/** ESPN fornisce la data di nascita come G/M/AAAA (es. "27/1/2002"). */
const dobIt = (s) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s || "");
  return m ? `${Number(m[1])} ${MESI[Number(m[2]) - 1]} ${m[3]}` : s;
};
const rankIt = (r) => (r || "").replace(/^Tied-/, "").replace(/(\d+)(st|nd|rd|th)/, "$1°") + (/^Tied-/.test(r || "") ? " a pari merito" : "");

const SUMMARY_IT = {
  "Pass Yards": "Yard su passaggio", "Passing Yards": "Yard su passaggio", Touchdowns: "Touchdown", "Passing Touchdowns": "TD su passaggio",
  INT: "Intercetti", Interceptions: "Intercetti", QBR: "QBR", "Passer Rating": "Passer rating",
  Receptions: "Ricezioni", "Rec. Yards": "Yard su ricezione", "Receiving Yards": "Yard su ricezione", "Receiving Touchdowns": "TD su ricezione",
  "YDS/R": "Yard per ricezione", "Yards Per Reception": "Yard per ricezione",
  "Rush Yards": "Yard su corsa", "Rushing Yards": "Yard su corsa", "Rushing Touchdowns": "TD su corsa", "YDS/CAR": "Yard per corsa", "Yards Per Rush Attempt": "Yard per corsa",
  "Total Tackles": "Placcaggi totali", SOLO: "Placcaggi solitari", "Solo Tackles": "Placcaggi solitari", Tackles: "Placcaggi", Sacks: "Sack", "Forced Fumbles": "Fumble forzati", "Passes Defended": "Passaggi deviati",
  "Field Goals Made": "Field goal", "FG Made": "Field goal", "Field Goal %": "% field goal", "FG%": "% field goal", "Long Field Goal Made": "FG più lungo",
  "Punts": "Punt", "Punt Yards": "Yard di punt", "Gross Avg": "Media lorda", "Gross Average Punt Yards": "Media lorda",
};

// Categorie di statistiche mostrate per ruolo (le altre restano nascoste).
const ROLE_CATS = {
  QB: ["passing", "rushing"],
  RB: ["rushing", "receiving"], FB: ["rushing", "receiving"],
  WR: ["receiving", "rushing", "returning", "kickReturns", "puntReturns"], TE: ["receiving", "rushing"],
  K: ["kicking", "scoring"], PK: ["kicking", "scoring"], P: ["punting"], LS: ["defensive"],
  OL: [], OT: [], G: [], C: [], OG: [],
};
const DEF_CATS = ["defensive", "defensiveInterceptions", "fumbles"];
const catsForRole = (pos) => ROLE_CATS[pos] ?? DEF_CATS;

const CAT_IT = {
  passing: "Passaggi",
  rushing: "Corse",
  receiving: "Ricezioni",
  defensive: "Difesa",
  defensiveInterceptions: "Intercetti",
  scoring: "Punti",
  kicking: "Calci",
  punting: "Punt",
  returning: "Ritorni",
  kickReturns: "Ritorni di kickoff",
  puntReturns: "Ritorni di punt",
  fumbles: "Fumble",
};

// ----------------------------------------------------------------- sezioni
function hero(a) {
  const t = a.team;
  const style = t ? `--team:${t.color || "#162c55"};--team-alt:${t.alt || "#f7b263"};--team-ink:${isLight(t.color) ? "#0a1730" : "#ffffff"}` : "";
  return `<section class="team-hero player-hero" style="${style}">
      ${a.headshot ? `<img class="player-photo" src="${espnImg(a.headshot, 520, 380)}" alt="${esc(a.name)}" width="260" height="190">` : ""}
      <div>
        <span class="eyebrow">${t ? `<a href="${teamHref(t)}" class="ph-team">${teamLogo(t, 22, "logo", true)} ${esc(t.name)}</a>` : "Free agent"}</span>
        <h1>${esc(a.name)}</h1>
        <div class="meta">
          ${a.jersey ? `<span>#${esc(a.jersey)}</span>` : ""}
          ${a.pos ? `<span>${esc(a.pos)}</span>` : ""}
          ${a.posName ? `<span>${esc(a.posName)}</span>` : ""}
          ${a.status && a.status !== "Active" ? `<span>${esc(a.status)}</span>` : ""}
        </div>
      </div>
    </section>`;
}

function infoGrid(a) {
  const cell = (k, v, sub = "") => `<div class="info"><div class="k">${k}</div><div class="v">${esc(v)}${sub ? `<small>${esc(sub)}</small>` : ""}</div></div>`;
  return `<div class="info-grid">
      ${cell("Età", a.age ?? "—", a.dob ? `Nato il ${dobIt(a.dob)}` : "")}
      ${cell("Altezza", cm(a.height), a.height)}
      ${cell("Peso", kg(a.weight), a.weight)}
      ${cell("College", a.college || "—", a.birthPlace ? `Nato a ${a.birthPlace}` : "")}
      ${cell("Esperienza", expIt(a.experience))}
      ${cell("Draft", draftIt(a.draft))}
    </div>`;
}

function summaryTiles(a) {
  // Nessuna presenza in stagione (es. practice squad): ESPN restituisce solo "--".
  if (!a.summary.stats.length || a.summary.stats.every((x) => /^-*$/.test(String(x.value).trim()))) return "";
  return `<section class="section">
      <div class="section-head"><h2>Stagione in corso</h2><span class="count">${esc(a.summary.label.replace("regular season stats", "· regular season"))}</span></div>
      <div class="stats-grid stats-4">${a.summary.stats
        .map((s) => `<div class="stat"><div class="n">${esc(s.value)}</div><div class="l">${esc(SUMMARY_IT[s.label] || s.label)}${s.rank ? ` · ${esc(rankIt(s.rank))} in NFL` : ""}</div></div>`)
        .join("")}</div>
    </section>`;
}

function relevant(cat) {
  // Mostra solo le categorie in cui il giocatore ha numeri reali (GP escluso).
  const gp = cat.labels.indexOf("GP");
  return cat.rows.some((r) => r.stats.some((v, i) => i !== gp && parseFloat(String(v).replace(",", "")) > 0));
}

function seasonStats(cats, teamsById, pos) {
  const wanted = catsForRole(pos);
  let list = cats.filter((c) => wanted.includes(c.name) && relevant(c)).sort((x, y) => wanted.indexOf(x.name) - wanted.indexOf(y.name));
  if (!list.length) list = cats.filter(relevant); // ruoli atipici: mostriamo ciò che c'è
  if (!list.length) return `<div class="placeholder">Nessuna statistica NFL registrata.</div>`;
  return list
    .map((c) => {
      const rows = [...c.rows].sort((x, y) => y.year - x.year).slice(0, SEASONS_SHOWN);
      return `<div class="table-card stat-table">
          <h3>${esc(CAT_IT[c.name] || c.title)}</h3>
          <div class="table-scroll"><table class="standings">
            <thead><tr><th>Stagione</th><th>Squadra</th>${c.labels.map((l, i) => `<th title="${esc(c.names[i] || "")}">${esc(l)}</th>`).join("")}</tr></thead>
            <tbody>
              ${rows
                .map((r) => {
                  const t = teamsById[r.teamId];
                  return `<tr><td><b>${esc(r.year)}</b></td><td>${t ? `<a href="${teamHref(t)}" class="cell-team">${teamLogo(t, 18)} ${esc(t.abbr)}</a>` : "—"}</td>${r.stats.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`;
                })
                .join("")}
              ${c.totals.length ? `<tr class="total-row"><td><b>Carriera</b></td><td></td>${c.totals.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>` : ""}
            </tbody>
          </table></div>
        </div>`;
    })
    .join("");
}

function gamelog(gl) {
  const blocks = gl.blocks.filter((b) => b.rows.length && !/preseason/i.test(b.title));
  if (!blocks.length) return `<div class="placeholder">Nessuna partita giocata in questa stagione.</div>`;
  const groupRow = gl.groups.length
    ? `<tr class="group-row"><th colspan="4"></th>${gl.groups.map((g) => `<th colspan="${g.count}">${esc(CAT_IT[g.title.toLowerCase()] || g.title)}</th>`).join("")}</tr>`
    : "";
  return blocks
    .map(
      (b) => `<div class="table-card stat-table">
        <h3>${esc(b.title.replace("Regular Season", "Regular season").replace("Postseason", "Playoff"))}${b.team ? ` · ${esc(b.team)}` : ""}</h3>
        <div class="table-scroll"><table class="standings gamelog">
          <thead>${groupRow}<tr><th>Week</th><th>Data</th><th>Avv.</th><th>Risultato</th>${gl.labels.map((l, i) => `<th title="${esc(gl.names[i] || "")}">${esc(l)}</th>`).join("")}</tr></thead>
          <tbody>
            ${b.rows
              .map((r) => {
                const e = gl.events[r.eventId] || {};
                const res = (e.result || "").toUpperCase();
                return `<tr class="row-link" data-href="${gameHref(r.eventId)}">
                    <td>${esc(e.week ?? "")}</td>
                    <td>${e.date ? esc(fmtShort(e.date)) : ""}</td>
                    <td>${e.opp ? `<span class="cell-team">${esc(e.atVs === "@" ? "@" : "vs")} ${teamLogo(e.opp, 18)} ${esc(e.opp.abbr)}</span>` : ""}</td>
                    <td><a href="${gameHref(r.eventId)}" class="res res-${res.toLowerCase()}">${esc(res)} ${esc(e.score || "")}</a></td>
                    ${r.stats.map((v) => `<td>${esc(v)}</td>`).join("")}
                  </tr>`;
              })
              .join("")}
            ${b.totals.length ? `<tr class="total-row"><td colspan="4"><b>Totale</b></td>${b.totals.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>` : ""}
          </tbody>
        </table></div>
      </div>`
    )
    .join("");
}

// Righe del game log cliccabili per intero
root.addEventListener("click", (e) => {
  const tr = e.target.closest("tr[data-href]");
  if (tr && !e.target.closest("a")) location.href = tr.dataset.href;
});

// ----------------------------------------------------------------- avvio
async function init() {
  loading(root, "Carichiamo il giocatore…");
  let res;
  try {
    res = await getAthlete(id);
  } catch (err) {
    console.error(err);
    return showError(root, init, "Non riusciamo a caricare questo giocatore.");
  }
  const a = res.data;
  document.title = `${a.name} · 5DWN`;
  root.innerHTML = `${staleNotice(res)}${hero(a)}${infoGrid(a)}${summaryTiles(a)}
    <section class="section">
      <div class="section-head"><h2>Statistiche stagionali</h2><span class="count">Ultime ${SEASONS_SHOWN} stagioni e carriera</span></div>
      <div id="season-stats" class="stack"></div>
    </section>
    <section class="section">
      <div class="section-head"><h2>Game log</h2><span class="count">Partita per partita · tocca una riga per il profilo partita</span></div>
      <div id="gamelog" class="stack"></div>
    </section>`;

  const statsBox = document.getElementById("season-stats");
  const logBox = document.getElementById("gamelog");
  loading(statsBox);
  loading(logBox);

  const [stats, gl, teams] = await Promise.allSettled([getAthleteStats(id), getGamelog(id), getTeams()]);
  const teamsById = teams.status === "fulfilled" ? Object.fromEntries(teams.value.data.map((t) => [t.id, t])) : {};
  if (stats.status === "fulfilled") statsBox.innerHTML = seasonStats(stats.value.data, teamsById, a.pos);
  else showError(statsBox, init);
  if (gl.status === "fulfilled") logBox.innerHTML = gamelog(gl.value.data);
  else showError(logBox, init);
}

if (!id) location.replace("squadre.html");
else init();
