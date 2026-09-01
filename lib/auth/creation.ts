import "server-only";

import { createClient } from "@supabase/supabase-js";
import { lireConfigSupabase } from "@/lib/supabase/config";
import { clienteDeService } from "@/lib/supabase/service";
import { nomComplet } from "@/lib/personne/types";

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
 *    modification d'un compte existant. Une clé qui peut tout ne doit servir
 *    qu'à peu de choses.
 *
 *    **Une seule suppression existe**, et sa garde tient en une ligne : elle
 *    refuse toute fiche qui ne porte pas le drapeau `demonstration`. Elle
 *    sert au bouton « tout vider » du jeu d'essai, et la base la rend
 *    nécessaire : une fiche cliente ne se supprime pas tant que son compte
 *    existe, la contrainte `membre_a_une_personne` s'y oppose.
 * 3. **Il refuse une fiche sans accompagnement**, et ne fait rien si un
 *    compte existe déjà. C'est l'accompagnement qui fait d'une fiche un
 *    client : sans lui, un contact ajouté pour mémoire recevrait un accès à
 *    un espace qui n'a rien à lui montrer. Rejouable sans dégât : relancer
 *    ne crée pas un second compte.
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
 * Crée le compte de connexion d'un client.
 *
 * Ne lève pas quand elle ne peut pas : elle renvoie pourquoi. L'ajout d'un
 * client ne doit pas se défaire parce que sa fiche n'a pas d'email, sinon on
 * perdrait la partie qui a marché (la fiche, son accompagnement, son
 * parcours) pour une raison qui se corrige en dix secondes.
 */
export async function creerLeCompteDuMembre(
  personneId: string,
): Promise<ResultatCreation> {
  const service = clienteDeService();

  const { data: personne, error: erreurFiche } = await service
    .from("personne")
    .select("id, nom, prenom, email, accompagnement (id)")
    .eq("id", personneId)
    .maybeSingle();

  if (erreurFiche) return { fait: "impossible", pourquoi: erreurFiche.message };
  if (!personne) return { fait: "impossible", pourquoi: "Cette fiche n'existe plus." };

  // Un accompagnement, et non un drapeau posé sur la fiche : c'est lui qui
  // fait d'une fiche un client. Sans cette garde, un contact ajouté pour
  // mémoire recevrait un accès à un espace qui n'a rien à lui montrer.
  if ((personne.accompagnement ?? []).length === 0) {
    return {
      fait: "impossible",
      pourquoi: "Cette fiche n'a pas d'accompagnement. Ajoute-lui son offre, puis renvoie ses accès.",
    };
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

  const nom = nomComplet(personne);

  const { error: erreurCompte } = await service.from("compte").insert({
    id: utilisateur.user.id,
    role: "membre",
    personne_id: personneId,
    nom,
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
    .select("email, accompagnement (id)")
    .eq("id", personneId)
    .maybeSingle();

  if (error) return { envoye: false, pourquoi: error.message };
  if (!personne) return { envoye: false, pourquoi: "Cette fiche n'existe plus." };
  if ((personne.accompagnement ?? []).length === 0) {
    return { envoye: false, pourquoi: "Cette fiche n'a pas d'accompagnement." };
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

/**
 * Fabrique le lien d'accès sans l'envoyer, pour que le coach le transmette
 * lui-même.
 *
 * **Pourquoi les deux existent.** Une installation neuve utilise le service
 * d'email de Supabase, qui plafonne à quelques envois par heure et dont les
 * textes sont en anglais tant que personne ne les a réécrits. Un coach qui
 * ajoute ses cinq premiers clients le même après-midi se heurterait au
 * plafond, sans comprendre pourquoi. Le lien copié passe par WhatsApp, et
 * l'outil marche le premier jour sans configurer quoi que ce soit.
 *
 * Ce lien vaut une heure et ouvre l'espace de son porteur : il se colle dans
 * une conversation privée, jamais ailleurs. C'est la même prudence que
 * l'envoi par email, avec la responsabilité déplacée sur celui qui colle.
 *
 * Passe par la clé de service, contrairement à l'envoi : fabriquer un lien
 * sans l'envoyer est une opération d'administration, l'API publique ne sait
 * que déclencher un email.
 */
export async function genererLeLienDAcces(
  personneId: string,
  origine: string,
): Promise<{ lien?: string; email?: string; pourquoi?: string }> {
  const service = clienteDeService();

  const { data: personne, error } = await service
    .from("personne")
    .select("email, accompagnement (id)")
    .eq("id", personneId)
    .maybeSingle();

  if (error) return { pourquoi: error.message };
  if (!personne) return { pourquoi: "Cette fiche n'existe plus." };
  if ((personne.accompagnement ?? []).length === 0) {
    return { pourquoi: "Cette fiche n'a pas d'accompagnement." };
  }
  if (!personne.email) return { pourquoi: "Cette fiche n'a pas d'email." };

  const { data, error: erreurLien } = await service.auth.admin.generateLink({
    type: "recovery",
    email: personne.email,
    options: { redirectTo: `${origine}/auth/confirmer` },
  });

  if (erreurLien) return { pourquoi: erreurLien.message };

  return { lien: data.properties.action_link, email: personne.email };
}

/**
 * Supprime le compte d'une fiche de démonstration, et elle seule.
 *
 * **La garde est la première ligne, et elle est absolue** : la fiche doit
 * porter le drapeau `demonstration`. Sans elle, un défaut d'appel effacerait
 * l'accès d'un vrai client, ce qui ne se rattrape pas.
 *
 * **Pourquoi elle est nécessaire.** La base refuse de supprimer une fiche
 * dont un compte membre dépend : `compte.personne_id` passe à nul, et la
 * contrainte `membre_a_une_personne` interdit un membre sans fiche. Le bouton
 * « tout vider » ne pourrait donc rien vider. L'utilisateur
 * d'authentification part en premier, `compte` suit en cascade, et la fiche
 * devient supprimable.
 *
 * Ne lève pas si la fiche n'a pas de compte : vider un jeu d'essai
 * partiellement créé doit marcher aussi.
 */
export async function supprimerLeCompteDeDemonstration(
  personneId: string,
): Promise<{ pourquoi?: string }> {
  const service = clienteDeService();

  const { data: personne, error } = await service
    .from("personne")
    .select("id, demonstration")
    .eq("id", personneId)
    .maybeSingle();

  if (error) return { pourquoi: error.message };
  if (!personne) return {};

  if (!personne.demonstration) {
    return { pourquoi: "Cette fiche n'est pas une fiche de démonstration." };
  }

  const { data: compte } = await service
    .from("compte")
    .select("id")
    .eq("personne_id", personneId)
    .maybeSingle();

  if (!compte) return {};

  const { error: erreurSuppression } = await service.auth.admin.deleteUser(compte.id);
  if (erreurSuppression) return { pourquoi: erreurSuppression.message };

  return {};
}
