# 5DWN — Football more than a game

Sito statico di **5DWN (quintodwn)**, la pagina italiana di NFL.
Niente backend, niente chiavi, nessun build: HTML + CSS + JavaScript che leggono
in diretta l'API pubblica di ESPN dal browser.

| Pagina | File | Dati |
|---|---|---|
| Home | `index.html` | banner settimana (scoreboard), classifica lampo (standings), ultimo reel |
| Classifiche | `classifiche.html` | standings (conference + `?level=3` per le division) |
| Calendario e Risultati | `calendario.html?w=2-4` | scoreboard per settimana (Week 1-18 + playoff) |
| Statistiche | `statistiche.html?tipo=squadra&stat=ppg` | classifiche complete individuali (byathlete) e di squadra (byteam) |
| Squadre | `squadre.html` | groups + standings |
| Scheda squadra | `squadra.html?team=min` | team, roster, schedule (log partite), standings + `content/squadre.js` |
| Profilo partita | `partita.html?id=401872964` | summary (+ calendari squadra per gli head-to-head) |
| Profilo giocatore | `giocatore.html?id=8439` | athlete, stats, gamelog |

`risultati.html` è rimasto solo come reindirizzamento a `calendario.html`, così i
vecchi link continuano a funzionare.

---

## 1. Struttura

```
5dwn-sito/
├── index.html, classifiche.html, calendario.html, statistiche.html,
│   squadre.html, squadra.html, partita.html, giocatore.html, 404.html
│   (risultati.html = redirect)
├── content/
│   ├── sito.js        ← link social, payoff, ultimo reel
│   ├── squadre.js     ← contenuti editoriali delle 32 squadre
│   └── tv-italia.js   ← canali TV italiani (solo da palinsesto ufficiale)
├── assets/
│   ├── css/style.css  ← tema (colori del logo in :root)
│   ├── img/           ← logo-5dwn.png, favicon.png
│   └── js/
│       ├── api.js     ← chiamate ESPN + cache
│       ├── ui.js      ← header/footer, date in ora italiana, card partite
│       └── pages/     ← uno script per pagina
├── netlify.toml       ← config Netlify (nessun build)
└── .nojekyll          ← per GitHub Pages
```

## 2. Cose da completare prima di pubblicare

1. **Link social**: Instagram e YouTube (`@quintodwn`) sono già impostati in
   `content/sito.js`; se cambiano, si aggiornano lì.
2. **Ultimo reel** (home): in `content/sito.js`, blocco `ultimoReel`, incolla il
   link del reel più recente (facoltativi titolo e copertina). Se lo lasci vuoto
   la card porta alla pagina dei reel di @quintodwn.
3. **TV in Italia**: in `content/tv-italia.js` aggiungi, partita per partita, il
   canale preso dal palinsesto ufficiale DAZN (la chiave è l'ID nell'indirizzo
   `partita.html?id=…`). Senza dato il sito mostra «In attesa del palinsesto
   ufficiale DAZN» e non indovina mai il canale. Nelle card e nel banner, finché
   manca il dato italiano, compare la rete USA fornita da ESPN (es. «USA FOX»).
4. Facoltativo: controlla capienze stadi e anni di fondazione in
   `content/squadre.js` (valori indicativi, da verificare).

## 3. Modificare i contenuti editoriali

Tutto in **`content/squadre.js`**, una voce per squadra con la sigla ESPN
(`MIN`, `GB`, `KC`…). I Vikings hanno già un esempio completo da copiare.
Campi disponibili (tutti facoltativi):

```js
MIN: {
  fondazione: 1960,
  stadio: { capienza: 66860 },        // nome e città arrivano già da ESPN
  storia: ["Paragrafo 1…", "Paragrafo 2…"],   // ammesso HTML semplice (<em>, <strong>, <a>)
  tappe: [{ anno: "1969", testo: "Campioni NFL" }],
  palmares: [{ label: "Super Bowl disputati", valore: "4" }],
  stagioni: [{ anno: 2025, record: "10-7", risultato: "Wild Card" }],
  statistiche: [{ label: "Record all-time", valore: "…" }],
  note: "Commento della redazione",
},
```

Le sezioni vuote mostrano un segnaposto «in arrivo». Record, roster,
head coach, calendario e statistiche della stagione si aggiornano da soli.

> Attenzione alle virgolette: se un testo contiene `"`, usa le virgolette
> italiane «…» o l'apostrofo tipografico ’.

## 3b. Studio grafiche (pagina nascosta)

`studio.html` non è nel menu ed è esclusa dai motori di ricerca (`noindex`):
si apre solo digitando l'indirizzo, es. `https://…/5dwn/studio.html`.

**Template 1 — Calendario settimanale**, in due formati ricostruiti sui file di
riferimento: **16:9 · 1920×1080** ("NFL Calendar") e **9:16 · 1080×1920** per le
storie IG ("Calendario storie"). I file di riferimento restano nella cartella del
progetto ma non vengono pubblicati (vedi `.gitignore`).

- Scegli la settimana dalla tendina (Week 1-18 + playoff, la corrente è
  preselezionata): titolo, anno e partite arrivano dallo scoreboard ESPN.
- Orari in ora italiana, giorni italiani (es. il TNF diventa «venerdì»).
- Partita internazionale per prima con la fascetta «INTERNATIONAL GAME — città, paese».
- Domenica su due colonne bilanciate e allineate in basso (16:9); nel 9:16 tutte le
  partite in una colonna a tutta larghezza. Se le partite sono tante, il blocco si
  riduce per stare nel formato.
- **TV:** di default «NFL Game Pass»; diventa «DAZN» se la partita è in
  `content/tv-italia.js`. In anteprima basta **cliccare la cella TV** per
  alternare DAZN / Game Pass (la scelta resta salvata nel browser).
- **Scarica PNG:** la grafica viene ridisegnata su canvas a grandezza reale con gli
  stessi font e loghi ufficiali ESPN dell'anteprima.

**Template 2 — Risultati settimanali** (riferimenti "Risultati orizzontale" e
"risultati verticale"): si sceglie con l'interruttore **Calendario / Risultati** in
cima alla pagina. Stesso impianto del calendario, ma con sottotitolo «RISULTATI»,
una cella punteggio unica (punteggio di chi perde in grigio) e «RISULTATI FINALI»
nel piè di pagina. La tendina mostra solo le settimane già iniziate e la grafica
include solo le partite concluse; di default propone l'ultima settimana completa.
I punteggi arrivano da ESPN tramite il sito, come tutti gli altri dati.

**Template 3 — Classifiche** (riferimenti "NFL Standings"): una grafica per
l'**AFC** e una per l'**NFC**, ciascuna in 16:9 e in 9:16 per le storie IG
(stesso sfondo e impianto del calendario storie, division una sotto l'altra), con le 4 division (W, L, PCT), logo della
conference e i colori ufficiali delle squadre. Si generano **settimana per
settimana**: per la settimana in corso si usa la classifica ufficiale ESPN; per le
settimane passate vittorie/sconfitte/percentuale vengono ricalcolate dai risultati
ESPN fino a quella settimana (ordine per percentuale e vittorie: i tiebreaker NFL
completi non sono disponibili per le settimane passate).

**Template 4 — Partita della settimana** (riferimento "NFL Game of the Week",
16:9 e storia IG 9:16 da "NFL Game of the Week-selection storia"): voce **Partita** nello Studio, formato scelto con il selettore 16:9 / Storie IG. Si sceglie la settimana (solo
quelle già giocate), poi la **partita** conclusa di quella giornata e la **foto**.
La grafica mostra squadre, loghi, punteggio (vincente in blu scuro, perdente in
grigio) e 8 statistiche ESPN a confronto (yard totali, palle perse, primi down,
penalità, terzi e quarti down, red zone, possesso) con barre proporzionali, colorate
per chi ha fatto meglio. La foto viene proposta tra quelle ESPN della partita
(miniature 1920×1080 degli highlights), scegliendo quella il cui titolo cita la
squadra vincente; dalla tendina **Foto** si può cambiare, oppure si può caricare
una foto propria con **Carica foto** (resta nel browser, non viene pubblicata).

**Template 6 — Calendario squadra individuale** (riferimento "NFL Team Schedule-selection (1)",
solo 16:9): voce **Calendario squadra** nello Studio, tendina **Squadra** con le 32
squadre (ESPN). Le 18 settimane della regular season in due colonne (W1-W9, W10-W18):
partite giocate con **W** verde / **L** rossa / **T** grigia e punteggio (prima la squadra
scelta, il punteggio perdente in grigio), partite future con orario italiano, **BYE**
nella settimana di riposo, "DA DEFINIRE / TBD" quando ESPN non ha ancora l'orario.
Accanto a "CALENDARIO" il box RECORD (vittorie-sconfitte, -pareggi se ci sono). I dati si ricaricano da ESPN a ogni scelta e da soli ogni minuto
mentre la pagina è aperta.

**Template 5 — Giocatore** (riferimento "NFL Player Performance", solo 16:9): voce
**Giocatore** nello Studio. Si sceglie settimana → partita conclusa → **giocatore**
(tutti quelli con statistiche nel boxscore ESPN, divisi per squadra). Le 6 caselle
(3 a sinistra, 3 a destra) hanno ognuna una tendina con le statistiche disponibili
per quel giocatore in quella partita (passaggi, corse, ricezioni, difesa, intercetti,
kicking, punt, ritorni, fumble) più "Risultato della partita" e "vuoto"; i default
dipendono dal ruolo (QB, RB, WR/TE, difesa, K, P, returner). Logo, filigrana, linee e
barre usano i colori della squadra del giocatore. La foto centrale viene cercata tra
le immagini ESPN dei giorni della partita: prima quelle con il suo nome in didascalia
(notizie del profilo, notizie fantasy, highlights), poi le foto dei servizi sulla
partita, poi fino a 5 foto dal web (Wikimedia Commons, licenze libere: titolo con nome e
cognome del giocatore), per ultima la foto profilo; si può sempre caricare una foto propria.
Sotto i controlli ci sono i link di ricerca su Google Immagini, Getty Images e Commons.

**Foto (Partita e Giocatore)**: qualsiasi foto, anche caricata, si allinea con **Zoom**,
**Orizzontale** e **Verticale** oppure trascinandola nell'anteprima; "Centra foto" la
riporta al centro. L'export PNG usa esattamente lo stesso ritaglio.

**Template 7 — Confronto giocatori** (riferimento "NFL Player Comparison", solo 16:9):
voce **Confronto giocatori** nello Studio. Si sceglie il **periodo** (ultima partita,
ultime 2…10 partite, intera stagione), quanti **giocatori** (2 o 3, ognuno con tendina
Squadra → Giocatore dal roster ESPN) e quante **statistiche** (5, 6 o 7, ognuna con la sua
tendina). Le statistiche vengono sommate dal gamelog ESPN di ogni giocatore sulle sue
ultime N partite della stagione; percentuali, medie e passer rating sono ricalcolati
(es. COMP %, YDS/ATT, PASSER RTG con la formula NFL). Foto = foto profilo ESPN, logo
squadra ingrandito nella card. **Titolo e sottotitolo non hanno un testo automatico**:
vanno sempre scritti in "Testi personalizzati" (senza, il download è bloccato). Footer
automatico "NFL 2026 REGULAR SEASON" (sostituibile) e nota facoltativa sotto le card.
**Rank NFL** accanto a ogni valore, con **Mostra**: dato + rank / solo dato / solo rank.
Il rank è calcolato tra i giocatori "qualificati" ESPN del ruolo della statistica (passaggi:
QB qualificati; corse: RB; ricezioni: WR/TE; difesa: difensori), sullo stesso periodo:
intera stagione = statistiche stagionali ESPN di tutta la lega; ultime N partite = gamelog
dei primi 60 qualificati del ruolo sommati sulle loro ultime N partite. INT, sack subiti e
fumble: meno = meglio. "NQ" = giocatore non qualificato. Colori: top 10 verde, ultimi 10
rossi, il resto grigio.
Ogni giocatore ha la spunta **Anonimo**: la foto diventa la sua sagoma scura, il logo
della squadra è sostituito da un "?", il nome sparisce e card e barra usano un grigio
neutro (le statistiche restano).

**Template 8 — Confronto squadre** (riferimento "NFL Team Comparison", solo 16:9): voce
**Confronto squadre**. 2 o 3 squadre, 5-7 statistiche scelte da tendine divise in
ATTACCO / DIFESA / SPECIAL TEAMS (incluse le efficienze yard/giocata, yard/tentativo,
yard/portata e le versioni concesse, e il PASSER RATING AGAINST calcolato con la formula
NFL sui totali concessi). Ogni conteggio è nella lista due volte, totale e "/PARTITA"
(es. PUNTI SEGNATI e PUNTI SEGNATI/PARTITA), così ogni riga si sceglie a sé; medie e
percentuali sono una voce sola. **Mostra**: dato + rank, solo dato, solo rank. Il **rank NFL** è
calcolato confrontando le statistiche stagionali ESPN di tutte le 32 squadre (ESPN non lo
espone), nella direzione giusta per ogni statistica (es. punti concessi: meno = meglio);
colori: top 10 verde, 11-22 grigio, bottom 10 rosso. Titolo e sottotitolo obbligatori.
Non disponibili in ESPN: QB hit, safety, goal-to-go %.
**Squadra anonima** (casella sotto ogni squadra, solo con 2-3 squadre): box in grigio neutro,
"?" al posto del logo, "SQUADRA / A·B·C" al posto di città e nome, anche nel titolo automatico
e nel nome del file; dati, rank, record e stagione restano visibili.
Rams: logo bianco (variante ESPN "500-dark") sul box blu (`TC_WHITE_LOGO`).
**Periodo** (vale anche per 2-3 squadre): intera stagione (statistiche stagionali ESPN) oppure
ultima partita / ultime 2…10 partite: si sommano le statistiche partita per partita ESPN
(API core, proprie e degli avversari) e si ricalcolano percentuali e medie; il rank usa le
stesse ultime N partite di tutte le 32 squadre (la prima volta servono alcuni secondi, i dati
restano in memoria finché la pagina è aperta). Il **record** nel box segue lo stesso periodo.
Etichetta del periodo nelle card (anche in Confronto giocatori): "STAGIONE 2026" solo con
l'intera stagione, "ULTIME N PARTITE" da 2 partite in su, "WEEK X VS NOME SQUADRA" con l'ultima partita.
**1 squadra = Focus squadra** (riferimento "NFL Team Focus"): titolo = nome della squadra
(sostituibile), sottotitolo obbligatorio (es. "BILANCIO WEEK 1-4") con il box RECORD del
periodo, tabella centrale con dato/rank e due card laterali: per ognuna si sceglie la
persona (head coach o un giocatore del roster ESPN; proposti QB titolare e head coach) e la
foto (foto profilo ESPN scontornata per i giocatori, foto Wikimedia Commons cercate con nome
+ squadra, oppure "Carica foto"). ESPN non ha foto degli allenatori.

**Stagioni storiche (Confronto giocatori e Confronto squadre, Focus compreso)**: ogni
giocatore e ogni squadra ha il proprio menu **Stagione** (ultime 20 stagioni, default la
corrente). Con la stagione cambiano valori, record, rank e squadra com'era quell'anno (nome,
sigla, logo: es. 2010 → Oakland Raiders). Il **rank** è calcolato dentro la stagione del box
(Brady 2010 fra i QB del 2010): per i giocatori si applicano le soglie NFL di qualificazione
(passaggi 14 tentativi, corse 6,25 portate, ricezioni 1,875 ricezioni per partita della squadra),
perché ESPN non le applica alle stagioni passate. Per le stagioni passate le tendine dei
giocatori elencano chi ha statistiche quell'anno con quella squadra (ESPN non fornisce roster
e coach storici). Le risposte delle stagioni concluse restano in cache a lungo (30 giorni).
Le statistiche non disponibili in una stagione spariscono dal menu (Confronto squadre).
**Titolo automatico** con le stagioni (es. "MAHOMES 2023 VS BRADY 2010", "BILLS 2026 VS
PATRIOTS 2007", Focus "NEW ENGLAND PATRIOTS 2007"), sostituibile; sottotitolo da scrivere;
footer automatico con le stagioni (es. "NFL 2010 / 2007 REGULAR SEASON"). Le foto profilo
ESPN sono sempre le più recenti del giocatore (per foto d'epoca: Commons o "Carica foto").

**Dati non tracciati / mancanti**: se una statistica non esiste per la stagione scelta
(campo assente nei dati ESPN dell'anno, oppure 0 per tutti in una stagione conclusa, es. TFL o
red zone negli anni vecchi) la riga sparisce dalla grafica e dal menu; se esiste ma manca il
dato del singolo giocatore/squadra compare **N/D** senza rank. Mai 0 o rank finti (anche nel PNG).
**Foto personalizzata** in ogni box del Confronto giocatori e nelle card del Focus squadra:
URL incollato o file caricato, con priorità sulla foto automatica (ESPN ha solo la foto
profilo più recente, non una per stagione). Un URL funziona solo se il sito che ospita
l'immagine ne permette l'uso (es. Wikimedia Commons); altrimenti va scaricata e caricata.
Le card dei Confronti mostrano "STAGIONE 2010" sotto il nome / accanto al record.
**Calendario squadra** e **Giocatore** hanno anche il menu **Stagione** (settimane, partite,
risultati e nomi delle squadre dell'anno scelto; ESPN usa i loghi attuali anche per gli anni
passati). Le **Classifiche** riportano la settimana e la data nel sottotitolo
("CLASSIFICA · WEEK 4 · 4 OTT"). Tutti i selettori dello Studio sono menu a tendina (anche
Grafica e Formato).

**Lower third (video)** — pagina a parte `lower-third.html` (+ `lower-third.js`), raggiungibile
dal menu Grafica dello Studio. Porta in HTML/CSS/JS il prototipo "NFL Lower Third Show"
(riferimento in `reference/`, non pubblicato): stage 1920×1080 scalato, banner in basso con curve
Bézier, box segmento (strisce / foto / nessuno, giocatori o loghi con colore squadra e divisione
curva), titolo e seconda riga ad adattamento automatico, linguetta (partita / testo), 4 palette
con colori sovrascrivibili riga per riga, fascia base, anteprima su scacchiera / scuro /
fotogramma. Riquadri "Giocatore": tendina con il roster ESPN della squadra (QB titolare proposto
per primo) e foto profilo standard ESPN, oppure "PNG caricato". Le foto ESPN vengono analizzate
(primo pixel non trasparente) e ridimensionate perché la cima della testa cada sempre alla stessa
altezza per tutti i giocatori, con le spalle sul bordo inferiore. Con due giocatori quello di destra è davanti.
Con loghi o giocatori compare **Sfondo squadra**: Pieno (box colore squadra) o Sfumato (tipo First
Take: colore squadra con righe diagonali che sfuma in diagonale verso il centro, trasparente prima
del titolo; con due squadre i due colori si incontrano al centro; con i giocatori il taglio a destra
diventa inclinato come la sfumatura). Switch **Logo 5DWN a destra**: logo nello spazio libero
del pannello prima delle curve, blu su pannello chiaro, nero su arancio, bianco su scuro o blu.
**Animazione e video**: "▶ Play" mostra l'entrata a sipario (~2,5 s): la fascia (base + onde)
entra da entrambi i lati e si chiude al centro (0,6 s), compare il logo 5DWN (colore dalla tendina
"Colore logo (entrata)": automatico, bianco, nero, blu, arancio), pausa ~1 s, poi la fascia si
riapre verso i lati (0,6 s) scoprendo il banner completo, che resta fermo. La linguetta non si
anima mai da sola: resta centrata dal primo fotogramma. "Esporta video" registra la stessa
coreografia (tempi in `CUR`) su canvas 1920×1080 a 30 fps con MediaRecorder e scarica un WebM:
Trasparente (VP9 con alfa, per editor che leggono WebM con alfa), Pieno (sfondo scuro) o Chroma key
(sfondo verde #00B140, da togliere con il filtro chroma key, va bene anche in Premiere). Durata a
scelta (default 8 s). Banner completo e fascia vengono rasterizzati con lo stesso motore dell'export PNG; la
registrazione avviene in tempo reale (tenere la scheda in primo piano). Riquadri immagine: trascina un PNG o clicca, rotella = zoom, trascina = sposta,
doppio clic = rimuovi (immagini in IndexedDB, stato in localStorage `nfllowershow.v1`, Reset).
Export con html-to-image (pixelRatio 2): "PNG banner" ritagliato sul banner reale e "1920×1080"
frame intero, entrambi trasparenti; font Archivo incorporato nell'export. Selettori a tendina
come nel resto dello Studio. Loghi 5DWN in `assets/5dwn-logo-{light,black,blue,orange}.png`.

**Testi personalizzati**: il riquadro "Testi personalizzati" sotto i controlli ha tre
campi opzionali (Titolo, Sottotitolo, Footer) per il template attivo. Vuoto = testo
automatico (mostrato come segnaposto); compilato = il testo digitato sostituisce quello
automatico in anteprima e nel PNG. Ogni template ricorda i propri testi finché la pagina
resta aperta; "Testi automatici" li azzera. Nelle Classifiche il testo vale per AFC e NFC;
Giocatore non ha footer; Partita non ha testi sostituibili (campi disattivati); nei
Confronti titolo automatico (con le stagioni) e sottotitolo obbligatorio.

Colori, misure e font sono in `assets/js/pages/studio.js` (oggetti `TEAM_CELL`,
`STYLES`, `G`) e `assets/css/studio.css`: sono stati misurati sul riferimento,
quindi vanno cambiati solo se cambia il template.

**Font titoli e sottotitoli** (sito, Studio, lower third): `assets/fonts/Archivo-Bold.ttf`
(famiglia "Archivo Bold", titoli) e `assets/fonts/Archivo-Thin.ttf` ("Archivo Thin",
sottotitoli), dichiarati in `assets/css/style.css` (variabili `--font-title` e `--font-sub`:
h1-h4, sottotitolo delle pagine e della home). Nello Studio gli stili `week`, `tsName`, `pName`
(titoli) e `sub`, `stSub`, `tsCal`, `cmpSub`, `pVs` (sottotitoli) hanno `natural: true`: stessa
altezza delle maiuscole del master ma spaziatura propria del font. Nel lower third titolo Bold e
seconda riga Thin, incorporati anche nell'export PNG/video.

## 4. Provarlo sul tuo computer

Serve un piccolo server locale (aprendo i file con doppio clic gli script non partono):

```bash
cd ~/"Library/Mobile Documents/com~apple~CloudDocs/5dwn-sito"
```

```bash
python3 -m http.server 8000
```

Poi apri http://localhost:8000 nel browser. `Ctrl+C` nel terminale per fermarlo.

## 5. Pubblicare gratis — opzione A: GitHub Pages

1. Crea un account su https://github.com (se non ce l'hai).
2. In alto a destra **+ → New repository**. Nome, ad esempio, `5dwn`.
   Visibilità **Public**. Clicca **Create repository**.
3. Nella pagina del repository vuoto clicca **uploading an existing file**,
   trascina **il contenuto** della cartella `5dwn-sito` (i file e le cartelle
   al suo interno, non la cartella stessa) e premi **Commit changes**.
   - Il file `.nojekyll` è nascosto nel Finder: premi `Cmd+Shift+.` per vederlo
     e trascinalo insieme agli altri. Oppure usa git dal terminale:
     ```bash
     cd ~/"Library/Mobile Documents/com~apple~CloudDocs/5dwn-sito"
     git init && git add . && git commit -m "Sito 5DWN"
     git branch -M main
     git remote add origin https://github.com/TUO-UTENTE/5dwn.git
     git push -u origin main
     ```
4. Nel repository: **Settings → Pages**. In *Build and deployment* scegli
   **Source: Deploy from a branch**, **Branch: `main`**, cartella **`/ (root)`**, **Save**.
5. Dopo 1–2 minuti il sito è online su `https://TUO-UTENTE.github.io/5dwn/`.
6. Per aggiornare: carica di nuovo i file modificati (o `git push`); GitHub ripubblica da solo.

**Dominio personalizzato (dopo)** — es. `quintodwn.it`:

1. **Settings → Pages → Custom domain**: scrivi `www.quintodwn.it` e **Save**
   (GitHub crea da solo il file `CNAME` nel repository).
2. Dal pannello DNS del tuo registrar (Aruba, Register.it, GoDaddy…):
   - record **CNAME**: host `www` → `TUO-UTENTE.github.io`
   - record **A** per il dominio senza www (`@`), quattro righe:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. Quando GitHub ha verificato il DNS (da pochi minuti a qualche ora) spunta
   **Enforce HTTPS**.

## 6. Pubblicare gratis — opzione B: Netlify

**Il modo più veloce (senza GitHub):**

1. Vai su https://app.netlify.com/drop e accedi (anche con Google/GitHub).
2. Trascina la cartella `5dwn-sito` nella pagina. In pochi secondi hai un
   indirizzo tipo `https://nome-casuale.netlify.app`.
3. **Site configuration → Change site name** per avere ad es. `quintodwn.netlify.app`.
4. Per aggiornare: **Deploys →** trascina di nuovo la cartella.

**Con aggiornamento automatico da GitHub (consigliato a regime):**

1. Carica il sito su GitHub (passi 1–3 dell'opzione A).
2. Su Netlify: **Add new site → Import an existing project → GitHub** →
   scegli il repository.
3. *Build command*: lascia **vuoto**. *Publish directory*: **`.`**
   (sono già impostati in `netlify.toml`). **Deploy**.
4. Ogni modifica caricata su GitHub viene pubblicata in automatico.

**Dominio personalizzato (dopo):**

1. **Domain management → Add a domain** → `quintodwn.it` → segui la procedura.
2. Nel DNS del registrar:
   - record **CNAME**: host `www` → `NOME-SITO.netlify.app`
   - record **A** per `@` → `75.2.60.5`
   (in alternativa puoi delegare i nameserver a Netlify DNS, come proposto dalla procedura).
3. Il certificato HTTPS (Let's Encrypt) viene attivato da Netlify in automatico.

## 7. Dati, aggiornamento automatico e cache

Endpoint ESPN usati (JSON pubblico e gratuito, chiamato direttamente dal browser):

- `site.web.api.espn.com/apis/v2/sports/football/nfl/standings` (+ `?level=3`)
- `site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` (+ `?seasontype=&week=&dates=`)
- `site.api.espn.com/apis/site/v2/sports/football/nfl/groups`
- `site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{ID}` · `/roster` · `/schedule` (+ `?season=&seasontype=`)
- `site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event={ID}` — profilo partita:
  punteggio per quarti, statistiche, box score, scoring plays, forma recente, infortuni
- `site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{ID}` · `/stats` · `/gamelog`

**Head-to-head:** il summary ESPN non li fornisce, quindi il profilo partita li
ricostruisce dai calendari della squadra di casa nelle ultime 6 stagioni
(regular season + playoff), con il conteggio vittorie. Le stagioni concluse
restano in cache 30 giorni. Il numero di stagioni si cambia in
`assets/js/pages/partita.js` (`H2H_SEASONS`).

**Infortuni:** arrivano dall'injury report ESPN incluso nel summary della partita
(l'endpoint `/injuries` globale pesa quasi 9 MB, troppo per il browser).

**Highlights:** per le partite finite c'è un link alla ricerca sul canale YouTube
ufficiale NFL (`youtube.com/@NFL`) con squadre, anno e settimana. Senza chiave
YouTube non si può conoscere in anticipo l'ID esatto del video.

**Statistiche:** le classifiche individuali usano
`site.web.api.espn.com/apis/common/v3/sports/football/nfl/statistics/byathlete`
con `isqualified=false` (tutti i giocatori con dati, non solo i "qualificati")
e vengono scaricate solo per la statistica scelta. Quelle di squadra usano
`…/statistics/byteam`, che contiene sia i numeri propri sia quelli concessi agli
avversari (punti subiti, sack fatti). La red zone % non è in quell'endpoint e
arriva da `…/nfl/teams/{ID}/statistics` (32 chiamate, solo quando la scegli).
Le liste lunghe mostrano i primi 50 con il pulsante «Mostra tutti».

Ogni statistica a conteggio ha anche la versione **a partita**. Per evitare outlier
(es. un ricevitore con un solo passaggio lanciato in cima al passer rating) si
applicano soglie minime ispirate ai criteri NFL, rapportate alle partite di
squadra giocate (T): passaggi 5×T tentativi per i totali e 14×T per rating e medie;
corse 1×T per i totali e 6,25×T per medie e yard per corsa; ricezioni 1,875×T per
le medie; field goal 0,75×T tentativi per la percentuale; per tutte le medie almeno
metà delle partite giocate. La soglia applicata è scritta sopra ogni classifica e
si modifica in `assets/js/pages/statistiche.js` (oggetto `QUAL`).

**Nota su `/teams`:** l'elenco `…/nfl/teams` funziona da terminale ma **ESPN non
invia l'header CORS**, quindi i browser lo bloccano. Il sito usa `/groups`
(stesse squadre, stessi loghi ufficiali, CORS abilitato) e i colori ufficiali
ESPN salvati in `assets/js/api.js`. La scheda squadra legge comunque i colori live
da `/teams/{ID}`, che invece funziona.

**Cache leggera** (`assets/js/api.js`, oggetto `TTL`): ogni risposta, già
alleggerita, viene salvata in memoria e nel `localStorage` del visitatore.

| Dato | Validità cache |
|---|---|
| Scoreboard con partite in corso | 1 min |
| Scoreboard settimana corrente | 3 min |
| Settimane concluse | 6 ore |
| Classifiche | 10 min |
| Calendario squadra | 15 min |
| Scheda squadra | 1 ora |
| Roster | 12 ore |
| Elenco squadre | 24 ore |
| Profilo partita in corso / da giocare / finita | 30 s / 10 min / 24 ore |
| Profilo giocatore · statistiche · game log | 12 ore · 6 ore · 1 ora |
| Calendari delle stagioni passate (head-to-head) | 30 giorni |
| Classifiche statistiche · red zone | 30 min · 1 ora |

Le pagine si ricontrollano da sole (ogni 30 secondi il profilo di una partita in
corso, ogni minuto Home e Calendario, ogni 5 minuti
Classifiche e Statistiche) solo mentre la scheda del browser è visibile. Se ESPN non
risponde viene mostrato l'ultimo dato salvato con un avviso; senza dati salvati
compare un messaggio d'errore con il pulsante **Riprova**.

Tutti gli orari sono convertiti nel fuso **Europe/Rome** (ora legale inclusa).

## 8. Personalizzare la grafica

Colori in cima a `assets/css/style.css`: blocco `:root` per il tema scuro
(predefinito) e `:root[data-theme="light"]` per il tema chiaro.

```css
--orange: #f7b263;   /* il "5" del logo (fondi e pulsanti) */
--accent: #f7b263;   /* arancio di testi e bordi; nel tema chiaro è più scuro */
--navy: #0a1730;     /* sfondo pagina */
```

**Tema chiaro/scuro:** il pulsante sole/luna nell'header cambia tema; la scelta
è salvata nel browser (`localStorage`, chiave `5dwn-theme`) e applicata prima
che la pagina venga disegnata, quindi niente lampi. I loghi delle squadre
passano da soli dalla versione per fondo scuro a quella standard.

Loghi 5DWN: `assets/img/logo-5dwn.png` (arancio + bianco, tema scuro) e
`assets/img/logo-5dwn-nero.png` (nero, tema chiaro). Per cambiarli basta
sostituire i file mantenendo gli stessi nomi.

**Versioni dei file (cache):** gli indirizzi di CSS e script hanno un suffisso
`?v=AAAAMMGGhhmm` che viene aggiornato a ogni pubblicazione, così i browser
scaricano subito i file nuovi invece di usare quelli vecchi in cache. Se modifichi
un file direttamente da GitHub senza cambiare il suffisso, i visitatori vedono la
novità entro circa 10 minuti.

**Selettori:** tutti i selettori del sito sono tendine (`<select class="select">`),
mai liste a scorrimento orizzontale; i due interruttori a due voci
(Conference/Division, Individuali/Squadra) restano pulsanti affiancati.

---

Dati e loghi delle squadre © ESPN / NFL e rispettivi proprietari. L'API ESPN non
è ufficialmente documentata: se un giorno cambiasse formato, gli adattamenti
vanno fatti solo in `assets/js/api.js`.
