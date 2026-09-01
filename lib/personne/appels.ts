import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Appel } from "./appels.types";
export type { IssueAppel, Appel } from "./appels.types";
export { ISSUES, libelleIssue } from "./appels.types";

/**
 * Le rang se calcule ici plutôt que de vivre en base : un appel supprimé
 * laisserait sinon un trou dans la numérotation, et le troisième appel
 * s'appellerait toujours le quatrième.
 */
export async function lireAppels(personneId: string): Promise<Appel[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("appel")
    .select(
      "id, personne_id, prevu_le, issue, nature, titre, portee, duree_minutes, lien_visio, notes, source_externe, reference_externe, lien_enregistrement, transcription, resume",
    )
    .eq("personne_id", personneId)
    .order("prevu_le");

  if (error) throw new Error(`Lecture des appels impossible : ${error.message}`);

  return (data ?? []).map((appel, index) => ({
    ...(appel as Omit<Appel, "rang">),
    rang: index + 1,
  }));
}
