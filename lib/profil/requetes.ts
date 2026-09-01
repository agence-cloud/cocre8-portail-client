import { creerClientServeur } from "@/lib/supabase/serveur";
import type {
  QuestionProfil,
  QuestionProfilReglable,
  ReponseProfil,
} from "@/lib/profil/types";

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

/**
 * Toutes les questions, actives ou non, pour l'écran des réglages.
 *
 * `lireQuestions` filtre sur `active` parce que c'est ce que le client doit
 * remplir. Le coach, lui, doit voir celles qu'il a désactivées : sans ça,
 * décocher une question la ferait disparaître de son propre écran, et il ne
 * pourrait plus la réactiver.
 */
export async function lireToutesLesQuestions(): Promise<QuestionProfilReglable[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("question_profil")
    .select("id, libelle, aide, type, ordre, active")
    .order("ordre");

  if (error) throw new Error(`Lecture des questions impossible : ${error.message}`);

  return (data ?? []) as QuestionProfilReglable[];
}
