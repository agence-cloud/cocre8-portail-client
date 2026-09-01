import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Personne } from "@/lib/personne/types";

const CHAMPS =
  "id, nom, prenom, email, telephone, entreprise, demonstration, notes, cree_le, modifie_le";

/**
 * Les clients, les plus récemment modifiés d'abord.
 *
 * Le client du jeu de démonstration en fait partie : sans lui, son écran de
 * suivi deviendrait inatteignable, et la démonstration avec.
 */
export async function lireClients(): Promise<Personne[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("personne")
    .select(CHAMPS)
    .order("modifie_le", { ascending: false });

  // Une liste vide peut vouloir dire « aucune donnée » ou « permission
  // refusée ». Les confondre ferait passer un problème d'accès pour une base
  // vide, ce qui se diagnostique très mal.
  if (error) throw new Error(`Lecture des clients impossible : ${error.message}`);

  return (data ?? []) as unknown as Personne[];
}

export async function lirePersonne(id: string): Promise<Personne | null> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("personne")
    .select(CHAMPS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Lecture de la fiche impossible : ${error.message}`);

  return (data as unknown as Personne) ?? null;
}

/**
 * Vrai quand cette fiche a déjà un compte pour se connecter.
 *
 * Sur `compte` et non sur `auth.users`, qui n'est pas lisible : c'est la
 * ligne `compte` qui fait exister le client dans l'application, un
 * utilisateur d'authentification sans elle ne voit rien.
 */
export async function aUnCompte(personneId: string): Promise<boolean> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("compte")
    .select("id")
    .eq("personne_id", personneId)
    .maybeSingle();

  if (error) throw new Error(`Lecture du compte impossible : ${error.message}`);

  return data !== null;
}
