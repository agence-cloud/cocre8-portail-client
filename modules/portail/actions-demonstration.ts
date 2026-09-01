"use server";

import { revalidatePath } from "next/cache";
import { exigerAdmin } from "@/lib/auth/compte";
import {
  creerLeCompteDuMembre,
  supprimerLeCompteDeDemonstration,
} from "@/lib/auth/creation";
import { creerClientServeur } from "@/lib/supabase/serveur";

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

/** Le client inventé, et ce qu'il a déjà vécu. */
const CLIENTE = {
  prenom: "Léa",
  nom: "Marchand",
  email: "lea.marchand@exemple.test",
  entreprise: "Atelier Marchand",
  /** Assez ancien pour que deux parties soient ouvertes et deux séances passées. */
  ilYAJours: 45,
};

const REPONSES: Record<string, string> = {
  texte_long:
    "J'ai lancé mon activité il y a deux ans et je plafonne. Je veux doubler mon chiffre sans travailler le soir.",
  texte_court: "Dans six mois",
  nombre: "6",
  choix: "Oui",
};

const SEANCES = [
  {
    ilYAJours: 30,
    titre: "Première séance",
    resume:
      "On a posé ton objectif et ce qui te bloque vraiment. Ta priorité des trois prochaines semaines : arrêter de vendre à l'heure.",
    transcription:
      "Bonjour Léa, on commence par où tu en es aujourd'hui. Tu me disais que tes journées partent en poussière...",
    notes: "Note interne : elle sous-estime son prix. Y revenir à la prochaine.",
  },
  {
    ilYAJours: 12,
    titre: "Point d'étape",
    resume:
      "Ton offre est passée au forfait. On a écrit les trois étapes du plan et daté la première.",
    transcription: "Alors, tu as testé le forfait sur deux devis. Raconte-moi ce qui s'est passé...",
    notes: "Note interne : bonne dynamique, ne pas surcharger.",
  },
];

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

  const { data: offre } = await supabase
    .from("offre")
    .select("id, prix_defaut")
    .eq("active", true)
    .order("prix_defaut")
    .limit(1)
    .maybeSingle();

  if (!offre) {
    return { fait: false, pourquoi: "Aucune offre active : le client inventé n'aurait rien signé." };
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
    offre_id: offre.id,
    prix_negocie: offre.prix_defaut,
    date_debut: demarrage,
  });

  if (erreurAccompagnement) {
    await supabase.from("personne").delete().eq("id", personne.id);
    return { fait: false, pourquoi: erreurAccompagnement.message };
  }

  await supabase.rpc("appliquer_parcours_modele", { p_personne: personne.id });
  await supabase.rpc("planifier_piliers", {
    p_personne: personne.id,
    p_demarrage: demarrage,
  });

  // Une partie de ses tâches est faite, et pas toutes : une progression à
  // 0 % ou à 100 % ne montre pas ce que l'anneau et la barre savent faire.
  // Seules les tâches des parties ouvertes sont cochées, les autres lui
  // seraient invisibles.
  const { data: ouvertes } = await supabase
    .from("acces_pilier")
    .select("pilier_id")
    .eq("personne_id", personne.id)
    .lte("date_ouverture", ilYA(0));

  const { data: taches } = await supabase
    .from("tache")
    .select("id, pilier_id")
    .eq("personne_id", personne.id)
    .order("ordre");

  const idsOuverts = new Set((ouvertes ?? []).map((a) => a.pilier_id));
  const cochables = (taches ?? []).filter((t) => idsOuverts.has(t.pilier_id));
  const aCocher = cochables.slice(0, Math.ceil(cochables.length * 0.6));

  if (aCocher.length > 0) {
    await supabase
      .from("tache")
      .update({ faite: true, faite_le: ilYAHorodate(7) })
      .in("id", aCocher.map((t) => t.id));
  }

  // Le profil est rempli en entier, et c'est structurel : tant qu'une réponse
  // manque, l'espace entier renvoie vers la porte d'accueil, et le tableau de
  // bord qu'on veut montrer devient inatteignable.
  const { data: questions } = await supabase
    .from("question_profil")
    .select("id, type")
    .eq("active", true);

  if (questions && questions.length > 0) {
    await supabase.from("reponse_profil").insert(
      questions.map((question) => ({
        personne_id: personne.id,
        question_id: question.id,
        reponse: REPONSES[question.type] ?? "Réponse d'exemple",
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
      issue: "honore",
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
