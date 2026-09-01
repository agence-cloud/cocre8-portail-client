import { creerClientServeur } from "@/lib/supabase/serveur";

/**
 * Une tâche du parcours type : le patron que chaque nouveau client reçoit en
 * copie.
 *
 * Copie et non référence : c'est ce qui permet au coach de modifier son
 * parcours type sans toucher aux tâches déjà cochées par ses clients, et
 * c'est pour ça qu'une tâche modèle se retire sans garde.
 */
export type TacheModele = {
  id: string;
  pilier_id: string;
  groupe: string | null;
  titre: string;
  description: string | null;
  ordre: number;
};

export async function lireTachesModeles(): Promise<TacheModele[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("tache_modele")
    .select("id, pilier_id, groupe, titre, description, ordre")
    .order("ordre");

  if (error) throw new Error(`Lecture du parcours type impossible : ${error.message}`);

  return (data ?? []) as TacheModele[];
}
