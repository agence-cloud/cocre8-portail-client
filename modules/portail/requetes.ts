import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Tache } from "@/modules/portail/types";

/**
 * Toutes les tâches d'une personne, dans l'ordre du parcours.
 *
 * La même requête sert au membre et au coach : les permissions décident de ce
 * qui remonte. Un membre ne reçoit que les tâches de ses piliers ouverts, un
 * admin les reçoit toutes. Écrire deux requêtes ferait diverger les deux vues.
 */
export async function lireTaches(personneId: string): Promise<Tache[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("tache")
    .select(
      "id, personne_id, pilier_id, groupe, titre, description, ordre, faite, faite_le",
    )
    .eq("personne_id", personneId)
    .order("ordre");

  if (error) throw new Error(`Lecture des tâches impossible : ${error.message}`);

  return (data ?? []) as Tache[];
}
