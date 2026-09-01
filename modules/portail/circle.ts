/**
 * Les liens externes proposés au client dans sa barre latérale : la
 * communauté, la formation, les événements.
 *
 * **Vides par défaut.** Ce sont les espaces de celui qui installe l'outil, et
 * personne d'autre ne peut les deviner. Tant qu'une adresse est vide, son
 * lien ne se dessine pas, et un groupe sans aucun lien ne dessine ni titre ni
 * filet : mieux vaut rien qu'un lien mort.
 *
 * En constantes et non en variables d'environnement : un `NEXT_PUBLIC_` est
 * recopié dans le paquet à la construction, le changer demande un
 * déploiement de toute façon, la variable n'apporte donc aucune souplesse.
 * Elle ajoute juste trois valeurs à ne pas oublier, et un oubli fait
 * disparaître le lien sans rien dire. Elles deviendront des réglages.
 */
export type EspaceCircle = "communaute" | "formation" | "evenements";

/**
 * Les valeurs sont typées `string` et non figées en littéraux : un `as const`
 * ferait dire au compilateur ce que valent ces trois adresses, et il
 * refuserait alors comme une erreur la comparaison qui tient toute la règle
 * du dessus. La garde doit rester vivante quelle que soit la valeur du jour.
 */
export const CIRCLE: Record<EspaceCircle, string> = {
  communaute: "",
  formation: "",
  evenements: "",
};

/**
 * La règle elle-même, prise en paramètre plutôt que lue sur `CIRCLE`. Un test
 * posé sur `liensCircle()` seule ne pourrait comparer qu'à `CIRCLE`, et les
 * deux côtés de la comparaison bougeraient ensemble : retirer le filtre
 * laisserait ce test vert. En passant les adresses en paramètre, le test
 * choisit lui-même ses valeurs et éprouve la règle, pas la valeur du moment.
 *
 * Le type de retour reste anonyme plutôt que d'importer `LienNav` du socle :
 * le module décrit ses liens, le socle décide comment il les dessine.
 */
export function construireLiensCircle(adresses: Record<EspaceCircle, string>) {
  const espaces = [
    { libelle: "Communauté", href: adresses.communaute, icone: "communaute" as const },
    { libelle: "Formation", href: adresses.formation, icone: "formation" as const },
    { libelle: "Événements", href: adresses.evenements, icone: "direct" as const },
  ];

  return espaces
    .filter((espace) => espace.href !== "")
    .map((espace) => ({ ...espace, externe: true }));
}

/**
 * Ce que la barre latérale reçoit : les seules adresses réellement remplies,
 * dans l'ordre où le membre les lit.
 */
export function liensCircle() {
  return construireLiensCircle(CIRCLE);
}
