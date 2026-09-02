/**
 * Le contenu du jeu de démonstration : qui est la cliente inventée, ce qu'elle
 * a répondu, et ce qui s'est dit à ses deux séances.
 *
 * **Séparé de l'action qui le pose**, pour deux raisons. Un fichier « use
 * server » ne peut exporter que des fonctions, donc rien de ce contenu n'était
 * lisible par un test. Et ce contenu est ce qu'un coach voudra réécrire à son
 * métier : il se trouve mieux dans un fichier qui ne parle que de lui.
 */
/** Le client inventé, et ce qu'il a déjà vécu. */
export const CLIENTE = {
  prenom: "Léa",
  nom: "Marchand",
  email: "lea.marchand@exemple.test",
  entreprise: "Atelier Marchand",
  /** Assez ancien pour que deux séances soient déjà passées. */
  ilYAJours: 45,
};

/**
 * Ses réponses, une par question, et elles se répondent entre elles.
 *
 * **Elles étaient auparavant indexées par type de question**, donc les sept
 * questions en texte long recevaient toutes la même phrase, mot pour mot. À
 * l'écran, la fiche de la cliente était sept fois la même ligne : le coach y
 * lisait moins un client qu'un remplissage, et l'outil paraissait vide au
 * moment précis où il devait paraître plein.
 *
 * Elles racontent donc une seule histoire : une graphiste qui vend à l'heure,
 * qui plafonne parce que son temps est fini, et à qui l'accompagnement va
 * faire passer son offre au forfait. Ses tâches cochées, ses deux comptes
 * rendus et son objectif disent tous cette histoire-là, sans quoi la
 * démonstration se contredit à voix haute.
 *
 * **Indexées par le libellé de la question**, celui du jeu de départ. Un coach
 * qui a réécrit ses questions avant de charger la démonstration ne trouve donc
 * pas la sienne ici, et reçoit le repli par type. C'est le bon compromis : une
 * réponse générique sous une question personnelle vaut mieux qu'une réponse
 * personnelle sous la mauvaise question.
 */
export const REPONSES: Record<string, string> = {
  "Quel est ton objectif principal ?":
    "Passer de 2 500 à 5 000 euros par mois sans ajouter une heure de travail.",
  "Où en es-tu aujourd'hui ?":
    "Graphiste à mon compte depuis deux ans. Je facture à l'heure, entre 45 et 60 euros, et mes journées sont pleines. Le chiffre ne monte plus parce que le temps est fini.",
  "Pour quand ?": "Fin juin",
  "Qu'est-ce qui te bloque le plus ?":
    "Je n'ose pas annoncer un forfait. Quand un client demande le prix, je calcule des heures à voix haute et je finis toujours en dessous de ce que j'avais prévu.",
  "Qu'as-tu déjà essayé ?":
    "J'ai augmenté mon taux horaire deux fois. Ça a marché trois mois, puis j'ai perdu deux clients réguliers et je suis redescendue.",
  "Combien d'heures par semaine peux-tu y consacrer ?": "6",
  "À quoi verras-tu que c'est réussi ?":
    "Trois devis au forfait signés d'affilée, sans que j'aie eu à justifier le prix par un nombre d'heures.",
  "Qu'attends-tu de ton coach ?":
    "Qu'on me dise quand je me sous-estime, sur le moment, pas trois semaines après.",
};

/**
 * Le repli quand la question n'est pas celle du jeu de départ. Volontairement
 * neutre : il ne prétend pas répondre à une question qu'il ne connaît pas.
 */
export const REPONSES_PAR_TYPE: Record<string, string> = {
  texte_long: "Réponse d'exemple, à remplacer par celle de ton client.",
  texte_court: "Fin juin",
  nombre: "6",
  choix: "Oui",
};

export const SEANCES = [
  {
    ilYAJours: 30,
    titre: "Première séance",
    resume:
      "On a posé ton objectif et ce qui te bloque vraiment. Ta priorité des trois prochaines semaines : arrêter de vendre à l'heure.",
    transcription:
      "Bonjour Léa, on commence par où tu en es aujourd'hui. Tu me disais que tes journées partent en poussière...",
    notes: "Note interne : elle sous-estime son prix. Y revenir à la prochaine.",
  },
  {
    ilYAJours: 12,
    titre: "Point d'étape",
    resume:
      "Ton offre est passée au forfait. On a écrit les trois étapes du plan et daté la première.",
    transcription: "Alors, tu as testé le forfait sur deux devis. Raconte-moi ce qui s'est passé...",
    notes: "Note interne : bonne dynamique, ne pas surcharger.",
  },
];


/**
 * Ses objectifs, et leurs étapes.
 *
 * **Ils racontent la même histoire que ses réponses**, celle d'une graphiste
 * qui vend à l'heure et veut passer au forfait. C'est tout l'intérêt du jeu :
 * un coach qui l'ouvre doit reconnaître un vrai client, pas un remplissage.
 *
 * Trois objectifs et pas cinq : le premier est fini, le deuxième en cours, le
 * troisième pas commencé. C'est ce qui montre les trois états de la carte en
 * un écran, là où trois objectifs à moitié faits n'en montreraient qu'un.
 *
 * `faites` est le nombre d'étapes cochées, en partant du haut. Un nombre
 * plutôt que la liste des titres cochés : le jour où l'on réécrit une étape,
 * il n'y a pas deux endroits à tenir d'accord.
 */
export const OBJECTIFS = [
  {
    titre: "Arrêter de facturer à l'heure",
    description: "Le temps est fini, donc le chiffre plafonne tant qu'il s'y adosse.",
    dansJours: -20,
    faites: 3,
    taches: [
      "Lister les cinq dernières missions et leur temps réel",
      "Calculer ce que chacune aurait coûté au forfait",
      "Écrire les trois forfaits, avec ce qu'ils contiennent et ce qu'ils excluent",
    ],
  },
  {
    titre: "Annoncer le prix sans se justifier",
    description: "Le blocage n'est pas le tarif, c'est la phrase qui l'accompagne.",
    dansJours: 25,
    faites: 1,
    taches: [
      "Écrire la phrase d'annonce, mot pour mot",
      "La dire à voix haute dix fois avant le prochain rendez-vous",
      "L'essayer sur un devis, et noter la réaction",
      "Refaire le même devis sans donner aucun nombre d'heures",
    ],
  },
  {
    titre: "Trois forfaits signés d'affilée",
    description: "Le signe que le changement a tenu, et pas seulement qu'il a été essayé.",
    dansJours: 80,
    faites: 0,
    taches: [
      "Relancer les deux clients réguliers avec la nouvelle offre",
      "Proposer un forfait à chaque nouvelle demande, sans exception",
      "Faire le point sur les trois premiers signés",
    ],
  },
];
