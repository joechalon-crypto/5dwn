// ============================================================================
// TV IN ITALIA — da compilare SOLO con dati ufficiali (palinsesto/EPG DAZN).
// ----------------------------------------------------------------------------
// Non esiste un'API pubblica gratuita del palinsesto DAZN: per questo il sito
// non indovina mai il canale. Se una partita non è in elenco, il profilo
// partita mostra il segnaposto "in attesa del palinsesto ufficiale".
//
// Chiave = ID partita ESPN (è il numero nell'indirizzo del profilo partita:
// partita.html?id=401872972). Valore = canale come da palinsesto ufficiale.
//
// Esempio:
//   "401872972": "DAZN",
//   "401872965": "DAZN · NFL Game Pass",
// ============================================================================

export const TV_ITALIA = {
};

export const TV_ITALIA_PLACEHOLDER = "In attesa del palinsesto ufficiale DAZN";
