export type Tache = {
  id: string;
  objectif_id: string;
  titre: string;
  description: string | null;
  ordre: number;
  faite: boolean;
  faite_le: string | null;
};

/**
 * Un objectif d'un client, avec ses sous-tâches.
 *
 * **Il appartient au client, et c'est tout le changement.** L'outil portait
 * auparavant des « parties » communes, ouvertes une par mois selon un
 * calendrier, remplies depuis un parcours type recopié chez chacun. C'était
 * la méthode d'un coach imposée à tous ceux qui installent l'outil. Ici le
 * coach écrit les objectifs d'un client sur son écran de suivi, avec les
 * sous-tâches en dessous, et rien ne les range dans une grille.
 *
 * Les tâches arrivent imbriquées : une tâche sans son objectif n'a ni
 * propriétaire ni contexte, et les deux se lisent toujours ensemble.
 */
export type Objectif = {
  id: string;
  personne_id: string;
  titre: string;
  description: string | null;
  echeance: string | null;
  ordre: number;
  taches: Tache[];
};
