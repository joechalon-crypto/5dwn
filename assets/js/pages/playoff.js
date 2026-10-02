import { renderChrome, loading, showError, staleNotice, updatedLine, teamLogo, teamHref, gameHref, fmtShort, fmtTime, every, esc } from "../ui.js";
import { getStandings, getScoreboard, getWeek } from "../api.js";

renderChrome("playoff");

const box = document.getElementById("bracket");
const WC_PAIRS = [[2, 7], [3, 6], [4, 5]];

// Partite di postseason (solo quando la stagione è nella fase playoff).
async function loadPostseason() {
  try {
    const cur = (await getScoreboard()).data;
    if (Number(cur.season?.type) !== 3) return [];
    const weeks = cur.calendar.filter((e) => e.seasonType === 3 && new Date(e.start) <= Date.now());
    const all = await Promise.all(weeks.map((e) => getWeek(e, cur.season.year).then((r) => r.data.games).catch(() => [])));
    return all.flat();
  } catch {
    return [];
  }
}

const findGame = (games, a, b) =>
  games.find((g) => {
    const ids = [g.home?.team.id, g.away?.team.id];
    return ids.includes(a) && ids.includes(b);
  });

function slot(entry, game, placeholder) {
  if (!entry) return `<div class="slot tbd"><span class="s"></span><span></span><span class="t">${esc(placeholder || "Da definire")}</span><span class="sc"></span></div>`;
  const c = game ? [game.home, game.away].find((x) => x?.team.id === entry.team.id) : null;
  const done = game?.state === "post";
  const cls = done ? (c?.winner ? "won" : "lost") : "";
  const score = game && game.state !== "pre" ? c?.score ?? "" : `<small>${esc(entry.record || `${entry.w}-${entry.l}${entry.t ? `-${entry.t}` : ""}`)}</small>`;
  return `<div class="slot ${cls}">
      <span class="s">${entry.seed}</span>${teamLogo(entry.team, 26)}
      <a class="t" href="${teamHref(entry.team)}">${esc(entry.team.short)}</a>
      <span class="sc">${score}</span>
    </div>`;
}

function matchup(hi, lo, game, phHi, phLo) {
  const when = game
    ? game.state === "pre"
      ? `${fmtShort(game.date)} · ${fmtTime(game.date)}${game.tv ? ` · ${esc(game.tv)}` : ""}`
      : game.state === "in"
        ? "In corso"
        : "Finale"
    : hi && lo
      ? "Accoppiamento se la stagione finisse oggi"
      : "";
  const foot = game
    ? `<a class="when when-link" href="${gameHref(game.id)}">${when} · Profilo partita →</a>`
    : when
      ? `<div class="when">${when}</div>`
      : "";
  return `<div class="matchup">${slot(hi, game, phHi)}${slot(lo, game, phLo)}${foot}</div>`;
}

const winnerOf = (game, a, b) => {
  if (!game || game.state !== "post") return null;
  const w = [game.home, game.away].find((c) => c?.winner);
  return w ? [a, b].find((e) => e.team.id === w.team.id) : null;
};

function conferenceColumn(conf, games) {
  const seeds = conf.teams.filter((t) => t.seed && t.seed <= 7).sort((a, b) => a.seed - b.seed);
  const bySeed = Object.fromEntries(seeds.map((t) => [t.seed, t]));
  const confIds = new Set(conf.teams.map((t) => t.team.id));
  const entryById = Object.fromEntries(conf.teams.map((t) => [t.team.id, t]));
  const confGames = games.filter((g) => confIds.has(g.home?.team.id) && confIds.has(g.away?.team.id));

  // Seed list
  const list = seeds
    .map((t) => {
      const pill = t.seed === 1 ? '<span class="pill pill-bye">Bye</span>' : t.seed <= 4 ? '<span class="pill pill-div">Division</span>' : '<span class="pill pill-wc">Wild card</span>';
      return `<a class="seed-row ${t.seed === 1 ? "bye" : ""}" href="${teamHref(t.team)}">
          <span class="seed">${t.seed}</span>${teamLogo(t.team, 30)}
          <span class="nm">${esc(t.team.name)}<small>${pill}</small></span>
          <span class="rec">${t.w}-${t.l}${t.t ? `-${t.t}` : ""}</span>
        </a>`;
    })
    .join("");

  // Wild Card Round
  const wc = WC_PAIRS.map(([h, l]) => {
    const a = bySeed[h], b = bySeed[l];
    const g = a && b ? findGame(confGames, a.team.id, b.team.id) : null;
    return { a, b, g, winner: winnerOf(g, a, b) };
  });

  // Divisional: partite reali se esistono, altrimenti ricostruite col reseeding.
  const pairs = (seedGames) =>
    seedGames.map((g) => {
      const x = entryById[g.home.team.id], y = entryById[g.away.team.id];
      const [hi, lo] = (x?.seed ?? 99) < (y?.seed ?? 99) ? [x, y] : [y, x];
      return { hi, lo, g };
    });

  const realDiv = confGames.filter((g) => g.seasonType === 3 && g.week === 2);
  const realConf = confGames.filter((g) => g.seasonType === 3 && g.week === 3);

  let divRows;
  if (realDiv.length) {
    divRows = pairs(realDiv);
  } else {
    const winners = wc.map((m) => m.winner).filter(Boolean);
    if (winners.length === 3) {
      const sorted = winners.sort((a, b) => a.seed - b.seed);
      divRows = [
        { hi: bySeed[1], lo: sorted[2] },
        { hi: sorted[0], lo: sorted[1] },
      ];
    } else {
      divRows = [
        { hi: bySeed[1], lo: null, phLo: "Seed più basso rimasto" },
        { hi: null, lo: null, phHi: "Vincente Wild Card", phLo: "Vincente Wild Card" },
      ];
    }
  }

  let confRows;
  if (realConf.length) confRows = pairs(realConf);
  else {
    const dw = divRows.map((r) => winnerOf(r.g, r.hi, r.lo)).filter(Boolean).sort((a, b) => a.seed - b.seed);
    confRows = [{ hi: dw[0] || null, lo: dw[1] || null, phHi: "Vincente Divisional", phLo: "Vincente Divisional" }];
  }

  const hunt = conf.teams
    .filter((t) => t.seed && t.seed > 7 && t.seed <= 10)
    .map((t) => `<a class="chip" href="${teamHref(t.team)}">${teamLogo(t.team, 20)}${t.seed}. ${esc(t.team.abbr)} ${t.w}-${t.l}</a>`)
    .join("");

  return `<section class="conf-col">
      <h2><span class="pill pill-conf">${esc(conf.abbr)}</span> ${esc(conf.name)}</h2>
      <div class="seed-list">${list || '<div class="state">Seed non ancora disponibili.</div>'}</div>
      <div class="rounds">
        <div class="round"><h3>Wild Card Round</h3>
          ${wc.map((m) => matchup(m.a, m.b, m.g)).join("")}
          <div class="matchup"><div class="slot"><span class="s">1</span>${bySeed[1] ? teamLogo(bySeed[1].team, 26) : "<span></span>"}<span class="t">${esc(bySeed[1]?.team.short || "Seed 1")}</span><span class="pill pill-bye">Bye</span></div></div>
        </div>
        <div class="round"><h3>Divisional Round</h3>${divRows.map((r) => matchup(r.hi, r.lo, r.g, r.phHi, r.phLo)).join("")}</div>
        <div class="round"><h3>${esc(conf.abbr)} Championship</h3>${confRows.map((r) => matchup(r.hi, r.lo, r.g, r.phHi, r.phLo)).join("")}</div>
      </div>
      ${hunt ? `<div class="hunt"><strong>In corsa:</strong> ${hunt}</div>` : ""}
    </section>`;
}

function superBowl(confs, games) {
  const sb = games.find((g) => g.seasonType === 3 && g.week === 4);
  const champ = (conf) => {
    const ids = new Set(conf.teams.map((t) => t.team.id));
    const g = games.find((x) => x.seasonType === 3 && x.week === 3 && ids.has(x.home?.team.id) && x.state === "post");
    const w = g && [g.home, g.away].find((c) => c?.winner);
    return w ? conf.teams.find((t) => t.team.id === w.team.id) : null;
  };
  const [a, b] = confs.map(champ);
  const side = (t, conf) =>
    t ? `<a href="${teamHref(t.team)}">${teamLogo(t.team, 56, "logo logo-lg")}${esc(t.team.short)}</a>` : `<span class="tbd">Campione ${esc(conf.abbr)}</span>`;
  let score = "VS";
  if (sb && sb.state !== "pre") score = `${sb.away.score} – ${sb.home.score}`;
  return `<div class="card sb-card">
      <span class="eyebrow">Super Bowl</span>
      <div class="vs">${side(a, confs[0])}<span class="big">${score}</span>${side(b, confs[1])}</div>
      ${sb ? `<p class="updated">${esc(sb.venue?.name || "")} · ${fmtShort(sb.date)} ${fmtTime(sb.date)}</p>` : ""}
    </div>`;
}

async function load({ quiet = false } = {}) {
  if (!quiet) loading(box, "Costruiamo il tabellone…");
  try {
    const [st, games] = await Promise.all([getStandings(), loadPostseason()]);
    const confs = st.data.conferences;
    box.innerHTML = `${staleNotice(st)}
      <div class="bracket-wrap">${confs.map((c) => conferenceColumn(c, games)).join("")}</div>
      ${superBowl(confs, games)}
      ${updatedLine(st)}`;
  } catch (err) {
    console.error(err);
    if (!quiet) showError(box, () => load());
  }
}

load();
every(5 * 60 * 1000, () => load({ quiet: true }));
