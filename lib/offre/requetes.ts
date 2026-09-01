import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Accompagnement, Offre } from "@/lib/offre/types";

const CHAMPS_OFFRE =
  "id, nom, prix_defaut, type, duree_mois, provisionne_espace, active, par_defaut";

/** Les offres proposables, la moins chère d'abord : c'est l'ordre du catalogue. */
export async function lireOffres(): Promise<Offre[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("offre")
    .select(CHAMPS_OFFRE)
    .eq("active", true)
    .order("prix_defaut");

  if (error) throw new Error(`Lecture des offres impossible : ${error.message}`);

  return (data ?? []) as Offre[];
}

/** L'offre que vise tout nouveau lead. Nulle si le catalogue n'en désigne aucune. */
export async function lireOffreParDefaut(): Promise<Offre | null> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("offre")
    .select(CHAMPS_OFFRE)
    .eq("par_defaut", true)
    .maybeSingle();

  if (error) throw new Error(`Lecture de l'offre par défaut impossible : ${error.message}`);

  return (data ?? null) as Offre | null;
}

/** Les offres signées par une personne, la plus ancienne d'abord. */
export async function lireAccompagnements(personneId: string): Promise<Accompagnement[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("accompagnement")
    .select(
      `id, personne_id, offre_id, prix_negocie, date_debut, date_fin, statut, progression, offre:offre_id (${CHAMPS_OFFRE})`,
    )
    .eq("personne_id", personneId)
    .order("date_debut");

  if (error) {
    throw new Error(`Lecture des accompagnements impossible : ${error.message}`);
  }

  return (data ?? []) as unknown as Accompagnement[];
}
