import type { LiensExternes } from "@/lib/reglages/types";

/**
 * Les liens externes proposés au client dans sa barre latérale : la
 * communauté, la formation, les événements.
 *
 * **Ce sont des réglages, pas des constantes.** Ce sont les espaces de celui
 * qui installe l'outil, et personne d'autre ne peut les deviner. Ils partent
 * donc vides, et cette fonction reçoit les adresses en paramètre plutôt que
 * d'aller les lire : le module dessine des liens, il ne décide pas d'où
 * viennent les valeurs.
 *
 * **Une adresse vide n'affiche pas son lien**, et un groupe sans aucun lien
 * ne dessine ni titre ni filet. Mieux vaut rien qu'un lien mort.
 *
 * Prendre les adresses en paramètre est aussi ce qui rend la règle
 * éprouvable : un test qui lirait la même source que la fonction verrait ses
 * deux côtés bouger ensemble, et retirer le filtre le laisserait vert.
 *
 * Le type de retour reste anonyme plutôt que d'importer `LienNav` du socle :
 * le module décrit ses liens, le socle décide comment il les dessine.
 */
export function construireLiensCircle(adresses: LiensExternes) {
  const espaces = [
    { libelle: "Communauté", href: adresses.communaute, icone: "communaute" as const },
    { libelle: "Formation", href: adresses.formation, icone: "formation" as const },
    { libelle: "Événements", href: adresses.evenements, icone: "direct" as const },
  ];

  return espaces
    .filter((espace) => espace.href !== "")
    .map((espace) => ({ ...espace, externe: true }));
}
