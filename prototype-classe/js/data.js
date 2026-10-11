/*
 * Données statistiques et sources — prototype « La classe »
 * ----------------------------------------------------------
 * Ce fichier ne contient AUCUN code de dessin. Il regroupe tout ce qui doit
 * être vérifié par une personne avant publication : chiffres, libellés,
 * définitions, limites et références.
 *
 * Statuts utilisés dans `verification` :
 *   "confirme-resume"  : concordant avec le résumé publié par l'Ined.
 *   "a-confirmer"      : à relire dans le texte intégral avant mise en ligne.
 *   "redactionnel"     : formulation rédigée pour le prototype (pas une donnée).
 *
 * Aucune donnée de démonstration n'est présentée comme validée : tout champ
 * marqué "a-confirmer" est signalé comme tel dans le panneau explicatif.
 */
(function () {
  "use strict";

  var sources = {
    "ined-ps-612": {
      id: "ined-ps-612",
      titre:
        "Violences sexuelles durant l’enfance et l’adolescence : des agressions familiales dont on parle peu",
      auteurs: ["Elise Marsicano", "Nathalie Bajos", "Jeanna-Eve Pousson"],
      editeur: "Ined",
      revue: "Population & Sociétés",
      numero: "612",
      date: "juin 2023",
      doi: "10.3917/popsoc.612.0001",
      url: "https://www.ined.fr/fr/publications/editions/population-et-societes/violences-sexuelles-durant-enfance-et-adolescence",
      enquete: {
        description:
          "Enquête nationale sur les violences sexuelles menée par l’Inserm auprès d’adultes résidant en France métropolitaine.",
        anneeCollecte: "2021 (d’après le résumé de l’Ined)",
        trancheAge: null, // à reporter depuis le texte intégral
        tailleEchantillon: null, // à reporter depuis le texte intégral
        verification: "a-confirmer"
      }
    }
  };

  var statistics = {
    /* Statistique représentée dans la classe. */
    femmes: {
      id: "femmes",
      sourceId: "ined-ps-612",
      valeur: 4.6, // en %
      unite: "%",
      verification: "confirme-resume",
      libelleCourt: "4,6 % des femmes interrogées",
      phrase:
        "Dans une enquête menée auprès d’adultes en France métropolitaine, 4,6 % des femmes interrogées déclarent avoir subi des violences incestueuses avant l’âge de 18 ans.",
      // Représentation en « 1 sur N ». N est calculé et contrôlé dans main.js
      // (Math.round(100 / valeur)) : la scène refuse une valeur incohérente.
      representation: { numerateur: 1, denominateur: 22, approximation: true },
      phraseProportion: "Cela correspond à environ 1 femme interrogée sur 22.",
      proportionMiseEnValeur: "1 femme interrogée sur 22",
      population:
        "Femmes adultes ayant répondu à l’enquête.",
      periode:
        "Violences survenues avant l’âge de 18 ans, déclarées plus tard, à l’âge adulte. Selon l’âge des personnes interrogées, ces faits remontent à quelques années ou à plusieurs décennies.",
      mesure:
        "La part des femmes interrogées qui déclarent avoir subi, avant 18 ans, des violences sexuelles commises dans le cadre familial (violences incestueuses). Il s’agit de déclarations recueillies par questionnaire, et non de faits constatés par une autorité."
    },

    /*
     * Statistique NON représentée dans cette scène.
     * 1,2 % ≈ 1 sur 83 : elle ne doit jamais être figurée par une place
     * sur 22. Une future vue de comparaison devra utiliser une échelle
     * adaptée (ex. 83 places, ou une grille de 100 / 1 000 personnes)
     * avec des dénominateurs explicites.
     */
    hommes: {
      id: "hommes",
      sourceId: "ined-ps-612",
      valeur: 1.2,
      unite: "%",
      verification: "confirme-resume",
      libelleCourt: "1,2 % des hommes interrogés",
      phrase:
        "Dans la même enquête, 1,2 % des hommes interrogés déclarent avoir subi des violences incestueuses avant l’âge de 18 ans.",
      representation: { numerateur: 1, denominateur: 83, approximation: true },
      phraseProportion: "Cela correspond à environ 1 homme interrogé sur 83.",
      proportionMiseEnValeur: "1 homme interrogé sur 83",
      population:
        "Hommes adultes ayant répondu à l’enquête.",
      periode: null, // identique à "femmes" — à factoriser lors de la future vue
      mesure: null
    }
  };

  /* Limites d'interprétation communes (rédactionnel, à relire). */
  var limites = [
    "Ce chiffre repose sur des déclarations. Une partie des violences n’est jamais dite, oubliée ou difficile à nommer : il s’agit plutôt d’une estimation basse.",
    "Il s’agit d’une estimation à partir d’un échantillon : elle comporte une marge d’incertitude statistique.",
    "Il décrit des adultes interrogés en France métropolitaine. Il ne mesure pas directement ce que vivent aujourd’hui les enfants, et ne couvre pas les territoires d’outre-mer.",
    "« 1 sur 22 » est un arrondi : 4,6 % correspond plus précisément à 1 sur 21,7.",
    "La salle de classe est une représentation visuelle de cette proportion. Elle ne compte pas des enfants actuellement victimes, et la place mise en évidence a été choisie arbitrairement.",
    "La même étude indique 1,2 % chez les hommes interrogés, soit environ 1 sur 83. Cette proportion ne peut pas être représentée par une place sur 22 ; elle nécessitera une visualisation dédiée."
  ];

  /* Paramètres de la scène — séparés du dessin. */
  var scenes = {
    classe: {
      statistiqueId: "femmes",
      // Disposition : rangées de tables doubles, du fond vers l'avant.
      // 4 + 6 + 6 + 6 = 22 places.
      rangees: [
        { tablesDoubles: [0, 2] }, // fond : 2 tables (gauche et droite)
        { tablesDoubles: [0, 1, 2] },
        { tablesDoubles: [0, 1, 2] },
        { tablesDoubles: [0, 1, 2] } // avant
      ],
      // Index (0 à 21, ordre de lecture du fond vers l'avant, de gauche à
      // droite) de la place mise en évidence. Choix arbitraire, documenté.
      placeMiseEnEvidence: 11
    }
  };

  window.STOP_INCESTE_DATA = Object.freeze({
    sources: sources,
    statistics: statistics,
    limites: limites,
    scenes: scenes,
    verificationLabels: {
      "confirme-resume": "Concordant avec le résumé publié par l’Ined",
      "a-confirmer": "À confirmer dans le texte intégral avant publication",
      redactionnel: "Formulation rédactionnelle du prototype"
    }
  });
})();
