import { creerClientServeur } from "@/lib/supabase/serveur";
import type { QuestionProfil, ReponseProfil } from "@/lib/profil/types";

/** Les questions actives, dans l'ordre. Lisibles par tout compte connecté. */
export async function lireQuestions(): Promise<QuestionProfil[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("question_profil")
    .select("id, pilier_id, libelle, aide, type, options, ordre")
    .eq("active", true)
    .order("ordre");

  if (error) throw new Error(`Lecture des questions impossible : ${error.message}`);

  return (data ?? []) as QuestionProfil[];
}

export async function lireReponses(personneId: string): Promise<ReponseProfil[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("reponse_profil")
    .select("id, question_id, reponse, modifie_le")
    .eq("personne_id", personneId);

  if (error) throw new Error(`Lecture des réponses impossible : ${error.message}`);

  return (data ?? []) as ReponseProfil[];
}
