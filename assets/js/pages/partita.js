import {
  renderChrome, loading, showError, staleNotice, updatedLine, teamLogo, teamHref, gameHref, playerHref, espnImg,
  statusText, tvItalia, TV_PLACEHOLDER, fmtDay, fmtShort, fmtTime, every, esc,
} from "../ui.js?v=202610021759";
import { getSummary, getScoreboard, getHeadToHead } from "../api.js?v=202610021759";

renderChrome("calendario");

const root = document.getElementById("match");
const id = new URLSearchParams(location.search).get("id");
const H2H_SEASONS = 6; // stagioni considerate per gli scontri diretti

const ROUND = { 1: "Wild Card Round", 2: "Divisional Round", 3: "Conference Championship", 4: "Super Bowl" };
const roundLabel = (m) =>
  m.seasonType === 3 ? ROUND[m.week] || "Playoff" : m.seasonType === 1 ? `Preseason · Week ${m.week}` : `Week ${m.week}`;
const quarterLabel = (n) => (n <= 4 ? `${n}° quarto` : n === 5 ? "Overtime" : `Overtime ${n - 4}`);

// ============================================================================ intestazione
function teamSide(c, m, align) {
  const showScore = m.state !== "pre";
  const won = m.state === "post" && c.winner;
  return `<div class="mh-team ${align}${m.state === "post" && !c.winner ? " lost" : ""}">
      <a href="${teamHref(c.team)}" class="mh-logo">${teamLogo(c.team, 72, "logo mh-img", true)}</a>
      <div class="mh-name">
        <a href="${teamHref(c.team)}">${esc(c.team.location || "")}<strong>${esc(c.team.nickname || c.team.short)}</strong></a>
        <span>${esc(c.record || "")}${c.homeAway === "home" ? " · Casa" : " · Trasferta"}</span>
      </div>
      ${showScore ? `<div class="mh-score${won ? " won" : ""}">${c.score ?? 0}</div>` : ""}
    </div>`;
}

function header(m) {
  const st = statusText(m);
  const tvIt = tvItalia(m.id);
  const venue = m.venue ? `${m.venue.name}${m.venue.city ? `, ${m.venue.city}` : ""}${m.venue.state ? ` (${m.venue.state})` : ""}` : "";
  return `<section class="match-hero">
      <div class="mh-top">
        <span class="eyebrow">${esc(roundLabel(m))} · ${esc(m.year || "")}</span>
        <span class="mh-status ${st.cls}">${esc(m.state === "pre" ? "Da giocare" : st.text)}</span>
      </div>
      <div class="mh-teams">
        ${teamSide(m.away, m, "left")}
        <div class="mh-vs">${m.state === "pre" ? "@" : "–"}</div>
        ${teamSide(m.home, m, "right")}
      </div>
      <dl class="mh-info">
        <div><dt>Data e ora (Italia)</dt><dd>${esc(fmtDay(m.date))} · ${esc(fmtTime(m.date))}</dd></div>
        <div><dt>Stadio</dt><dd>${esc(venue || "—")}${m.neutral ? " · campo neutro" : ""}</dd></div>
        <div><dt>TV in Italia</dt><dd class="${tvIt ? "" : "placeholder-text"}">${esc(tvIt || TV_PLACEHOLDER)}</dd></div>
        <div><dt>TV USA (ESPN)</dt><dd>${esc(m.tvUS.join(", ") || "—")}</dd></div>
        ${m.attendance ? `<div><dt>Spettatori</dt><dd>${new Intl.NumberFormat("it-IT").format(m.attendance)}</dd></div>` : ""}
      </dl>
    </section>`;
}

// ============================================================================ partita da giocare
function formList(m, side, regularStart) {
  const list = m.lastFive[side.team.id] || [];
  if (!list.length) return `<div class="placeholder">Nessuna partita recente disponibile.</div>`;
  return `<ul class="mini-list">${[...list]
    .reverse()
    .map((g) => {
      const pre = regularStart && new Date(g.date) < regularStart;
      return `<li><a href="${gameHref(g.id)}">
          <span class="ml-res res-${(g.result || "").toLowerCase()}">${esc(g.result || "–")}</span>
          <span class="ml-date">${esc(fmtShort(g.date))}${pre ? ' <em class="pill pill-wc">Pre</em>' : ""}</span>
          <span class="ml-opp">${esc(g.atVs === "@" ? "@" : "vs")} ${teamLogo(g.opp, 20)} ${esc(g.opp.abbr)}</span>
          <span class="ml-score">${esc(g.score)}</span>
        </a></li>`;
    })
    .join("")}</ul>`;
}

function injuryList(m, side) {
  const list = m.injuries[side.team.id] || [];
  if (!list.length) return `<div class="placeholder">Nessuna assenza segnalata.</div>`;
  return `<ul class="inj-list">${list
    .map(
      (p) => `<li>
        <a href="${playerHref(p.id)}" class="inj-name">${esc(p.name)} <small>${esc(p.pos)}</small></a>
        <span class="inj-status s-${esc(p.statusKey)}">${esc(p.status)}</span>
        <span class="inj-detail">${esc([p.type, p.side].filter(Boolean).join(" · "))}${p.returnDate ? `${p.type ? " · " : ""}rientro previsto ${esc(fmtShort(p.returnDate))}` : ""}</span>
      </li>`
    )
    .join("")}</ul>`;
}

const twoCols = (m, fn) => `<div class="duo">
    ${[m.away, m.home]
      .map((s) => `<div class="duo-col"><h3 class="duo-title">${teamLogo(s.team, 24)} ${esc(s.team.short)}</h3>${fn(s)}</div>`)
      .join("")}
  </div>`;

async function renderH2H(m) {
  const el = document.getElementById("h2h");
  if (!el) return;
  loading(el, "Cerchiamo gli scontri diretti…");
  try {
    const { games, fromYear, toYear } = await getHeadToHead(m.home.team.id, m.away.team.id, m.year, H2H_SEASONS);
    const played = games.filter((g) => g.state === "post" && g.id !== m.id);
    if (!played.length) {
      el.innerHTML = `<div class="placeholder">Nessuno scontro diretto tra ${fromYear} e ${toYear}.</div>`;
      return;
    }
    const w = played.filter((g) => g.result === "W").length; // dal punto di vista della squadra di casa
    const l = played.filter((g) => g.result === "L").length;
    const t = played.length - w - l;
    el.innerHTML = `
      <div class="h2h-tally">
        <div>${teamLogo(m.home.team, 36)}<strong>${w}</strong><span>${esc(m.home.team.abbr)}</span></div>
        <div class="h2h-mid">${t ? `${t} pareggi<br>` : ""}${played.length} partite<br><small>${fromYear}–${toYear}</small></div>
        <div>${teamLogo(m.away.team, 36)}<strong>${l}</strong><span>${esc(m.away.team.abbr)}</span></div>
      </div>
      <ul class="mini-list">${played
        .map((g) => {
          const winner = g.result === "W" ? m.home.team : g.result === "L" ? m.away.team : null;
          const hs = g.home ? g.us : g.them; // punteggio della squadra che giocava in casa quel giorno
          const as = g.home ? g.them : g.us;
          const homeAbbr = g.home ? m.home.team.abbr : m.away.team.abbr;
          const awayAbbr = g.home ? m.away.team.abbr : m.home.team.abbr;
          return `<li><a href="${gameHref(g.id)}">
              <span class="ml-date">${esc(fmtShort(g.date))} ${new Date(g.date).getFullYear()}</span>
              <span class="ml-opp">${g.seasonType === 3 ? '<em class="pill pill-bye">Playoff</em> ' : ""}${esc(awayAbbr)} ${as} – ${hs} ${esc(homeAbbr)}</span>
              <span class="ml-score">${winner ? `${teamLogo(winner, 20)} ${esc(winner.abbr)}` : "Pari"}</span>
            </a></li>`;
        })
        .join("")}</ul>`;
  } catch (err) {
    console.error(err);
    el.innerHTML = `<div class="placeholder">Scontri diretti non disponibili al momento.</div>`;
  }
}

async function preGame(m) {
  let regularStart = null;
  try {
    const cal = (await getScoreboard()).data.calendar;
    const w1 = cal.find((e) => e.seasonType === 2 && e.week === 1);
    if (w1) regularStart = new Date(w1.start);
  } catch {
    /* senza calendario non segniamo le partite di preseason */
  }
  return `
    <section class="section">
      <div class="section-head"><h2>Forma recente</h2><span class="count">Ultime partite</span></div>
      ${twoCols(m, (s) => formList(m, s, regularStart))}
    </section>
    <section class="section">
      <div class="section-head"><h2>Testa a testa</h2><span class="count">Ultime ${H2H_SEASONS} stagioni, playoff inclusi</span></div>
      <div id="h2h"></div>
    </section>
    <section class="section">
      <div class="section-head"><h2>Assenze e infortuni</h2><span class="count">Injury report ESPN</span></div>
      ${twoCols(m, (s) => injuryList(m, s))}
    </section>`;
}

// ============================================================================ partita in corso / finita
function linescore(m) {
  const n = Math.max(4, m.home.linescores.length, m.away.linescores.length);
  const head = Array.from({ length: n }, (_, i) => `<th>${i < 4 ? i + 1 : i === 4 ? "OT" : `OT${i - 3}`}</th>`).join("");
  const row = (c) => `<tr class="${m.state === "post" && c.winner ? "won" : ""}">
      <td class="team-cell"><a href="${teamHref(c.team)}">${teamLogo(c.team, 22)} ${esc(c.team.abbr)}</a></td>
      ${Array.from({ length: n }, (_, i) => `<td>${c.linescores[i] ?? "–"}</td>`).join("")}
      <td class="tot">${c.score ?? 0}</td>
    </tr>`;
  return `<div class="table-card"><div class="table-scroll"><table class="standings linescore">
      <thead><tr><th class="team-cell">Squadra</th>${head}<th>Tot</th></tr></thead>
      <tbody>${row(m.away)}${row(m.home)}</tbody>
    </table></div></div>`;
}

const STAT_IT = {
  firstDowns: "Primi down",
  totalOffensivePlays: "Giocate totali",
  totalYards: "Yard totali",
  yardsPerPlay: "Yard per giocata",
  netPassingYards: "Yard su passaggio",
  completionAttempts: "Completi / Tentati",
  yardsPerPass: "Yard per passaggio",
  rushingYards: "Yard su corsa",
  rushingAttempts: "Tentativi di corsa",
  yardsPerRushAttempt: "Yard per corsa",
  thirdDownEff: "Conversioni 3° down",
  fourthDownEff: "Conversioni 4° down",
  redZoneAttempts: "Red zone (TD-tentativi)",
  sacksYardsLost: "Sack subiti - yard perse",
  turnovers: "Palle perse",
  interceptions: "Intercetti lanciati",
  fumblesLost: "Fumble persi",
  totalPenaltiesYards: "Penalità - yard",
  possessionTime: "Possesso palla",
};
const STAT_ORDER = Object.keys(STAT_IT);

function numeric(v, name) {
  if (v == null || v === "") return null;
  if (name === "possessionTime") {
    const [mm, ss] = String(v).split(":").map(Number);
    return mm * 60 + (ss || 0);
  }
  if (/[-/]/.test(String(v).replace(/^-/, ""))) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function teamStats(m) {
  const seen = new Set();
  const rows = STAT_ORDER.map((k) => m.teamStats.find((s) => s.name === k)).filter((s) => s && !seen.has(s.name) && seen.add(s.name));
  if (!rows.length) return `<div class="placeholder">Statistiche non ancora disponibili.</div>`;
  return `<div class="card compare">
      <div class="cmp-head"><span>${teamLogo(m.away.team, 24)} ${esc(m.away.team.abbr)}</span><span></span><span>${esc(m.home.team.abbr)} ${teamLogo(m.home.team, 24)}</span></div>
      ${rows
        .map((s) => {
          const a = numeric(s.away, s.name), h = numeric(s.home, s.name);
          const bar = a != null && h != null && a + h > 0;
          const pa = bar ? (a / (a + h)) * 100 : 50;
          return `<div class="cmp-row">
              <span class="cmp-v">${esc(s.away)}</span>
              <span class="cmp-l">${esc(STAT_IT[s.name] || s.label)}</span>
              <span class="cmp-v">${esc(s.home)}</span>
              ${bar ? `<span class="cmp-bar"><i class="a" style="width:${pa.toFixed(1)}%"></i><i class="h" style="width:${(100 - pa).toFixed(1)}%"></i></span>` : ""}
            </div>`;
        })
        .join("")}
    </div>`;
}

function topPlayer(cats, key, title, fmtLine) {
  const c = cats?.[key];
  if (!c?.athletes?.length) return "";
  const yi = c.labels.indexOf("YDS");
  const best = [...c.athletes].sort((x, y) => parseFloat(y.stats[yi] || 0) - parseFloat(x.stats[yi] || 0))[0];
  const v = (lab) => best.stats[c.labels.indexOf(lab)] ?? "–";
  return `<a class="top-player" href="${playerHref(best.id)}">
      <img src="${espnImg(best.headshot, 96, 70)}" alt="" width="48" height="48" loading="lazy">
      <span class="tp-body">
        <span class="tp-role">${title}</span>
        <span class="tp-name">${esc(best.name)}</span>
        <span class="tp-line">${esc(fmtLine(v))}</span>
      </span>
    </a>`;
}

function topPlayers(m) {
  const block = (s) => {
    const cats = m.players[s.team.id];
    const html =
      topPlayer(cats, "passing", "Passer", (v) => `${v("C/ATT")} · ${v("YDS")} yd · ${v("TD")} TD · ${v("INT")} INT`) +
      topPlayer(cats, "rushing", "Rusher", (v) => `${v("CAR")} corse · ${v("YDS")} yd · ${v("TD")} TD`) +
      topPlayer(cats, "receiving", "Receiver", (v) => `${v("REC")} ricezioni · ${v("YDS")} yd · ${v("TD")} TD`);
    return html || `<div class="placeholder">Dati non ancora disponibili.</div>`;
  };
  return twoCols(m, block);
}

function scoringPlays(m) {
  if (!m.scoringPlays.length) return `<div class="placeholder">Nessuna segnatura${m.state === "in" ? " finora" : ""}.</div>`;
  const byTeam = { [m.home.team.id]: m.home.team, [m.away.team.id]: m.away.team };
  let lastQ = null;
  return `<ol class="plays">${m.scoringPlays
    .map((p) => {
      const t = byTeam[p.teamId];
      const q = p.period !== lastQ ? `<li class="plays-q">${quarterLabel(p.period)}</li>` : "";
      lastQ = p.period;
      return `${q}<li class="play">
          <span class="play-team">${t ? teamLogo(t, 28) : ""}</span>
          <span class="play-body">
            <span class="play-type"><b>${esc(p.abbr || "")}</b> ${esc(p.type)} · ${esc(p.clock)}</span>
            <span class="play-text">${esc(p.text)}</span>
          </span>
          <span class="play-score">${esc(m.away.team.abbr)} ${p.away} – ${p.home} ${esc(m.home.team.abbr)}</span>
        </li>`;
    })
    .join("")}</ol>`;
}

function highlights(m) {
  const q = `${m.away.team.name} vs ${m.home.team.name} highlights ${m.year} ${roundLabel(m)}`;
  const url = `https://www.youtube.com/@NFL/search?query=${encodeURIComponent(q)}`;
  return `<a class="highlight-card" href="${url}" target="_blank" rel="noopener">
      <span class="eyebrow">YouTube · canale ufficiale NFL</span>
      <strong>Guarda gli highlights di ${esc(m.away.team.short)} – ${esc(m.home.team.short)}</strong>
      <span class="btn btn-primary">Apri gli highlights</span>
    </a>`;
}

function liveOrFinal(m) {
  return `
    <section class="section">
      <div class="section-head"><h2>Punteggio per quarti</h2></div>
      ${linescore(m)}
    </section>
    ${m.state === "post" ? `<section class="section"><div class="section-head"><h2>Highlights</h2></div>${highlights(m)}</section>` : ""}
    <section class="section">
      <div class="section-head"><h2>Top giocatori</h2><span class="count">Tocca un giocatore per il profilo</span></div>
      ${topPlayers(m)}
    </section>
    <div class="two-col section">
      <section>
        <div class="section-head"><h2>Scoring plays</h2></div>
        ${scoringPlays(m)}
      </section>
      <section>
        <div class="section-head"><h2>Statistiche a confronto</h2></div>
        ${teamStats(m)}
      </section>
    </div>`;
}

// ============================================================================ avvio
let lastState = null;

async function load({ quiet = false } = {}) {
  if (!quiet) loading(root, "Carichiamo la partita…");
  try {
    const res = await getSummary(id);
    const m = res.data;
    if (!m.home || !m.away) throw new Error("Partita non trovata");
    // In pausa, durante un aggiornamento silenzioso, evitiamo di ridisegnare se nulla è cambiato.
    if (quiet && m.state === "pre" && lastState === "pre") return;
    lastState = m.state;
    document.title = `${m.away.team.short} – ${m.home.team.short} · 5DWN`;
    const body = m.state === "pre" ? await preGame(m) : liveOrFinal(m);
    root.innerHTML = staleNotice(res) + header(m) + body + updatedLine(res);
    if (m.state === "pre") renderH2H(m);
  } catch (err) {
    console.error(err);
    if (!quiet) showError(root, () => load(), "Non riusciamo a caricare questa partita.");
  }
}

if (!id) location.replace("calendario.html");
else {
  load();
  // Durante la partita il summary si aggiorna ogni 30 secondi (TTL della cache).
  every(30 * 1000, () => {
    if (lastState === "in" || lastState === "pre") load({ quiet: true });
  });
}
