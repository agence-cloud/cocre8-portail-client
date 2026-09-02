// @vitest-environment node

import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

async function connecterAdmin(): Promise<SupabaseClient> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await admin.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_MOTDEPASSE!,
  });
  if (error) throw new Error(`Connexion admin impossible : ${error.message}`);
  return admin;
}

/**
 * Ce que `install.sql` laisse derrière lui.
 *
 * **Ce fichier était trois fois plus long.** Il éprouvait les parties du
 * parcours, les quarante-six tâches modèles qui s'y rangeaient, et les deux
 * fonctions qui les recopiaient chez un client avec un calendrier d'ouverture.
 * Tout cela est parti : les objectifs appartiennent à un client et s'écrivent
 * à la main, il n'y a plus de référentiel commun à vérifier.
 *
 * Ne reste que le questionnaire, seule liste que l'outil pose encore d'avance,
 * parce qu'un profil vide ne demanderait rien à personne.
 */
describe("le jeu de départ", () => {
  let admin: SupabaseClient;

  beforeAll(async () => {
    admin = await connecterAdmin();
  });

  it("pose les questions du profil, actives et ordonnées", async () => {
    const { data, error } = await admin
      .from("question_profil")
      .select("libelle, type, ordre")
      .eq("active", true)
      .order("ordre");

    expect(error).toBeNull();
    // Le compte n'est pas figé ici : un coach a le droit d'ajouter ou de
    // retirer ses questions depuis les réglages, et ce test tourne contre sa
    // base. Ce qui doit tenir, c'est qu'il en reste au moins une et que la
    // porte du profil ait donc quelque chose à demander.
    expect((data ?? []).length).toBeGreaterThan(0);
    expect(data?.[0].ordre).toBe(1);
  });

  it("ne pose aucun objectif d'avance", async () => {
    // Délibéré, et c'est le coeur du changement : poser des objectifs à
    // l'installation reviendrait à imposer la méthode de l'éditeur à tous
    // ceux qui installent l'outil. Un objectif sans client n'existe pas.
    const { data, error } = await admin
      .from("objectif")
      .select("id, personne_id")
      .is("personne_id", null);

    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("pose au moins une offre active", async () => {
    // `creerLeCompteDuMembre` refuse une fiche sans accompagnement, et un
    // accompagnement demande une offre : sans offre, personne ne peut être
    // ajouté, et l'outil s'ouvre sur une impasse.
    const { data, error } = await admin
      .from("offre")
      .select("nom")
      .eq("active", true);

    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });
});
