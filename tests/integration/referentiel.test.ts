// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { calendrierPropose } from "@/lib/pilier/etat";

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

describe("le référentiel", () => {
  let admin: SupabaseClient;

  beforeAll(async () => {
    admin = await connecterAdmin();
  });

  it("compte cinq piliers, du 0 au 4", async () => {
    const { data } = await admin.from("pilier").select("numero, nom").order("ordre");

    expect(data?.map((p) => p.numero)).toEqual([0, 1, 2, 3, 4]);
    expect(data?.[0].nom).toBe("Clarté");
  });

  it("pose dix questions de profil actives", async () => {
    const { data } = await admin
      .from("question_profil")
      .select("libelle, type, ordre")
      .eq("active", true)
      .order("ordre");

    expect(data).toHaveLength(10);
    expect(data?.[0].libelle).toContain("12 derniers mois");
    expect(data?.[8].type).toBe("choix");
  });

  it("pose quarante-six tâches modèles, réparties sur quatre piliers", async () => {
    const { data } = await admin
      .from("tache_modele")
      .select("groupe, pilier:pilier_id (numero)");

    const parPilier = new Map<number, number>();
    for (const ligne of data ?? []) {
      // Supabase renvoie une jointure comme un tableau même quand elle ne
      // porte qu'une ligne.
      const jointure = ligne.pilier as unknown;
      const pilier = Array.isArray(jointure) ? jointure[0] : jointure;
      const numero = (pilier as { numero: number }).numero;
      parPilier.set(numero, (parPilier.get(numero) ?? 0) + 1);
    }

    // Le jeu de départ : trois tâches par partie, quatre parties. Ces
    // chiffres bougeront dès qu'un coach écrira son propre parcours depuis
    // ses réglages, et c'est bien pour ça que ce test vit ici et pas chez
    // lui : il éprouve le jeu livré, pas le sien.
    expect(data).toHaveLength(12);
    for (const numero of [1, 2, 3, 4]) {
      expect(parPilier.get(numero)).toBe(3);
    }
  });

  it("range chaque tâche sous une section", async () => {
    const { data } = await admin.from("tache_modele").select("titre, groupe");

    expect(data?.filter((t) => !t.groupe)).toEqual([]);
  });
});

describe("les gestes de mise en service", () => {
  let admin: SupabaseClient;
  let personneId: string | undefined;

  beforeAll(async () => {
    admin = await connecterAdmin();
    const { data } = await admin
      .from("personne")
      .insert({ nom: `Jetable ${Date.now()}` })
      .select("id")
      .single();
    personneId = data!.id as string;
  });

  afterAll(async () => {
    // personneId reste indéfini si le beforeAll échoue après la connexion
    // mais avant la création de la fiche : sans ce garde, ce afterAll
    // lèverait sa propre erreur sur un filtre sans valeur, et masquerait la
    // vraie cause de l'échec derrière un second échec sans rapport.
    if (personneId) await admin.from("personne").delete().eq("id", personneId);
  });

  it("pose le calendrier en ramenant au dernier jour du mois", async () => {
    // Non-null : si le beforeAll avait échoué avant de poser la fiche, ce
    // test ne serait jamais atteint, vitest le marque en échec avant.
    await admin.rpc("planifier_piliers", {
      p_personne: personneId!,
      p_demarrage: "2026-01-31",
    });

    const { data } = await admin
      .from("acces_pilier")
      .select("date_ouverture, pilier:pilier_id (numero)")
      .eq("personne_id", personneId!);

    const parNumero = new Map<number, string>();
    for (const ligne of data ?? []) {
      const jointure = ligne.pilier as unknown;
      const pilier = Array.isArray(jointure) ? jointure[0] : jointure;
      parNumero.set((pilier as { numero: number }).numero, ligne.date_ouverture as string);
    }

    // L'ancre absolue : PostgreSQL ramène au dernier jour du mois quand le
    // jour n'existe pas. Le 31 janvier plus un mois donne le 28 février.
    expect(parNumero.get(1)).toBe("2026-01-31");
    expect(parNumero.get(2)).toBe("2026-02-28");
    expect(parNumero.get(3)).toBe("2026-03-31");
    expect(parNumero.get(4)).toBe("2026-04-30");
    // Et le couplage : la base et l'écran calculent ces dates chacun de leur
    // côté, en SQL ici et en TypeScript dans calendrierPropose. Comparer les
    // deux aux mêmes littéraux ne suffit pas : le jour où l'un des deux
    // dérive, ce test doit rougir, sinon l'écran promet au membre une date
    // que la base ne pose pas.
    const attendu = new Map(
      calendrierPropose("2026-01-31").map((l) => [l.numero, l.date]),
    );
    for (const numero of [1, 2, 3, 4]) {
      expect(parNumero.get(numero)).toBe(attendu.get(numero));
    }
  });

  it("copie le parcours, et le relancer n'ajoute rien", async () => {
    const premiere = await admin.rpc("appliquer_parcours_modele", {
      p_personne: personneId!,
    });
    const seconde = await admin.rpc("appliquer_parcours_modele", {
      p_personne: personneId!,
    });

    expect(premiere.data).toBe(46);
    expect(seconde.data).toBe(0);
  });
});
