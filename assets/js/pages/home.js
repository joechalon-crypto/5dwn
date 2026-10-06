import { renderChrome, loading, showError, staleNotice, updatedLine, weekLabel, teamLogo, teamHref, gameHref, statusText, tvLabel, fmtShort, fmtTime, every, ICONS, esc } from "../ui.js?v=202610061310";
import { getScoreboard, getWeek, getStandings, currentWeekIndex, TTL } from "../api.js?v=202610061310";
import { SITO } from "../../../content/sito.js?v=202610061310";

renderChrome("home");

// ---------------------------------------------------------------- 2. Hero
const s = SITO.social;
document.getElementById("cta").innerHTML = `
  <a class="btn btn-primary" href="${s.instagram.url}" target="_blank" rel="noopener">${ICONS.instagram} ${esc(s.instagram.handle)}</a>
  <a class="btn" href="${s.youtube.url}" target="_blank" rel="noopener">${ICONS.youtube} YouTube ${esc(s.youtube.handle)}</a>`;

// ---------------------------------------------------------------- 1. Banner settimana
const track = document.getElementById("ticker-track");
const weekEl = document.getElementById("ticker-week");

function tickerTeam(c, g) {
  const done = g.state === "post";
  const lost = done && (g.home?.winner || g.away?.winner) && !c.winner;
  return `<span class="tk-team${lost ? " lost" : ""}">
      ${teamLogo(c.team, 20)}<span class="abbr">${esc(c.team.abbr)}</span>
      <span class="tk-score">${g.state === "pre" ? "" : c.score ?? ""}</span>
    </span>`;
}

function tickerCard(g) {
  let top;
  if (g.state === "pre") top = `<span>${esc(fmtShort(g.date))}</span><span>${esc(fmtTime(g.date))}</span>`;
  else if (g.state === "in") top = `<span class="live">${esc(statusText(g).text.replace("LIVE · ", ""))}</span><span class="live">Live</span>`;
  else top = `<span>${esc(statusText(g).text)}</span>`;
  const tv = g.state === "pre" ? tvLabel(g) : "";
  return `<a class="tk-card" href="${gameHref(g.id)}">
      <span class="tk-top">${top}</span>
      ${tickerTeam(g.away, g)}
      ${tickerTeam(g.home, g)}
      ${tv ? `<span class="tk-tv">${esc(tv)}</span>` : ""}
    </a>`;
}

let tickerHasLive = false;

async function loadTicker() {
  try {
    let res = await getScoreboard();
    if (res.data.games.some((g) => g.state === "in")) res = await getScoreboard({}, { ttl: TTL.scoreboardLive });
    const sb = res.data;
    let games = sb.games;
    const idx = currentWeekIndex(sb);
    let entry = sb.calendar[idx];

    // Settimana tutta conclusa: il banner passa da solo alla successiva.
    if (games.length && games.every((g) => g.state === "post") && sb.calendar[idx + 1]) {
      entry = sb.calendar[idx + 1];
      games = (await getWeek(entry, sb.season.year)).data.games;
    }

    tickerHasLive = games.some((g) => g.state === "in");
    weekEl.textContent = entry ? weekLabel(entry) : sb.week ? `Week ${sb.week}` : "NFL";
    const keepScroll = track.scrollLeft;
    track.innerHTML = games.length ? games.map(tickerCard).join("") : `<div class="ticker-empty">Nessuna partita in programma.</div>`;
    track.scrollLeft = keepScroll;
  } catch (err) {
    console.error(err);
    if (!track.querySelector(".tk-card")) track.innerHTML = `<div class="ticker-empty">Partite non disponibili al momento.</div>`;
  }
}

document.querySelectorAll(".ticker-nav").forEach((b) =>
  b.addEventListener("click", () => track.scrollBy({ left: (b.classList.contains("next") ? 1 : -1) * track.clientWidth * 0.8, behavior: "smooth" }))
);

// ---------------------------------------------------------------- 3. Classifica lampo
const leadersBox = document.getElementById("leaders");

async function loadLeaders({ quiet = false } = {}) {
  if (!quiet) loading(leadersBox, "Carichiamo le division…");
  try {
    const res = await getStandings();
    const divs = res.data.divisions;
    leadersBox.innerHTML = `${staleNotice(res)}<div class="leaders-grid">${divs
      .map((d) => {
        const t = d.teams[0];
        if (!t) return "";
        return `<a class="leader" href="${teamHref(t.team)}">
            <span class="leader-div">${esc(d.name)}</span>
            <span class="leader-team">${teamLogo(t.team, 32)}<span class="leader-name">${esc(t.team.short)}</span></span>
            <span class="leader-rec">${t.w}-${t.l}${t.t ? `-${t.t}` : ""}</span>
          </a>`;
      })
      .join("")}</div>${updatedLine(res)}`;
  } catch (err) {
    console.error(err);
    if (!quiet) showError(leadersBox, () => loadLeaders());
  }
}

// ---------------------------------------------------------------- 4. Ultimo reel
const reel = SITO.ultimoReel || {};
const reelUrl = reel.url || `${s.instagram.url.replace(/\/$/, "")}/reels/`;
document.getElementById("reel").innerHTML = `
  <a class="reel-card${reel.copertina ? " has-cover" : ""}" href="${esc(reelUrl)}" target="_blank" rel="noopener">
    ${reel.copertina ? `<img class="reel-cover" src="${esc(reel.copertina)}" alt="" loading="lazy">` : `<span class="reel-mark" aria-hidden="true">${ICONS.instagram}</span>`}
    <span class="reel-body">
      <span class="eyebrow">Instagram · ${esc(s.instagram.handle)}</span>
      <strong class="reel-title">${esc(reel.titolo || "Guarda l'ultimo reel di 5DWN")}</strong>
      <span class="reel-text">Highlights, analisi e la NFL raccontata in italiano, ogni settimana.</span>
      <span class="btn btn-primary">${ICONS.instagram} Apri su Instagram</span>
    </span>
  </a>`;

// ---------------------------------------------------------------- avvio e aggiornamento
loadTicker();
loadLeaders();
every(60 * 1000, () => {
  loadTicker();
  loadLeaders({ quiet: true });
});
