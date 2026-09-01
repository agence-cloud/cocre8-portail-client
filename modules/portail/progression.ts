import type { Tache, Section } from "@/modules/portail/types";
import type { Pilier } from "@/lib/pilier/types";

/**
 * Range les tâches sous le nom de leur sous-module, dans l'ordre du parcours.
 * Un pilier à seize cases à cocher devient sinon un mur où la logique de la
 * méthode disparaît.
 */
export function grouperEnSections(taches: Tache[]): Section[] {
  const triees = [...taches].sort((a, b) => a.ordre - b.ordre);
  const sections: Section[] = [];

  for (const tache of triees) {
    const derniere = sections.at(-1);
    if (derniere && derniere.nom === tache.groupe) {
      derniere.taches.push(tache);
    } else {
      sections.push({ nom: tache.groupe, taches: [tache], faites: 0, terminee: false });
    }
  }

  for (const section of sections) {
    section.faites = section.taches.filter((t) => t.faite).length;
    section.terminee = section.faites === section.taches.length;
  }

  return sections;
}

function pourcentage(taches: Tache[]): number {
  if (taches.length === 0) return 0;
  return Math.round((taches.filter((t) => t.faite).length / taches.length) * 100);
}

/**
 * La progression globale, sur les piliers ouverts seulement.
 *
 * Un membre qui a tout fait dans ses piliers ouverts est à 100 %, et repasse
 * à 60 % le jour où le suivant s'ouvre. C'est le seul calcul qui récompense
 * ce qui est fait au lieu de punir ce qui n'est pas encore accessible. Le
 * coach voit exactement le même chiffre que son membre.
 */
export function progression(taches: Tache[], piliersOuverts: Set<string>): number {
  return pourcentage(taches.filter((t) => piliersOuverts.has(t.pilier_id)));
}

export function progressionPilier(taches: Tache[], pilierId: string): number {
  return pourcentage(taches.filter((t) => t.pilier_id === pilierId));
}

/**
 * Le pilier ouvert le plus bas qui n'est pas terminé, sinon le dernier ouvert.
 *
 * Les piliers ouverts sans aucune tâche sont écartés : le pilier 4, ouvert à
 * la main pour un membre de la cohorte fondatrice, n'a pas de parcours écrit,
 * et il passerait pour le pilier en cours à 0 %.
 */
export function pilierEnCours(
  piliers: Pilier[],
  taches: Tache[],
  piliersOuverts: Set<string>,
): Pilier | null {
  const ouverts = piliers
    .filter((p) => piliersOuverts.has(p.id))
    .sort((a, b) => a.ordre - b.ordre);

  if (ouverts.length === 0) return null;

  const avecTaches = ouverts.filter((p) =>
    taches.some((t) => t.pilier_id === p.id),
  );
  if (avecTaches.length === 0) return ouverts[0];

  return avecTaches.find((p) => progressionPilier(taches, p.id) < 100)
    ?? avecTaches[avecTaches.length - 1];
}
