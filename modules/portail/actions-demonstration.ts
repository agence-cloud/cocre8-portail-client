"use server";

import { revalidatePath } from "next/cache";
import { exigerAdmin } from "@/lib/auth/compte";
import {
  creerLeCompteDuMembre,
  supprimerLeCompteDeDemonstration,
} from "@/lib/auth/creation";
import { creerClientServeur } from "@/lib/supabase/serveur";
import {
  CLIENTE,
  OBJECTIFS,
  REPONSES,
  REPONSES_PAR_TYPE,
  SEANCES,
} from "@/modules/portail/demonstration-donnees";

/**
 * Le jeu de démonstration : un client inventé, pour que l'outil s'ouvre plein.
 *
 * **Pourquoi il existe.** Un outil qui s'ouvre vide se referme. Un coach qui
 * vient de l'installer ne sait pas encore ce qu'il regarde : un tableau de
 * bord à zéro, une liste sans personne, des écrans qui ne disent rien. Avec un
 * client dedans, il comprend en trente secondes et décide s'il continue.
 *
 * **Il se reconnaît à un drapeau, pas à un nom.** `personne.demonstration`
 * est ce que « tout vider » suit, et ce que la suppression de compte exige.
 * Un client inventé qu'on reconnaîtrait à son prénom finirait par disparaître
 * le jour où un vrai client s'appellerait pareil.
 *
 * **Ce qu'il ne fait pas : se connecter tout seul.** Le compte du client est
 * créé, mais son mot de passe est aléatoire et jeté, comme pour tout le monde.
 * Pour voir l'espace côté client, le coach passe par « Obtenir un lien à
 * copier » sur son écran de suivi et l'ouvre dans une fenêtre privée. C'est
 * un détour, et c'est voulu : il lui fait traverser le vrai chemin d'accès,
 * celui que ses clients emprunteront.
 */

function ilYA(jours: number): string {
  const date = new Date();
  date.setDate(date.getDate() - jours);
  return date.toISOString().slice(0, 10);
}

function ilYAHorodate(jours: number): string {
  const date = new Date();
  date.setDate(date.getDate() - jours);
  return date.toISOString();
}

export async function chargerLaDemonstration(): Promise<{
  fait: boolean;
  pourquoi?: string;
}> {
  await exigerAdmin();
  const supabase = await creerClientServeur();

  // Rejouable sans dégât : un second clic ne crée pas un second client
  // inventé, il ne fait rien. C'est la même prudence que partout ailleurs.
  const { data: deja } = await supabase
    .from("personne")
    .select("id")
    .eq("demonstration", true)
    .maybeSingle();

  if (deja) {
    return { fait: false, pourquoi: "Le jeu de démonstration est déjà chargé." };
  }

  const demarrage = ilYA(CLIENTE.ilYAJours);

  const { data: personne, error: erreurFiche } = await supabase
    .from("personne")
    .insert({
      nom: CLIENTE.nom,
      prenom: CLIENTE.prenom,
      email: CLIENTE.email,
      entreprise: CLIENTE.entreprise,
      demonstration: true,
    })
    .select("id")
    .single();

  if (erreurFiche) return { fait: false, pourquoi: erreurFiche.message };

  const { error: erreurAccompagnement } = await supabase.from("accompagnement").insert({
    personne_id: personne.id,
    date_debut: demarrage,
  });

  if (erreurAccompagnement) {
    await supabase.from("personne").delete().eq("id", personne.id);
    return { fait: false, pourquoi: erreurAccompagnement.message };
  }

  // Ses objectifs, leurs étapes, et une partie cochée. Une progression à 0 %
  // ou à 100 % ne montrerait ni ce que l'anneau sait faire, ni la carte
  // repliée d'un objectif atteint : c'est justement ce qu'on veut faire voir.
  for (const [rang, modele] of OBJECTIFS.entries()) {
    const { data: objectif, error: erreurObjectif } = await supabase
      .from("objectif")
      .insert({
        personne_id: personne.id,
        titre: modele.titre,
        description: modele.description,
        echeance: ilYA(-modele.dansJours),
        ordre: rang + 1,
      })
      .select("id")
      .single();

    if (erreurObjectif) return { fait: false, pourquoi: erreurObjectif.message };

    const { error: erreurTaches } = await supabase.from("tache").insert(
      modele.taches.map((titre, rangTache) => ({
        objectif_id: objectif.id,
        titre,
        ordre: rangTache + 1,
        faite: rangTache < modele.faites,
        faite_le: rangTache < modele.faites ? ilYAHorodate(7 + rangTache) : null,
      })),
    );

    if (erreurTaches) return { fait: false, pourquoi: erreurTaches.message };
  }

  // Le profil est rempli en entier, et c'est structurel : tant qu'une réponse
  // manque, l'espace entier renvoie vers la porte d'accueil, et le tableau de
  // bord qu'on veut montrer devient inatteignable.
  const { data: questions } = await supabase
    .from("question_profil")
    .select("id, type, libelle")
    .eq("active", true);

  if (questions && questions.length > 0) {
    await supabase.from("reponse_profil").insert(
      questions.map((question) => ({
        personne_id: personne.id,
        question_id: question.id,
        reponse:
          REPONSES[question.libelle] ??
          REPONSES_PAR_TYPE[question.type] ??
          "Réponse d'exemple, à remplacer par celle de ton client.",
      })),
    );
  }

  await supabase.from("appel").insert(
    SEANCES.map((seance) => ({
      personne_id: personne.id,
      titre: seance.titre,
      nature: "coaching",
      portee: "individuel",
      prevu_le: ilYAHorodate(seance.ilYAJours),
      duree_minutes: 45,
      resume: seance.resume,
      transcription: seance.transcription,
      notes: seance.notes,
    })),
  );

  // Son compte, pour que l'écran de suivi propose ses accès comme pour un
  // vrai client. Le mot de passe reste aléatoire et jeté.
  const compte = await creerLeCompteDuMembre(personne.id);

  revalidatePath("/", "layout");

  return {
    fait: true,
    pourquoi: compte.fait === "impossible" ? compte.pourquoi : undefined,
  };
}

/**
 * Retire le jeu de démonstration, et rien d'autre.
 *
 * **Le filtre est la première chose, et il ne bouge pas.** Seules les fiches
 * marquées `demonstration` sont lues, et la suppression de compte refuse de
 * toute façon celles qui ne le sont pas : deux gardes sur la même règle, par
 * deux chemins. C'est la seule opération de l'outil qui efface du travail.
 *
 * Le reste part en cascade avec la fiche : son accompagnement, ses tâches,
 * son calendrier, ses réponses, ses séances et ses documents.
 */
export async function viderLaDemonstration(): Promise<{
  retirees: number;
  pourquoi?: string;
}> {
  await exigerAdmin();
  const supabase = await creerClientServeur();

  const { data: fiches, error } = await supabase
    .from("personne")
    .select("id")
    .eq("demonstration", true);

  if (error) return { retirees: 0, pourquoi: error.message };

  let retirees = 0;

  for (const fiche of fiches ?? []) {
    // Le compte d'abord : la base refuse de supprimer une fiche dont un
    // compte membre dépend, la contrainte `membre_a_une_personne` interdisant
    // un membre sans fiche.
    const { pourquoi } = await supprimerLeCompteDeDemonstration(fiche.id);
    if (pourquoi) return { retirees, pourquoi };

    const { error: erreurSuppression } = await supabase
      .from("personne")
      .delete()
      .eq("id", fiche.id)
      .eq("demonstration", true);

    if (erreurSuppression) return { retirees, pourquoi: erreurSuppression.message };
    retirees += 1;
  }

  revalidatePath("/", "layout");

  return { retirees };
}
