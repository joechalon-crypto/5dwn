import { renderChrome, loading, showError, staleNotice, teamLogo, teamHref, gameHref, playerHref, espnImg, fmtShort, fmtTime, esc } from "../ui.js?v=202610021841";
import { getTeams, getTeam, getRoster, getSchedule, getStandings } from "../api.js?v=202610021841";
import { SQUADRE } from "../../../content/squadre.js?v=202610021841";

renderChrome("squadre");

const root = document.getElementById("team");
const param = (new URLSearchParams(location.search).get("team") || "").toLowerCase();

const num = (n) => (n == null ? "—" : new Intl.NumberFormat("it-IT").format(n));
const cm = (inches) => (inches ? `${Math.round(inches * 2.54)} cm` : "—");
const kg = (lbs) => (lbs ? `${Math.round(lbs * 0.4536)} kg` : "—");
const rankIt = (s) =>
  (s || "")
    .replace(/^T-(\d+)(st|nd|rd|th)/, "$1° (a pari merito)")
    .replace(/^(\d+)(st|nd|rd|th)/, "$1°");

function isLight(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

function placeholder(text) {
  return `<div class="placeholder">${esc(text)}</div>`;
}

// ---------------------------------------------------------------------------
async function init() {
  loading(root, "Carichiamo la squadra…");
  let teams;
  try {
    teams = (await getTeams()).data;
  } catch (err) {
    console.error(err);
    return showError(root, init);
  }
  const base = teams.find((t) => t.abbr.toLowerCase() === param || t.id === param || t.slug === param);
  if (!base) {
    root.innerHTML = `<div class="state"><p><strong>Squadra non trovata.</strong></p><a class="btn" href="squadre.html">Vai a tutte le squadre</a></div>`;
    return;
  }

  const ed = SQUADRE[base.abbr] || {};
  document.title = `${base.name} · 5DWN`;
  document.documentElement.style.setProperty("--team", base.color || "#333");
  document.documentElement.style.setProperty("--team-alt", base.alt || "#f7b263");
  // Testo bianco o navy sulla fascia colorata, in base alla luminosità del colore squadra.
  document.documentElement.style.setProperty("--team-ink", isLight(base.color) ? "#0a1730" : "#ffffff");

  root.innerHTML = `
    <section class="team-hero" id="hero">
      ${teamLogo(base, 150, "big-logo", true)}
      <div>
        <span class="eyebrow">${esc(base.location)}</span>
        <h1>${esc(base.name)}</h1>
        <div class="meta" id="hero-meta"></div>
        <div class="swatches" title="Colori ufficiali">
          ${base.color ? `<i style="background:${base.color}" title="${base.color}"></i>` : ""}
          ${base.alt ? `<i style="background:${base.alt}" title="${base.alt}"></i>` : ""}
        </div>
      </div>
    </section>

    <div class="info-grid" id="info"></div>

    <div class="two-col section">
      <div>
        <section id="storia-sec">
          <div class="section-head"><h2>Storia della franchigia</h2></div>
          <div class="card editorial" id="storia"></div>
        </section>
        <section class="section" id="stagione-sec">
          <div class="section-head"><h2>Stagione in corso</h2><span class="count">Log partita per partita · tocca una riga</span></div>
          <div class="table-card"><div class="table-scroll" id="schedule"></div></div>
        </section>
      </div>
      <aside>
        <section>
          <div class="section-head"><h2>Statistiche</h2></div>
          <div class="stats-grid" id="stats"></div>
        </section>
        <section class="section" id="palmares-sec"></section>
        <section class="section" id="archivio-sec"></section>
      </aside>
    </div>

    <section class="section">
      <div class="section-head"><h2>Roster</h2><span id="roster-count" class="count"></span></div>
      <label class="select-field roster-select">
        <span class="select-label">Reparto</span>
        <span class="select-wrap"><select id="roster-tabs" class="select" aria-label="Reparto del roster"></select></span>
      </label>
      <div class="table-card"><div class="table-scroll" id="roster"></div></div>
    </section>

    <p class="updated"><a href="squadre.html">← Tutte le squadre</a></p>`;

  renderEditorial(ed);
  loadInfo(base, ed);
  loadSchedule(base);
  loadRoster(base);
}

// ---------------------------------------------------------------------------
function renderEditorial(ed) {
  const storia = document.getElementById("storia");
  const paragrafi = Array.isArray(ed.storia) ? ed.storia : ed.storia ? [ed.storia] : [];
  let html = paragrafi.map((p) => `<p>${p}</p>`).join(""); // HTML ammesso (contenuto redazionale)
  if (ed.tappe?.length) {
    html += `<h3>Le tappe</h3><ul class="timeline">${ed.tappe
      .map((t) => `<li><b>${esc(t.anno)}</b>${t.testo}</li>`)
      .join("")}</ul>`;
  }
  if (ed.note) html += `<h3>La nota di 5DWN</h3><p>${ed.note}</p>`;
  storia.innerHTML = html || placeholder("La storia di questa franchigia arriverà presto su 5DWN. Stay tuned!");

  if (ed.palmares?.length) {
    document.getElementById("palmares-sec").innerHTML = `<div class="section-head"><h2>Palmarès</h2></div>
      <div class="card">${ed.palmares
        .map((p) => `<div class="kv"><span>${esc(p.label)}</span><strong>${esc(p.valore)}</strong></div>`)
        .join("")}</div>`;
  }

  const arch = document.getElementById("archivio-sec");
  arch.innerHTML = `<div class="section-head"><h2>Risultati stagionali</h2></div>${
    ed.stagioni?.length
      ? `<div class="table-card"><table class="schedule"><thead><tr><th>Stagione</th><th>Record</th><th>Esito</th></tr></thead><tbody>${ed.stagioni
          .map((s) => `<tr><td><b>${esc(s.anno)}</b></td><td>${esc(s.record)}</td><td>${esc(s.risultato || "")}</td></tr>`)
          .join("")}</tbody></table></div>`
      : placeholder("Archivio delle stagioni passate in arrivo.")
  }`;
}

// ---------------------------------------------------------------------------
async function loadInfo(base, ed) {
  const info = document.getElementById("info");
  const meta = document.getElementById("hero-meta");
  const stats = document.getElementById("stats");
  info.innerHTML = '<div class="info skeleton" style="height:76px"></div>'.repeat(4);
  stats.innerHTML = '<div class="stat skeleton" style="height:80px"></div>'.repeat(4);

  const [team, standings, roster] = await Promise.allSettled([getTeam(base.id), getStandings(), getRoster(base.id)]);
  const t = team.status === "fulfilled" ? team.value.data : null;
  const st = standings.status === "fulfilled" ? standings.value.data : null;
  const coach = roster.status === "fulfilled" ? roster.value.data.coach : null;

  // Conference / division / record
  const grp = st?.byTeam?.[base.id];
  const row = st?.divisions.flatMap((d) => d.teams).find((r) => r.team.id === base.id);
  const confRow = st?.conferences.flatMap((c) => c.teams).find((r) => r.team.id === base.id);
  meta.innerHTML = [
    grp ? `<span>${esc(grp.conf)}</span><span>${esc(grp.division)}</span>` : "",
    row ? `<span>Record ${row.w}-${row.l}${row.t ? `-${row.t}` : ""}</span>` : t?.record?.total ? `<span>Record ${esc(t.record.total.summary)}</span>` : "",
    t?.standingSummary ? `<span>${esc(rankIt(t.standingSummary))}</span>` : "",
    confRow?.seed && confRow.seed <= 7 ? `<span>Seed ${confRow.seed} ${esc(grp?.conf || "")} · zona playoff</span>` : "",
  ].join("");

  // Anagrafica
  const v = t?.venue || {};
  const stadioNome = v.name || ed.stadio?.nome || "—";
  const stadioCitta = [v.city || ed.stadio?.citta, v.state].filter(Boolean).join(", ");
  const tipo = t?.venue ? `${v.indoor ? "Coperto" : "All'aperto"} · ${v.grass ? "erba naturale" : "erba sintetica"}` : "";
  info.innerHTML = `
    <div class="info"><div class="k">Stadio</div><div class="v">${esc(stadioNome)}<small>${esc(stadioCitta)}</small></div></div>
    <div class="info"><div class="k">Capienza</div><div class="v">${ed.stadio?.capienza ? num(ed.stadio.capienza) : "—"}<small>${esc(tipo)}</small></div></div>
    <div class="info"><div class="k">Fondazione</div><div class="v">${ed.fondazione ? esc(ed.fondazione) : "—"}<small>${esc(base.location)}</small></div></div>
    <div class="info"><div class="k">Head coach</div><div class="v">${esc(coach?.name || "—")}<small>${coach?.experience != null ? `Esperienza da head coach: ${coach.experience} ${coach.experience === 1 ? "anno" : "anni"}` : ""}</small></div></div>`;

  // Statistiche stagionali (ESPN) + extra redazionali
  const tot = t?.record?.total?.stats || {};
  const cards = [];
  if (t?.record?.total) {
    const f1 = (x) => (x == null ? "—" : Number(x).toFixed(1).replace(".", ","));
    cards.push(
      { n: t.record.total.summary, l: "Record" },
      { n: f1(tot.avgPointsFor), l: "Punti fatti a partita" },
      { n: f1(tot.avgPointsAgainst), l: "Punti subiti a partita" },
      { n: tot.differential != null ? `${tot.differential > 0 ? "+" : ""}${tot.differential}` : "—", l: "Differenziale punti" },
      { n: t.record.home?.summary || "—", l: "In casa" },
      { n: t.record.road?.summary || "—", l: "In trasferta" }
    );
  }
  for (const s of ed.statistiche || []) cards.push({ n: s.valore, l: s.label });
  stats.innerHTML = cards.length
    ? cards.map((c) => `<div class="stat"><div class="n">${esc(c.n)}</div><div class="l">${esc(c.l)}</div></div>`).join("")
    : placeholder("Statistiche disponibili dall'inizio della stagione.");
}

// ---------------------------------------------------------------------------
const ROUND = { 1: "WC", 2: "DIV", 3: "CONF", 4: "SB" };

async function loadSchedule(base) {
  const box = document.getElementById("schedule");
  loading(box, "Carichiamo il calendario…");
  try {
    const [res, post] = await Promise.all([
      getSchedule(base.id),
      getSchedule(base.id, {}, { seasonType: 3 }).catch(() => null), // playoff, se ci sono
    ]);
    const { byeWeek, season } = res.data;
    const seen = new Set();
    const events = [...res.data.events, ...(post?.data.events || [])].filter((e) => !seen.has(e.id) && seen.add(e.id));
    const rows = [];
    const byeRow = () => `<tr class="bye"><td>${byeWeek}</td><td colspan="4">Settimana di riposo (bye)</td></tr>`;
    let byeDone = false;
    for (const e of events) {
      if (byeWeek && !byeDone && e.week > byeWeek && e.seasonType !== 3 && season.type === 2) {
        rows.push(byeRow());
        byeDone = true;
      }
      const result =
        e.state === "post"
          ? `<span class="res res-${e.result.toLowerCase()}">${e.result} ${e.us}-${e.them}</span>`
          : e.state === "in"
            ? `<span class="res live">LIVE ${e.us ?? 0}-${e.them ?? 0}</span>`
            : `<span class="res-time">${esc(fmtTime(e.date))}</span>`;
      const week = e.seasonType === 3 ? ROUND[e.week] || "PO" : e.week ?? "";
      rows.push(`<tr class="row-link${e.state === "pre" ? " upcoming" : ""}" data-href="${gameHref(e.id)}">
          <td>${week}</td>
          <td>${esc(fmtShort(e.date))}</td>
          <td><span class="opp">${e.home ? "vs" : "@"} ${teamLogo(e.opp, 22)} ${esc(e.opp.short)}</span></td>
          <td><a href="${gameHref(e.id)}" class="log-link">${result}</a></td>
          <td class="log-tv">${e.state === "pre" && e.tv ? `USA ${esc(e.tv)}` : ""}</td>
        </tr>`);
    }
    if (byeWeek && !byeDone && season.type === 2) rows.push(byeRow());
    const played = events.filter((e) => e.state === "post");
    const w = played.filter((e) => e.result === "W").length, l = played.filter((e) => e.result === "L").length, t = played.length - w - l;
    box.innerHTML = rows.length
      ? `${staleNotice(res)}<table class="schedule log">
          <thead><tr><th>Week</th><th>Data</th><th>Avversario</th><th>Risultato / Ora ITA</th><th>TV</th></tr></thead>
          <tbody>${rows.join("")}</tbody>
          ${played.length ? `<tfoot><tr><td colspan="5">Record: <b>${w}-${l}${t ? `-${t}` : ""}</b> · ${played.length} giocate, ${events.length - played.length} da giocare</td></tr></tfoot>` : ""}
        </table>`
      : `<div class="state">Calendario non ancora disponibile.</div>`;
  } catch (err) {
    console.error(err);
    showError(box, () => loadSchedule(base));
  }
}

// Righe di log e roster cliccabili per intero
document.addEventListener("click", (e) => {
  const tr = e.target.closest("tr[data-href]");
  if (tr && !e.target.closest("a")) location.href = tr.dataset.href;
});

// ---------------------------------------------------------------------------
async function loadRoster(base) {
  const box = document.getElementById("roster");
  const tabs = document.getElementById("roster-tabs");
  loading(box, "Carichiamo il roster…");
  try {
    const res = await getRoster(base.id);
    const groups = res.data.groups;
    if (!groups.length) {
      box.innerHTML = `<div class="state">Roster non disponibile.</div>`;
      return;
    }
    const active = groups.filter((g) => ["offense", "defense", "specialTeam"].includes(g.key)).reduce((n, g) => n + g.players.length, 0);
    document.getElementById("roster-count").textContent = `${active} giocatori attivi`;

    const show = (key) => {
      const g = groups.find((x) => x.key === key) || groups[0];
      tabs.value = g.key;
      box.innerHTML = `${staleNotice(res)}<table class="roster">
        <thead><tr><th>#</th><th>Giocatore</th><th>Ruolo</th><th>Età</th><th>Altezza</th><th>Peso</th><th>Esp.</th><th>College</th></tr></thead>
        <tbody>${g.players
          .map(
            (p) => `<tr class="row-link" data-href="${playerHref(p.id)}">
              <td class="num">${esc(p.jersey || "–")}</td>
              <td><a class="player" href="${playerHref(p.id)}">${p.headshot ? `<img src="${espnImg(p.headshot, 96, 70)}" alt="" loading="lazy" width="34" height="34">` : '<img alt="" width="34" height="34" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">'}<span>${esc(p.name)}${p.injury ? `<small class="inj">${esc(p.injury)}</small>` : ""}</span></a></td>
              <td class="pos" title="${esc(p.posName)}">${esc(p.pos)}</td>
              <td>${p.age ?? "—"}</td>
              <td>${cm(p.height)}</td>
              <td>${kg(p.weight)}</td>
              <td>${p.exp === 0 ? "Rookie" : p.exp ?? "—"}</td>
              <td>${esc(p.college || "—")}</td>
            </tr>`
          )
          .join("")}</tbody></table>`;
    };

    tabs.innerHTML = groups.map((g) => `<option value="${g.key}">${esc(g.label)} (${g.players.length})</option>`).join("");
    tabs.addEventListener("change", () => show(tabs.value));
    show(groups[0].key);
  } catch (err) {
    console.error(err);
    showError(box, () => loadRoster(base));
  }
}

if (!param) location.replace("squadre.html");
else init();
