// @vitest-environment node
//
// Environnement node et non jsdom : sous jsdom, `localStorage` est partagé
// par toutes les instances du client Supabase, et les deux clients de ce
// fichier se retrouveraient sur la même session.

import { describe, it, expect } from "vitest";
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
 * La porte de la première mise en service.
 *
 * Ce test tourne contre une base déjà installée, ce qui est le cas de toutes
 * les bases sauf pendant leurs premières minutes. Il éprouve donc la porte
 * fermée, qui est l'état qui compte : une porte d'installation restée ouverte
 * sur une app en service laisse n'importe qui se créer un compte de coach.
 */
describe("la première mise en service", () => {
  it("se dit faite, à qui pose la question sans être connecté", async () => {
    // Le témoin positif de tout le reste. Sans lui, une fonction qui aurait
    // cessé de répondre laisserait les assertions suivantes vertes, et
    // l'écran d'installation se rouvrirait sans que rien ne le dise.
    const anonyme = client();
    const { data, error } = await anonyme.rpc("installation_faite");

    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it("ne laisse personne lire la table, connecté ou non", async () => {
    // Aucune politique sur cette table, et tout droit révoqué : ni le coach
    // ni son client n'ont à savoir quand l'outil a été mis en service, et
    // surtout personne n'a à pouvoir vider la ligne qui tient la porte
    // fermée.
    const anonyme = client();
    const coach = await connecter(
      process.env.TEST_ADMIN_EMAIL!,
      process.env.TEST_ADMIN_MOTDEPASSE!,
    );
    const cliente = await connecter(
      process.env.TEST_MEMBRE_EMAIL!,
      process.env.TEST_MEMBRE_MOTDEPASSE!,
    );

    for (const [qui, c] of [
      ["un anonyme", anonyme],
      ["le coach", coach],
      ["une cliente", cliente],
    ] as const) {
      const { data, error } = await c.from("installation").select("faite_le");
      expect(error, `${qui} lit la table installation`).not.toBeNull();
      expect(data).toBeNull();
    }
  });

  it("ne laisse pas un client rouvrir la porte en effaçant la ligne", async () => {
    // La tentative complète, et pas seulement la lecture : une suppression
    // qui passerait rendrait l'écran d'installation de nouveau accessible sur
    // une app en service.
    const cliente = await connecter(
      process.env.TEST_MEMBRE_EMAIL!,
      process.env.TEST_MEMBRE_MOTDEPASSE!,
    );

    const { error } = await cliente.from("installation").delete().eq("id", true);
    expect(error).not.toBeNull();

    const anonyme = client();
    const { data } = await anonyme.rpc("installation_faite");
    expect(data, "la porte s'est rouverte").toBe(true);
  });
});
