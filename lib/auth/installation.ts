import "server-only";

import { creerClientServeur } from "@/lib/supabase/serveur";
import { clienteDeService } from "@/lib/supabase/service";

/**
 * La première mise en service : une base vierge ouvre une porte, une seule
 * fois, et le premier compte créé devient celui du coach.
 *
 * **Pourquoi ce fichier existe.** `lib/auth/creation.ts` porte en tête « il
 * ne sait créer qu'un membre, jamais d'admin », et cette règle ne se
 * desserre pas : une clé qui peut tout ne doit servir qu'à une chose. La
 * création du premier compte est une autre chose, elle vit donc ici, avec ses
 * propres gardes.
 *
 * **C'est le seul endroit de l'app où une adresse et un mot de passe viennent
 * d'un formulaire.** Partout ailleurs, l'adresse se lit en base à partir d'un
 * identifiant de fiche, précisément pour qu'une requête forgée ne puisse pas
 * créer un compte sur l'adresse de son choix. Ici la règle n'a personne à
 * protéger : sur une base vierge, il n'y a aucun compte à usurper. Elle
 * redevient vraie à la seconde d'après, quand la porte se referme.
 *
 * **La porte se ferme par la base, pas par une lecture.** Lire « aucun compte
 * n'existe » puis écrire laisserait passer deux requêtes simultanées. C'est
 * l'insertion dans `installation`, dont la table n'accepte qu'une ligne, qui
 * tranche : la seconde échoue sur un doublon.
 */

/** Ce que la mise en service a fait, pour que l'écran puisse le dire. */
export type ResultatInstallation =
  | { fait: "installe" }
  | { fait: "deja_faite" }
  | { fait: "impossible"; pourquoi: string };

/** Huit caractères, comme le formulaire l'annonce. */
const LONGUEUR_MINIMALE = 8;

/**
 * Vrai dès que l'outil a été mis en service.
 *
 * Passe par une fonction de la base et non par une lecture de table : la
 * table `installation` n'est lisible par personne, et cette question doit
 * pouvoir être posée par un visiteur qui n'a pas encore de compte.
 */
export async function installationFaite(): Promise<boolean> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("installation_faite");

  // Une base injoignable n'est pas une base vierge. Les confondre ouvrirait
  // la porte d'installation d'une app déjà installée le jour d'une panne
  // réseau, ce qui est exactement ce que cette porte doit empêcher.
  if (error) throw new Error(`État de l'installation illisible : ${error.message}`);

  return data === true;
}

/**
 * Crée le compte du coach sur une base vierge, et referme la porte.
 *
 * Ne lève pas quand elle ne peut pas : elle renvoie pourquoi, pour que l'écran
 * le dise sans perdre ce que la personne vient de saisir.
 */
export async function installerLePremierCompte(
  nom: string,
  email: string,
  motDePasse: string,
): Promise<ResultatInstallation> {
  if (!nom.trim()) return { fait: "impossible", pourquoi: "Dis-nous ton nom." };
  if (!email.trim()) return { fait: "impossible", pourquoi: "Renseigne ton adresse email." };
  if (motDePasse.length < LONGUEUR_MINIMALE) {
    return {
      fait: "impossible",
      pourquoi: `Ton mot de passe doit faire au moins ${LONGUEUR_MINIMALE} caractères.`,
    };
  }

  const service = clienteDeService();

  // La réservation d'abord, la création ensuite. Dans l'autre ordre, deux
  // requêtes simultanées créeraient deux coachs avant que l'une des deux
  // s'aperçoive qu'elle est en trop.
  const { error: erreurVerrou } = await service.from("installation").insert({ id: true });

  if (erreurVerrou) return { fait: "deja_faite" };

  // `email_confirm: true` : sans lui, le compte reste en attente de
  // confirmation, ne peut pas se connecter, et Supabase envoie un email qu'on
  // ne contrôle ni dans son texte ni dans son moment. Or celui qui installe
  // est devant son écran, il veut entrer maintenant.
  const { data: utilisateur, error: erreurUtilisateur } =
    await service.auth.admin.createUser({
      email: email.trim(),
      password: motDePasse,
      email_confirm: true,
    });

  if (erreurUtilisateur) {
    await libererLaPorte(service);
    return { fait: "impossible", pourquoi: erreurUtilisateur.message };
  }

  const { error: erreurCompte } = await service.from("compte").insert({
    id: utilisateur.user.id,
    role: "admin",
    personne_id: null,
    nom: nom.trim(),
  });

  if (erreurCompte) {
    // Sans ces deux retraits, l'outil resterait bloqué pour toujours : la
    // porte fermée, et aucun compte pour entrer.
    await service.auth.admin.deleteUser(utilisateur.user.id);
    await libererLaPorte(service);
    return { fait: "impossible", pourquoi: erreurCompte.message };
  }

  return { fait: "installe" };
}

/**
 * Rend la porte à la tentative suivante quand la création a échoué en cours
 * de route.
 *
 * Si le processus meurt entre la réservation et ce retrait, l'outil reste
 * fermé sans compte, et il faut alors vider la table `installation` à la main
 * depuis l'éditeur SQL. C'est le prix de la garde contre la double
 * installation, et il est plus petit que le défaut qu'elle évite.
 */
async function libererLaPorte(
  service: ReturnType<typeof clienteDeService>,
): Promise<void> {
  await service.from("installation").delete().eq("id", true);
}
