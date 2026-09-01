export type Etape = "lead" | "qualifie" | "appel_booke" | "client" | "perdu";

export type Canal =
  | "meta_ads"
  | "youtube"
  | "linkedin"
  | "instagram"
  | "academie"
  | "bouche_a_oreille"
  | "prospection";

export type Chemin = "vsl" | "reservation_directe" | "academie";

export type MotifSortie =
  | "trop_tot"
  | "hors_cible"
  | "pas_interesse"
  | "budget"
  | "injoignable";

export type Personne = {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  entreprise: string | null;
  canal: Canal | null;
  chemin: Chemin | null;
  campagne: string | null;
  offre_visee_id: string | null;
  prix_vise: number | null;
  /** Jointure sur l'offre visée, pour annualiser sans dépendre d'une liste. */
  offre_visee?: { type: "ponctuel" | "mensuel" } | null;
  etape: Etape;
  motif_sortie: MotifSortie | null;
  renvoye_academie: boolean;
  renvoye_academie_le: string | null;
  a_relier: boolean;
  /** La fiche avec qui relier celle-ci. Null quand rien ne la rapproche. */
  a_relier_avec: string | null;
  /**
   * Fiche fictive du jeu de démonstration. Le drapeau est ce qui permet de
   * la reconnaître : c'est lui que « tout vider » suit, et lui qui empêche un
   * client inventé de compter comme un vrai.
   */
  demonstration: boolean;
  notes: string | null;
  cree_le: string;
  modifie_le: string;
};

/**
 * Quatre colonnes visibles dans le CRM. `client` existe comme étape mais ne
 * s'affiche pas : une fiche qui signe quitte le CRM pour l'onglet Clients, où
 * son suivi commence. Un CRM sert à agir sur ce qui n'est pas encore gagné.
 */
export const ETAPES = [
  { valeur: "lead", libelle: "Lead", sortie: false, dansLeCrm: true },
  { valeur: "qualifie", libelle: "Qualifié", sortie: false, dansLeCrm: true },
  { valeur: "appel_booke", libelle: "Appel booké", sortie: false, dansLeCrm: true },
  { valeur: "perdu", libelle: "Perdu", sortie: true, dansLeCrm: true },
  { valeur: "client", libelle: "Client", sortie: false, dansLeCrm: false },
] as const satisfies readonly {
  valeur: Etape;
  libelle: string;
  sortie: boolean;
  dansLeCrm: boolean;
}[];

export const ETAPES_CRM = ETAPES.filter((e) => e.dansLeCrm);

export const CANAUX: readonly { valeur: Canal; libelle: string }[] = [
  { valeur: "meta_ads", libelle: "Meta Ads" },
  { valeur: "youtube", libelle: "YouTube" },
  { valeur: "linkedin", libelle: "LinkedIn" },
  { valeur: "instagram", libelle: "Instagram" },
  { valeur: "academie", libelle: "Académie" },
  { valeur: "bouche_a_oreille", libelle: "Bouche à oreille" },
  { valeur: "prospection", libelle: "Prospection" },
];

export const CHEMINS: readonly { valeur: Chemin; libelle: string }[] = [
  { valeur: "vsl", libelle: "Tunnel VSL" },
  { valeur: "reservation_directe", libelle: "Réservation directe" },
  { valeur: "academie", libelle: "Académie" },
];

export const MOTIFS_SORTIE: readonly { valeur: MotifSortie; libelle: string }[] = [
  { valeur: "trop_tot", libelle: "Trop tôt" },
  { valeur: "hors_cible", libelle: "Hors cible" },
  { valeur: "pas_interesse", libelle: "Pas intéressé" },
  { valeur: "budget", libelle: "Budget" },
  { valeur: "injoignable", libelle: "Injoignable" },
];

export function libelleEtape(etape: Etape): string {
  return ETAPES.find((e) => e.valeur === etape)!.libelle;
}

/**
 * Cherche un libellé dans un des référentiels ci-dessus. Sans elle, chaque
 * écran refait sa propre recherche, et changer un libellé de canal demande
 * de penser à plusieurs fichiers.
 */
export function libelleDe(
  liste: readonly { valeur: string; libelle: string }[],
  valeur: string | null,
  defaut = "Non renseigné",
): string {
  if (!valeur) return defaut;
  return liste.find((element) => element.valeur === valeur)?.libelle ?? valeur;
}

export function estSortie(etape: Etape): boolean {
  return ETAPES.find((e) => e.valeur === etape)!.sortie;
}
