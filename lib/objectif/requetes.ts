import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Objectif, Tache } from "@/lib/objectif/types";

/**
 * Les objectifs d'un client, leurs tâches dedans, tout dans l'ordre.
 *
 * Une seule requête et non deux : les permissions par ligne laissent un
 * client lire ses objectifs et les tâches qui pendent après eux, donc la
 * jointure imbriquée de PostgREST fait le travail. Deux requêtes séparées
 * demanderaient de recoller les tâches à la main, avec le risque d'une tâche
 * orpheline affichée sous le mauvais objectif.
 *
 * Le coach lit la même chose pour n'importe quel client, sa politique
 * l'autorisant partout : c'est la même fonction des deux côtés.
 */
export async function lireObjectifs(personneId: string): Promise<Objectif[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("objectif")
    .select(
      "id, personne_id, titre, description, echeance, ordre, taches:tache (id, objectif_id, titre, description, ordre, faite, faite_le)",
    )
    .eq("personne_id", personneId)
    .order("ordre")
    .order("ordre", { referencedTable: "tache" });

  if (error) throw new Error(`Lecture des objectifs impossible : ${error.message}`);

  return (data ?? []).map((ligne) => ({
    ...ligne,
    taches: (ligne.taches ?? []) as Tache[],
  })) as Objectif[];
}

/** Toutes les tâches d'un client, à plat. Pour les compter, jamais pour les afficher. */
export function toutesLesTaches(objectifs: Objectif[]): Tache[] {
  return objectifs.flatMap((objectif) => objectif.taches);
}
