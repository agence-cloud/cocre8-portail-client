import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/serveur";
import type { CompteConnecte, Role } from "@/lib/auth/roles";
import { cheminAccueil } from "@/lib/auth/roles";

export async function lireCompteConnecte(): Promise<CompteConnecte | null> {
  const supabase = await creerClientServeur();

  // getUser vérifie le jeton auprès de Supabase. getSession se contente de
  // lire le cookie, qui peut être forgé : ne jamais s'en servir pour décider
  // d'un droit d'accès.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("compte")
    .select("id, role, nom, personne_id, actif")
    .eq("id", user.id)
    .single();

  // PGRST116 signifie « aucune ligne », le cas normal d'un utilisateur sans
  // compte chez nous. Toute autre erreur est un incident : la taire ferait
  // passer une base injoignable pour une déconnexion.
  if (error && error.code !== "PGRST116") {
    throw new Error(`Lecture du compte impossible : ${error.message}`);
  }

  if (!data || !data.actif) return null;

  return {
    id: data.id,
    role: data.role as Role,
    nom: data.nom,
    personneId: data.personne_id,
  };
}

/** À appeler en tête de toute page de pilotage. */
export async function exigerAdmin(): Promise<CompteConnecte> {
  const compte = await lireCompteConnecte();
  if (!compte) redirect("/connexion");
  if (compte.role !== "admin") redirect(cheminAccueil(compte.role));
  return compte;
}

/** À appeler en tête de toute page d'espace membre. */
export async function exigerMembre(): Promise<CompteConnecte> {
  const compte = await lireCompteConnecte();
  if (!compte) redirect("/connexion");
  if (compte.role !== "membre") redirect(cheminAccueil(compte.role));
  return compte;
}

/**
 * À appeler dans une action que les deux rôles déclenchent, comme cocher une
 * tâche. Elle n'arbitre pas entre membre et admin : ce sont les permissions
 * par ligne qui décident de ce que chacun a le droit de toucher.
 */
export async function exigerConnecte(): Promise<CompteConnecte> {
  const compte = await lireCompteConnecte();
  if (!compte) redirect("/connexion");
  return compte;
}
