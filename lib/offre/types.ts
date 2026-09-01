export type TypeOffre = "ponctuel" | "mensuel";

export type Offre = {
  id: string;
  nom: string;
  prix_defaut: number;
  type: TypeOffre;
  duree_mois: number | null;
  active: boolean;
};

export type StatutAccompagnement = "actif" | "termine" | "suspendu";

export type Accompagnement = {
  id: string;
  personne_id: string;
  offre_id: string;
  /**
   * Le prix figé au jour où le client signe.
   *
   * Sur l'offre vit le prix du moment ; ici vit celui qu'a payé cette
   * personne-là. C'est ce qui permet d'augmenter ses tarifs sans réécrire
   * l'histoire de ceux qui ont signé avant.
   */
  prix_negocie: number;
  date_debut: string;
  date_fin: string | null;
  statut: StatutAccompagnement;
  progression: number;
  offre: Offre | null;
};

export const TYPES_OFFRE: readonly { valeur: TypeOffre; libelle: string }[] = [
  { valeur: "ponctuel", libelle: "Paiement unique" },
  { valeur: "mensuel", libelle: "Mensuel" },
];

function format(decimales: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

const ENTIER = format(0);
const CENTIMES = format(2);

/**
 * Les montants ronds s'écrivent sans décimales, les autres avec deux : un prix
 * s'écrit « 1 499,50 » et jamais « 1 499,5 ».
 *
 * Le remplacement des espaces est nécessaire : en français, Intl sépare les
 * milliers par une espace insécable étroite et le symbole par une espace
 * insécable. Les ramener à des espaces ordinaires rend les libellés
 * comparables dans les tests et cherchables dans une page.
 */
export function formaterEuros(montant: number): string {
  const rond = Number.isInteger(montant);
  return (rond ? ENTIER : CENTIMES).format(montant).replace(/[  ]/g, " ");
}

/**
 * Ramène toute offre à ce qu'elle rapporte sur un an, pour que le pipe
 * compare des choses comparables. Sans ça, un récurrent à 400 euros par mois
 * pèserait 400 face à un programme à 1 500, alors qu'il rapporte davantage.
 */
export function valeurAnnuelle(offre: Offre, prix: number): number {
  return offre.type === "mensuel" ? prix * 12 : prix;
}
