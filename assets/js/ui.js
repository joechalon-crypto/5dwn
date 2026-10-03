// ============================================================================
// UI condivisa: header, footer, stati di caricamento/errore, formattazione.
// ============================================================================

import { SITO } from "../../content/sito.js?v=202610030319";
import { TV_ITALIA, TV_ITALIA_PLACEHOLDER } from "../../content/tv-italia.js?v=202610030319";

export const TZ = "Europe/Rome";

const NAV = [
  { href: "index.html", label: "Home", id: "home" },
  { href: "classifiche.html", label: "Classifiche", id: "classifiche" },
  { href: "calendario.html", label: "Calendario e Risultati", id: "calendario" },
  { href: "statistiche.html", label: "Statistiche", id: "statistiche" },
  { href: "squadre.html", label: "Squadre", id: "squadre" },
];

export const ICONS = {
  instagram:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
  youtube:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15.1V8.9l5.8 3.1-5.8 3.1Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// ---------------------------------------------------------------------------
// Tema chiaro / scuro (scelta salvata in localStorage, default: scuro)
// ---------------------------------------------------------------------------

const THEME_KEY = "5dwn-theme";
const LOGO = { dark: "assets/img/logo-5dwn.png", light: "assets/img/logo-5dwn-nero.png" };
const THEME_COLOR = { dark: "#0a1730", light: "#f3f4f7" };

export const getTheme = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

export function applyTheme(theme, save = false) {
  const t = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = t;
  document.querySelectorAll("img.site-logo").forEach((img) => {
    if (img.getAttribute("src") !== LOGO[t]) img.setAttribute("src", LOGO[t]);
  });
  document.querySelectorAll("img.team-logo").forEach((img) => {
    const next = t === "light" ? img.dataset.logoLight : img.dataset.logoDark;
    if (next && img.getAttribute("src") !== next) {
      delete img.dataset.failed;
      img.setAttribute("src", next);
    }
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[t]);
  const btn = document.querySelector(".theme-toggle");
  if (btn) {
    btn.innerHTML = t === "light" ? ICONS.moon : ICONS.sun;
    btn.setAttribute("aria-label", t === "light" ? "Passa al tema scuro" : "Passa al tema chiaro");
    btn.setAttribute("title", t === "light" ? "Tema scuro" : "Tema chiaro");
  }
  if (save) {
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* senza storage la scelta vale solo per questa pagina */
    }
  }
}

// ---------------------------------------------------------------------------
// Header / footer
// ---------------------------------------------------------------------------

export function renderChrome(active) {
  const header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML = `
      <div class="container bar">
        <a class="brand" href="index.html" aria-label="5DWN — Home">
          <img class="site-logo" src="${LOGO[getTheme()]}" alt="5DWN" width="1220" height="293">
        </a>
        <nav class="site-nav" id="site-nav" aria-label="Navigazione principale">
          <ul>${NAV.map(
            (n) => `<li><a href="${n.href}"${n.id === active ? ' aria-current="page"' : ""}>${n.label}</a></li>`
          ).join("")}</ul>
        </nav>
        <div class="header-actions">
          <button class="theme-toggle icon-btn" type="button"></button>
          <button class="nav-toggle icon-btn" aria-expanded="false" aria-controls="site-nav" aria-label="Apri menu">${ICONS.menu}</button>
        </div>
      </div>`;
    header.querySelector(".theme-toggle").addEventListener("click", () => applyTheme(getTheme() === "light" ? "dark" : "light", true));
    const btn = header.querySelector(".nav-toggle");
    const nav = header.querySelector(".site-nav");
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      btn.innerHTML = open ? ICONS.close : ICONS.menu;
    });
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    const s = SITO.social;
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="container">
        <div class="grid">
          <div>
            <img class="site-logo" src="${LOGO[getTheme()]}" alt="5DWN" width="1220" height="293">
            <p class="payoff">${esc(SITO.payoff)}</p>
            <p>${esc(SITO.descrizione)}</p>
          </div>
          <div>
            <strong>Sezioni</strong>
            <ul>${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join("")}</ul>
          </div>
          <div>
            <strong>Seguici</strong>
            <ul>
              <li><a href="${s.instagram.url}" target="_blank" rel="noopener">Instagram ${esc(s.instagram.handle)}</a></li>
              <li><a href="${s.youtube.url}" target="_blank" rel="noopener">YouTube · ${esc(s.youtube.handle)}</a></li>
            </ul>
          </div>
        </div>
        <p class="legal">© ${new Date().getFullYear()} 5DWN · quintodwn. Dati e loghi delle squadre: ESPN / NFL, di proprietà dei rispettivi titolari. Sito non affiliato alla NFL.</p>
      </div>`;
  }

  // Loghi: se la variante "dark" non esiste, ripiega sulla versione standard.
  applyTheme(getTheme());

  document.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (img.tagName === "IMG" && img.dataset.fallback && !img.dataset.failed) {
        img.dataset.failed = "1";
        img.src = img.dataset.fallback;
      }
    },
    true
  );
}

// ---------------------------------------------------------------------------
// Immagini ESPN ridimensionate (molto più leggere dei PNG 500px originali)
// ---------------------------------------------------------------------------

export function espnImg(href, w, h = w) {
  if (!href) return "";
  const m = href.match(/^https:\/\/a\.espncdn\.com(\/i\/.+\.png)$/);
  if (!m) return href;
  return `https://a.espncdn.com/combiner/i?img=${m[1]}&w=${w}&h=${h}&transparent=true`;
}

/** Logo squadra: variante "dark" (ESPN 500-dark) nel tema scuro, standard nel tema chiaro. */
export function teamLogo(team, size = 28, cls = "logo", eager = false) {
  if (!team) return "";
  const px = Math.round(size * 2);
  const dark = espnImg(team.logo || team.logoLight, px);
  const light = espnImg(team.logoLight || team.logo, px);
  const src = getTheme() === "light" ? light : dark;
  return `<img class="${cls} team-logo" src="${src}" data-logo-dark="${esc(dark)}" data-logo-light="${esc(light)}" data-fallback="${esc(team.logoLight || team.logo)}" width="${size}" height="${size}" alt="${esc(team.short || team.abbr)}" loading="${eager ? "eager" : "lazy"}">`;
}

export const teamHref = (team) => `squadra.html?team=${encodeURIComponent((team.abbr || team.id).toLowerCase())}`;
export const gameHref = (id) => `partita.html?id=${encodeURIComponent(id)}`;
export const playerHref = (id) => `giocatore.html?id=${encodeURIComponent(id)}`;

/** Canale TV italiano solo se inserito a mano da fonte ufficiale (content/tv-italia.js). */
export const tvItalia = (id) => TV_ITALIA[String(id)] || null;
export const TV_PLACEHOLDER = TV_ITALIA_PLACEHOLDER;

/** Etichetta TV breve per card e banner: Italia se nota, altrimenti la rete USA (dato ESPN). */
export function tvLabel(g) {
  const it = tvItalia(g.id);
  if (it) return `TV ${it}`;
  return g.tv ? `USA ${g.tv}` : "";
}

// ---------------------------------------------------------------------------
// Stati
// ---------------------------------------------------------------------------

export function loading(el, msg = "Caricamento dati in corso…") {
  el.innerHTML = `<div class="state" role="status"><div class="spinner"></div>${esc(msg)}</div>`;
}

export function showError(el, retry, msg = "Non riusciamo a caricare i dati in questo momento.") {
  el.innerHTML = `<div class="state error" role="alert">
      <span class="label">Errore di caricamento</span>
      <p><strong>${esc(msg)}</strong><br>Controlla la connessione o riprova tra qualche istante.</p>
      ${retry ? '<button class="btn btn-primary" type="button">Riprova</button>' : ""}
    </div>`;
  if (retry) el.querySelector("button").addEventListener("click", retry);
}

export function staleNotice(res) {
  return res?.stale
    ? `<div class="notice">Connessione con ESPN non disponibile: stai vedendo gli ultimi dati salvati (${esc(fmtUpdated(res.fetchedAt))}).</div>`
    : "";
}

export function updatedLine(res) {
  return `<p class="updated">Dati ESPN aggiornati alle ${esc(fmtUpdated(res.fetchedAt))} · si aggiornano automaticamente.</p>`;
}

// ---------------------------------------------------------------------------
// Date in ora italiana
// ---------------------------------------------------------------------------

const fmt = (opts) => new Intl.DateTimeFormat("it-IT", { timeZone: TZ, ...opts });
const fDay = fmt({ weekday: "long", day: "numeric", month: "long" });
const fShort = fmt({ weekday: "short", day: "numeric", month: "short" });
const fTime = fmt({ hour: "2-digit", minute: "2-digit" });
const fKey = fmt({ year: "numeric", month: "2-digit", day: "2-digit" });

export const fmtDay = (d) => fDay.format(new Date(d));
export const fmtShort = (d) => fShort.format(new Date(d));
export const fmtTime = (d) => fTime.format(new Date(d));
export const dayKey = (d) => fKey.format(new Date(d));
export const fmtUpdated = (t) => fmt({ hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(t));

const ROUND_IT = {
  "Hall of Fame Weekend": "Hall of Fame Game",
  "Wild Card": "Wild Card Round",
  "Divisional Round": "Divisional Round",
  "Conference Championship": "Conference Championship",
  "Super Bowl": "Super Bowl",
};
const fDM = fmt({ day: "numeric", month: "short" });
/** "6–15 set": intervallo della settimana in ora italiana. */
export function weekRange(entry) {
  if (!entry?.start) return "";
  const a = new Date(entry.start);
  const b = new Date(new Date(entry.end).getTime() - 12 * 3600 * 1000);
  return `${fDM.format(a)} – ${fDM.format(b)}`;
}

const ROUND_SHORT = { "Wild Card": "Wild Card", "Divisional Round": "Divisional", "Conference Championship": "Conf. Champ.", "Super Bowl": "Super Bowl" };
export const weekShort = (entry) => ROUND_SHORT[entry?.label] || entry?.label || "";

export function weekLabel(entry) {
  if (!entry) return "";
  if (ROUND_IT[entry.label]) return ROUND_IT[entry.label];
  if (entry.seasonType === 1) return entry.label.replace("Preseason Week", "Preseason · Week");
  return entry.label;
}

// ---------------------------------------------------------------------------
// Card partita
// ---------------------------------------------------------------------------

export function statusText(g) {
  if (g.state === "pre") return { text: `${fmtShort(g.date)} · ${fmtTime(g.date)}`, cls: "" };
  if (g.state === "in") {
    const q = g.period > 4 ? "OT" : `Q${g.period}`;
    const txt = /half/i.test(g.detail) ? "Intervallo" : `${q} · ${g.clock}`;
    return { text: `LIVE · ${txt}`, cls: "live" };
  }
  if (/postponed/i.test(g.statusName)) return { text: "Rinviata", cls: "" };
  if (/canceled/i.test(g.statusName)) return { text: "Annullata", cls: "" };
  return { text: /OT/.test(g.detail) ? "Finale (OT)" : "Finale", cls: "" };
}

function teamRow(c, g) {
  if (!c) return "";
  const done = g.state === "post";
  const cls = done ? (c.winner ? "winner" : g.home?.winner || g.away?.winner ? "loser" : "") : "";
  const score = g.state === "pre" ? "" : (c.score ?? "");
  return `<div class="game-team ${cls}">
      ${teamLogo(c.team, 28)}
      <span class="name"><span>${esc(c.team.short)}</span>${c.record ? `<small>${esc(c.record)}</small>` : ""}</span>
      <span class="score">${score}</span>
    </div>`;
}

export function gameCard(g) {
  const st = statusText(g);
  const where = g.venue ? `${g.venue.name}${g.venue.city ? `, ${g.venue.city}` : ""}` : "";
  const right = g.state === "pre" ? esc(tvLabel(g)) : esc(fmtShort(g.date));
  return `<a class="game" href="${gameHref(g.id)}" aria-label="${esc(`${g.away?.team.name} - ${g.home?.team.name}: profilo partita`)}">
      <div class="game-meta"><span class="status ${st.cls}">${esc(st.text)}</span><span>${right}</span></div>
      ${teamRow(g.away, g)}
      ${teamRow(g.home, g)}
      ${where || g.note ? `<div class="game-foot"><span>${esc(g.note || "")}${g.note && where ? " · " : ""}${esc(where)}</span>${g.neutral ? "<span>Campo neutro</span>" : ""}</div>` : ""}
    </a>`;
}

export function groupByDay(games) {
  const map = new Map();
  for (const g of games) {
    const k = dayKey(g.date);
    if (!map.has(k)) map.set(k, { label: fmtDay(g.date), games: [] });
    map.get(k).games.push(g);
  }
  return [...map.values()];
}

export function renderDayGroups(games) {
  return groupByDay(games)
    .map((d) => `<div class="day-group"><h3>${esc(d.label)}</h3><div class="games-grid">${d.games.map(gameCard).join("")}</div></div>`)
    .join("");
}

/** Esegue fn ogni `ms` solo quando la pagina è visibile. */
export function every(ms, fn) {
  let id = null;
  const start = () => { if (!id) id = setInterval(fn, ms); };
  const stop = () => { clearInterval(id); id = null; };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else { fn(); start(); }
  });
  start();
}
