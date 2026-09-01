export type Tache = {
  id: string;
  personne_id: string;
  pilier_id: string;
  /** Le sous-module de la méthode sous lequel la tâche se range. */
  groupe: string | null;
  titre: string;
  description: string | null;
  ordre: number;
  faite: boolean;
  faite_le: string | null;
};

export type Section = {
  nom: string | null;
  taches: Tache[];
  faites: number;
  terminee: boolean;
};
