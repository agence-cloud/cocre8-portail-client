"use server";

/**
 * Changer son propre mot de passe.
 *
 * **Dans le socle et non dans un module** : c'est de l'authentification, pas
 * du portail. Deux écrans l'appellent, les réglages du coach et le profil de
 * son client, et rien ici ne connaît d'objectif ni de coaching.
 *
 * **Rien à voir avec la clé de service.** Cette écriture passe par la session
 * de celui qui la demande : Supabase change le mot de passe de l'utilisateur
 * connecté, et de lui seul. Un identifiant de compte n'est donc jamais un
 * paramètre, il n'y en a pas besoin, et c'est ce qui rend cette action sans
 * danger là où `poserUnMotDePasse` doit, elle, se garder par le rôle.
 *
 * **La garde est donc « être connecté », et pas davantage.** Le coach et son
 * client l'appellent tous les deux, chacun sur son propre compte. Un client
 * reçoit son mot de passe de son coach, qui l'a lu à l'écran : lui refuser
 * d'en poser un autre reviendrait à lui laisser pour toujours celui qu'une
 * autre personne a vu.
 *
 * **Ce qui manquait avant elle.** Rien dans l'outil ne changeait un mot de
 * passe. Celui posé à la mise en service était donc le seul du coach, pour
 * toujours, et son seul recours était le tableau de bord Supabase.
 */

import { exigerConnecte } from "@/lib/auth/compte";
import { creerClientServeur } from "@/lib/supabase/serveur";

export type EtatMotDePasse = { erreur: string | null; change: boolean };

export async function changerMonMotDePasse(
  _precedent: EtatMotDePasse,
  donnees: FormData,
): Promise<EtatMotDePasse> {
  await exigerConnecte();

  const nouveau = String(donnees.get("nouveau") ?? "");
  const confirmation = String(donnees.get("confirmation") ?? "");

  if (nouveau === "") {
    return { erreur: "Écris ton nouveau mot de passe.", change: false };
  }

  // La confirmation, parce qu'un mot de passe se saisit à l'aveugle : une
  // faute de frappe ici enfermerait dehors celui qui vient de la faire.
  if (nouveau !== confirmation) {
    return { erreur: "Les deux mots de passe ne sont pas identiques.", change: false };
  }

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.updateUser({ password: nouveau });

  // Le message vient de Supabase et non d'ici : c'est lui qui porte la
  // longueur minimale et les exigences de caractères, réglées dans le tableau
  // de bord du projet. Les redire ici les ferait mentir dès le premier
  // réglage changé.
  if (error) {
    return { erreur: error.message, change: false };
  }

  return { erreur: null, change: true };
}
