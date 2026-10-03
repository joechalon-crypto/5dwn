import { renderChrome, loading, showError, staleNotice, updatedLine, renderDayGroups, weekLabel, weekShort, weekRange, every, esc } from "../ui.js?v=202610031557";
import { getScoreboard, getWeek, currentWeekIndex, TTL } from "../api.js?v=202610031557";

renderChrome("calendario");

const weekSelect = document.getElementById("week-select");
const box = document.getElementById("games");
const titleEl = document.getElementById("week-title");
const datesEl = document.getElementById("week-dates");
const countEl = document.getElementById("week-count");

let sb = null;        // scoreboard corrente (calendario + settimana in corso)
let weeks = [];       // Week 1-18 + playoff
let currentKey = "";  // settimana in corso
let selectedKey = ""; // settimana mostrata

const keyOf = (e) => `${e.seasonType}-${e.week}`;

// ----------------------------------------------------------------- tendina settimane
function renderSelect() {
  const group = (type, label) => {
    const list = weeks.filter((e) => e.seasonType === type);
    return list.length
      ? `<optgroup label="${label}">${list
          .map((e) => {
            const k = keyOf(e);
            return `<option value="${k}"${k === selectedKey ? " selected" : ""}>${esc(weekShort(e))} · ${esc(weekRange(e))}${k === currentKey ? " — in corso" : ""}</option>`;
          })
          .join("")}</optgroup>`
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

// ----------------------------------------------------------------- partite della settimana
async function loadWeek({ quiet = false } = {}) {
  const entry = weeks.find((e) => keyOf(e) === selectedKey);
  if (!entry) return;
  titleEl.textContent = weekLabel(entry);
  datesEl.textContent = `${weekRange(entry)} · ${sb.season.year}`;
  if (!quiet) {
    countEl.textContent = "";
    loading(box, "Carichiamo le partite…");
  }
  const want = selectedKey;
  try {
    let res;
    // La settimana in corso arriva dallo scoreboard "live"; le altre dalla cache per settimana.
    if (entry.seasonType === Number(sb.season.type) && entry.week === Number(sb.week)) {
      res = await getScoreboard();
      if (res.data.games.some((g) => g.state === "in")) res = await getScoreboard({}, { ttl: TTL.scoreboardLive });
    } else {
      res = await getWeek(entry, sb.season.year);
    }
    if (want !== selectedKey) return; // l'utente ha già cambiato settimana

    const games = res.data.games;
    const live = games.filter((g) => g.state === "in");
    const next = games.filter((g) => g.state === "pre");
    const done = games.filter((g) => g.state === "post");
    countEl.textContent = games.length ? `${done.length}/${games.length} giocate` : "";

    const block = (title, list, cls = "") =>
      list.length ? `<div class="cal-block"><h3 class="cal-title ${cls}">${title}</h3>${renderDayGroups(list)}</div>` : "";

    box.innerHTML = games.length
      ? staleNotice(res) + block("In diretta", live, "live") + block("In programma", next) + block("Risultati", done) + updatedLine(res)
      : `<div class="state">Nessuna partita in calendario per questa settimana.</div>`;
  } catch (err) {
    console.error(err);
    if (!quiet) showError(box, () => loadWeek());
  }
}

// ----------------------------------------------------------------- avvio
async function init() {
  loading(box, "Carichiamo il calendario…");
  try {
    sb = (await getScoreboard()).data;
  } catch (err) {
    console.error(err);
    return showError(box, init);
  }
  weeks = sb.calendar.filter((e) => e.seasonType === 2 || e.seasonType === 3);
  const cur = sb.calendar[currentWeekIndex(sb)];
  if (cur && (cur.seasonType === 2 || cur.seasonType === 3)) currentKey = keyOf(cur);
  else if (cur?.seasonType === 1) currentKey = keyOf(weeks[0]); // pre-season: si parte dalla Week 1
  else currentKey = keyOf(weeks[weeks.length - 1] || {});

  const fromUrl = new URLSearchParams(location.search).get("w");
  selectedKey = weeks.some((e) => keyOf(e) === fromUrl) ? fromUrl : currentKey;
  renderSelect();
  loadWeek();
}

init();
// Aggiornamento automatico solo sulla settimana in corso (la cache limita le chiamate).
every(60 * 1000, () => {
  if (sb && selectedKey === currentKey) loadWeek({ quiet: true });
});
