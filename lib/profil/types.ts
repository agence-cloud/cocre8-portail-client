export type TypeQuestion = "texte_court" | "texte_long" | "nombre" | "choix";

export type QuestionProfil = {
  id: string;
  libelle: string;
  aide: string | null;
  type: TypeQuestion;
  /** Les libellés proposés, pour le type « choix ». */
  options: string[] | null;
  ordre: number;
};

/**
 * Une question telle que le coach la règle : sans `options`,
 * que l'écran des réglages ne propose pas encore, mais avec `active`, qu'il
 * est seul à voir.
 */
export type QuestionProfilReglable = {
  id: string;
  libelle: string;
  aide: string | null;
  type: TypeQuestion;
  ordre: number;
  active: boolean;
};

export type ReponseProfil = {
  id: string;
  question_id: string;
  reponse: string | null;
  modifie_le: string;
};
