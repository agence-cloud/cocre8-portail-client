import type { QuestionProfil, ReponseProfil } from "@/lib/profil/types";

/**
 * Combien de questions portent une vraie réponse.
 *
 * Une chaîne vide ne compte pas : un champ ouvert puis quitté sans rien
 * écrire enregistre une ligne, et la compter afficherait une complétude qui
 * ne correspond à aucune information.
 */
export function completude(
  questions: QuestionProfil[],
  reponses: ReponseProfil[],
): { repondues: number; total: number; pourcentage: number } {
  const remplies = new Set(
    reponses
      .filter((r) => (r.reponse ?? "").trim() !== "")
      .map((r) => r.question_id),
  );

  const repondues = questions.filter((q) => remplies.has(q.id)).length;
  const total = questions.length;

  return {
    repondues,
    total,
    pourcentage: total === 0 ? 0 : Math.round((repondues / total) * 100),
  };
}

/**
 * Vrai quand il ne manque aucune réponse. Sert de porte : tant que c'est
 * faux, le membre ne va nulle part ailleurs que sur son profil.
 *
 * Un référentiel vide renvoie vrai, jamais faux : une base sans questions
 * enfermerait sinon tous les membres dehors.
 */
export function profilComplet(
  questions: QuestionProfil[],
  reponses: ReponseProfil[],
): boolean {
  const bilan = completude(questions, reponses);
  return bilan.repondues >= bilan.total;
}
