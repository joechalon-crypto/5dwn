import { renderChrome, loading, showError, staleNotice, updatedLine, teamLogo, teamHref, playerHref, espnImg, every, esc } from "../ui.js";
import { getLeaders } from "../api.js";

renderChrome("statistiche");

const box = document.getElementById("leaders");
const jump = document.getElementById("stat-jump");

// Statistiche mostrate, nell'ordine della pagina (chiavi = categorie ESPN).
const STATS = [
  { key: "passingYards", title: "Yard su passaggio", unit: "yd", abbr: "PASS YDS" },
  { key: "passingTouchdowns", title: "Touchdown su passaggio", unit: "TD", abbr: "PASS TD" },
  { key: "rushingYards", title: "Yard su corsa", unit: "yd", abbr: "RUSH YDS" },
  { key: "receptions", title: "Ricezioni", unit: "rec", abbr: "REC" },
  { key: "receivingYards", title: "Yard su ricezione", unit: "yd", abbr: "REC YDS" },
  { key: "sacks", title: "Sack", unit: "sack", abbr: "SACK" },
  { key: "interceptions", title: "Intercetti", unit: "int", abbr: "INT" },
];

const NO_PHOTO = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

function row(p, rank, tied, featured) {
  const t = p.team;
  return `<li class="ld-row${featured ? " first" : ""}">
      <span class="ld-rank">${tied ? `<small>T</small>` : ""}${rank}</span>
      <a class="ld-player" href="${playerHref(p.id)}">
        <img class="ld-photo" src="${p.headshot ? espnImg(p.headshot, featured ? 160 : 96, featured ? 116 : 70) : NO_PHOTO}" alt="" loading="lazy" width="${featured ? 64 : 40}" height="${featured ? 64 : 40}">
        <span class="ld-who">
          <span class="ld-name">${esc(p.name)}</span>
          <span class="ld-meta">${esc(p.pos)}${p.jersey ? ` · #${esc(p.jersey)}` : ""}</span>
        </span>
      </a>
      ${t ? `<a class="ld-team" href="${teamHref(t)}" title="${esc(t.name)}">${teamLogo(t, 22)}<span>${esc(t.abbr)}</span></a>` : "<span></span>"}
      <span class="ld-value">${esc(p.display)}</span>
    </li>`;
}

function card(stat, list) {
  let prevValue = null, prevRank = 0;
  const ranks = list.map((p, i) => {
    const rank = p.value != null && p.value === prevValue ? prevRank : i + 1;
    prevValue = p.value;
    prevRank = rank;
    return rank;
  });
  const tied = (i) => ranks.filter((r) => r === ranks[i]).length > 1;
  return `<section class="leader-card" id="stat-${stat.key}">
      <header class="lc-head">
        <h2>${esc(stat.title)}</h2>
        <span class="tag">${esc(stat.abbr)}</span>
      </header>
      ${list.length
        ? `<ol class="ld-list">${list.slice(0, 10).map((p, i) => row(p, ranks[i], tied(i), i === 0)).join("")}</ol>`
        : `<div class="placeholder">Dati non ancora disponibili.</div>`}
    </section>`;
}

async function load({ quiet = false } = {}) {
  if (!quiet) loading(box, "Carichiamo i leader della stagione…");
  try {
    const res = await getLeaders();
    const d = res.data;
    document.getElementById("season-label").textContent =
      `Stagione ${d.year || ""}${d.seasonType ? ` · ${d.seasonType === "Regular Season" ? "Regular season" : d.seasonType === "Postseason" ? "Playoff" : d.seasonType}` : ""}${d.week ? ` · aggiornata alla ${d.week}` : ""}`;
    jump.innerHTML = STATS.map((s) => `<a href="#stat-${s.key}">${esc(s.title)}</a>`).join("");
    box.innerHTML = `${staleNotice(res)}<div class="leaders-cards">${STATS.map((s) => card(s, d.cats[s.key] || [])).join("")}</div>${updatedLine(res)}`;
  } catch (err) {
    console.error(err);
    if (!quiet) showError(box, () => load());
  }
}

load();
every(10 * 60 * 1000, () => load({ quiet: true }));
