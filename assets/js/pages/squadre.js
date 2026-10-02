import { renderChrome, loading, showError, teamLogo, teamHref, esc } from "../ui.js?v=202610021645";
import { getTeams, getStandings } from "../api.js?v=202610021645";

renderChrome("squadre");

const box = document.getElementById("teams");

function link(t, rec) {
  return `<a class="team-link" href="${teamHref(t)}" style="--team:${t.color || "var(--orange)"}">
      ${teamLogo(t, 40, "logo logo-lg")}
      <span>${esc(t.name)}<small>${rec ? `${esc(rec)} · ` : ""}${esc(t.abbr)}</small></span>
    </a>`;
}

async function load() {
  loading(box, "Carichiamo le 32 squadre…");
  try {
    const teams = (await getTeams()).data;
    const byId = Object.fromEntries(teams.map((t) => [t.id, t]));
    let standings = null;
    try {
      standings = (await getStandings()).data;
    } catch {
      /* senza classifiche mostriamo l'elenco alfabetico */
    }

    if (standings) {
      box.innerHTML = ["AFC", "NFC"]
        .map(
          (c) => `<h2 class="conf-heading">${c}</h2>
          <div class="div-grid">${standings.divisions
            .filter((d) => d.conf === c)
            .map(
              (d) => `<div class="div-card"><h3>${esc(d.name)}</h3>${d.teams
                .map((r) => link(byId[r.team.id] || r.team, `${r.w}-${r.l}${r.t ? `-${r.t}` : ""}`))
                .join("")}</div>`
            )
            .join("")}</div>`
        )
        .join("");
    } else {
      box.innerHTML = `<div class="div-grid">${[...teams]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => link(t))
        .join("")}</div>`;
    }
  } catch (err) {
    console.error(err);
    showError(box, load);
  }
}

load();
