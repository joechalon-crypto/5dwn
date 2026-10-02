// ============================================================================
// Accesso ai dati ESPN (API pubblica, nessuna chiave) con cache leggera.
//  - cache in memoria + localStorage con scadenza (TTL) per endpoint
//  - richieste identiche in corso vengono unificate
//  - se la rete fallisce si usano i dati in cache scaduti (marcati "stale")
//  - in cache salviamo solo i dati già "snelliti" (non il JSON completo ESPN)
// ============================================================================

const SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const STANDINGS = "https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings";
const CACHE_PREFIX = "5dwn:v4:";
const ATHLETE = "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes";
const TIMEOUT_MS = 12000;

const MIN = 60 * 1000;
export const TTL = {
  scoreboardLive: 1 * MIN,
  scoreboard: 3 * MIN,
  scoreboardPast: 6 * 60 * MIN,
  standings: 10 * MIN,
  teams: 24 * 60 * MIN,
  team: 60 * MIN,
  roster: 12 * 60 * MIN,
  schedule: 15 * MIN,
  history: 30 * 24 * 60 * MIN, // stagioni concluse: non cambiano più
  summaryLive: 0.5 * MIN,
  summaryPre: 10 * MIN,
  summaryPost: 24 * 60 * MIN,
  athlete: 12 * 60 * MIN,
  athleteStats: 6 * 60 * MIN,
  gamelog: 60 * MIN,
  rankings: 30 * MIN,
};

const memory = new Map();
const inflight = new Map();

function readStore(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStore(key, entry) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Spazio esaurito: liberiamo le voci 5DWN più vecchie e riproviamo una volta.
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
      keys
        .map((k) => ({ k, t: (JSON.parse(localStorage.getItem(k)) || {}).t || 0 }))
        .sort((a, b) => a.t - b.t)
        .slice(0, Math.ceil(keys.length / 2))
        .forEach(({ k }) => localStorage.removeItem(k));
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      /* cache solo in memoria */
    }
  }
}

async function fetchJSON(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Scarica (o legge dalla cache) e trasforma un endpoint.
 * `ttl` può essere un numero (ms) o una funzione (dati in cache) => ms.
 * @returns {Promise<{data:any, fetchedAt:number, stale:boolean}>}
 */
export async function cached(key, ttl, loader, { force = false } = {}) {
  const now = Date.now();
  const hit = memory.get(key) || readStore(key);
  const maxAge = hit ? (typeof ttl === "function" ? ttl(hit.d) : ttl) : 0;
  if (!force && hit && now - hit.t < maxAge) {
    memory.set(key, hit);
    return { data: hit.d, fetchedAt: hit.t, stale: false };
  }
  if (inflight.has(key)) return inflight.get(key);

  const p = (async () => {
    try {
      const d = await loader();
      const entry = { t: Date.now(), d };
      memory.set(key, entry);
      writeStore(key, entry);
      return { data: d, fetchedAt: entry.t, stale: false };
    } catch (err) {
      if (hit) return { data: hit.d, fetchedAt: hit.t, stale: true };
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

// ---------------------------------------------------------------------------
// Normalizzazione
// ---------------------------------------------------------------------------

function darkLogo(t) {
  const logos = t.logos || [];
  const dark = logos.find((l) => (l.rel || []).includes("dark"));
  if (dark) return dark.href;
  const href = logos[0]?.href || t.logo || "";
  return href.replace("/teamlogos/nfl/500/", "/teamlogos/nfl/500-dark/");
}

function lightLogo(t) {
  const logos = t.logos || [];
  const def = logos.find((l) => (l.rel || []).includes("default")) || logos[0];
  return def?.href || t.logo || "";
}

export function normTeam(t = {}) {
  return {
    id: String(t.id),
    abbr: t.abbreviation || "",
    name: t.displayName || `${t.location || ""} ${t.name || ""}`.trim(),
    short: t.shortDisplayName || t.name || "",
    nickname: t.name || t.nickname || "",
    location: t.location || (t.displayName || "").replace(t.name || "", "").trim(),
    slug: t.slug || "",
    color: t.color ? `#${t.color}` : null,
    alt: t.alternateColor ? `#${t.alternateColor}` : null,
    logo: darkLogo(t),
    logoLight: lightLogo(t),
  };
}

function statsMap(stats = []) {
  const m = {};
  for (const s of stats) {
    const k = (s.type || s.name || "").toLowerCase();
    m[k] = s;
  }
  return m;
}

function normStandingEntry(e) {
  const s = statsMap(e.stats);
  const v = (k) => s[k]?.value ?? null;
  const dv = (k) => s[k]?.displayValue ?? s[k]?.summary ?? "";
  return {
    team: normTeam(e.team),
    w: v("wins") ?? 0,
    l: v("losses") ?? 0,
    t: v("ties") ?? 0,
    pct: dv("winpercent"),
    pf: v("pointsfor") ?? 0,
    pa: v("pointsagainst") ?? 0,
    diff: v("pointdifferential") ?? v("differential") ?? 0,
    streak: dv("streak"),
    seed: v("playoffseed"),
    gb: dv("gamesbehind"),
    clincher: dv("clincher"),
    home: dv("home"),
    road: dv("road"),
    div: dv("vsdiv") || dv("divisionrecord"),
    conf: dv("vsconf"),
    record: dv("total"),
  };
}

const DIV_ORDER = ["North", "South", "East", "West"];

async function loadStandings() {
  const [conf, div] = await Promise.all([fetchJSON(STANDINGS), fetchJSON(`${STANDINGS}?level=3`)]);

  const conferences = (conf.children || []).map((c) => ({
    abbr: c.abbreviation,
    name: c.name,
    teams: (c.standings?.entries || [])
      .map(normStandingEntry)
      .sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99)),
  }));

  const divisions = [];
  for (const c of div.children || []) {
    for (const d of c.children || []) {
      divisions.push({
        conf: c.abbreviation,
        name: d.name,
        short: d.name.replace(`${c.abbreviation} `, ""),
        teams: (d.standings?.entries || []).map(normStandingEntry),
      });
    }
  }
  divisions.sort(
    (a, b) =>
      a.conf.localeCompare(b.conf) || DIV_ORDER.indexOf(a.short) - DIV_ORDER.indexOf(b.short)
  );

  const byTeam = {};
  for (const d of divisions) for (const t of d.teams) byTeam[t.team.id] = { conf: d.conf, division: d.name };

  return {
    season: conf.season || {},
    seasonName: conf.children?.[0]?.standings?.seasonDisplayName || "",
    conferences,
    divisions,
    byTeam,
  };
}

export const getStandings = (opts) => cached("standings", TTL.standings, loadStandings, opts);

// ---------------------------------------------------------------------------

function normCompetitor(c) {
  return {
    team: normTeam(c.team),
    score: c.score != null && c.score !== "" ? Number(c.score?.value ?? c.score) : null,
    winner: !!c.winner,
    record: c.records?.find((r) => r.type === "total")?.summary || "",
  };
}

function normGame(ev) {
  const comp = ev.competitions?.[0] || {};
  const st = ev.status?.type || comp.status?.type || {};
  const comps = (comp.competitors || []).map((c) => ({ ...normCompetitor(c), homeAway: c.homeAway }));
  const status = ev.status || comp.status || {};
  return {
    id: ev.id,
    date: ev.date,
    state: st.state || "pre",
    completed: !!st.completed,
    statusName: st.name || "",
    detail: st.shortDetail || st.detail || "",
    clock: status.displayClock || "",
    period: status.period || 0,
    neutral: !!comp.neutralSite,
    venue: comp.venue ? { name: comp.venue.fullName, city: comp.venue.address?.city || "", country: comp.venue.address?.country || "" } : null,
    tv: (comp.broadcasts || []).flatMap((b) => b.names || []).join(", "),
    note: comp.notes?.[0]?.headline || "",
    week: ev.week?.number ?? null,
    seasonType: ev.season?.type ?? null,
    home: comps.find((c) => c.homeAway === "home") || comps[0],
    away: comps.find((c) => c.homeAway === "away") || comps[1],
  };
}

function normCalendar(cal = []) {
  const out = [];
  for (const block of cal) {
    for (const e of block.entries || []) {
      out.push({
        seasonType: Number(block.value),
        week: Number(e.value),
        label: e.label,
        start: e.startDate,
        end: e.endDate,
      });
    }
  }
  return out;
}

async function loadScoreboard(params) {
  const qs = new URLSearchParams(params).toString();
  const json = await fetchJSON(`${SITE}/scoreboard${qs ? `?${qs}` : ""}`);
  return {
    season: json.season || {},
    week: json.week?.number ?? null,
    calendar: normCalendar(json.leagues?.[0]?.calendar),
    games: (json.events || []).map(normGame).sort((a, b) => new Date(a.date) - new Date(b.date)),
  };
}

/** Scoreboard della settimana corrente (params vuoto) o di una settimana specifica. */
export function getScoreboard({ seasonType, week, year } = {}, opts = {}) {
  const params = {};
  if (seasonType) params.seasontype = seasonType;
  if (week) params.week = week;
  if (year) params.dates = year;
  const key = `scoreboard:${params.dates || ""}:${params.seasontype || ""}:${params.week || "now"}`;
  const ttl = opts.ttl ?? TTL.scoreboard;
  return cached(key, ttl, () => loadScoreboard(params), opts);
}

// ---------------------------------------------------------------------------

// Elenco squadre. L'endpoint /teams di ESPN non invia l'header CORS, quindi il
// browser lo blocca: usiamo /groups (stessi dati di base + loghi, CORS abilitato)
// e completiamo con i colori ufficiali ESPN qui sotto. I colori della singola
// squadra arrivano comunque live da /teams/{id} nella pagina squadra.
const TEAM_COLORS = {
  ARI: ["a40227", "ffffff"],
  ATL: ["a71930", "000000"],
  BAL: ["29126f", "000000"],
  BUF: ["00338d", "d50a0a"],
  CAR: ["0085ca", "000000"],
  CHI: ["0b1c3a", "e64100"],
  CIN: ["fb4f14", "000000"],
  CLE: ["472a08", "ff3c00"],
  DAL: ["002a5c", "b0b7bc"],
  DEN: ["0a2343", "fc4c02"],
  DET: ["0076b6", "bbbbbb"],
  GB: ["204e32", "ffb612"],
  HOU: ["021018", "eb0028"],
  IND: ["003b75", "ffffff"],
  JAX: ["007487", "d7a22a"],
  KC: ["e31837", "ffb612"],
  LAC: ["0080c6", "ffc20e"],
  LAR: ["003594", "ffd100"],
  LV: ["000000", "a5acaf"],
  MIA: ["008e97", "fc4c02"],
  MIN: ["4f2683", "ffc62f"],
  NE: ["002a5c", "c60c30"],
  NO: ["d3bc8d", "000000"],
  NYG: ["003c7f", "c9243f"],
  NYJ: ["115740", "ffffff"],
  PHI: ["06424d", "000000"],
  PIT: ["000000", "ffb612"],
  SEA: ["002a5c", "69be28"],
  SF: ["aa0000", "b3995d"],
  TB: ["bd1c36", "3e3a35"],
  TEN: ["4495d2", "001532"],
  WSH: ["5a1414", "ffb612"],
};

async function loadTeams() {
  const json = await fetchJSON(`${SITE}/groups`);
  return (json.groups || [])
    .flatMap((g) => g.children || [])
    .flatMap((d) => d.teams || [])
    .map((t) => {
      const [c, a] = TEAM_COLORS[t.abbreviation] || [];
      return normTeam({ ...t, color: t.color || c, alternateColor: t.alternateColor || a });
    });
}
export const getTeams = (opts) => cached("teams", TTL.teams, loadTeams, opts);

function recordItems(items = []) {
  const out = {};
  for (const it of items) {
    const stats = {};
    for (const s of it.stats || []) stats[s.name] = s.value;
    out[it.type] = { summary: it.summary, stats };
  }
  return out;
}

async function loadTeam(id) {
  const json = await fetchJSON(`${SITE}/teams/${id}`);
  const t = json.team || {};
  const v = t.franchise?.venue;
  return {
    ...normTeam(t),
    standingSummary: t.standingSummary || "",
    record: recordItems(t.record?.items),
    venue: v
      ? {
          name: v.fullName,
          city: v.address?.city || "",
          state: v.address?.state || "",
          indoor: !!v.indoor,
          grass: !!v.grass,
          image: v.images?.[0]?.href || null,
        }
      : null,
  };
}
export const getTeam = (id, opts) => cached(`team:${id}`, TTL.team, () => loadTeam(id), opts);

const ROSTER_GROUPS = {
  offense: "Attacco",
  defense: "Difesa",
  specialTeam: "Special Teams",
  injuredReserveOrOut: "Infortunati / Out",
  suspended: "Sospesi",
  practiceSquad: "Practice Squad",
};

async function loadRoster(id) {
  const json = await fetchJSON(`${SITE}/teams/${id}/roster`);
  const coach = json.coach?.[0];
  return {
    coach: coach ? { name: `${coach.firstName} ${coach.lastName}`.trim(), experience: coach.experience } : null,
    groups: (json.athletes || [])
      .filter((g) => (g.items || []).length)
      .map((g) => ({
        key: g.position,
        label: ROSTER_GROUPS[g.position] || g.position,
        players: g.items.map((a) => ({
          id: a.id,
          name: a.displayName || a.fullName,
          first: a.firstName || "",
          last: a.lastName || "",
          jersey: a.jersey || "",
          pos: a.position?.abbreviation || "",
          posName: a.position?.displayName || "",
          age: a.age ?? null,
          height: a.height ?? null, // pollici
          weight: a.weight ?? null, // libbre
          exp: a.experience?.years ?? null,
          college: a.college?.shortName || a.college?.name || "",
          headshot: a.headshot?.href || null,
          injury: a.injuries?.[0]?.status || "",
        })),
      })),
  };
}
export const getRoster = (id, opts) => cached(`roster:${id}`, TTL.roster, () => loadRoster(id), opts);

async function loadSchedule(id, { season, seasonType } = {}) {
  const qs = new URLSearchParams();
  if (season) qs.set("season", season);
  if (seasonType) qs.set("seasontype", seasonType);
  const json = await fetchJSON(`${SITE}/teams/${id}/schedule${qs.toString() ? `?${qs}` : ""}`);
  return {
    season: json.season || {},
    byeWeek: json.byeWeek ?? null,
    events: (json.events || []).map((ev) => {
      const comp = ev.competitions?.[0] || {};
      const st = comp.status?.type || {};
      const cs = comp.competitors || [];
      const us = cs.find((c) => String(c.team?.id) === String(id)) || cs[0] || {};
      const them = cs.find((c) => c !== us) || {};
      const score = (c) => (c.score == null ? null : Number(c.score.value ?? c.score));
      return {
        id: ev.id,
        date: ev.date,
        week: ev.week?.number ?? null,
        weekText: ev.week?.text || "",
        seasonType: ev.seasonType?.type ?? null,
        seasonYear: ev.season?.year ?? season ?? null,
        state: st.state || "pre",
        completed: !!st.completed,
        home: us.homeAway === "home",
        opp: normTeam(them.team || {}),
        us: score(us),
        them: score(them),
        result: us.winner === true ? "W" : them.winner === true ? "L" : st.completed ? "T" : "",
        timeValid: comp.timeValid !== false, // false: data/ora ancora da definire (es. Week 18)
        tv: (comp.broadcasts || []).map((b) => b.media?.shortName).filter(Boolean).join(", "),
      };
    }),
  };
}
/**
 * Calendario squadra: stagione corrente (default) o una stagione/fase specifica.
 * `params.past = true` (stagione già conclusa secondo ESPN) allunga la cache a 30 giorni.
 */
export function getSchedule(id, opts = {}, params = {}) {
  const { season, seasonType, past } = params;
  return cached(
    `schedule:${id}:${season || "now"}:${seasonType || ""}`,
    past ? TTL.history : TTL.schedule,
    () => loadSchedule(id, { season, seasonType }),
    opts
  );
}

// ---------------------------------------------------------------------------
// Navigazione tra settimane (pre-season, regular season, postseason)
// ---------------------------------------------------------------------------

/** Indice della settimana corrente nel calendario appiattito di uno scoreboard. */
export function currentWeekIndex(sb) {
  const cal = sb.calendar || [];
  const type = Number(sb.season?.type);
  // 1) la settimana che ESPN indica come corrente
  let i = cal.findIndex((e) => e.seasonType === type && e.week === Number(sb.week));
  if (i > -1) return i;
  // 2) la settimana del calendario ESPN che contiene oggi
  const now = Date.now();
  i = cal.findIndex((e) => new Date(e.start) <= now && now <= new Date(e.end));
  if (i > -1) return i;
  // 3) pausa tra una settimana e l'altra / off-season: la prossima in calendario, altrimenti l'ultima
  i = cal.findIndex((e) => new Date(e.start) > now);
  return i > -1 ? i : cal.length - 1;
}

/** Scoreboard di una voce del calendario (con TTL lungo se la settimana è conclusa). */
export function getWeek(entry, year, opts = {}) {
  const past = new Date(entry.end).getTime() < Date.now() - 12 * 3600 * 1000;
  return getScoreboard(
    { seasonType: entry.seasonType, week: entry.week, year },
    { ttl: past ? TTL.scoreboardPast : TTL.scoreboard, ...opts }
  );
}

// ---------------------------------------------------------------------------
// Profilo partita (summary ESPN)
// ---------------------------------------------------------------------------

const INJ_IT = {
  Out: "Out",
  Doubtful: "In dubbio",
  Questionable: "Incerto",
  Probable: "Probabile",
  "Injured Reserve": "Injured Reserve",
  "Physically Unable to Perform": "PUP",
  Suspension: "Squalificato",
  "Day-To-Day": "Giorno per giorno",
};

const BODY_IT = {
  Knee: "Ginocchio", Ankle: "Caviglia", Hamstring: "Bicipite femorale", Shoulder: "Spalla", Concussion: "Commozione cerebrale",
  Back: "Schiena", Foot: "Piede", Hip: "Anca", Groin: "Inguine", Calf: "Polpaccio", Quadriceps: "Quadricipite", Finger: "Dito",
  Hand: "Mano", Wrist: "Polso", Elbow: "Gomito", Neck: "Collo", Chest: "Torace", Ribs: "Costole", Toe: "Dito del piede",
  Achilles: "Tendine d'Achille", Thigh: "Coscia", Abdomen: "Addome", Illness: "Malattia", Personal: "Motivi personali",
  Shin: "Tibia", Pectoral: "Pettorale", Oblique: "Obliquo", Thumb: "Pollice", Heel: "Tallone", Head: "Testa",
  Forearm: "Avambraccio", Biceps: "Bicipite", Triceps: "Tricipite", Leg: "Gamba", Arm: "Braccio",
  "Lower Leg": "Gamba", Face: "Volto", Eye: "Occhio", Jaw: "Mascella", Glute: "Gluteo", Lung: "Polmone",
  Rest: "Riposo", "Not Injury Related": "Non legato a infortuni", Undisclosed: "",
};
const SIDE_IT = { Right: "lato destro", Left: "lato sinistro", Bilateral: "entrambi i lati" };

function boxCategory(cat) {
  return {
    labels: cat.labels || [],
    athletes: (cat.athletes || []).map((a) => ({
      id: a.athlete?.id,
      name: a.athlete?.displayName || "",
      jersey: a.athlete?.jersey || "",
      headshot: a.athlete?.headshot?.href || null,
      stats: a.stats || [],
    })),
  };
}

async function loadSummary(id) {
  const json = await fetchJSON(`${SITE}/summary?event=${id}`);
  const comp = json.header?.competitions?.[0] || {};
  const st = comp.status?.type || {};
  const side = (c) => ({
    homeAway: c.homeAway,
    team: normTeam(c.team || {}),
    score: c.score != null && c.score !== "" ? Number(c.score) : null,
    winner: !!c.winner,
    record: (c.record || []).find((r) => r.type === "total")?.summary || "",
    linescores: (c.linescores || []).map((l) => Number(l.displayValue ?? l.value ?? 0)),
  });
  const cs = (comp.competitors || []).map(side);
  const home = cs.find((c) => c.homeAway === "home") || cs[0];
  const away = cs.find((c) => c.homeAway === "away") || cs[1];

  // Statistiche di squadra a confronto (stesso ordine per entrambe)
  const bt = json.boxscore?.teams || [];
  const statsOf = (tid) => bt.find((t) => String(t.team?.id) === String(tid))?.statistics || [];
  const hs = statsOf(home?.team.id), as = statsOf(away?.team.id);
  const teamStats = hs.map((s, i) => ({ name: s.name, label: s.label, home: s.displayValue, away: as[i]?.displayValue ?? "" }));

  const players = {};
  for (const p of json.boxscore?.players || []) {
    const cats = {};
    for (const c of p.statistics || []) cats[c.name] = boxCategory(c);
    players[p.team?.id] = cats;
  }

  const injuries = {};
  for (const t of json.injuries || []) {
    injuries[t.team?.id] = (t.injuries || []).map((i) => ({
      id: i.athlete?.id,
      name: i.athlete?.displayName || "",
      pos: i.athlete?.position?.abbreviation || "",
      headshot: i.athlete?.headshot?.href || null,
      status: INJ_IT[i.status] || i.status || "",
      statusKey: i.type?.abbreviation || "",
      type: i.details?.type ? BODY_IT[i.details.type] ?? i.details.type : "",
      side: SIDE_IT[i.details?.side] || "",
      returnDate: i.details?.returnDate || null,
    }));
  }

  const lastFive = {};
  for (const t of json.lastFiveGames || []) {
    lastFive[t.team?.id] = (t.events || []).map((e) => ({
      id: e.id,
      date: e.gameDate,
      week: e.week,
      atVs: e.atVs,
      opp: normTeam(e.opponent || {}),
      result: e.gameResult || "",
      score: e.score || "",
    }));
  }

  return {
    id: String(id),
    date: comp.date,
    state: st.state || "pre",
    completed: !!st.completed,
    statusName: st.name || "",
    detail: st.shortDetail || st.detail || "",
    period: comp.status?.period || 0,
    clock: comp.status?.displayClock || "",
    seasonType: json.header?.season?.type ?? null,
    year: json.header?.season?.year ?? null,
    week: json.header?.week ?? null,
    neutral: !!comp.neutralSite,
    venue: json.gameInfo?.venue
      ? { name: json.gameInfo.venue.fullName, city: json.gameInfo.venue.address?.city || "", state: json.gameInfo.venue.address?.state || "", grass: !!json.gameInfo.venue.grass }
      : null,
    attendance: json.gameInfo?.attendance || null,
    weatherF: json.gameInfo?.weather?.temperature ?? null,
    tvUS: [...new Set([...(json.broadcasts || []), ...(comp.broadcasts || [])].map((b) => b.media?.shortName || b.station).filter(Boolean))],
    home,
    away,
    teamStats,
    players,
    injuries,
    lastFive,
    // Foto della partita: miniature 1920×1080 dei video highlights (con titolo) e immagini del recap.
    photos: [
      ...(json.videos || []).filter((v) => v.thumbnail).map((v) => ({ url: v.thumbnail, title: v.headline || "" })),
      ...((json.article && json.article.images) || []).filter((im) => im.url).map((im) => ({ url: im.url, title: im.caption || json.article.headline || "" })),
    ],
    scoringPlays: (json.scoringPlays || []).map((p) => ({
      period: p.period?.number ?? 0,
      clock: p.clock?.displayValue || "",
      teamId: p.team?.id,
      type: p.type?.text || p.scoringType?.displayName || "",
      abbr: p.scoringType?.abbreviation || "",
      text: p.text || "",
      away: p.awayScore,
      home: p.homeScore,
    })),
  };
}

export const getSummary = (id, opts) =>
  cached(
    `summary:${id}`,
    (d) => (d.state === "post" ? TTL.summaryPost : d.state === "in" ? TTL.summaryLive : TTL.summaryPre),
    () => loadSummary(id),
    opts
  );

/**
 * Scontri diretti: calendari della squadra A nelle ultime `seasons` stagioni
 * (regular season + playoff), filtrati sull'avversario B. Le stagioni concluse
 * restano in cache 30 giorni, quindi le chiamate pesanti si fanno una volta sola.
 */
export async function getHeadToHead(teamA, teamB, currentYear, seasons = 6) {
  const years = Array.from({ length: seasons }, (_, i) => currentYear - i);
  // currentYear arriva dal summary ESPN della partita: le stagioni precedenti sono concluse.
  const jobs = years.flatMap((y) => [2, 3].map((t) => getSchedule(teamA, {}, { season: y, seasonType: t, past: y < currentYear }).catch(() => null)));
  const all = (await Promise.all(jobs)).filter(Boolean);
  const seen = new Set();
  const games = [];
  for (const res of all) {
    for (const e of res.data.events) {
      if (e.opp.id !== String(teamB) || seen.has(e.id)) continue;
      seen.add(e.id);
      games.push(e);
    }
  }
  games.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { games, fromYear: years[years.length - 1], toYear: currentYear };
}

// ---------------------------------------------------------------------------
// Profilo giocatore
// ---------------------------------------------------------------------------

async function loadAthlete(id) {
  const json = await fetchJSON(`${ATHLETE}/${id}`);
  const a = json.athlete || {};
  return {
    id: String(a.id),
    name: a.displayName || a.fullName || "",
    first: a.firstName || "",
    last: a.lastName || "",
    jersey: a.jersey || "",
    pos: a.position?.abbreviation || "",
    posName: a.position?.displayName || "",
    team: a.team ? normTeam(a.team) : null,
    age: a.age ?? null,
    height: a.displayHeight || "",
    weight: a.displayWeight || "",
    dob: a.displayDOB || "",
    birthPlace: a.displayBirthPlace || "",
    college: a.college?.name || a.college?.shortName || "",
    experience: a.displayExperience || "",
    draft: a.displayDraft || "",
    headshot: a.headshot?.href || null,
    status: a.status?.name || "",
    summary: {
      label: a.statsSummary?.displayName || "",
      stats: (a.statsSummary?.statistics || []).map((s) => ({ label: s.shortDisplayName || s.displayName, abbr: s.abbreviation, value: s.displayValue, rank: s.rankDisplayValue || "" })),
    },
  };
}
export const getAthlete = (id, opts) => cached(`athlete:${id}`, TTL.athlete, () => loadAthlete(id), opts);

async function loadAthleteStats(id) {
  const json = await fetchJSON(`${ATHLETE}/${id}/stats`);
  return (json.categories || []).map((c) => ({
    name: c.name,
    title: c.displayName,
    labels: c.labels || [],
    names: c.displayNames || [],
    rows: (c.statistics || []).map((r) => ({ year: r.season?.year, team: r.teamSlug || "", teamId: r.teamId || "", stats: r.stats || [] })),
    totals: c.totals || [],
  }));
}
export const getAthleteStats = (id, opts) => cached(`athstats:${id}`, TTL.athleteStats, () => loadAthleteStats(id), opts);

// Foto ESPN legate al giocatore: notizie del profilo + notizie fantasy (immagini con didascalia e data).
async function loadPlayerMedia(id) {
  const [ov, fan] = await Promise.allSettled([
    fetchJSON(`${ATHLETE}/${id}/overview`),
    fetchJSON(`https://site.api.espn.com/apis/fantasy/v2/games/ffl/news/players?playerId=${id}&limit=50`),
  ]);
  const items = [...(ov.status === "fulfilled" ? ov.value.news || [] : []), ...(fan.status === "fulfilled" ? fan.value.feed || [] : [])];
  const out = [];
  for (const a of items) {
    for (const im of a.images || []) {
      if (!im.url) continue;
      out.push({ url: im.url, caption: im.caption || im.alt || "", headline: a.headline || "", published: a.published || a.lastModified || "", width: im.width || 0 });
    }
  }
  return out;
}
export const getPlayerMedia = (id, opts) => cached(`pmedia:${id}`, TTL.gamelog, () => loadPlayerMedia(id), opts);

// Foto dal web fuori da ESPN: Wikimedia Commons (API pubblica con CORS, immagini a licenza libera).
async function loadWebPhotos(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(`${query} filetype:bitmap`)}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1600`;
  const json = await fetchJSON(url);
  return Object.values(json.query?.pages || {})
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map((pg) => ({ pg, ii: pg.imageinfo?.[0] }))
    .filter(({ ii }) => ii && /^image\/(jpeg|png|webp)$/.test(ii.mime || "") && (ii.width || 0) >= 600)
    .map(({ pg, ii }) => ({ url: ii.thumburl || ii.url, title: pg.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, "") }));
}
export const getWebPhotos = (query, opts) => cached(`web:${query}`, TTL.athlete, () => loadWebPhotos(query), opts);

async function loadGamelog(id) {
  const json = await fetchJSON(`${ATHLETE}/${id}/gamelog`);
  const events = {};
  for (const [eid, e] of Object.entries(json.events || {})) {
    events[eid] = {
      id: eid,
      week: e.week,
      date: e.gameDate,
      atVs: e.atVs,
      opp: normTeam(e.opponent || {}),
      result: e.gameResult || "",
      score: e.score || "",
    };
  }
  return {
    labels: json.labels || [],
    names: json.displayNames || [],
    keys: json.names || [], // nomi tecnici (es. "completions"), per le somme del Confronto giocatori
    groups: (json.categories || []).map((c) => ({ name: c.name || "", title: c.displayName, count: c.count || 0 })),
    blocks: (json.seasonTypes || []).map((st) => ({
      title: st.displayName,
      team: st.displayTeam || "",
      rows: (st.categories || []).flatMap((c) => c.events || []).map((e) => ({ eventId: e.eventId, stats: e.stats || [] })),
      totals: st.summary?.stats?.[0]?.stats || [],
    })),
    events,
  };
}
export const getGamelog = (id, opts) => cached(`gamelog:${id}`, TTL.gamelog, () => loadGamelog(id), opts);

// ---------------------------------------------------------------------------
// Classifiche statistiche complete (pagina Statistiche)
// ---------------------------------------------------------------------------

const STATS_BASE = "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/statistics";

/**
 * Tutti i giocatori con dati per una statistica (anche non "qualificati").
 * `def` = { category: "offense:passing", group: "passing", field: "passingYards", extra?: [{group, field}] }
 */
async function loadAthleteRanking(def, seasonType) {
  const qs = new URLSearchParams({ isqualified: "false", limit: "1000", category: def.category, sort: `${def.group}.${def.field}:desc` });
  if (seasonType) qs.set("seasontype", seasonType);
  const json = await fetchJSON(`${STATS_BASE}/byathlete?${qs}`);
  const names = {};
  for (const c of json.categories || []) names[c.name.toLowerCase()] = c.names || [];
  const pick = (a, group, field) => {
    const cat = (a.categories || []).find((c) => c.name.toLowerCase() === group.toLowerCase());
    const i = (names[group.toLowerCase()] || []).indexOf(field);
    return cat && i > -1 ? cat.values?.[i] ?? null : null;
  };
  const season = json.requestedSeason || json.currentSeason || {};
  return {
    year: season.year ?? null,
    seasonType: season.type?.name || "",
    rows: (json.athletes || []).map((a) => {
      const at = a.athlete || {};
      return {
        id: at.id,
        name: at.displayName || "",
        pos: at.position?.abbreviation || "",
        headshot: at.headshot?.href || null,
        team: at.teamId ? { id: String(at.teamId), abbr: at.teamShortName || "", name: at.teamName || at.teamShortName || "", short: at.teamShortName || "", logo: (at.teamLogos?.[0]?.href || "").replace("/500/", "/500-dark/"), logoLight: at.teamLogos?.[0]?.href || "" } : null,
        gp: pick(a, "general", "gamesPlayed"),
        value: pick(a, def.group, def.field),
        qual: def.qual ? pick(a, def.qual.group, def.qual.field) : null, // es. tentativi, per la soglia minima
        extra: (def.extra || []).map((e) => pick(a, e.group, e.field)),
      };
    }),
  };
}
/** Stessa statistica = stessa richiesta (la versione "a partita" riusa i totali in cache). */
export function getAthleteRanking(def, opts) {
  const f = (x) => (x ? `${x.group}.${x.field}` : "");
  const key = ["rank:athlete", def.category, f(def), f(def.qual), ...(def.extra || []).map(f)].join("|");
  return cached(key, TTL.rankings, () => loadAthleteRanking(def), opts);
}

/** Statistiche di tutte le 32 squadre: proprie (splitId 0) e degli avversari (splitId 900). */
async function loadTeamStats() {
  const json = await fetchJSON(`${STATS_BASE}/byteam`);
  const names = {};
  for (const c of json.categories || []) names[c.name] = c.names || [];
  const season = json.requestedSeason || json.currentSeason || {};
  return {
    year: season.year ?? null,
    seasonType: season.type?.name || "",
    teams: (json.teams || []).map((t) => {
      const own = {}, opp = {};
      for (const c of t.categories || []) {
        const target = String(c.splitId) === "900" ? opp : own;
        const n = names[c.name] || [];
        target[c.name] = {};
        n.forEach((field, i) => {
          if (!(field in target[c.name])) target[c.name][field] = c.values?.[i] ?? null;
        });
      }
      return { team: normTeam(t.team || {}), own, opp };
    }),
  };
}
export const getTeamStats = (opts) => cached("rank:teams", TTL.rankings, loadTeamStats, opts);

/** Red zone % (touchdown) per squadra: dato presente solo nelle statistiche della singola squadra. */
async function loadRedZone(id) {
  const json = await fetchJSON(`${SITE}/teams/${id}/statistics`);
  for (const c of json.results?.stats?.categories || []) {
    const s = (c.stats || []).find((x) => x.name === "redzoneTouchdownPct");
    if (s) return s.value ?? null;
  }
  return null;
}
export const getRedZone = (id, opts) => cached(`redzone:${id}`, TTL.rankings * 2, () => loadRedZone(id), opts);
