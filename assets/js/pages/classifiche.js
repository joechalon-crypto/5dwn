import { renderChrome, loading, showError, staleNotice, updatedLine, teamLogo, teamHref, every, esc } from "../ui.js?v=202610031538";
import { getStandings } from "../api.js?v=202610031538";

renderChrome("classifiche");

const box = document.getElementById("standings");
const toggle = document.getElementById("view-toggle");
let view = location.hash === "#division" ? "division" : "conference";
let last = null;

const streakIt = (s) => (s || "").replace(/^W/, "V").replace(/^L/, "S").replace(/^T/, "P");
const diffCell = (d) => `<td class="${d > 0 ? "pos" : d < 0 ? "neg" : ""}">${d > 0 ? "+" : ""}${d}</td>`;
const clinch = (c) => (c && c !== "-" ? ` <sup class="clinch" title="${esc(CLINCH[c] || "")}">${esc(c)}</sup>` : "");
const CLINCH = {
  z: "Division vinta",
  y: "Wild card conquistata",
  x: "Qualificata ai playoff",
  "*": "Division vinta e bye al primo turno",
  e: "Eliminata dalla corsa playoff",
};

function teamCell(r) {
  return `<td class="team-cell"><a href="${teamHref(r.team)}">${teamLogo(r.team, 26)}
      <span class="full-name">${esc(r.team.name)}</span><span class="short-name">${esc(r.team.abbr)}</span>${clinch(r.clincher)}</a></td>`;
}

function conferenceTable(conf) {
  const rows = conf.teams
    .map((r, i) => {
      const badge = r.seed && r.seed <= 7 ? `<span class="seed-badge ${r.seed <= 4 ? "div" : "wc"}">${r.seed}</span>` : `<span class="seed-badge">${r.seed ?? i + 1}</span>`;
      return `<tr class="${r.seed === 7 ? "cutline" : ""}">
        <td class="rank">${badge}</td>${teamCell(r)}
        <td><b>${r.w}</b></td><td>${r.l}</td><td>${r.t}</td><td>${esc(r.pct)}</td>
        <td>${esc(r.div)}</td><td>${esc(r.conf)}</td><td>${r.pf}</td><td>${r.pa}</td>${diffCell(r.diff)}<td>${esc(streakIt(r.streak))}</td>
      </tr>`;
    })
    .join("");
  return `<section class="table-card">
      <h3><span class="tag">${esc(conf.abbr)}</span>${esc(conf.name)}</h3>
      <div class="table-scroll"><table class="standings">
        <thead><tr><th>Seed</th><th class="team-cell">Squadra</th><th>V</th><th>S</th><th>P</th><th>%</th><th>Div</th><th>Conf</th><th>PF</th><th>PS</th><th>Diff</th><th>Serie</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </section>`;
}

function divisionTable(div) {
  const rows = div.teams
    .map(
      (r, i) => `<tr>
        <td class="rank">${i + 1}</td>${teamCell(r)}
        <td><b>${r.w}</b></td><td>${r.l}</td><td>${r.t}</td><td>${esc(r.pct)}</td>
        <td>${esc(r.home)}</td><td>${esc(r.road)}</td><td>${esc(r.div)}</td><td>${esc(r.conf)}</td>
        <td>${r.pf}</td><td>${r.pa}</td>${diffCell(r.diff)}<td>${esc(streakIt(r.streak))}</td>
      </tr>`
    )
    .join("");
  return `<section class="table-card">
      <h3><span class="tag">${esc(div.conf)}</span>${esc(div.short)}</h3>
      <div class="table-scroll"><table class="standings">
        <thead><tr><th>#</th><th class="team-cell">Squadra</th><th>V</th><th>S</th><th>P</th><th>%</th><th>Casa</th><th>Trasf.</th><th>Div</th><th>Conf</th><th>PF</th><th>PS</th><th>Diff</th><th>Serie</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </section>`;
}

const LEGEND = `<div class="legend">
    <span><span class="seed-badge div">1</span> Seed 1-4: in testa alla division</span>
    <span><span class="seed-badge wc">5</span> Seed 5-7: wild card</span>
    <span>V vittorie · S sconfitte · P pareggi · PF punti fatti · PS punti subiti</span>
    <span>z division · y wild card · x playoff · * bye · e eliminata</span>
  </div>`;

function render() {
  if (!last) return;
  const d = last.data;
  let html = staleNotice(last);
  if (view === "conference") {
    html += `<div class="tables two">${d.conferences.map(conferenceTable).join("")}</div>`;
  } else {
    html += ["AFC", "NFC"]
      .map(
        (c) => `<h2 class="conf-heading">${c}</h2><div class="tables two">${d.divisions
          .filter((x) => x.conf === c)
          .map(divisionTable)
          .join("")}</div>`
      )
      .join("");
  }
  box.innerHTML = html + LEGEND + updatedLine(last);
  toggle.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
}

toggle.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-view]");
  if (!b) return;
  view = b.dataset.view;
  history.replaceState(null, "", view === "division" ? "#division" : "#conference");
  render();
});

async function load({ quiet = false } = {}) {
  if (!quiet) loading(box, "Carichiamo le classifiche…");
  try {
    last = await getStandings();
    const sn = document.getElementById("season-name");
    if (sn) sn.textContent = last.data.seasonName || last.data.season?.displayName || "";
    render();
  } catch (err) {
    console.error(err);
    if (!quiet || !last) showError(box, () => load());
  }
}

render();
load();
every(5 * 60 * 1000, () => load({ quiet: true }));
