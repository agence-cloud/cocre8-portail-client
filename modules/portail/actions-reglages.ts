"use server";

import { revalidatePath } from "next/cache";
import { exigerAdmin } from "@/lib/auth/compte";
import { ecrireReglages } from "@/lib/reglages/requetes";
import type { Reglages } from "@/lib/reglages/types";

export type EtatReglages = { erreur: string | null; enregistre: boolean };

/**
 * Enregistre les réglages, tous d'un coup.
 *
 * L'action vit dans le module et non dans le socle : c'est la règle du dépôt,
 * une écriture gardée appartient à celui qui l'expose, avec sa garde et les
 * routes qu'elle doit rafraîchir.
 *
 * La garde est double. `exigerAdmin()` donne un message clair à qui n'a rien
 * à faire ici, et la politique de la table refuse l'écriture de toute façon :
 * la seconde tient même si quelqu'un appelle la base directement avec la clé
 * publique, qu'il détient.
 */
export async function enregistrerLesReglages(
  _precedent: EtatReglages,
  donnees: FormData,
): Promise<EtatReglages> {
  await exigerAdmin();

  const texte = (champ: string) => String(donnees.get(champ) ?? "").trim();

  const singulier = texte("mot_singulier");
  const pluriel = texte("mot_pluriel");

  // Le mot des parties est le seul réglage qu'on refuse de laisser vide : il
  // s'affiche dans des phrases entières côté client, et une phrase à trou est
  // pire qu'un mot qu'on n'aime pas.
  if (!singulier || !pluriel) {
    return { erreur: "Le mot des parties ne peut pas rester vide.", enregistre: false };
  }

  const reglages: Partial<Reglages> = {
    nom_programme: texte("nom_programme") || "Espace Client",
    mot_partie: { singulier, pluriel },
    coach_nom: texte("coach_nom"),
    coach_telephone: texte("coach_telephone"),
    liens_externes: {
      communaute: texte("lien_communaute"),
      formation: texte("lien_formation"),
      evenements: texte("lien_evenements"),
    },
  };

  try {
    await ecrireReglages(reglages);
  } catch (erreur) {
    return {
      erreur: erreur instanceof Error ? erreur.message : "Enregistrement impossible.",
      enregistre: false,
    };
  }

  // Le nom du programme s'affiche dans la mise en page racine, et les liens
  // externes dans la barre du client : rafraîchir la seule page des réglages
  // laisserait l'ancien nom partout ailleurs jusqu'au prochain rechargement.
  revalidatePath("/", "layout");

  return { erreur: null, enregistre: true };
}
