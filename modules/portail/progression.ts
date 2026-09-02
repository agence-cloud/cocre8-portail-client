import type { Objectif, Tache } from "@/lib/objectif/types";
import { toutesLesTaches } from "@/lib/objectif/requetes";

function pourcentage(taches: Tache[]): number {
  if (taches.length === 0) return 0;
  return Math.round((taches.filter((t) => t.faite).length / taches.length) * 100);
}

/**
 * La progression globale : toutes les tâches de tous les objectifs.
 *
 * Le calcul écartait auparavant les parties non encore ouvertes, pour ne pas
 * bloquer un client à 25 % pendant son premier mois. La question ne se pose
 * plus : un objectif est visible le jour où son coach le pose, donc tout ce
 * qui est compté est aussi faisable. Le coach voit exactement le même chiffre
 * que son client.
 */
export function progression(objectifs: Objectif[]): number {
  return pourcentage(toutesLesTaches(objectifs));
}

export function progressionObjectif(objectif: Objectif): number {
  return pourcentage(objectif.taches);
}

/**
 * L'objectif sur lequel le client en est : le premier qui n'est pas fini.
 *
 * Les objectifs sans aucune tâche sont écartés : un objectif que le coach
 * vient de poser sans encore l'avoir découpé passerait pour celui en cours,
 * à 0 %, et le tableau de bord n'aurait rien à proposer de faire.
 *
 * Tout est fini, ou rien n'est découpé : on rend le dernier plutôt que rien,
 * pour que la carte du tableau de bord garde quelque chose à montrer.
 */
export function objectifEnCours(objectifs: Objectif[]): Objectif | null {
  const avecTaches = objectifs.filter((objectif) => objectif.taches.length > 0);
  if (avecTaches.length === 0) return objectifs[0] ?? null;

  return (
    avecTaches.find((objectif) => progressionObjectif(objectif) < 100) ??
    avecTaches[avecTaches.length - 1]
  );
}
