export type StatutAccompagnement = "actif" | "termine" | "suspendu";

/**
 * Ce qui fait d'une fiche un client : une date de démarrage, et ce qui se
 * passe ensuite.
 *
 * **Il ne porte ni offre ni prix, et c'est un choix.** Une version précédente
 * obligeait à choisir une offre et à saisir un montant avant de pouvoir créer
 * un client. Or rien dans cet outil ne permettait de créer, de renommer ou de
 * retirer une offre : c'était un champ obligatoire que personne ne pouvait
 * administrer, et une façon de vendre imposée à tous ceux qui installent
 * l'outil. Ce que tu factures se suit ailleurs.
 */
export type Accompagnement = {
  id: string;
  personne_id: string;
  date_debut: string;
  date_fin: string | null;
  statut: StatutAccompagnement;
  progression: number;
};
