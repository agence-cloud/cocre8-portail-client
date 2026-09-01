// @vitest-environment node
//
// Environnement node et non jsdom : sous jsdom, `localStorage` est partagé
// par toutes les instances du client Supabase, et les trois clients de ce
// fichier se retrouveraient sur la session du dernier connecté.

import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function client(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function connecter(email: string, motDePasse: string): Promise<SupabaseClient> {
  const c = client();
  const { error } = await c.auth.signInWithPassword({ email, password: motDePasse });
  if (error) throw new Error(`Connexion impossible pour ${email} : ${error.message}`);
  return c;
}

/**
 * Les réglages : lus par tous les comptes, écrits par le coach seul.
 *
 * Le témoin positif compte autant que l'interdit. Sans lui, une table devenue
 * illisible pour tout le monde laisserait les assertions de refus vertes,
 * pendant que l'espace de chaque client afficherait des valeurs par défaut
 * sans que rien ne le signale.
 */
describe("les réglages", () => {
  let coach: SupabaseClient;
  let cliente: SupabaseClient;
  const anonyme = client();

  beforeAll(async () => {
    coach = await connecter(
      process.env.TEST_ADMIN_EMAIL!,
      process.env.TEST_ADMIN_MOTDEPASSE!,
    );
    cliente = await connecter(
      process.env.TEST_MEMBRE_EMAIL!,
      process.env.TEST_MEMBRE_MOTDEPASSE!,
    );
  });

  it("se laisse lire par une cliente connectée", async () => {
    const { error } = await cliente.from("reglage").select("cle");
    expect(error).toBeNull();
  });

  it("ne se laisse pas lire sans compte", async () => {
    // La table porte le nom et le numéro du coach, qui ne regardent que ses
    // clients. C'est pour ça que le nom du programme, lui, passe par une
    // fonction à part : l'écran de connexion l'affiche avant toute session.
    // Un refus franc, et non une liste vide : le droit est retiré au niveau
    // de la table, pas seulement par une politique. Attendre une liste vide
    // laisserait le test vert le jour où la table redeviendrait lisible mais
    // sans ligne à montrer.
    const { data, error } = await anonyme.from("reglage").select("cle");

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("ne se laisse pas écrire par une cliente", async () => {
    const { error } = await cliente
      .from("reglage")
      .upsert({ cle: "coach_telephone", valeur: "0600000000" }, { onConflict: "cle" });

    expect(error).not.toBeNull();
  });

  it("se laisse écrire par le coach, et se relit", async () => {
    // Le témoin positif, et l'aller-retour complet : une politique d'écriture
    // qui refuserait tout le monde passerait le test du dessus sans qu'on
    // s'aperçoive que l'écran des réglages ne sert plus à rien.
    const temoin = `Programme ${Date.now()}`;

    try {
      const { error } = await coach
        .from("reglage")
        .upsert({ cle: "nom_programme", valeur: temoin }, { onConflict: "cle" });
      expect(error).toBeNull();

      const { data } = await coach
        .from("reglage")
        .select("valeur")
        .eq("cle", "nom_programme")
        .single();
      expect(data?.valeur).toBe(temoin);

      // Et la fonction publique dit la même chose : c'est elle que l'écran de
      // connexion interroge, et deux sources qui divergent afficheraient deux
      // noms différents dans la même app.
      const { data: nomPublic } = await anonyme.rpc("nom_du_programme");
      expect(nomPublic).toBe(temoin);
    } finally {
      await coach.from("reglage").delete().eq("cle", "nom_programme");
    }
  });

  it("rend le nom par défaut quand rien n'est réglé", async () => {
    // Une base neuve n'a aucune ligne : l'écran de connexion doit afficher un
    // nom, pas un trou.
    const { data: avant } = await coach
      .from("reglage")
      .select("valeur")
      .eq("cle", "nom_programme")
      .maybeSingle();

    if (avant) return;

    const { data } = await anonyme.rpc("nom_du_programme");
    expect(data).toBe("Espace Client");
  });
});
