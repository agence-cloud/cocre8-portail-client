import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Pilier, AccesPilier } from "@/lib/pilier/types";

/** Le référentiel, du pilier 0 au pilier 4. Lisible par tout compte connecté. */
export async function lirePiliers(): Promise<Pilier[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("pilier")
    .select("id, numero, nom, description, ordre")
    .order("ordre");

  if (error) throw new Error(`Lecture des piliers impossible : ${error.message}`);

  return (data ?? []) as Pilier[];
}

/**
 * Le calendrier d'une personne, dates à venir comprises. Une liste vide
 * signifie qu'aucun pilier ne lui est ouvert, pas qu'il n'en existe pas.
 */
export async function lireCalendrier(personneId: string): Promise<AccesPilier[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("acces_pilier")
    .select("pilier_id, date_ouverture")
    .eq("personne_id", personneId);

  if (error) throw new Error(`Lecture du calendrier impossible : ${error.message}`);

  return (data ?? []) as AccesPilier[];
}
