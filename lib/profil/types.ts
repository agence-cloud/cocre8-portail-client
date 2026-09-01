export type TypeQuestion = "texte_court" | "texte_long" | "nombre" | "choix";

export type QuestionProfil = {
  id: string;
  pilier_id: string | null;
  libelle: string;
  aide: string | null;
  type: TypeQuestion;
  /** Les libellés proposés, pour le type « choix ». */
  options: string[] | null;
  ordre: number;
};

export type ReponseProfil = {
  id: string;
  question_id: string;
  reponse: string | null;
  modifie_le: string;
};
