import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Accompagnement } from "@/lib/accompagnement/types";

/** Les accompagnements d'un client, du plus ancien au plus récent. */
export async function lireAccompagnements(personneId: string): Promise<Accompagnement[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("accompagnement")
    .select("id, personne_id, date_debut, date_fin, statut, progression")
    .eq("personne_id", personneId)
    .order("date_debut");

  if (error) {
    throw new Error(`Lecture des accompagnements impossible : ${error.message}`);
  }

  return (data ?? []) as Accompagnement[];
}
