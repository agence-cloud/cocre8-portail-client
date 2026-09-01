import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Personne } from "@/lib/personne/types";

// La jointure sur l'offre visée n'est pas un confort : sans elle, le pipe
// devrait retrouver l'offre dans une liste chargée à part, qui ne contient que
// les offres actives. Une offre désactivée lui ferait perdre l'annualisation
// et afficher un montant différent de celui du tableau de pilotage.
const CHAMPS =
  "id, nom, prenom, email, telephone, entreprise, canal, chemin, campagne, offre_visee_id, prix_vise, etape, motif_sortie, renvoye_academie, renvoye_academie_le, a_relier, a_relier_avec, demonstration, notes, cree_le, modifie_le, offre_visee:offre_visee_id (type)";

/**
 * Les prospects, les plus récemment modifiés d'abord. Les clients en sont
 * exclus : ils vivent dans l'onglet Clients, où leur suivi commence, et un CRM
 * sert à agir sur ce qui n'est pas encore gagné.
 *
 * Une seule requête plutôt qu'une par colonne : le rendu répartit ensuite, et
 * le volume de Nouvelle École ne justifie pas de paginer.
 */
/**
 * Supabase renvoie une jointure comme un tableau, même quand elle ne peut
 * porter qu'une ligne. On la ramène à un objet ici, une fois, plutôt que de
 * faire porter la vérification à chaque écran qui lit une fiche.
 */
function normaliser(ligne: Record<string, unknown>): Personne {
  const jointure = ligne.offre_visee;
  const offre = Array.isArray(jointure) ? (jointure[0] ?? null) : (jointure ?? null);
  return { ...ligne, offre_visee: offre } as unknown as Personne;
}

export async function lirePipe(): Promise<Personne[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("personne")
    .select(CHAMPS)
    .neq("etape", "client")
    // Aucune fiche de démonstration n'est un prospect. Il n'y en a pas dans le
    // pipe aujourd'hui, Léa Marchand étant cliente ; le filtre est là pour
    // que le jour où la démonstration gagne un lead, il ne se glisse pas dans
    // le travail réel sans qu'on l'ait décidé.
    .eq("demonstration", false)
    .order("modifie_le", { ascending: false });

  // Une liste vide peut vouloir dire « aucune donnée » ou « permission
  // refusée ». Les confondre ferait passer un problème d'accès pour un pipe
  // vide, ce qui se diagnostique très mal.
  if (error) throw new Error(`Lecture du pipe impossible : ${error.message}`);

  return (data ?? []).map(normaliser);
}

export async function lirePersonne(id: string): Promise<Personne | null> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("personne")
    .select(CHAMPS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Lecture de la fiche impossible : ${error.message}`);

  return data ? normaliser(data) : null;
}

/**
 * Le nom de la fiche avec qui relier, pour que le badge dise avec qui.
 *
 * Une seconde requête et non une jointure : la jointure serait auto-référente
 * sur `personne`, ce que Supabase exige de nommer par sa contrainte, et qui
 * rendrait `CHAMPS` illisible pour un champ que seul l'écran de la fiche
 * affiche. Le pipe, lui, se contente du badge nu et n'a donc rien à payer.
 */
export async function lireJumelle(
  id: string,
): Promise<{ id: string; nom: string; prenom: string | null } | null> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("personne")
    .select("id, nom, prenom")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Lecture de la jumelle impossible : ${error.message}`);

  return data ?? null;
}

/** Les clients, les plus récemment arrivés d'abord. */
export async function lireClients(): Promise<Personne[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("personne")
    .select(CHAMPS)
    .eq("etape", "client")
    .order("modifie_le", { ascending: false });

  if (error) throw new Error(`Lecture des clients impossible : ${error.message}`);

  return (data ?? []).map(normaliser);
}

/**
 * Vrai quand cette fiche a déjà un compte pour se connecter.
 *
 * Sur `compte` et non sur `auth.users`, qui n'est pas lisible : c'est la
 * ligne `compte` qui fait exister le membre dans l'application, un
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
