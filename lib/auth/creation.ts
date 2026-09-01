import "server-only";

import { createClient } from "@supabase/supabase-js";
import { lireConfigSupabase } from "@/lib/supabase/config";
import { clienteDeService } from "@/lib/supabase/service";

/**
 * Le seul endroit du dépôt où la clé de service est lue.
 *
 * **Pourquoi elle est là.** `compte.id` référence `auth.users`, donc ouvrir
 * l'espace d'un membre demande de créer un utilisateur d'authentification, et
 * cela n'existe que dans l'API d'administration de Supabase. Trois autres
 * chemins ont été essayés et écartés, le plan 10 dit lesquels et pourquoi :
 * l'inscription publique envoie un email qu'on ne contrôle pas, une fonction
 * edge ajoute une seconde définition de « qui a le droit », un déclencheur en
 * base ne crée toujours pas l'utilisateur.
 *
 * **Ce qui l'encadre**, et chaque règle ferme une porte différente :
 *
 * 1. **L'adresse n'est jamais un paramètre.** L'appelant passe l'identifiant
 *    d'une fiche, ce module lit l'email en base. Sans cette règle, une
 *    requête forgée créerait un compte sur n'importe quelle adresse, et le
 *    lien d'accès partirait chez n'importe qui.
 * 2. **Il ne sait créer qu'un membre.** Jamais d'admin, jamais de
 *    suppression, jamais de modification d'un compte existant. Une clé qui
 *    peut tout ne doit servir qu'à une chose.
 * 3. **Il refuse une fiche qui n'est pas cliente**, et ne fait rien si un
 *    compte existe déjà. Rejouable sans dégât : une bascule relancée ne crée
 *    pas un second compte.
 *
 * **Rien ne part d'ici.** L'utilisateur est créé déjà confirmé, avec un mot
 * de passe aléatoire que personne ne connaîtra jamais, et Supabase n'envoie
 * aucun email. L'invitation est un geste séparé, `envoyerLesAcces`, déclenché
 * par un clic.
 *
 * `server-only` en tête du fichier : une importation depuis un composant
 * client casse la compilation au lieu de faire fuiter la clé dans le paquet
 * du navigateur.
 */

/** Ce que la création a fait, pour que l'écran puisse le dire. */
export type ResultatCreation =
  | { fait: "cree"; email: string }
  | { fait: "existait" }
  | { fait: "impossible"; pourquoi: string };

/**
 * Crée le compte membre d'une fiche devenue cliente.
 *
 * Ne lève pas quand elle ne peut pas : elle renvoie pourquoi. La bascule en
 * client ne doit pas se défaire parce qu'une fiche n'a pas d'email, sinon on
 * perdrait la partie qui a marché (l'étape, le prix figé) pour une raison
 * qui se corrige en dix secondes.
 */
export async function creerLeCompteDuMembre(
  personneId: string,
): Promise<ResultatCreation> {
  const service = clienteDeService();

  const { data: personne, error: erreurFiche } = await service
    .from("personne")
    .select("id, nom, prenom, email, etape")
    .eq("id", personneId)
    .maybeSingle();

  if (erreurFiche) return { fait: "impossible", pourquoi: erreurFiche.message };
  if (!personne) return { fait: "impossible", pourquoi: "Cette fiche n'existe plus." };

  if (personne.etape !== "client") {
    return { fait: "impossible", pourquoi: "Cette fiche n'est pas cliente." };
  }

  if (!personne.email) {
    return {
      fait: "impossible",
      pourquoi: "Cette fiche n'a pas d'email. Ajoute-le, puis renvoie ses accès.",
    };
  }

  // Rejouable : une bascule relancée ne doit pas créer un second compte.
  const { data: existant, error: erreurExistant } = await service
    .from("compte")
    .select("id")
    .eq("personne_id", personneId)
    .maybeSingle();

  if (erreurExistant) return { fait: "impossible", pourquoi: erreurExistant.message };
  if (existant) return { fait: "existait" };

  // `email_confirm: true` : sans lui, l'utilisateur reste en attente de
  // confirmation, ne peut pas se connecter, et Supabase envoie un email
  // qu'on ne contrôle ni dans son texte ni dans son moment.
  //
  // Le mot de passe est aléatoire et jeté : personne ne le connaîtra jamais,
  // le membre posera le sien depuis le lien qu'on lui enverra. Un mot de
  // passe deviné à la création serait un compte ouvert à qui le devine.
  const { data: utilisateur, error: erreurUtilisateur } =
    await service.auth.admin.createUser({
      email: personne.email,
      password: crypto.randomUUID(),
      email_confirm: true,
    });

  if (erreurUtilisateur) {
    return { fait: "impossible", pourquoi: erreurUtilisateur.message };
  }

  const nomComplet = [personne.prenom, personne.nom].filter(Boolean).join(" ");

  const { error: erreurCompte } = await service.from("compte").insert({
    id: utilisateur.user.id,
    role: "membre",
    personne_id: personneId,
    nom: nomComplet,
  });

  if (erreurCompte) {
    // La ligne `compte` a échoué après la création de l'utilisateur : sans ce
    // retrait, il resterait un utilisateur d'authentification orphelin, que
    // la prochaine tentative buterait sur une adresse déjà prise sans jamais
    // pouvoir aboutir.
    await service.auth.admin.deleteUser(utilisateur.user.id);
    return { fait: "impossible", pourquoi: erreurCompte.message };
  }

  return { fait: "cree", email: personne.email };
}

/**
 * Envoie au membre le lien qui lui fera poser son mot de passe.
 *
 * Le seul geste de ce fichier qui sorte de l'application, et il est séparé de
 * la création pour cette raison : l'espace se prépare tout seul, l'invitation
 * part quand un humain le décide.
 *
 * L'adresse vient de la base, comme partout ici. Et l'envoi passe par la clé
 * publique et non par celle de service : réinitialiser un mot de passe est
 * une opération publique, la clé de service n'y ajouterait qu'un pouvoir dont
 * on n'a pas besoin.
 */
export async function envoyerLesAcces(
  personneId: string,
  origine: string,
): Promise<{ envoye: boolean; email?: string; pourquoi?: string }> {
  const service = clienteDeService();

  const { data: personne, error } = await service
    .from("personne")
    .select("email, etape")
    .eq("id", personneId)
    .maybeSingle();

  if (error) return { envoye: false, pourquoi: error.message };
  if (!personne) return { envoye: false, pourquoi: "Cette fiche n'existe plus." };
  if (personne.etape !== "client") {
    return { envoye: false, pourquoi: "Cette fiche n'est pas cliente." };
  }
  if (!personne.email) {
    return { envoye: false, pourquoi: "Cette fiche n'a pas d'email." };
  }

  const { url, cle } = lireConfigSupabase();
  const publique = createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: erreurEnvoi } = await publique.auth.resetPasswordForEmail(
    personne.email,
    { redirectTo: `${origine}/auth/confirmer` },
  );

  if (erreurEnvoi) return { envoye: false, pourquoi: erreurEnvoi.message };

  return { envoye: true, email: personne.email };
}
