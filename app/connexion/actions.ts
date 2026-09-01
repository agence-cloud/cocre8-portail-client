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

  // Message volontairement identique pour un email inconnu et un mot de passe
  // faux : préciser lequel des deux est mauvais permettrait de savoir quels
  // emails existent dans la base.
  if (error || !data.user) {
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
