import { redirect } from "next/navigation";
import { lireQuestions, lireReponses } from "@/lib/profil/requetes";
import { profilComplet } from "@/lib/profil/completude";

/**
 * À appeler en tête de chaque écran de l'espace, sauf le profil lui-même.
 *
 * Dans chaque page et non dans le layout : c'est la règle du projet, chaque
 * page se garde elle-même. Et un layout qui redirige boucle sur la page de
 * profil, qui est justement celle où il faut laisser passer.
 */
export async function exigerProfilComplet(personneId: string): Promise<void> {
  const [questions, reponses] = await Promise.all([
    lireQuestions(),
    lireReponses(personneId),
  ]);

  if (!profilComplet(questions, reponses)) redirect("/espace/profil");
}
