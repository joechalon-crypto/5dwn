// ============================================================================
// CONTENUTI EDITORIALI DELLE SQUADRE — 5DWN
// ----------------------------------------------------------------------------
// Questo è l'unico file da toccare per arricchire le pagine squadra.
// Tutto ciò che è "live" (record, roster, coach, calendario, statistiche
// stagionali) arriva da ESPN in automatico: qui va solo la parte editoriale.
//
// Chiave = sigla ESPN della squadra (MIN, GB, KC, ...).
// Campi disponibili (tutti facoltativi):
//
//   fondazione: 1960,                       // anno di fondazione
//   stadio: { capienza: 66860, nome, citta } // nome/città arrivano già da ESPN,
//                                            // compilali solo per sovrascriverli
//   storia: [ "paragrafo 1", "paragrafo 2" ],// testo libero, ammesso HTML semplice
//   tappe: [ { anno: "1969", testo: "..." } ],      // timeline della franchigia
//   palmares: [ { label: "Super Bowl vinti", valore: "0" } ],
//   stagioni: [ { anno: 2025, record: "10-7", risultato: "Wild Card" } ],
//   statistiche: [ { label: "Record all-time", valore: "..." } ],
//   note: "testo libero / opinione della redazione 5DWN"
//
// Capienze e anni di fondazione sono valori indicativi: verificali e
// aggiornali quando serve.
// ============================================================================

export const SQUADRE = {
  // ------------------------------------------------------------------ NFC NORTH
  MIN: {
    fondazione: 1960,
    stadio: { capienza: 66860 },
    storia: [
      "Nati nel 1960 ed entrati in campo nella stagione 1961, i Minnesota Vikings sono la squadra simbolo di 5DWN: viola e oro, corno vichingo sul casco e un tifo che ha reso famoso lo «Skol» in tutto il mondo.",
      "Gli anni d'oro arrivano con coach Bud Grant e la leggendaria linea difensiva dei <em>Purple People Eaters</em> (Alan Page, Carl Eller, Jim Marshall, Gary Larsen): il titolo NFL del 1969 e quattro Super Bowl disputati (IV, VIII, IX, XI), purtroppo tutti persi.",
      "Dalla magia di Fran Tarkenton alle ricezioni di Cris Carter e Randy Moss, dalle corse di Adrian Peterson al «Minneapolis Miracle» di Stefon Diggs nel playoff 2017: la storia dei Vikings è fatta di grandi campioni e di un sogno — il Lombardi Trophy — ancora da realizzare.",
    ],
    tappe: [
      { anno: "1961", testo: "Prima stagione NFL, al Metropolitan Stadium di Bloomington." },
      { anno: "1969", testo: "Campioni NFL; sconfitta nel Super Bowl IV contro i Chiefs." },
      { anno: "1973–1976", testo: "Altri tre Super Bowl disputati (VIII, IX, XI) nell'era Bud Grant." },
      { anno: "1982", testo: "Trasferimento nel Hubert H. Humphrey Metrodome." },
      { anno: "1998", testo: "Stagione da 15-1 con l'attacco record di Randall Cunningham, Moss e Carter." },
      { anno: "2016", testo: "Inaugurazione dello U.S. Bank Stadium, che nel 2018 ospita il Super Bowl LII." },
      { anno: "2018", testo: "«Minneapolis Miracle»: touchdown di Diggs all'ultimo secondo contro i Saints." },
    ],
    palmares: [
      { label: "Campionati NFL (pre-Super Bowl)", valore: "1 (1969)" },
      { label: "Super Bowl disputati", valore: "4" },
    ],
    stagioni: [],
    statistiche: [],
    note: "",
  },
  GB: { fondazione: 1919, stadio: { capienza: 81441 } },
  CHI: { fondazione: 1920, stadio: { capienza: 61500 } },
  DET: { fondazione: 1930, stadio: { capienza: 65000 } },

  // ------------------------------------------------------------------ NFC SOUTH
  ATL: { fondazione: 1966, stadio: { capienza: 71000 } },
  CAR: { fondazione: 1995, stadio: { capienza: 74867 } },
  NO: { fondazione: 1967, stadio: { capienza: 73208 } },
  TB: { fondazione: 1976, stadio: { capienza: 65618 } },

  // ------------------------------------------------------------------ NFC EAST
  DAL: { fondazione: 1960, stadio: { capienza: 80000 } },
  NYG: { fondazione: 1925, stadio: { capienza: 82500 } },
  PHI: { fondazione: 1933, stadio: { capienza: 69879 } },
  WSH: { fondazione: 1932, stadio: { capienza: 62000 } },

  // ------------------------------------------------------------------ NFC WEST
  ARI: { fondazione: 1898, stadio: { capienza: 63400 } },
  LAR: { fondazione: 1936, stadio: { capienza: 70240 } },
  SF: { fondazione: 1946, stadio: { capienza: 68500 } },
  SEA: { fondazione: 1976, stadio: { capienza: 68740 } },

  // ------------------------------------------------------------------ AFC NORTH
  BAL: { fondazione: 1996, stadio: { capienza: 71008 } },
  CIN: { fondazione: 1968, stadio: { capienza: 65515 } },
  CLE: { fondazione: 1946, stadio: { capienza: 67431 } },
  PIT: { fondazione: 1933, stadio: { capienza: 68400 } },

  // ------------------------------------------------------------------ AFC SOUTH
  HOU: { fondazione: 2002, stadio: { capienza: 72220 } },
  IND: { fondazione: 1953, stadio: { capienza: 67000 } },
  JAX: { fondazione: 1995, stadio: { capienza: 67814 } },
  TEN: { fondazione: 1960, stadio: { capienza: 69143 } },

  // ------------------------------------------------------------------ AFC EAST
  BUF: { fondazione: 1960, stadio: { capienza: 62000 } },
  MIA: { fondazione: 1966, stadio: { capienza: 65326 } },
  NE: { fondazione: 1960, stadio: { capienza: 65878 } },
  NYJ: { fondazione: 1960, stadio: { capienza: 82500 } },

  // ------------------------------------------------------------------ AFC WEST
  DEN: { fondazione: 1960, stadio: { capienza: 76125 } },
  KC: { fondazione: 1960, stadio: { capienza: 76416 } },
  LV: { fondazione: 1960, stadio: { capienza: 65000 } },
  LAC: { fondazione: 1960, stadio: { capienza: 70240 } },
};
