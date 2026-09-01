import { cache } from "react";
import { creerClientServeur } from "@/lib/supabase/serveur";
import { composerReglages, REGLAGES_PAR_DEFAUT, type Reglages } from "@/lib/reglages/types";

/**
 * Les réglages de l'outil, complets, chaque clé garantie présente.
 *
 * `cache` de React : presque chaque écran les demande, parfois deux fois dans
 * le même rendu (le layout et la page). Sans lui, la même lecture partirait
 * plusieurs fois par requête pour une valeur qui ne bouge pas.
 *
 * Une base injoignable rend les défauts plutôt que de lever. Un coach dont
 * le nom n'apparaît pas est un désagrément, un espace entier qui refuse de
 * s'afficher parce qu'un réglage n'a pas pu être lu est une panne.
 */
export const lireReglages = cache(async (): Promise<Reglages> => {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("reglage").select("cle, valeur");

  if (error) return REGLAGES_PAR_DEFAUT;

  return composerReglages(data ?? []);
});

/**
 * Le nom du programme seul, lisible sans être connecté.
 *
 * L'écran de connexion l'affiche, et celui qui s'y présente n'a pas de
 * session : il passe donc par une fonction de la base, qui ne rend que cette
 * valeur. Ouvrir toute la table aux anonymes aurait aussi donné le nom et le
 * numéro du coach, qui ne regardent que ses clients.
 */
export const lireNomDuProgramme = cache(async (): Promise<string> => {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("nom_du_programme");

  if (error || typeof data !== "string") return REGLAGES_PAR_DEFAUT.nom_programme;

  return data;
});

/**
 * Écrit les réglages qu'on lui donne, et ne touche pas aux autres.
 *
 * La garde est double, et c'est voulu : l'écran appelle `exigerAdmin()` avant
 * d'arriver ici, et la politique de la table refuse l'écriture à qui n'est
 * pas coach. La première donne un message clair, la seconde tient même si
 * quelqu'un appelle la base directement avec la clé publique.
 */
export async function ecrireReglages(partiel: Partial<Reglages>): Promise<void> {
  const lignes = Object.entries(partiel).map(([cle, valeur]) => ({
    cle,
    valeur,
    modifie_le: new Date().toISOString(),
  }));

  if (lignes.length === 0) return;

  const supabase = await creerClientServeur();
  const { error } = await supabase.from("reglage").upsert(lignes, { onConflict: "cle" });

  if (error) throw new Error(`Enregistrement des réglages impossible : ${error.message}`);
}
