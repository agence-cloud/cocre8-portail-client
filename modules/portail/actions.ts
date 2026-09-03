"use server";

/**
 * Les écritures gardées du portail. Comme celles du CRM, elles vivent dans le
 * module et non dans le socle : elles appellent leur garde et rafraîchissent
 * leurs routes, deux choses qu'un socle n'a pas à connaître.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/serveur";
import { headers } from "next/headers";
import { exigerConnecte, exigerAdmin } from "@/lib/auth/compte";
import {
  creerLeCompteDuMembre as creerLeCompte,
  envoyerLesAcces as envoyer,
  genererLeLienDAcces as genererLien,
} from "@/lib/auth/creation";
import { entrerDansLEspaceDe, revenirAuPilotage } from "@/lib/auth/apercu";
import { versInstantUTC } from "@/lib/dates";

export async function cocherTache(id: string, faite: boolean): Promise<void> {
  // La garde est ici et pas seulement dans la page : une action serveur
  // s'appelle par requête HTTP, elle ne passe par aucun layout.
  await exigerConnecte();
  const supabase = await creerClientServeur();

  const { data, error } = await supabase
    .from("tache")
    .update({ faite, faite_le: faite ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);

  // Une mise à jour qu'aucune politique n'autorise ne lève pas d'erreur, elle
  // ne touche aucune ligne. Sans cette vérification, cocher la tâche de
  // quelqu'un d'autre passerait pour un succès et la case resterait cochée à
  // l'écran alors que la base n'a rien enregistré.
  if (!data) throw new Error("Cette tâche ne t'appartient pas.");

  revalidatePath("/espace", "layout");
  revalidatePath("/pilotage/membres", "layout");
}

/**
 * Enregistre une réponse au profil. L'identifiant de la personne n'est pas un
 * paramètre : il vient du compte connecté, sinon n'importe quel membre
 * pourrait écrire dans le profil d'un autre en changeant un champ caché.
 */
export async function enregistrerReponse(
  questionId: string,
  reponse: string,
): Promise<void> {
  const compte = await exigerConnecte();
  if (!compte.personneId) throw new Error("Ce compte n'a pas de fiche.");

  const supabase = await creerClientServeur();
  const { error } = await supabase.from("reponse_profil").upsert(
    {
      personne_id: compte.personneId,
      question_id: questionId,
      reponse: reponse.trim() === "" ? null : reponse.trim(),
      modifie_le: new Date().toISOString(),
    },
    { onConflict: "personne_id,question_id" },
  );

  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);

  revalidatePath("/espace", "layout");
}

/**
 * La dernière réponse de la porte d'entrée. Le même enregistrement que
 * ci-dessus, à un détail près qui décide de tout : elle ne revalide rien.
 *
 * Revalider rafraîchirait la page en cours. Or le profil vient de devenir
 * complet, donc cette page cesserait d'être la porte pour devenir le résumé,
 * et l'écran de chargement disparaîtrait au milieu de son animation. C'est
 * exactement ce qui se produisait avant cette fonction.
 *
 * On peut s'en passer parce qu'on s'apprête à quitter la page : la navigation
 * vers l'espace ira chercher ses données d'elle-même, et ces pages sont
 * dynamiques, elles lisent le compte connecté à chaque rendu.
 */
export async function enregistrerDerniereReponse(
  questionId: string,
  reponse: string,
): Promise<void> {
  const compte = await exigerConnecte();
  if (!compte.personneId) throw new Error("Ce compte n'a pas de fiche.");

  const supabase = await creerClientServeur();
  const { error } = await supabase.from("reponse_profil").upsert(
    {
      personne_id: compte.personneId,
      question_id: questionId,
      reponse: reponse.trim() === "" ? null : reponse.trim(),
      modifie_le: new Date().toISOString(),
    },
    { onConflict: "personne_id,question_id" },
  );

  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
}

/**
 * Ouvre l'espace au sortir de la porte d'entrée.
 *
 * Deux gestes en un, et le premier explique le second. Le layout de l'espace
 * est partagé entre la page du profil et le tableau de bord : une navigation
 * de l'une à l'autre le réutilise tel qu'il a été rendu à l'arrivée,
 * c'est-à-dire avec un profil incomplet, et le membre débarquerait dans son
 * espace sans barre latérale. L'invalider avant de rediriger est ce qui le
 * fait relire.
 *
 * Et la redirection part d'ici plutôt que du navigateur pour que
 * l'invalidation la précède à coup sûr : demandées séparément, rien ne dit
 * laquelle arrive la première.
 */
export async function ouvrirLEspace(): Promise<void> {
  await exigerConnecte();
  revalidatePath("/espace", "layout");
  redirect("/espace");
}

/**
 * Enregistre plusieurs réponses d'un coup, pour le profil déjà rempli qu'on
 * rouvre au stylo. Un seul aller-retour, et surtout une seule écriture : dix
 * appels séparés pourraient laisser le profil à moitié corrigé si le
 * cinquième échouait, exactement ce que le stylo de la fiche du pilotage
 * évite de son côté.
 *
 * La porte d'entrée, elle, garde son enregistrement question par question au
 * moment où l'on quitte le champ : là, on remplit en plusieurs fois, et un
 * bouton unique ferait perdre son travail à qui s'arrête au milieu.
 */
export async function enregistrerReponses(
  reponses: { question_id: string; reponse: string }[],
): Promise<void> {
  const compte = await exigerConnecte();
  if (!compte.personneId) throw new Error("Ce compte n'a pas de fiche.");
  if (reponses.length === 0) return;

  const quand = new Date().toISOString();
  const supabase = await creerClientServeur();

  // `personne_id` vient du compte et jamais de l'appelant, comme au-dessus :
  // sinon n'importe quel membre écrirait dans le profil d'un autre.
  const { error } = await supabase.from("reponse_profil").upsert(
    reponses.map((r) => ({
      personne_id: compte.personneId,
      question_id: r.question_id,
      reponse: r.reponse.trim() === "" ? null : r.reponse.trim(),
      modifie_le: quand,
    })),
    { onConflict: "personne_id,question_id" },
  );

  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);

  revalidatePath("/espace", "layout");
}

/**
 * L'enregistrement d'un document, une fois le fichier déjà dans le coffre.
 *
 * **Le fichier ne passe plus par ici, et c'est la correction du 2026-09-02.**
 * Il traversait cette action serveur, qui plafonne à 1 Mo chez Next et à
 * 4,5 Mo chez Vercel. Au-delà, la requête était coupée avant d'arriver, et
 * l'écran affichait « An unexpected response was received from the server »,
 * en anglais, sans rapport avec la taille. Le formulaire annonçait 20 Mo.
 *
 * Le navigateur envoie donc le fichier directement au coffre, avec la session
 * du coach ou du client, et n'appelle cette action qu'ensuite, avec les
 * quelques centaines d'octets qui décrivent le fichier. Les permissions ne
 * bougent pas : ce sont celles du coffre qui décident où chacun peut écrire,
 * et elles étaient déjà écrites pour ça.
 *
 * **Le chemin est vérifié ici, et il l'est aussi par la base.** La politique
 * d'écriture de `document` exige déjà qu'un client ne cite qu'un fichier de
 * son dossier ; on le redit en clair plutôt que de laisser une erreur
 * PostgreSQL remonter à l'écran.
 *
 * **Ce qu'on ne vérifie pas : que le fichier soit bien arrivé.** Relire
 * l'objet dans le coffre a été écrit puis retiré, parce que la vérification
 * ne sait pas répondre pour un client : sa politique de lecture du coffre
 * exige une ligne `document` déjà posée et visible, donc elle ne trouve
 * jamais un fichier qu'on vient à peine d'envoyer. Elle aurait refusé tous
 * les dépôts des clients en prétendant que le fichier manquait. Le pire cas
 * qui reste est une ligne qui pointe sur rien, et elle ne vient que d'un
 * appel forgé : son propriétaire verrait un document qui ne s'ouvre pas.
 */
export async function enregistrerLeDocument(champs: {
  personneId: string;
  chemin: string;
  nom: string;
  taille: number;
  typeMime: string | null;
  interne: boolean;
}): Promise<{ erreur: string | null }> {
  await exigerConnecte();
  const supabase = await creerClientServeur();

  // Le dossier est toujours celui de la fiche : c'est ce que la politique du
  // coffre impose déjà à l'écriture, on le redit ici pour que la ligne ne
  // puisse pas désigner le fichier d'un autre.
  if (!champs.chemin.startsWith(`${champs.personneId}/`)) {
    return { erreur: "Ce fichier n'appartient pas à cette fiche." };
  }

  const { error } = await supabase.from("document").insert({
    personne_id: champs.personneId,
    nom: champs.nom,
    chemin_storage: champs.chemin,
    taille_octets: champs.taille,
    type_mime: champs.typeMime,
    visible_membre: !champs.interne,
  });

  if (error) {
    await supabase.storage.from("documents").remove([champs.chemin]);
    return { erreur: `Enregistrement impossible : ${error.message}` };
  }

  revalidatePath("/espace", "layout");
  revalidatePath("/pilotage/membres", "layout");
  return { erreur: null };
}

/**
 * L'aperçu : le coach ouvre l'espace d'un client tel que ce client le voit.
 *
 * **La garde est ici, et elle est la seule.** `lib/auth/apercu.ts` lit la clé
 * de service, il ne se garde pas lui-même : un appelant sans `exigerAdmin`
 * n'a rien à faire ici. L'identifiant de la fiche est le seul paramètre,
 * l'adresse email se lit en base.
 *
 * Pas de `revalidatePath` : la redirection change de session, donc tout se
 * recharge de toute façon, et l'appeler avant le `redirect` rafraîchirait des
 * pages avec les droits qu'on vient de quitter.
 */
export async function ouvrirLApercu(personneId: string): Promise<{ pourquoi?: string }> {
  await exigerAdmin();
  const { pourquoi } = await entrerDansLEspaceDe(personneId);
  if (pourquoi) return { pourquoi };
  redirect("/espace");
}

/**
 * Le retour du coach chez lui.
 *
 * **Sans `exigerAdmin`, et c'est voulu** : celui qui l'appelle est justement
 * connecté comme membre à ce moment-là. C'est la présence du cookie de retour
 * qui fait foi, et ce cookie ne se pose que dans l'action ci-dessus.
 */
export async function quitterLApercu(): Promise<void> {
  await revenirAuPilotage();
  redirect("/pilotage");
}

/**
 * Les objectifs d'un client, écrits par son coach.
 *
 * **Ils ont remplacé le parcours type et son calendrier.** L'outil copiait
 * auparavant un parcours commun chez chaque client, puis ouvrait ses parties
 * une par mois. C'était la méthode de l'éditeur imposée à tous ceux qui
 * installent l'outil : deux clients d'un même coach n'ont pas les mêmes
 * objectifs, et deux coachs encore moins. Tout se saisit donc à la main, pour
 * un client, sur son écran de suivi.
 */
export async function ajouterObjectif(
  personneId: string,
  titre: string,
  description: string | null,
  echeance: string | null,
): Promise<void> {
  const compte = await exigerAdmin();
  const supabase = await creerClientServeur();

  // Il se range à la fin : un objectif ajouté en cours de route s'intercalerait
  // en tête s'il prenait l'ordre 0, et bousculerait la lecture du client.
  const { data: dernier } = await supabase
    .from("objectif")
    .select("ordre")
    .eq("personne_id", personneId)
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("objectif").insert({
    personne_id: personneId,
    titre,
    description,
    echeance,
    ordre: ((dernier?.ordre as number) ?? 0) + 1,
    cree_par: compte.id,
  });

  if (error) throw new Error(`Objectif non ajouté : ${error.message}`);

  revalidatePath("/pilotage/membres", "layout");
  revalidatePath("/espace", "layout");
}

/**
 * Retire un objectif, et ses tâches avec lui par cascade.
 *
 * Rien ne demande confirmation ici : c'est l'écran qui la demande, parce que
 * lui seul peut dire combien de tâches partent avec, et que le nombre est ce
 * qui fait hésiter.
 */
export async function retirerObjectif(id: string): Promise<void> {
  await exigerAdmin();
  const supabase = await creerClientServeur();

  const { error } = await supabase.from("objectif").delete().eq("id", id);
  if (error) throw new Error(`Objectif non retiré : ${error.message}`);

  revalidatePath("/pilotage/membres", "layout");
  revalidatePath("/espace", "layout");
}

/** Une sous-tâche sous son objectif. */
export async function ajouterTache(
  objectifId: string,
  titre: string,
  description: string | null,
): Promise<void> {
  const compte = await exigerAdmin();
  const supabase = await creerClientServeur();

  const { data: derniere } = await supabase
    .from("tache")
    .select("ordre")
    .eq("objectif_id", objectifId)
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("tache").insert({
    objectif_id: objectifId,
    titre,
    description,
    ordre: ((derniere?.ordre as number) ?? 0) + 1,
    cree_par: compte.id,
  });

  if (error) throw new Error(`Tâche non ajoutée : ${error.message}`);

  revalidatePath("/pilotage/membres", "layout");
  revalidatePath("/espace", "layout");
}

export async function retirerTache(id: string): Promise<void> {
  await exigerAdmin();
  const supabase = await creerClientServeur();

  const { error } = await supabase.from("tache").delete().eq("id", id);
  if (error) throw new Error(`Tâche non retirée : ${error.message}`);

  revalidatePath("/pilotage/membres", "layout");
  revalidatePath("/espace", "layout");
}

/**
 * Un coaching posé par le coach, toujours pour ce membre-là.
 *
 * Plus de collectif : ils vivent sur Circle, pas ici (migration 0032). La
 * portée reste dans la table parce que `appel` la porte pour d'autres
 * usages, mais tout ce que cet écran pose est individuel.
 */
export async function poserCoaching(
  donnees: FormData,
): Promise<{ erreur: string | null }> {
  await exigerAdmin();

  const titre = String(donnees.get("titre") ?? "").trim();
  const debut = String(donnees.get("debut") ?? "");
  if (!titre) return { erreur: "Donne un titre à ce coaching." };
  if (!debut) return { erreur: "Pose une date et une heure." };

  const personneId = String(donnees.get("personne_id") ?? "");
  if (!personneId) return { erreur: "Ce coaching n'est rattaché à personne." };

  const lien = String(donnees.get("lien_visio") ?? "").trim();

  const supabase = await creerClientServeur();

  // Dans `appel` et non plus dans `rendez_vous` : les deux tables n'en font
  // plus qu'une depuis la migration 0029. C'est ce qui permet d'attacher un
  // compte rendu à un coaching, ce qui était impossible tant qu'il vivait
  // dans une table qui n'en avait pas.
  const { error } = await supabase.from("appel").insert({
    // Toujours une personne. Une ligne sans personne serait invisible pour
    // tout le monde depuis la migration 0032, donc posée pour rien.
    personne_id: personneId,
    titre,
    portee: "individuel",
    nature: "coaching",
    // `debut` vient d'un datetime-local, une heure de Paris sans fuseau :
    // new Date() l'aurait lue dans le fuseau du serveur, juste par accident
    // en local, faux en production.
    prevu_le: versInstantUTC(debut),
    duree_minutes: Number(donnees.get("duree_minutes")) || null,
    lien_visio: lien === "" ? null : lien,
  });

  if (error) return { erreur: `Coaching non posé : ${error.message}` };

  revalidatePath("/pilotage/membres", "layout");
  revalidatePath("/espace", "layout");
  return { erreur: null };
}

/**
 * Retire un coaching, et son compte rendu avec lui.
 *
 * **Elle remplace `noterIssueCoaching`.** Une séance portait une « issue » à
 * noter, Honoré ou No-show, reste de l'app de prospection dont cet outil est
 * extrait : là-bas, le taux de présence était une métrique commerciale. Un
 * coach qui suit ses clients ne compte pas leurs absences, il retire la
 * séance qui n'a pas eu lieu. C'est ce geste-là qui manquait.
 *
 * `nature` reste dans le filtre : cette action ne doit pouvoir toucher qu'un
 * coaching, jamais une autre réunion qu'un import déposerait un jour.
 */
export async function retirerCoaching(id: string): Promise<void> {
  await exigerAdmin();
  const supabase = await creerClientServeur();

  const { data, error } = await supabase
    .from("appel")
    .delete()
    .eq("id", id)
    .eq("nature", "coaching")
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Coaching non retiré : ${error.message}`);
  if (!data) throw new Error("Ce coaching n'existe plus, ou n'en est pas un.");

  revalidatePath("/pilotage/membres", "layout");
  revalidatePath("/espace", "layout");
}

/**
 * Le compte rendu d'un coaching, écrit par le coach depuis le suivi d'un
 * membre.
 *
 * Une seule table dit « une réunion », et chaque module qui y écrit apporte
 * sa garde et ses routes plutôt que d'appeler celle d'un autre.
 *
 * Le partage des écritures avec un import automatique est tenu ici comme dans
 * le panneau : sur un coaching importé, le lien et la transcription se
 * refusent, parce que la prochaine synchronisation écraserait la correction
 * sans prévenir.
 */
export async function modifierCompteRenduCoaching(
  id: string,
  champs: {
    lien_enregistrement?: string | null;
    transcription?: string | null;
    resume?: string | null;
    notes?: string | null;
  },
): Promise<void> {
  await exigerAdmin();
  const supabase = await creerClientServeur();

  const { data: coaching, error: erreurLecture } = await supabase
    .from("appel")
    .select("source_externe, nature")
    .eq("id", id)
    .maybeSingle();

  if (erreurLecture) throw new Error(`Coaching illisible : ${erreurLecture.message}`);
  if (!coaching) throw new Error("Ce coaching n'existe plus.");

  // Cet écran ne touche qu'aux coachings. Sans ce refus, un identifiant
  // forgé laisserait écrire le compte rendu d'un appel de prospection depuis
  // le suivi d'un membre, hors de la fiche qui le gouverne.
  if (coaching.nature !== "coaching") {
    throw new Error("Cet appel se corrige depuis sa fiche, dans le CRM.");
  }

  const autorises = coaching.source_externe
    ? (["resume", "notes"] as const)
    : (["lien_enregistrement", "transcription", "resume", "notes"] as const);

  const propre: Record<string, unknown> = {};
  for (const cle of autorises) {
    if (cle in champs) {
      const valeur = champs[cle];
      propre[cle] = typeof valeur === "string" && valeur.trim() === "" ? null : valeur;
    }
  }

  if (Object.keys(propre).length === 0) return;

  const { data, error } = await supabase
    .from("appel")
    .update(propre)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Compte rendu non enregistré : ${error.message}`);
  if (!data) throw new Error("Ce coaching n'existe plus.");

  revalidatePath("/pilotage/membres", "layout");
  revalidatePath("/espace", "layout");
}

/**
 * Envoie au membre le lien qui lui fera poser son mot de passe.
 *
 * Séparée de la bascule en client, délibérément : l'espace se prépare tout
 * seul au moment de la signature, l'invitation part quand un humain le
 * décide. Rien ne sort de l'application sans ce clic.
 *
 * L'adresse de retour se déduit de l'en-tête de la requête plutôt que d'être
 * écrite en dur : en local elle vaut localhost, en ligne le vrai domaine, et
 * personne n'a à s'en souvenir le jour du déploiement.
 */
export async function envoyerLesAcces(
  personneId: string,
): Promise<{ envoye: boolean; email?: string; pourquoi?: string }> {
  await exigerAdmin();

  const entetes = await headers();
  const hote = entetes.get("host");
  if (!hote) return { envoye: false, pourquoi: "Adresse du site introuvable." };

  // `x-forwarded-proto` derrière un proxy, http en local : deviner le
  // protocole donnerait un lien en http sur un site en https, que le
  // navigateur refuserait après redirection.
  const protocole = entetes.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");

  const resultat = await envoyer(personneId, `${protocole}://${hote}`);

  revalidatePath("/pilotage/membres", "layout");
  return resultat;
}

/**
 * Le lien d'accès, fabriqué mais pas envoyé.
 *
 * L'autre moitié de l'invitation : le coach le copie et le transmet
 * lui-même, par le canal qu'il utilise déjà avec ses clients. Rien ne sort
 * de l'application ici, ce qui en fait le geste le plus discret des deux.
 */
export async function genererLeLien(
  personneId: string,
): Promise<{ lien?: string; email?: string; pourquoi?: string }> {
  await exigerAdmin();

  const entetes = await headers();
  const hote = entetes.get("host");
  if (!hote) return { pourquoi: "Adresse du site introuvable." };

  const protocole =
    entetes.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");

  return genererLien(personneId, `${protocole}://${hote}`);
}

/**
 * Ajoute un client : sa fiche, son accompagnement et son compte, d'un seul
 * geste.
 *
 * **Son espace naît vide d'objectifs, et c'est voulu.** Il en recevait
 * auparavant un parcours type recopié, écrit par l'éditeur : le premier écran
 * du client montrait donc les tâches de quelqu'un d'autre. Le coach écrit les
 * siens juste après, sur l'écran de suivi qui s'ouvre.
 *
 * **Le seul chemin par lequel un client naît ici.** L'application dont cet
 * outil est extrait les créait à la bascule commerciale d'un CRM qui n'existe
 * plus : sans ce geste, un coach ne pourrait ajouter personne.
 *
 * **Rien n'est envoyé.** Le compte est créé et l'espace prêt, mais
 * l'invitation reste un clic séparé sur l'écran de suivi. C'est la règle du
 * dépôt : l'espace se prépare tout seul, ce qui sort vers quelqu'un attend
 * qu'un humain le décide.
 *
 * **L'ordre compte.** La fiche d'abord, l'accompagnement ensuite, le compte en
 * dernier : `creerLeCompteDuMembre` refuse une fiche sans accompagnement, et
 * c'est ce refus qui garantit qu'un contact ajouté pour mémoire ne reçoit pas
 * d'accès à un espace vide.
 */
export async function ajouterUnClient(champs: {
  nom: string;
  prenom: string;
  email: string;
  demarrage: string;
}): Promise<{ fait: boolean; personneId?: string; pourquoi?: string }> {
  await exigerAdmin();
  const supabase = await creerClientServeur();

  const { data: personne, error: erreurFiche } = await supabase
    .from("personne")
    .insert({
      nom: champs.nom.trim(),
      prenom: champs.prenom.trim() || null,
      email: champs.email.trim() || null,
    })
    .select("id")
    .single();

  // L'index unique sur l'email en minuscules : deux clients ne peuvent pas
  // porter la même adresse, et le message le dit plutôt que de laisser
  // remonter une contrainte PostgreSQL.
  if (erreurFiche) {
    const doublon = erreurFiche.code === "23505";
    return {
      fait: false,
      pourquoi: doublon
        ? "Un client porte déjà cette adresse email."
        : erreurFiche.message,
    };
  }

  const { error: erreurAccompagnement } = await supabase.from("accompagnement").insert({
    personne_id: personne.id,
    date_debut: champs.demarrage,
  });

  if (erreurAccompagnement) {
    // Sans ce retrait, la fiche resterait sans accompagnement, donc sans
    // accès possible, et son adresse bloquerait une seconde tentative.
    await supabase.from("personne").delete().eq("id", personne.id);
    return { fait: false, pourquoi: erreurAccompagnement.message };
  }

  // Le compte peut échouer sans que tout soit perdu : la fiche et son
  // accompagnement restent, et le coach relance l'envoi de ses accès depuis
  // l'écran de suivi.
  const compte = await creerLeCompte(personne.id);

  revalidatePath("/pilotage");
  revalidatePath("/pilotage/membres", "layout");

  return {
    fait: true,
    personneId: personne.id,
    pourquoi: compte.fait === "impossible" ? compte.pourquoi : undefined,
  };
}
