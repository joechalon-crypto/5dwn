// Lower third per i video 5DWN.
import { getRoster, getQualified } from "./assets/js/api.js";
// Fonte di verità: reference/NFL Lower Third Show.dc.html (costanti, curve, palette e logica portate 1:1).

// ---------------------------------------------------------------------------- costanti del prototipo
const T = {
  NFL: ["NFL", "NFL", "nfl"],
  ARI: ["Arizona", "Cardinals", "ari"], ATL: ["Atlanta", "Falcons", "atl"], BAL: ["Baltimore", "Ravens", "bal"], BUF: ["Buffalo", "Bills", "buf"],
  CAR: ["Carolina", "Panthers", "car"], CHI: ["Chicago", "Bears", "chi"], CIN: ["Cincinnati", "Bengals", "cin"], CLE: ["Cleveland", "Browns", "cle"],
  DAL: ["Dallas", "Cowboys", "dal"], DEN: ["Denver", "Broncos", "den"], DET: ["Detroit", "Lions", "det"], GB: ["Green Bay", "Packers", "gb"],
  HOU: ["Houston", "Texans", "hou"], IND: ["Indianapolis", "Colts", "ind"], JAX: ["Jacksonville", "Jaguars", "jax"], KC: ["Kansas City", "Chiefs", "kc"],
  LV: ["Las Vegas", "Raiders", "lv"], LAC: ["Los Angeles", "Chargers", "lac"], LAR: ["Los Angeles", "Rams", "lar"], MIA: ["Miami", "Dolphins", "mia"],
  MIN: ["Minnesota", "Vikings", "min"], NE: ["New England", "Patriots", "ne"], NO: ["New Orleans", "Saints", "no"], NYG: ["New York", "Giants", "nyg"],
  NYJ: ["New York", "Jets", "nyj"], PHI: ["Philadelphia", "Eagles", "phi"], PIT: ["Pittsburgh", "Steelers", "pit"], SF: ["San Francisco", "49ers", "sf"],
  SEA: ["Seattle", "Seahawks", "sea"], TB: ["Tampa Bay", "Buccaneers", "tb"], TEN: ["Tennessee", "Titans", "ten"], WSH: ["Washington", "Commanders", "wsh"],
};
const TC = {
  NFL: ["#013369", "#fff"],
  ARI: ["#C8143C", "#fff"], ATL: ["#D21F3C", "#fff"], BAL: ["#2B1A72", "#fff"], BUF: ["#0B4FC7", "#fff"], CAR: ["#0A85D1", "#fff"], CHI: ["#0B1F44", "#fff"],
  CIN: ["#FB4F14", "#fff"], CLE: ["#FF4A0D", "#fff"], DAL: ["#0E2A55", "#fff"], DEN: ["#FB4F14", "#fff"], DET: ["#0076B6", "#fff"], GB: ["#1F4A3A", "#fff"],
  HOU: ["#0B2554", "#fff"], IND: ["#0A44C2", "#fff"], JAX: ["#0F8FA8", "#fff"], KC: ["#E31837", "#fff"], LV: ["#B5BABD", "#111"], LAC: ["#0A7FE0", "#fff"],
  LAR: ["#0054D6", "#fff"], MIA: ["#139FB0", "#fff"], MIN: ["#4F2683", "#fff"], NE: ["#0B2552", "#fff"], NO: ["#D3BC8D", "#111"], NYG: ["#1C3FC6", "#fff"],
  NYJ: ["#125740", "#fff"], PHI: ["#035E63", "#fff"], PIT: ["#FFB612", "#111"], SF: ["#AA0000", "#fff"], SEA: ["#0E2550", "#fff"], TB: ["#D50A0A", "#fff"],
  TEN: ["#102A5E", "#fff"], WSH: ["#5A1414", "#fff"],
};
const THEMES = {
  orange: { label: "Arancio / Blu", bg: "#E09F58", stripe: "#2A50BC" },
  light: { label: "Chiaro / Nero", bg: "#F2F2F2", stripe: "#000000" },
  blue: { label: "Blu / Chiaro", bg: "#2A50BC", stripe: "#F2F2F2" },
  black: { label: "Nero / Arancio", bg: "#000000", stripe: "#E09F58" },
};
const DEFAULTS = {
  title: "Meglio Lawrence o Burrow domenica?", subtitle: "Passer rating '26: Trevor Lawrence 8° (107.8), Joe Burrow 11° (106.6)",
  box: "stripes", theme: "black", line1: "Duello", line2: "in regia", showLogo: true,
  // player: id ESPN del giocatore (foto profilo standard); "" = PNG caricato/trascinato
  slots: [{ kind: "photo", team: "JAX", player: "4360310" }, { kind: "photo", team: "CIN", player: "3915511" }],
  palette: "classic", colors: null,
  tab: "match", teamA: "JAX", teamB: "CIN", conn: "at", info: "(-2.5) | Domenica, 19:00", tabText: "Week 5 · Anteprima",
  base: true, bg: "checker",
  logoRight: false, // logo 5DWN anche all'estremità destra (sulle curve)
  logoBg: "solid", // sfondo dietro i loghi: "solid" (box pieno) | "fade" (sfumato, tipo First Take)
  img: {}, // zoom/spostamento dei riquadri immagine (le immagini stanno in IndexedDB)
};
const KEY = "nfllowershow.v1";
const PALETTES = {
  classic: { label: "Classico", colors: { panel: "#F2F2F2", curve1: "#E09F58", curve2: "#E09F58", base: "#2A50BC", baseStripe: "#1A3486",
    l1: "#F2F2F2", l2: "#E09F58", title: "#0F1E4A", sub: "#0F1E4A", tabText: "#F2F2F2", tabBg: "#2A50BC" } },
  night: { label: "Notte", colors: { panel: "#000000", curve1: "#E09F58", curve2: "#E09F58", base: "#2A50BC", baseStripe: "#1A3486",
    l1: "#F2F2F2", l2: "#E09F58", title: "#F2F2F2", sub: "#E09F58", tabText: "#000000", tabBg: "#E09F58" } },
  blue: { label: "Blu", colors: { panel: "#2A50BC", curve1: "#F2F2F2", curve2: "#F2F2F2", base: "#000000", baseStripe: "#0F1E4A",
    l1: "#F2F2F2", l2: "#E09F58", title: "#F2F2F2", sub: "#F2F2F2", tabText: "#F2F2F2", tabBg: "#000000" } },
  orange: { label: "Arancio", colors: { panel: "#E09F58", curve1: "#2A50BC", curve2: "#2A50BC", base: "#000000", baseStripe: "#0F1E4A",
    l1: "#F2F2F2", l2: "#E09F58", title: "#000000", sub: "#000000", tabText: "#F2F2F2", tabBg: "#2A50BC" } },
};
const SWATCHES = ["#F2F2F2", "#E09F58", "#2A50BC", "#1A3486", "#0F1E4A", "#000000"];
const SWATCH_NAMES = { "#F2F2F2": "Bianco", "#E09F58": "Arancio", "#2A50BC": "Blu", "#1A3486": "Blu scuro", "#0F1E4A": "Navy", "#000000": "Nero" };
const ROWS = [["panel", "Pannello"], ["curve1", "Linea + curva 1"], ["curve2", "Curva 2"], ["base", "Fascia base"], ["baseStripe", "Strisce fascia"],
  ["title", "Titolo"], ["sub", "Seconda riga"], ["l1", "Box riga 1"], ["l2", "Box riga 2"], ["tabText", "Linguetta testo"], ["tabBg", "Linguetta sfondo"]];
const W = 1920, P = 1830, OW = 40, BOXW = 417;
const T_BASE = 80, S_BASE = 50, T_SOLO = 92;
// logo 5DWN a destra: nello spazio libero del pannello tra il titolo (finisce a P−190) e le curve
const RIGHT_LOGO = { cx: 1712, cy: 76, h: 84 }; // centro e altezza (proporzioni 678×576)
/** Variante del logo leggibile sul colore del pannello. */
function logoForPanel(hex) {
  const n = parseInt(String(hex).replace("#", ""), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const lum = 0.3 * r + 0.59 * g + 0.11 * b;
  if (lum > 200) return "assets/5dwn-logo-blue.png"; // pannello chiaro
  if (r > 180 && g > 120 && b < 120) return "assets/5dwn-logo-black.png"; // pannello arancio
  return "assets/5dwn-logo-light.png"; // pannello scuro o blu
}
const NFL_LOGO = "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png";
const clone = (o) => JSON.parse(JSON.stringify(o));
const r1 = (n) => Math.round(n * 10) / 10;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Curve Bézier: piatte in basso e ripide in alto, inclinazione D = 1,1 × Hr
function curves(Hr) {
  const D = 1.1 * Hr;
  const down = (x0) => `C${r1(x0 - 0.06 * D)},${r1(0.4 * Hr)} ${r1(x0 - 0.4 * D)},${Hr} ${r1(x0 - D)},${Hr}`;
  const up = (x0) => `C${r1(x0 - 0.4 * D)},${Hr} ${r1(x0 - 0.06 * D)},${r1(0.4 * Hr)} ${x0},0`;
  const leftOf = (x0) => `M0,0 L${x0},0 ${down(x0)} L0,${Hr} Z`;
  const between = (a, b) => `M${a},0 L${b},0 ${down(b)} L${r1(a - D)},${Hr} ${up(a)} Z`;
  return { leftOf, between };
}
function boxBand(rt) {
  const H = 152, k = H / 125, TW = 82 * k, DR = 138 * k, DL = 115 * k;
  const lt = rt - TW, rb = rt - DR, lb = lt - DL, P2 = (x, y) => `${r1(x)},${r1(y)}`;
  return `M${P2(lb, H)} C${P2(lb + 0.6 * DL, H)} ${P2(lt - 0.06 * DL, 0.4 * H)} ${P2(lt, 0)} L${P2(rt, 0)} C${P2(rt - 0.06 * DR, 0.4 * H)} ${P2(rb + 0.6 * DR, H)} ${P2(rb, H)} Z`;
}
const teamLogo = (t) => (t[2] === "nfl" ? NFL_LOGO : `https://a.espncdn.com/i/teamlogos/nfl/500/${t[2]}.png`);

// ---------------------------------------------------------------------------- stato
function load() {
  try { const s = localStorage.getItem(KEY); if (s) return Object.assign(clone(DEFAULTS), JSON.parse(s)); } catch { /* storage non disponibile */ }
  return clone(DEFAULTS);
}
let data = load();
let titleFs = T_BASE, subFs = S_BASE, scale = 0.4;
function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage pieno o bloccato */ } }
function mut(fn) { fn(data); save(); render(); }

// ---------------------------------------------------------------------------- immagini (IndexedDB)
const DB = { name: "nfllowershow", store: "images" };
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB.name, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(DB.store);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function imgPut(id, val) {
  try { const db = await idb(); const tx = db.transaction(DB.store, "readwrite"); val == null ? tx.objectStore(DB.store).delete(id) : tx.objectStore(DB.store).put(val, id); } catch { /* senza IndexedDB: solo in memoria */ }
}
async function imgGet(id) {
  try { const db = await idb(); return await new Promise((res) => { const q = db.transaction(DB.store).objectStore(DB.store).get(id); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch { return null; }
}

/** Riquadro immagine: drag & drop o clic per caricare; rotella = zoom, trascinamento = sposta, doppio clic = rimuovi. */
class ImageSlot {
  constructor(id, placeholder, { mask = false } = {}) {
    this.id = id;
    this.el = document.createElement("div");
    this.el.className = `img-slot${mask ? " lt-player-mask" : ""}`;
    this.el.dataset.slot = id;
    this.el.innerHTML = `<span class="slot-ph">${esc(placeholder)}</span>`;
    this.img = document.createElement("img");
    this.img.alt = "";
    this.img.hidden = true;
    this.el.appendChild(this.img);
    this.input = document.createElement("input");
    this.input.type = "file";
    this.input.accept = "image/*";
    this.input.hidden = true;
    this.input.addEventListener("change", () => { const f = this.input.files?.[0]; if (f) this.readFile(f); this.input.value = ""; });
    this.el.addEventListener("click", () => { if (!this.el.dataset.filled) this.input.click(); });
    this.el.addEventListener("dblclick", () => {
      if (!this.el.dataset.filled) return;
      if (this.remoteUrl && this.onClearRemote) this.onClearRemote(); // foto ESPN: si torna al PNG caricato (o al riquadro vuoto)
      else this.set(null);
    });
    this.el.addEventListener("dragover", (e) => { e.preventDefault(); this.el.classList.add("drag-over"); });
    this.el.addEventListener("dragleave", () => this.el.classList.remove("drag-over"));
    this.el.addEventListener("drop", (e) => {
      e.preventDefault(); this.el.classList.remove("drag-over");
      const f = [...(e.dataTransfer?.files || [])].find((x) => x.type.startsWith("image/"));
      if (f) this.readFile(f);
    });
    this.el.addEventListener("wheel", (e) => {
      if (!this.el.dataset.filled) return;
      e.preventDefault();
      const t = this.tf();
      t.s = Math.max(0.2, Math.min(8, t.s * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
      this.saveTf(t);
    }, { passive: false });
    this.el.addEventListener("pointerdown", (e) => {
      if (!this.el.dataset.filled || e.button !== 0) return;
      e.preventDefault();
      const t = this.tf(), sx = e.clientX, sy = e.clientY, ox = t.x, oy = t.y;
      const move = (ev) => { t.x = ox + (ev.clientX - sx) / scale; t.y = oy + (ev.clientY - sy) / scale; this.apply(t); };
      const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); this.saveTf(t); };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }
  tf() { return Object.assign({ s: 1, x: 0, y: 0 }, data.img?.[this.id]); }
  apply(t = this.tf()) { this.img.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.s})`; }
  saveTf(t) { data.img = Object.assign({}, data.img, { [this.id]: t }); save(); this.apply(t); }
  readFile(file) {
    const fr = new FileReader();
    fr.onload = () => {
      this.saveTf({ s: 1, x: 0, y: 0 });
      if (this.onUpload) this.onUpload(); // un PNG caricato ha la priorità sulla foto ESPN
      this.set(fr.result);
    };
    fr.readAsDataURL(file);
  }
  /** Immagine caricata dall'utente (salvata in IndexedDB). */
  set(src, persist = true) {
    this.uploaded = src || null;
    if (!src && data.img) { delete data.img[this.id]; save(); }
    if (persist) imgPut(this.id, src);
    this.show();
    render(); // es. ritaglio dell'export e riquadri vuoti
  }
  /** Foto remota (profilo ESPN del giocatore scelto): ha la priorità sul PNG caricato finché è selezionata. */
  setRemote(url) {
    if ((url || null) === (this.remoteUrl || null)) return;
    this.remoteUrl = url || null;
    this.show();
  }
  show() {
    const src = this.remoteUrl || this.uploaded;
    if (!src) { this.img.removeAttribute("src"); this.img.hidden = true; delete this.el.dataset.filled; this.apply(); return; }
    if (this.remoteUrl) this.img.crossOrigin = "anonymous"; else this.img.removeAttribute("crossorigin");
    this.img.classList.toggle("is-headshot", !!this.remoteUrl); // foto profilo ESPN: riempie il riquadro, testa in alto
    if (this.img.getAttribute("src") !== src) this.img.src = src;
    this.img.hidden = false;
    this.el.dataset.filled = "";
    this.apply();
    this.fitHeadshot();
  }
  /**
   * Foto profilo ESPN: la cima della testa sempre alla stessa altezza (HEAD_TOP px dall'alto del riquadro)
   * e le spalle appoggiate sul bordo inferiore. Le foto ESPN hanno la testa a quote diverse: si misura
   * dove inizia (primo pixel non trasparente) e si ridimensiona l'immagine di conseguenza.
   */
  async fitHeadshot() {
    const url = this.remoteUrl;
    const st = this.img.style;
    if (!url) { st.left = st.top = st.width = st.height = ""; return; }
    const m = await headMetrics(url);
    if (this.remoteUrl !== url || !m) return;
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    const H = (h - HEAD_TOP) / (1 - m.top); // altezza mostrata: testa a HEAD_TOP, fondo sul bordo
    const Wd = H * m.ratio;
    st.width = `${Wd}px`; st.height = `${H}px`;
    st.left = `${(w - Wd) / 2}px`; st.top = `${h - H}px`;
  }
  async restore() { const src = await imgGet(this.id); if (src) this.set(src, false); }
}
const slots = {
  frame: new ImageSlot("lts-preview-frame", "Fotogramma del video (solo anteprima)"),
  boxPhoto: new ImageSlot("lts-box-photo", "Sfondo segmento (stadio, campo…)"),
  player1: new ImageSlot("lts-player-1", "Giocatore 1 (PNG scontornato)", { mask: true }),
  player2: new ImageSlot("lts-player-2", "Giocatore 2 (PNG scontornato)", { mask: true }),
};
[slots.player1, slots.player2].forEach((sl, i) => {
  const clear = () => mut((x) => { x.slots = x.slots || clone(DEFAULTS.slots); x.slots[i].player = ""; });
  sl.onUpload = clear;
  sl.onClearRemote = clear;
});

// ---------------------------------------------------------------------------- giocatori (roster ESPN)
const headshot = (id) => `https://a.espncdn.com/i/headshots/nfl/players/full/${id}.png`;
const rosters = {}; // squadra → [{ id, name, pos }]
const POS_ORDER = ["QB", "RB", "WR", "TE"];
// yard su passaggio stagionali per id: il QB titolare è quello che ne ha di più
let passYds = null;
const loadPassYds = () => (passYds ||= getQualified("offense:passing", "passing.passingYards")
  .then((r) => Object.fromEntries(r.data.map((q) => [q.id, q.stats["passing.passingYards"] || 0])))
  .catch(() => ({})));
async function loadRoster(team) {
  if (!team || team === "NFL") return [];
  if (!rosters[team]) {
    rosters[team] = getRoster(T[team][2]).then((r) => r.data.groups.flatMap((g) => g.players.map((p) => ({ id: String(p.id), name: p.name, pos: p.pos }))))
      .catch(() => { delete rosters[team]; return []; });
  }
  return rosters[team];
}
/** Foto profilo del giocatore scelto in ogni riquadro "Giocatore"; senza scelta resta il PNG caricato. */
function syncPlayerPhotos() {
  const sl = data.slots || DEFAULTS.slots;
  [slots.player1, slots.player2].forEach((slot, i) => {
    const s = sl[i];
    slot.setRemote(s.kind === "photo" && /^\d+$/.test(s.player || "") ? headshot(s.player) : null);
  });
}
/** Tendina giocatori di un riquadro: roster della squadra (QB, RB, WR, TE in testa). */
async function fillPlayerSelect(i) {
  const sel = document.querySelector(`[data-player="${i}"]`);
  const s = (data.slots || DEFAULTS.slots)[i];
  const [list, yds] = await Promise.all([loadRoster(s.team), loadPassYds()]);
  const sorted = list.slice().sort((a, b) => ((POS_ORDER.indexOf(a.pos) + 1 || 9) - (POS_ORDER.indexOf(b.pos) + 1 || 9))
    || (a.pos === "QB" ? (yds[b.id] || 0) - (yds[a.id] || 0) : 0) || a.name.localeCompare(b.name));
  sel.innerHTML = `<option value="">PNG caricato (trascina sul riquadro)</option>` +
    sorted.map((p) => `<option value="${p.id}">${esc(p.name)}${p.pos ? ` · ${esc(p.pos)}` : ""}</option>`).join("");
  sel.dataset.forTeam = s.team;
  // squadra cambiata e giocatore non più nel roster: si propone il primo QB
  if (s.player && !list.some((p) => p.id === s.player)) {
    const qb = sorted.find((p) => p.pos === "QB") || sorted[0];
    mut((x) => { x.slots[i].player = qb ? qb.id : ""; });
    return;
  }
  sel.value = s.player || "";
}

// ---------------------------------------------------------------------------- allineamento teste (foto ESPN)
const HEAD_TOP = 12; // px dall'alto del riquadro giocatore in cui inizia la testa, uguale per tutti
const headCache = new Map();
/** Dove inizia la testa nella foto (frazione dell'altezza) e proporzioni dell'immagine. */
function headMetrics(url) {
  if (!headCache.has(url)) {
    headCache.set(url, new Promise((res) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => {
        try {
          const cw = 200, ch = Math.round((200 * im.naturalHeight) / im.naturalWidth);
          const c = document.createElement("canvas"); c.width = cw; c.height = ch;
          const x = c.getContext("2d"); x.drawImage(im, 0, 0, cw, ch);
          const px = x.getImageData(0, 0, cw, ch).data;
          let top = 0;
          for (let y = 0; y < ch; y++) { // prima riga con abbastanza pixel pieni (ignora pixel isolati)
            let n = 0;
            for (let i = 0; i < cw; i++) if (px[(y * cw + i) * 4 + 3] > 60) n++;
            if (n >= cw * 0.02) { top = y / ch; break; }
          }
          res({ top: Math.min(top, 0.6), ratio: im.naturalWidth / im.naturalHeight });
        } catch { res(null); }
      };
      im.onerror = () => res(null);
      im.src = url;
    }));
  }
  return headCache.get(url);
}

// ---------------------------------------------------------------------------- render del banner
const $ = (id) => document.getElementById(id);
const headBox = () => {
  const left = data.box === "none" ? 60 : BOXW + 36;
  const right = P - 190;
  return { left, width: right - left, center: Math.round((left + right) / 2) };
};

function viewModel() {
  const Hr = data.base ? 241 : 161;
  const c = curves(Hr);
  const baseBands = [];
  if (data.base) for (let x = 360; x < P - 100; x += 380) baseBands.push(c.between(x, x + 150));
  const g = {
    Hr, bottom: data.base ? 0 : 40,
    bgPath: c.leftOf(W + 1.1 * Hr + 10), baseBands,
    underline: c.leftOf(P + OW), band1: c.between(P, P + OW), band2: c.between(P + OW + 56, P + OW + 78),
    panel: c.leftOf(P),
  };
  const th = THEMES[data.theme] || THEMES.black;
  const fsFor = (n) => Math.max(34, Math.min(70, Math.round(560 / Math.max(n, 1))));
  const box = {
    show: data.box !== "none", drawStripes: data.box === "stripes", drawPhoto: data.box === "photo",
    bg: data.box === "stripes" ? th.bg : "#1B1F26", stripe: th.stripe,
    bands: [BOXW + 20, BOXW + 20 - (163 * 152) / 125, BOXW + 20 - (2 * 163 * 152) / 125].map(boxBand),
    showLogo: !!data.showLogo, line1: data.line1, line2: data.line2,
    fs1: fsFor((data.line1 || "").length), fs2: fsFor((data.line2 || "").length), split: false, bg2: null,
  };
  const sl = data.slots || DEFAULTS.slots;
  const on = sl.map((s) => data.box !== "none" && s.kind !== "none");
  const slotVm = (i) => {
    const s = sl[i], isLogo = s.kind === "logo", both = on[0] && on[1];
    const tc = TC[s.team] || TC.CIN, t = T[s.team] || T.CIN;
    const lg = t[2] === "nfl" ? NFL_LOGO : `https://a.espncdn.com/i/teamlogos/nfl/${tc[1] === "#fff" ? "500-dark" : "500"}/${t[2]}.png`;
    if (isLogo) {
      const sz = both ? 140 : 176, cx = both ? (i === 0 ? 98 : 312) : 200;
      return { show: on[i], isPhoto: false, isLogo, logo: lg, x: cx - sz / 2, w: sz, h: sz, bottom: (152 - sz) / 2 };
    }
    const w = both ? 270 : 420, x = both ? (i === 0 ? -6 : 150) : -10;
    return { show: on[i], isPhoto: s.kind === "photo", isLogo, logo: lg, x, w, h: both ? 292 : 310, bottom: 0 };
  };
  // con giocatori o loghi, il box prende il colore della squadra (due squadre: divisione curva)
  const logoTeams = sl.filter((s, i) => on[i] && s.kind !== "none").map((s) => (TC[s.team] || TC.CIN)[0]);
  if (logoTeams.length) {
    box.bg = logoTeams[0];
    box.split = logoTeams.length === 2 && logoTeams[0] !== logoTeams[1];
    box.bg2 = logoTeams[1] || logoTeams[0];
    box.drawStripes = false; box.drawPhoto = false;
  }
  // Sfondo "sfumato" dietro i loghi (tipo First Take): colore squadra con righe diagonali leggere che
  // sfuma con un taglio inclinato verso il centro e si fonde con la fascia chiara, senza bordo netto.
  // vale per loghi e giocatori (anche misti)
  box.fade = data.logoBg === "fade" && sl.some((s, i) => on[i] && (s.kind === "logo" || s.kind === "photo"));
  if (box.fade) {
    const both = on[0] && on[1];
    const [a, b] = both ? [(TC[sl[0].team] || TC.CIN)[0], (TC[sl[1].team] || TC.CIN)[0]] : [logoTeams[0], null];
    // ogni strato è più lungo della sua sfumatura (niente bordi netti) ed è già trasparente prima del titolo (x 453)
    box.fadeLayers = !both || a === b
      ? [{ color: a, left: 0, width: 500, mask: "linear-gradient(100deg, #000 0%, #000 46%, transparent 86%)" }]
      // due squadre: il passaggio di colore sta nello spazio tra i due loghi (x 175 → 250); il colore di sinistra
      // resta pieno sotto quello di destra che sfuma, così nel passaggio non si vede la fascia chiara
      : [{ color: a, left: 0, width: 330, mask: "linear-gradient(100deg, #000 0%, #000 79%, transparent 100%)" },
         { color: b, left: 150, width: 340, mask: "linear-gradient(100deg, transparent 7%, #000 29%, #000 58%, transparent 86%)" }];
  }
  const pal = PALETTES[data.palette] || PALETTES.classic;
  const col = Object.assign({}, pal.colors, data.colors || {});
  const ta = T[data.teamA] || T.JAX, tb = T[data.teamB] || T.CIN;
  const tab = {
    show: data.tab !== "off", isMatch: data.tab === "match", isText: data.tab === "text", text: data.tabText,
    logoA: teamLogo(ta), logoB: teamLogo(tb), textA: `${ta[1]} ${data.conn || ""}`.trim(), textB: `${tb[1]} ${data.info || ""}`.trim(),
  };
  return { g, box, col, tab, s1: slotVm(0), s2: slotVm(1), head: headBox(), hasSub: !!(data.subtitle || "").trim() };
}

let lastBannerHtml = "";
function render() {
  const { g, box, col, tab, s1, s2, head, hasSub } = viewModel();
  const banner = $("banner");
  banner.style.bottom = `${g.bottom}px`;
  banner.style.height = `${g.Hr}px`;
  // Giocatori: dentro l'altezza del box il ritaglio segue il bordo destro curvo del box (417 in alto → 384 in basso),
  // così spalle e maglia non escono nella zona chiara del titolo; sopra il box la testa resta libera.
  const playerClip = (sx, h) => {
    if (box.fade) { // sfondo sfumato (senza bordo curvo): taglio inclinato come la sfumatura, prima del titolo
      const X = (x) => r1(x - sx);
      return `path('M${X(-40)},-200 L${X(445)},-200 L${X(445)},${h - 152} L${X(418)},${h} L${X(-40)},${h} Z')`;
    }
    const top = h - 152, X = (x) => r1(x - sx);
    return `path('M${X(-40)},-200 L${X(417)},-200 L${X(417)},${top} C${X(414)},${top + 60} ${X(400)},${h} ${X(384)},${h} L${X(-40)},${h} Z')`;
  };
  const slotHtml = (s, key) => !s.show ? "" : `<div class="lt-slot-pos" style="left:${s.x}px;bottom:${s.bottom}px;width:${s.w}px;height:${s.h}px${s.isPhoto ? `;clip-path:${playerClip(s.x, s.h)}` : ""}">
      ${s.isPhoto ? `<div data-host="${key}" style="position:absolute;inset:0"></div>` : ""}
      ${s.isLogo ? `<img class="lt-logo" src="${s.logo}" alt="" crossorigin="anonymous">` : ""}
    </div>`;
  const html = `
    <svg width="1920" height="${g.Hr}" viewBox="0 0 1920 ${g.Hr}">
      <defs>
        <clipPath id="lts-cp-panel"><rect x="0" y="0" width="1920" height="152"></rect></clipPath>
        <clipPath id="lts-cp-top"><rect x="0" y="0" width="1920" height="161"></rect></clipPath>
        <clipPath id="lts-cp-base"><rect x="0" y="161" width="1920" height="80"></rect></clipPath>
        <linearGradient id="lts-panel-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity=".3"></stop>
          <stop offset="1" stop-color="#000000" stop-opacity=".1"></stop>
        </linearGradient>
      </defs>
      <path d="${g.bgPath}" fill="${col.base}"></path>
      <g clip-path="url(#lts-cp-base)">${g.baseBands.map((d) => `<path d="${d}" fill="${col.baseStripe}"></path>`).join("")}</g>
      <path d="${g.underline}" fill="${col.curve1}" clip-path="url(#lts-cp-top)"></path>
      <path d="${g.band1}" fill="${col.curve1}"></path>
      <path d="${g.band2}" fill="${col.curve2}"></path>
      <path d="${g.panel}" fill="${col.panel}" clip-path="url(#lts-cp-panel)"></path>
      <path d="${g.panel}" fill="url(#lts-panel-grad)" clip-path="url(#lts-cp-panel)"></path>
    </svg>
    ${tab.show ? `<div class="lt-tab" style="left:${head.center}px;background:${col.tabBg};color:${col.tabText}">
      ${tab.isMatch ? `<img src="${tab.logoA}" alt="" crossorigin="anonymous"><span>${esc(tab.textA)}</span><img src="${tab.logoB}" alt="" crossorigin="anonymous"><span>${esc(tab.textB)}</span>` : ""}
      ${tab.isText ? `<span>${esc(tab.text)}</span>` : ""}
    </div>` : ""}
    ${box.show ? `<div class="lt-box">
      ${box.fade ? `<div class="lt-fade-wrap">${box.fadeLayers.map((l) => `<div class="lt-fade" style="left:${l.left}px;width:${l.width}px;background-color:${l.color};-webkit-mask-image:${l.mask};mask-image:${l.mask}"></div>`).join("")}</div>` : `<div class="lt-box-clip" style="background:${box.bg}">
        ${box.drawStripes ? `<svg width="417" height="152" viewBox="0 0 417 152">${box.bands.map((d) => `<path d="${d}" fill="${box.stripe}"></path>`).join("")}</svg>` : ""}
        ${box.drawPhoto ? `<div data-host="boxPhoto" style="position:absolute;inset:0"></div>` : ""}
        ${box.split ? `<div class="lt-box-split" style="background:${box.bg2}"></div>` : ""}
      </div>`}
      ${slotHtml(s1, "player1")}
      ${slotHtml(s2, "player2")}
      <div class="lt-box-text">
        ${box.showLogo ? `<img src="assets/5dwn-logo-light.png" alt="5DWN">` : ""}
        <div class="lt-box-lines">
          <div style="font-size:${box.fs1}px;color:${col.l1}">${esc(box.line1)}</div>
          <div style="font-size:${box.fs2}px;color:${col.l2}">${esc(box.line2)}</div>
        </div>
      </div>
    </div>` : ""}
    ${data.logoRight ? `<img class="lt-logo-right" src="${logoForPanel(col.panel)}" alt="5DWN" style="left:${RIGHT_LOGO.cx - RIGHT_LOGO.h * 0.59}px;top:${RIGHT_LOGO.cy - RIGHT_LOGO.h / 2}px;height:${RIGHT_LOGO.h}px">` : ""}
    <div class="lt-head" id="ltHead"></div>`;
  // si ricostruisce solo se la grafica è cambiata (scrivere il titolo non ridisegna loghi e curve)
  if (html !== lastBannerHtml) {
    lastBannerHtml = html;
    banner.innerHTML = html;
    // i riquadri immagine sono persistenti: si spostano nei rispettivi contenitori
    banner.querySelectorAll("[data-host]").forEach((h) => h.appendChild(slots[h.dataset.host].el));
  }
  const headEl = $("ltHead");
  headEl.style.left = `${head.left}px`;
  headEl.style.width = `${head.width}px`;
  headEl.innerHTML = `<div class="lt-title" id="ltTitle" style="color:${col.title}">${esc(data.title)}</div>
      ${hasSub ? `<div class="lt-sub" id="ltSub" style="color:${col.sub}">${esc(data.subtitle)}</div>` : ""}`;
  syncPlayerPhotos();
  slots.player1.fitHeadshot(); slots.player2.fitHeadshot(); // il riquadro cambia misura con 1 o 2 giocatori
  slots.player1.apply(); slots.player2.apply(); slots.boxPhoto.apply();
  // anteprima: scacchiera / scuro / fotogramma (non esportata)
  const bgMap = { checker: "repeating-conic-gradient(#C8CCD3 0 25%, #E4E7EB 0 50%)", dark: "#1B1F26", photo: "#1B1F26" };
  $("previewBg").style.background = bgMap[data.bg] || bgMap.checker;
  $("previewBg").style.backgroundSize = "48px 48px";
  const ph = $("previewPhotoHost");
  ph.hidden = data.bg !== "photo";
  if (!ph.hidden && slots.frame.el.parentNode !== ph) ph.appendChild(slots.frame.el);
  slots.frame.apply();
  fitText();
  syncEditor();
}

/** Titolo e seconda riga: dimensione massima che sta nella larghezza disponibile (base 80/50, 92 se solo titolo). */
function fitText() {
  const hasSub = !!(data.subtitle || "").trim();
  const width = headBox().width;
  const fit = (el, base) => {
    if (!el) return base;
    el.style.fontSize = `${base}px`;
    const natural = el.scrollWidth;
    return natural ? Math.min(base, Math.floor((base * width) / natural)) : base;
  };
  titleFs = fit($("ltTitle"), hasSub ? T_BASE : T_SOLO);
  if ($("ltTitle")) $("ltTitle").style.fontSize = `${titleFs}px`;
  if (hasSub) { subFs = fit($("ltSub"), S_BASE); $("ltSub").style.fontSize = `${subFs}px`; }
}

// ---------------------------------------------------------------------------- scala dello stage (ResizeObserver)
let lastFitW = "";
const wide = window.matchMedia("(min-width: 901px)");
function fit() {
  const col = $("stagecol");
  if (!col.clientWidth) { requestAnimationFrame(fit); return; }
  // solo variazioni reali (≥ 2 px): niente ricalcoli a catena per arrotondamenti
  // schermi larghi: lo stage sta sempre intero nella finestra (larghezza e altezza), così la pagina non scorre mai
  const availH = wide.matches ? window.innerHeight - 40 : Infinity;
  const key = `${col.clientWidth}x${availH}`;
  if (lastFitW && lastFitW.split("x").every((v, i) => Math.abs(Number(v) - Number(key.split("x")[i])) < 2 || v === key.split("x")[i])) return;
  lastFitW = key;
  scale = Math.round(Math.min(col.clientWidth / 1920, availH / 1080) * 10000) / 10000;
  $("stage").style.width = `${Math.round(1920 * scale)}px`;
  $("stage").style.height = `${Math.round(1080 * scale)}px`;
  $("world").style.transform = `scale(${scale})`;
}
// si osserva solo la larghezza (un cambio di altezza non deve ricalcolare la scala)
let fitRaf = 0;
new ResizeObserver(() => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fit); }).observe($("stagecol"));
window.addEventListener("resize", () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fit); });

// ---------------------------------------------------------------------------- editor (solo menu a tendina, regola del sito)
const teamOpts = Object.keys(T).map((k) => ({ code: k, label: k === "NFL" ? "NFL (generico)" : T[k][1] }))
  .sort((p, q) => (p.code === "NFL" ? -1 : q.code === "NFL" ? 1 : p.label.localeCompare(q.label)));
const teamOptionsHtml = teamOpts.map((t) => `<option value="${t.code}">${esc(t.label)}</option>`).join("");

function buildEditor() {
  $("selPalette").innerHTML = Object.keys(PALETTES).map((k) => `<option value="${k}">${PALETTES[k].label}</option>`).join("");
  $("selTheme").innerHTML = Object.keys(THEMES).map((k) => `<option value="${k}">${THEMES[k].label}</option>`).join("");
  $("colorRows").innerHTML = ROWS.map(([k, label]) => `<div class="ed-row"><span>${label}</span><div class="ed-color">
      <span class="ed-chip" data-chip="${k}"></span>
      <select class="ed-sel" data-color="${k}" aria-label="${label}">${SWATCHES.map((c) => `<option value="${c}">${SWATCH_NAMES[c]} (${c})</option>`).join("")}</select>
    </div></div>`).join("");
  $("slotControls").innerHTML = [0, 1].map((i) => `<div class="ed-field">
      <span class="ed-lbl">Immagine ${i + 1} nel box</span>
      <div class="ed-2">
        <select class="ed-sel" data-kind="${i}" aria-label="Tipo immagine ${i + 1}"><option value="none">Nessuna</option><option value="photo">Giocatore</option><option value="logo">Logo</option></select>
        <select class="ed-sel" data-team="${i}" aria-label="Squadra immagine ${i + 1}">${teamOptionsHtml}</select>
      </div>
      <select class="ed-sel" data-player="${i}" aria-label="Giocatore immagine ${i + 1}"><option value="">PNG caricato (trascina sul riquadro)</option></select>
    </div>`).join("");
  $("selTeamA").innerHTML = teamOptionsHtml;
  $("selTeamB").innerHTML = teamOptionsHtml;

  const bindText = (id, key) => $(id).addEventListener("input", (e) => mut((x) => { x[key] = e.target.value; }));
  bindText("inTitle", "title"); bindText("inSub", "subtitle"); bindText("inLine1", "line1"); bindText("inLine2", "line2");
  bindText("inConn", "conn"); bindText("inInfo", "info"); bindText("inTabText", "tabText");
  const bindSel = (id, key) => $(id).addEventListener("change", (e) => mut((x) => { x[key] = e.target.value; }));
  bindSel("selBox", "box"); bindSel("selTheme", "theme"); bindSel("selTab", "tab"); bindSel("selTeamA", "teamA"); bindSel("selTeamB", "teamB"); bindSel("selBg", "bg"); bindSel("selLogoBg", "logoBg");
  // cambiare preset azzera le sovrascritture dei singoli colori
  $("selPalette").addEventListener("change", (e) => mut((x) => { x.palette = e.target.value; x.colors = null; }));
  $("colorRows").addEventListener("change", (e) => {
    const k = e.target.dataset.color;
    if (k) mut((x) => { x.colors = Object.assign({}, x.colors || {}, { [k]: e.target.value }); });
  });
  $("slotControls").addEventListener("change", (e) => {
    const d = e.target.dataset, i = d.kind ?? d.team ?? d.player;
    if (i == null) return;
    mut((x) => {
      x.slots = x.slots || clone(DEFAULTS.slots);
      if (d.kind != null) x.slots[i].kind = e.target.value;
      else if (d.team != null) { x.slots[i].team = e.target.value; if (x.slots[i].player) x.slots[i].player = "auto"; } // giocatore scelto → primo QB della nuova squadra
      else x.slots[i].player = e.target.value;
    });
  });
  $("chkLogo").addEventListener("change", () => mut((x) => { x.showLogo = !x.showLogo; }));
  $("chkBase").addEventListener("change", () => mut((x) => { x.base = !x.base; }));
  $("chkLogoRight").addEventListener("change", () => mut((x) => { x.logoRight = !x.logoRight; }));
  $("btnReset").addEventListener("click", () => {
    mut((x) => { Object.keys(x).forEach((k) => delete x[k]); Object.assign(x, clone(DEFAULTS)); });
    Object.values(slots).forEach((s) => { if (s.el.dataset.filled) s.set(null); });
  });
  $("btnBanner").addEventListener("click", () => exportPng(true));
  $("btnFull").addEventListener("click", () => exportPng(false));
}

/** Allinea i controlli allo stato (senza toccare il campo che si sta scrivendo). */
function syncEditor() {
  const setVal = (id, v) => { const el = $(id); if (el && document.activeElement !== el && el.value !== (v ?? "")) el.value = v ?? ""; };
  setVal("inTitle", data.title); setVal("inSub", data.subtitle); setVal("inLine1", data.line1); setVal("inLine2", data.line2);
  setVal("inConn", data.conn); setVal("inInfo", data.info); setVal("inTabText", data.tabText);
  setVal("selPalette", data.palette); setVal("selTheme", data.theme); setVal("selBox", data.box); setVal("selTab", data.tab);
  setVal("selTeamA", data.teamA); setVal("selTeamB", data.teamB); setVal("selBg", data.bg);
  $("chkLogo").checked = !!data.showLogo;
  $("chkBase").checked = !!data.base;
  $("chkLogoRight").checked = !!data.logoRight;
  const col = Object.assign({}, (PALETTES[data.palette] || PALETTES.classic).colors, data.colors || {});
  document.querySelectorAll("[data-color]").forEach((s) => { s.value = col[s.dataset.color]; });
  document.querySelectorAll("[data-chip]").forEach((c) => { c.style.background = col[c.dataset.chip]; });
  const sl = data.slots || DEFAULTS.slots;
  document.querySelectorAll("[data-kind]").forEach((s) => { s.value = sl[s.dataset.kind].kind; });
  document.querySelectorAll("[data-team]").forEach((s) => { s.value = sl[s.dataset.team].team; s.hidden = sl[s.dataset.team].kind === "none"; });
  document.querySelectorAll("[data-player]").forEach((s) => {
    const i = Number(s.dataset.player), slot = sl[i];
    s.hidden = slot.kind !== "photo" || slot.team === "NFL";
    if (s.hidden) return;
    if (s.dataset.forTeam !== slot.team || (slot.player && ![...s.options].some((o) => o.value === slot.player))) fillPlayerSelect(i);
    else if (document.activeElement !== s) s.value = slot.player || "";
  });
  $("themeField").hidden = data.box !== "stripes";
  $("logoBgField").hidden = data.box === "none" || !(data.slots || DEFAULTS.slots).some((x) => x.kind === "logo" || x.kind === "photo");
  setVal("selLogoBg", data.logoBg || "solid");
  $("boxControls").hidden = data.box === "none";
  $("tabMatch").hidden = data.tab !== "match";
  $("inTabText").hidden = data.tab !== "text";
}

// ---------------------------------------------------------------------------- export PNG (html-to-image)
const FONT_CSS_URL = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap";
let fontCssPromise = null;
/** CSS del font Archivo con i file incorporati (data URL): l'immagine esportata usa lo stesso font dell'anteprima. */
function fontEmbedCss() {
  fontCssPromise ||= (async () => {
    const css = await (await fetch(FONT_CSS_URL)).text();
    const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
    let out = css;
    for (const u of urls) {
      const blob = await (await fetch(u)).blob();
      const dataUrl = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
      out = out.split(u).join(dataUrl);
    }
    return out;
  })().catch((err) => { fontCssPromise = null; throw err; });
  return fontCssPromise;
}
/** Riquadro reale di tutti gli elementi visibili (linguetta e immagini che sporgono incluse), esclusi i riquadri vuoti. */
function cropBox(node) {
  const base = node.getBoundingClientRect();
  let x0 = 1920, y0 = 1080, x1 = 0, y1 = 0;
  node.querySelectorAll("*").forEach((el) => {
    if (el.closest(".img-slot:not([data-filled])")) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    x0 = Math.min(x0, (r.left - base.left) / scale); y0 = Math.min(y0, (r.top - base.top) / scale);
    x1 = Math.max(x1, (r.right - base.left) / scale); y1 = Math.max(y1, (r.bottom - base.top) / scale);
  });
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
  return { x: x0, y: y0, w: Math.min(1920, Math.ceil(x1)) - x0, h: Math.min(1080, Math.ceil(y1)) - y0 };
}
async function exportPng(crop) {
  const node = $("canvas");
  if (!window.htmlToImage) { alert("Export non disponibile."); return; }
  $("status").textContent = "Preparo il PNG…";
  try {
    await document.fonts.ready;
    const fontCss = await fontEmbedCss().catch(() => undefined);
    const full = await window.htmlToImage.toCanvas(node, {
      width: 1920, height: 1080, pixelRatio: 2, cacheBust: true, fontEmbedCSS: fontCss,
      filter: (n) => !(n.classList?.contains("img-slot") && !n.hasAttribute("data-filled")), // riquadri vuoti esclusi
    });
    let out = full;
    if (crop) {
      const b = cropBox(node);
      out = document.createElement("canvas");
      out.width = b.w * 2; out.height = b.h * 2;
      out.getContext("2d").drawImage(full, b.x * 2, b.y * 2, b.w * 2, b.h * 2, 0, 0, b.w * 2, b.h * 2);
    }
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = `${crop ? "banner-" : "lower-third-show-"}${(data.title || "").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.png`;
    a.click();
    $("status").textContent = `Scaricato: ${a.download}`;
  } catch (err) {
    console.error(err);
    $("status").textContent = "";
    alert("Export non riuscito (loghi esterni bloccati). Usa uno screenshot del canvas.");
  }
}

// ---------------------------------------------------------------------------- avvio
buildEditor();
fit();
render();
Promise.all(Object.values(slots).map((s) => s.restore())).then(() => render());
document.fonts?.ready.then(() => fitText());
