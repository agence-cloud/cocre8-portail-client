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
import { envoyerLesAcces as envoyer } from "@/lib/auth/creation";
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
  // ne touche aucune ligne. Sans cette vérification, cocher la tâche d'un
  // pilier fermé passerait pour un succès et la case resterait cochée à
  // l'écran alors que la base n'a rien enregistré.
  if (!data) throw new Error("Cette tâche ne t'appartient pas, ou son pilier n'est pas ouvert.");

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
 * Dépose un fichier dans le coffre, puis enregistre sa ligne.
 *
 * L'ordre compte : si l'enregistrement échoue après le téléversement, on
 * retire le fichier. Sans ça, le coffre accumulerait des fichiers que plus
 * aucune ligne ne nomme, invisibles et impossibles à nettoyer.
 */
export async function deposerDocument(
  personneId: string,
  donnees: FormData,
): Promise<{ erreur: string | null }> {
  await exigerConnecte();

  const fichier = donnees.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { erreur: "Choisis un fichier." };
  }

  // 20 Mo : au-delà, c'est une vidéo, et une vidéo se partage par un lien.
  if (fichier.size > 20 * 1024 * 1024) {
    return { erreur: "Ce fichier dépasse 20 Mo. Partage plutôt un lien." };
  }

  const supabase = await creerClientServeur();
  // Le nom d'origine est conservé pour l'affichage, mais le chemin porte un
  // identifiant : deux fichiers du même nom ne doivent pas s'écraser, et un
  // nom de fichier peut contenir n'importe quoi.
  const chemin = `${personneId}/${crypto.randomUUID()}`;

  const { error: erreurCoffre } = await supabase.storage
    .from("documents")
    .upload(chemin, fichier, { contentType: fichier.type || undefined });

  if (erreurCoffre) return { erreur: `Dépôt impossible : ${erreurCoffre.message}` };

  const { error: erreurLigne } = await supabase.from("document").insert({
    personne_id: personneId,
    nom: fichier.name,
    chemin_storage: chemin,
    taille_octets: fichier.size,
    type_mime: fichier.type || null,
    visible_membre: donnees.get("interne") !== "on",
  });

  if (erreurLigne) {
    await supabase.storage.from("documents").remove([chemin]);
    return { erreur: `Enregistrement impossible : ${erreurLigne.message}` };
  }

  revalidatePath("/espace", "layout");
  revalidatePath("/pilotage/membres", "layout");
  return { erreur: null };
}

/** Le coach pose le calendrier complet à partir d'une date de démarrage. */
export async function planifierCalendrier(
  personneId: string,
  demarrage: string,
): Promise<void> {
  await exigerAdmin();
  const supabase = await creerClientServeur();

  const { error } = await supabase.rpc("planifier_piliers", {
    p_personne: personneId,
    p_demarrage: demarrage,
  });

  if (error) throw new Error(`Calendrier impossible : ${error.message}`);

  revalidatePath("/pilotage/membres", "layout");
  revalidatePath("/espace", "layout");
}

/**
 * Une date corrigée à la main. Une date vide retire la ligne, donc ferme le
 * pilier sans date : c'est ce qui permet de refermer un pilier ouvert par
 * erreur, plutôt que de le repousser à l'an prochain.
 */
export async function changerDateOuverture(
  personneId: string,
  pilierId: string,
  date: string | null,
): Promise<void> {
  await exigerAdmin();
  const supabase = await creerClientServeur();

  const { error } = date
    ? await supabase
        .from("acces_pilier")
        .upsert(
          { personne_id: personneId, pilier_id: pilierId, date_ouverture: date },
          { onConflict: "personne_id,pilier_id" },
        )
    : await supabase
        .from("acces_pilier")
        .delete()
        .eq("personne_id", personneId)
        .eq("pilier_id", pilierId);

  if (error) throw new Error(`Date non enregistrée : ${error.message}`);

  revalidatePath("/pilotage/membres", "layout");
  revalidatePath("/espace", "layout");
}

/** Copie le parcours type. Renvoie le nombre de tâches réellement ajoutées. */
export async function appliquerParcours(personneId: string): Promise<number> {
  await exigerAdmin();
  const supabase = await creerClientServeur();

  const { data, error } = await supabase.rpc("appliquer_parcours_modele", {
    p_personne: personneId,
  });

  if (error) throw new Error(`Application impossible : ${error.message}`);

  revalidatePath("/pilotage/membres", "layout");
  revalidatePath("/espace", "layout");
  return (data as number) ?? 0;
}

/** Une tâche sur mesure, en plus du parcours type. */
export async function ajouterTache(
  personneId: string,
  pilierId: string,
  titre: string,
  description: string | null,
): Promise<void> {
  const compte = await exigerAdmin();
  const supabase = await creerClientServeur();

  // Elle se range à la fin du pilier : une tâche ajoutée en cours de route
  // s'intercalerait au milieu du parcours si elle prenait l'ordre 0.
  const { data: derniere } = await supabase
    .from("tache")
    .select("ordre")
    .eq("personne_id", personneId)
    .eq("pilier_id", pilierId)
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("tache").insert({
    personne_id: personneId,
    pilier_id: pilierId,
    groupe: "Ce que ton coach a ajouté",
    titre,
    description,
    ordre: ((derniere?.ordre as number) ?? 0) + 1,
    cree_par: compte.id,
  });

  if (error) throw new Error(`Tâche non ajoutée : ${error.message}`);

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
 * Noter qu'une séance a eu lieu, ou pas. C'est ce geste qui ouvre son compte
 * rendu : tant qu'elle est à venir, il n'y a rien à en dire.
 *
 * Comme la précédente, elle refuse tout ce qui n'est pas un coaching : les
 * appels de prospection se notent depuis leur fiche, dans le CRM, et cet
 * écran-ci n'a pas à les atteindre.
 */
export async function noterIssueCoaching(
  id: string,
  issue: "honore" | "no_show",
): Promise<void> {
  await exigerAdmin();
  const supabase = await creerClientServeur();

  const { data, error } = await supabase
    .from("appel")
    .update({ issue })
    .eq("id", id)
    .eq("nature", "coaching")
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Issue non enregistrée : ${error.message}`);
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
