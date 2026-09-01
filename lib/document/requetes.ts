import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Document } from "@/lib/document/types";

/**
 * Les documents d'une personne, le plus récent d'abord. Les permissions
 * décident de ce qui remonte : un membre ne voit que ceux marqués visibles,
 * un admin les voit tous. La requête est la même des deux côtés.
 */
export async function lireDocuments(personneId: string): Promise<Document[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("document")
    .select(
      "id, personne_id, nom, chemin_storage, taille_octets, type_mime, depose_par, visible_membre, cree_le",
    )
    .eq("personne_id", personneId)
    .order("cree_le", { ascending: false });

  if (error) throw new Error(`Lecture des documents impossible : ${error.message}`);

  return (data ?? []) as Document[];
}

/**
 * Une adresse temporaire pour télécharger un fichier. Le coffre est privé :
 * sans signature, aucune adresse ne fonctionne, y compris pour son
 * propriétaire.
 */
export async function signerDocument(chemin: string): Promise<string | null> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(chemin, 60 * 10);

  // Un refus de permission légitime et un incident réel (coffre mal
  // configuré, service dégradé, quota dépassé, coupure réseau) produisent
  // ici le même null : le membre n'a pas à savoir pourquoi un fichier ne
  // s'ouvre pas. Le journal est donc la seule trace qui reste pour
  // distinguer les deux côté serveur, avant qu'un membre ne signale ne
  // plus rien voir.
  if (error) {
    console.error(`Signature du document impossible (${chemin}) : ${error.message}`);
    return null;
  }

  return data.signedUrl;
}
