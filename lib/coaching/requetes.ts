import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Coaching } from "@/lib/coaching/types";
import type { Appel } from "@/lib/personne/appels.types";

const CHAMPS =
  "id, personne_id, titre, portee, prevu_le, duree_minutes, lien_visio, issue, lien_enregistrement, transcription, resume";

/**
 * Les coachings du membre connecté, passés ou à venir.
 *
 * Aucun identifiant en paramètre, contrairement au reste du socle, et c'est
 * délibéré : la vue `coaching_membre` filtre elle-même sur le compte connecté.
 * En accepter un donnerait l'illusion qu'on peut lire les séances de
 * quelqu'un d'autre, alors que la base n'en renverrait aucune.
 *
 * La lecture passe par la vue et jamais par la table `appel`, que le membre
 * ne peut pas atteindre : la vue est ce qui tient la note interne du coach
 * hors de portée, en ne la sélectionnant pas.
 *
 * Le coach, lui, ne passe pas par ici. Il lit `appel` avec la note interne,
 * depuis son module.
 */
export async function lireCoachingsPasses(): Promise<Coaching[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("coaching_membre")
    .select(CHAMPS)
    // Un coaching à venir n'a rien à raconter, et le tableau de bord le
    // montre déjà. Cette page-ci sert à retrouver ce qui a eu lieu.
    .lt("prevu_le", new Date().toISOString())
    .order("prevu_le", { ascending: false });

  if (error) throw new Error(`Lecture des coachings impossible : ${error.message}`);

  return (data ?? []) as Coaching[];
}

/** Ce qui arrive, le plus proche d'abord. Le passé est écarté à la requête. */
export async function lireProchainsCoachings(combien = 3): Promise<Coaching[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("coaching_membre")
    .select(CHAMPS)
    .gte("prevu_le", new Date().toISOString())
    .order("prevu_le")
    .limit(combien);

  if (error) throw new Error(`Lecture des coachings impossible : ${error.message}`);

  return (data ?? []) as Coaching[];
}

/**
 * Les coachings d'un membre vus par le coach, le plus récent d'abord, avec
 * la note interne.
 *
 * Les siens, et eux seuls : les coachings collectifs ne viennent pas dans
 * l'app, ils vivent sur Circle (migration 0032).
 *
 * Sur la table et non sur la vue, et c'est toute la différence : la vue
 * existe pour retirer la note interne au membre, le coach en a besoin. Les
 * permissions font le tri, l'admin lit `appel` en entier.
 */
export async function lireCoachingsDuMembre(personneId: string): Promise<Appel[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("appel")
    .select(
      "id, personne_id, prevu_le, issue, nature, titre, portee, duree_minutes, lien_visio, notes, source_externe, reference_externe, lien_enregistrement, transcription, resume",
    )
    .eq("nature", "coaching")
    .eq("personne_id", personneId)
    .order("prevu_le", { ascending: false });

  if (error) throw new Error(`Lecture des coachings impossible : ${error.message}`);

  // Le rang n'a pas de sens sur un coaching, qui porte un titre : il n'est là
  // que parce que `Appel` le déclare, calculé pour les appels du CRM.
  return (data ?? []).map((coaching, index) => ({
    ...(coaching as Omit<Appel, "rang">),
    rang: index + 1,
  }));
}
