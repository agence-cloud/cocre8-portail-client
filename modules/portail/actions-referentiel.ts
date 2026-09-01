"use server";

import { revalidatePath } from "next/cache";
import { exigerAdmin } from "@/lib/auth/compte";
import { creerClientServeur } from "@/lib/supabase/serveur";

export type EtatListe = { erreur: string | null; enregistre: boolean };

/**
 * Le parcours type : ses parties, les questions du profil, et les tâches que
 * chaque nouveau client reçoit.
 *
 * **Chaque liste s'envoie entière, en JSON dans un champ caché.** Des noms de
 * champs indexés (`nom_0`, `nom_1`) auraient marché aussi, et se seraient
 * décalés au premier retrait de ligne. Une liste est une valeur, elle voyage
 * d'un bloc.
 *
 * **Ce qui est supprimé se vérifie avant, jamais après.** La base efface en
 * cascade : retirer une partie emporte ses tâches modèles et les tâches de
 * chaque client, retirer une question emporte les réponses. Deux gardes
 * refusent donc ce qui détruirait du travail, et laissent passer le reste.
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

type LignePartie = { id?: string; nom: string; description: string };

export async function enregistrerLesParties(
  _precedent: EtatListe,
  donnees: FormData,
): Promise<EtatListe> {
  await exigerAdmin();

  const lignes = lignesDe<LignePartie>(donnees).filter((l) => l.nom?.trim());
  if (lignes.length === 0) {
    return echec("Il faut au moins une partie : c'est la structure du parcours.");
  }

  const supabase = await creerClientServeur();

  const { data: existantes, error: erreurLecture } = await supabase
    .from("pilier")
    .select("id, nom");
  if (erreurLecture) return echec(erreurLecture.message);

  const gardees = new Set(lignes.map((l) => l.id).filter(Boolean));
  const aSupprimer = (existantes ?? []).filter((p) => !gardees.has(p.id));

  // La garde qui compte. Supprimer une partie efface en cascade les tâches de
  // tous les clients qui l'ont, cochées comprises : leur progression
  // disparaîtrait sans qu'ils comprennent pourquoi.
  for (const partie of aSupprimer) {
    const { count } = await supabase
      .from("tache")
      .select("id", { count: "exact", head: true })
      .eq("pilier_id", partie.id)
      .eq("faite", true);

    if ((count ?? 0) > 0) {
      return echec(
        `« ${partie.nom} » ne peut pas être retirée : un client y a déjà coché des tâches. Renomme-la plutôt.`,
      );
    }
  }

  if (aSupprimer.length > 0) {
    const { error } = await supabase
      .from("pilier")
      .delete()
      .in("id", aSupprimer.map((p) => p.id));
    if (error) return echec(error.message);
  }

  // Deux passes pour renuméroter. Le numéro est unique, et une seule passe
  // qui échange deux valeurs se heurte à la contrainte en cours de route :
  // on écarte d'abord tout le monde dans les négatifs, personne n'y étant.
  const anciennes = lignes.filter((l) => l.id);
  for (const [rang, ligne] of anciennes.entries()) {
    const { error } = await supabase
      .from("pilier")
      .update({ numero: -(rang + 1) })
      .eq("id", ligne.id!);
    if (error) return echec(error.message);
  }

  for (const [rang, ligne] of lignes.entries()) {
    const champs = {
      numero: rang + 1,
      ordre: rang + 1,
      nom: ligne.nom.trim(),
      description: ligne.description?.trim() || null,
    };

    const { error } = ligne.id
      ? await supabase.from("pilier").update(champs).eq("id", ligne.id)
      : await supabase.from("pilier").insert(champs);

    if (error) return echec(error.message);
  }

  rafraichir();
  return { erreur: null, enregistre: true };
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

type LigneTache = {
  id?: string;
  pilier_id: string;
  groupe: string;
  titre: string;
  description: string;
};

export async function enregistrerLesTaches(
  _precedent: EtatListe,
  donnees: FormData,
): Promise<EtatListe> {
  await exigerAdmin();

  const lignes = lignesDe<LigneTache>(donnees).filter(
    (l) => l.titre?.trim() && l.pilier_id,
  );

  const supabase = await creerClientServeur();

  const { data: parcours, error: erreurParcours } = await supabase
    .from("parcours_modele")
    .select("id")
    .eq("actif", true)
    .limit(1)
    .maybeSingle();
  if (erreurParcours) return echec(erreurParcours.message);
  if (!parcours) return echec("Aucun parcours type actif : la base n'a pas été installée.");

  const { data: existantes, error: erreurLecture } = await supabase
    .from("tache_modele")
    .select("id");
  if (erreurLecture) return echec(erreurLecture.message);

  // Aucune garde ici, et c'est voulu : une tâche modèle n'est qu'un patron.
  // La retirer ne touche pas les tâches déjà posées chez les clients, qui en
  // sont des copies, et c'est justement pour ça que la copie existe.
  const gardees = new Set(lignes.map((l) => l.id).filter(Boolean));
  const aSupprimer = (existantes ?? []).filter((t) => !gardees.has(t.id));

  if (aSupprimer.length > 0) {
    const { error } = await supabase
      .from("tache_modele")
      .delete()
      .in("id", aSupprimer.map((t) => t.id));
    if (error) return echec(error.message);
  }

  for (const [rang, ligne] of lignes.entries()) {
    const champs = {
      parcours_modele_id: parcours.id,
      pilier_id: ligne.pilier_id,
      groupe: ligne.groupe?.trim() || null,
      titre: ligne.titre.trim(),
      description: ligne.description?.trim() || null,
      ordre: rang + 1,
    };

    const { error } = ligne.id
      ? await supabase.from("tache_modele").update(champs).eq("id", ligne.id)
      : await supabase.from("tache_modele").insert(champs);

    if (error) return echec(error.message);
  }

  rafraichir();
  return { erreur: null, enregistre: true };
}
