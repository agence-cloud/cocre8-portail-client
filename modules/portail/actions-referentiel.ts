"use server";

import { revalidatePath } from "next/cache";
import { exigerAdmin } from "@/lib/auth/compte";
import { creerClientServeur } from "@/lib/supabase/serveur";

export type EtatListe = { erreur: string | null; enregistre: boolean };

/**
 * Les questions du profil, celles que le client remplit en arrivant.
 *
 * **La liste s'envoie entière, en JSON dans un champ caché.** Des noms de
 * champs indexés (`nom_0`, `nom_1`) auraient marché aussi, et se seraient
 * décalés au premier retrait de ligne. Une liste est une valeur, elle voyage
 * d'un bloc.
 *
 * **Ce qui est supprimé se vérifie avant, jamais après.** La base efface en
 * cascade : retirer une question emporte les réponses de tous les clients. La
 * garde refuse donc ce qui détruirait du travail, et laisse passer le reste.
 */

function lignesDe<T>(donnees: FormData): T[] {
  try {
    const brut = JSON.parse(String(donnees.get("lignes") ?? "[]"));
    return Array.isArray(brut) ? (brut as T[]) : [];
  } catch {
    return [];
  }
}

function echec(erreur: string): EtatListe {
  return { erreur, enregistre: false };
}

/** Les écrans qui montrent le référentiel, côté coach comme côté client. */
function rafraichir() {
  revalidatePath("/", "layout");
}

type LigneQuestion = {
  id?: string;
  libelle: string;
  aide: string;
  type: string;
  active: boolean;
};

const TYPES_DE_QUESTION = ["texte_court", "texte_long", "nombre", "choix"];

export async function enregistrerLesQuestions(
  _precedent: EtatListe,
  donnees: FormData,
): Promise<EtatListe> {
  await exigerAdmin();

  const lignes = lignesDe<LigneQuestion>(donnees).filter((l) => l.libelle?.trim());
  if (lignes.some((l) => !TYPES_DE_QUESTION.includes(l.type))) {
    return echec("Une question porte un type que l'app ne connaît pas.");
  }

  const supabase = await creerClientServeur();

  const { data: existantes, error: erreurLecture } = await supabase
    .from("question_profil")
    .select("id, libelle");
  if (erreurLecture) return echec(erreurLecture.message);

  const gardees = new Set(lignes.map((l) => l.id).filter(Boolean));
  const aSupprimer = (existantes ?? []).filter((q) => !gardees.has(q.id));

  // Supprimer une question efface les réponses qui lui sont rattachées. Un
  // client qui a rempli son profil ne doit pas le voir se vider parce que le
  // coach a changé d'avis : désactiver garde la réponse et retire la question
  // des formulaires à venir.
  for (const question of aSupprimer) {
    const { count } = await supabase
      .from("reponse_profil")
      .select("id", { count: "exact", head: true })
      .eq("question_id", question.id);

    if ((count ?? 0) > 0) {
      return echec(
        `« ${question.libelle} » a déjà des réponses : décoche « active » plutôt que de la retirer.`,
      );
    }
  }

  if (aSupprimer.length > 0) {
    const { error } = await supabase
      .from("question_profil")
      .delete()
      .in("id", aSupprimer.map((q) => q.id));
    if (error) return echec(error.message);
  }

  for (const [rang, ligne] of lignes.entries()) {
    const champs = {
      libelle: ligne.libelle.trim(),
      aide: ligne.aide?.trim() || null,
      type: ligne.type,
      ordre: rang + 1,
      active: ligne.active,
    };

    const { error } = ligne.id
      ? await supabase.from("question_profil").update(champs).eq("id", ligne.id)
      : await supabase.from("question_profil").insert(champs);

    if (error) return echec(error.message);
  }

  rafraichir();
  return { erreur: null, enregistre: true };
}
