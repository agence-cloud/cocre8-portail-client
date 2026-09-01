export type IssueAppel = "a_venir" | "honore" | "no_show";

/**
 * À qui s'adresse la réunion. Indépendante de sa nature : un coaching peut
 * être collectif ou individuel, un appel de prospection est toujours
 * individuel.
 */
export type PorteeReunion = "collectif" | "individuel";

export type Appel = {
  id: string;
  /** Nul pour un appel importé qui n'a pas encore trouvé sa fiche. */
  personne_id: string | null;
  prevu_le: string;
  issue: IssueAppel;
  /** Déduite à la création, jamais saisie. */
  nature: "prospection" | "coaching";
  /** Nul sur un appel de prospection, qui n'a pas besoin d'être nommé. */
  titre: string | null;
  portee: PorteeReunion;
  duree_minutes: number | null;
  /** Le lien pour rejoindre, distinct du lien de l'enregistrement. */
  lien_visio: string | null;
  /**
   * La note interne du coach. Lui appartient, toujours, et ne sort jamais
   * vers le membre : la vue `coaching_membre` ne la sélectionne pas.
   */
  notes: string | null;
  /** Nul pour une saisie à la main, renseigné par un import automatique. */
  source_externe: string | null;
  reference_externe: string | null;
  lien_enregistrement: string | null;
  /** Ce qui s'est dit, mot pour mot. Distinct des notes : voir 0026. */
  transcription: string | null;
  /** Le résumé du transcript, seul texte du compte rendu que le client lit. */
  resume: string | null;
  /** Son numéro d'ordre, calculé à la lecture. */
  rang: number;
};

export const ISSUES: readonly { valeur: IssueAppel; libelle: string }[] = [
  { valeur: "a_venir", libelle: "À venir" },
  { valeur: "honore", libelle: "Honoré" },
  { valeur: "no_show", libelle: "No-show" },
];

export function libelleIssue(issue: IssueAppel): string {
  return ISSUES.find((i) => i.valeur === issue)!.libelle;
}
