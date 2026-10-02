// ============================================================================
// CONFIGURAZIONE DEL SITO 5DWN — modifica qui link e testi principali.
// ============================================================================

export const SITO = {
  nome: "5DWN",
  payoff: "Football more than a game",
  descrizione: "La pagina italiana di NFL: risultati, classifiche, playoff picture e tutte le 32 squadre.",

  social: {
    instagram: {
      label: "Instagram",
      handle: "@quintodwn",
      url: "https://instagram.com/quintodwn",
    },
    youtube: {
      label: "YouTube",
      handle: "Canale 5DWN",
      // TODO: sostituisci con l'URL esatto del canale (es. https://www.youtube.com/@NOMECANALE)
      url: "https://www.youtube.com/results?search_query=5DWN",
    },
    podcast: {
      label: "Podcast",
      handle: "Play Action",
      // TODO: sostituisci con il link del podcast (Spotify / Apple Podcasts)
      url: "https://open.spotify.com/search/Play%20Action%205DWN",
    },
  },

  // Card "Ultimo reel" in home. Instagram non offre un feed pubblico senza
  // chiave: quando pubblichi un reel incolla qui il link (e, se vuoi, titolo e
  // una copertina salvata in assets/img/). Se "url" è vuoto la card porta
  // alla pagina dei reel di @quintodwn.
  ultimoReel: {
    url: "",            // es. "https://www.instagram.com/reel/XXXXXXXXX/"
    titolo: "",         // es. "Week 4: le 5 giocate che non avete visto"
    copertina: "",      // es. "assets/img/reel-week4.jpg"
  },
};
