"use server";

import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/serveur";
import { cheminAccueil } from "@/lib/auth/roles";
import type { Role } from "@/lib/auth/roles";

export type EtatConnexion = { erreur: string | null };

export async function seConnecter(
  _precedent: EtatConnexion,
  donnees: FormData,
): Promise<EtatConnexion> {
  const email = String(donnees.get("email") ?? "").trim();
  const motDePasse = String(donnees.get("motDePasse") ?? "");

  if (!email || !motDePasse) {
    return { erreur: "Renseigne ton email et ton mot de passe." };
  }

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  // **Une base qu'on ne joint pas n'est pas un mot de passe faux, et les
  // confondre coûte une soirée.** Ça s'est produit à la première
  // installation : l'adresse du projet Supabase pointait à côté, l'app
  // affichait « Email ou mot de passe incorrect. », et la recherche est
  // partie sur les comptes alors que la base n'avait jamais été jointe.
  //
  // Le client Supabase distingue les deux, encore faut-il le lui demander :
  // un échec réseau porte le nom `AuthRetryableFetchError`, ou un statut
  // absent, là où un refus d'identifiants arrive en 400. La règle est donc
  // renversée : on ne dit « incorrect » que pour un refus reconnu comme tel,
  // et tout le reste s'annonce comme une panne.
  if (error) {
    const refus = error.status === 400 || error.status === 422;
    return refus
      ? // Message volontairement identique pour un email inconnu et un mot
        // de passe faux : préciser lequel des deux est mauvais permettrait de
        // savoir quels emails existent dans la base.
        { erreur: "Email ou mot de passe incorrect." }
      : { erreur: "La base de données ne répond pas. Vérifie la configuration de ton installation." };
  }

  if (!data.user) {
    return { erreur: "Email ou mot de passe incorrect." };
  }

  const { data: compte, error: erreurCompte } = await supabase
    .from("compte")
    .select("role, actif")
    .eq("id", data.user.id)
    .single();

  // Distinguer les deux cas : une base injoignable n'est pas un retrait
  // d'accès. Les confondre enverrait un membre appeler son coach pour un
  // incident réseau, et le coach chercherait une clôture qui n'existe pas.
  if (erreurCompte && erreurCompte.code !== "PGRST116") {
    await supabase.auth.signOut();
    return { erreur: "Connexion impossible pour le moment. Réessaie dans un instant." };
  }

  if (!compte || !compte.actif) {
    await supabase.auth.signOut();
    return { erreur: "Ton accès a été clôturé. Contacte ton coach." };
  }

  redirect(cheminAccueil(compte.role as Role));
}
