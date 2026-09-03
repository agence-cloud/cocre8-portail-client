import "server-only";

import { clienteDeService } from "@/lib/supabase/service";
import { nomComplet } from "@/lib/personne/types";
import { fabriquerUnMotDePasse } from "@/lib/auth/motdepasse";

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
 *    **Une seule modification existe**, `poserUnMotDePasse`, et elle refuse
 *    tout compte qui ne porte pas le rôle `membre` : la clé de service
 *    pourrait sinon remettre le mot de passe du coach.
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
 * **Rien ne part d'ici, et rien ne part de nulle part.** L'utilisateur est
 * créé déjà confirmé, et Supabase n'envoie aucun email. Le coach transmet
 * lui-même l'adresse de l'outil et le mot de passe que `poserUnMotDePasse`
 * lui affiche une fois.
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
      pourquoi: "Cette fiche n'est pas encore cliente. Passe-la en client, puis reprends ses accès.",
    };
  }

  if (!personne.email) {
    return {
      fait: "impossible",
      pourquoi: "Cette fiche n'a pas d'email. Ajoute-le, puis reprends ses accès.",
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
  // Le mot de passe posé ici est aléatoire et jeté : personne ne le connaîtra
  // jamais. Celui que le client recevra est posé juste après, par
  // `poserUnMotDePasse`, qui est le seul à le rendre lisible.
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
 * Pose un mot de passe neuf sur le compte d'un client, et le rend une fois.
 *
 * **C'est la seule façon de donner un accès, et rien ne sort d'ici.** Deux
 * chemins par email ont existé avant celui-ci et ont été retirés le même
 * jour : l'envoi d'un lien de réinitialisation, et le même lien fabriqué
 * pour être collé à la main. Les deux dépendaient du service d'email de
 * Supabase, qui plafonne à quelques envois par heure sur une installation
 * neuve, dont les textes sont en anglais tant que personne ne les a
 * réécrits, et dont le lien ne vaut qu'une heure. Un coach qui ouvre son
 * outil un dimanche soir n'a rien à réparer : il lit le mot de passe à
 * l'écran et l'envoie par où il parle déjà à ses clients.
 *
 * **C'est la seule modification d'un compte existant que ce fichier
 * autorise**, et la règle 2 en tête s'en trouve entamée. Sa garde tient donc
 * en deux points, et le premier vaut le plus : le compte visé est lu à
 * partir de l'identifiant de fiche, et **il doit porter le rôle `membre`**.
 * La clé de service peut tout, y compris changer le mot de passe du coach :
 * ce refus est ce qui l'en empêche.
 *
 * Le mot de passe n'est jamais rangé nulle part : il traverse cette
 * fonction, s'affiche une fois, et n'existe plus ensuite que chiffré chez
 * Supabase. Un coach qui l'a perdu en refait un.
 */
export async function poserUnMotDePasse(
  personneId: string,
): Promise<{ email?: string; motDePasse?: string; pourquoi?: string }> {
  const service = clienteDeService();

  const { data: compte, error } = await service
    .from("compte")
    .select("id, role")
    .eq("personne_id", personneId)
    .maybeSingle();

  if (error) return { pourquoi: error.message };
  if (!compte) return { pourquoi: "Ce client n'a pas encore de compte." };

  // La garde qui compte : ce chemin ne touche que des membres. Un défaut
  // d'appel ne doit pas pouvoir remettre le mot de passe du coach.
  if (compte.role !== "membre") {
    return { pourquoi: "Ce compte n'est pas celui d'un client." };
  }

  // L'adresse se lit en base, comme partout ici : c'est elle que l'écran
  // affichera comme identifiant, et elle ne doit venir d'aucun appelant.
  const { data: personne, error: erreurFiche } = await service
    .from("personne")
    .select("email")
    .eq("id", personneId)
    .maybeSingle();

  if (erreurFiche) return { pourquoi: erreurFiche.message };
  if (!personne?.email) return { pourquoi: "Cette fiche n'a pas d'email." };
  const email = personne.email;

  const motDePasse = fabriquerUnMotDePasse();

  const { error: erreurPose } = await service.auth.admin.updateUserById(compte.id, {
    password: motDePasse,
  });

  if (erreurPose) return { pourquoi: erreurPose.message };

  return { email, motDePasse };
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
