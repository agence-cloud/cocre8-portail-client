// @vitest-environment node
//
// Environnement node comme permissions.test.ts, et pour la même raison : sous
// jsdom, les clients admin et membre partageraient un localStorage et se
// retrouveraient sur la session du dernier connecté, chaque test vérifiant
// alors le mauvais rôle sans que rien ne le signale.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
 * Ce que la migration 0027 ouvre, et surtout ce qu'elle laisse fermé.
 *
 * Trois refus distincts, et non trois façons de dire le même : lire l'appel
 * d'un autre, lire ses propres appels de vente, et lire la note interne du
 * coach sur un coaching auquel on a pourtant droit. Chacun tombe si une
 * clause différente saute.
 */
describe("les coachings que le membre peut lire", () => {
  let admin: SupabaseClient;
  let membre: SupabaseClient;
  let personneDuMembre: string;
  let autrePersonne: string;
  const appels: string[] = [];
  const fiches: string[] = [];

  beforeAll(async () => {
    admin = await connecter(process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_MOTDEPASSE!);
    membre = await connecter(process.env.TEST_MEMBRE_EMAIL!, process.env.TEST_MEMBRE_MOTDEPASSE!);

    // La fiche du membre de test, telle que sa propre session la voit : c'est
    // exactement ce que `ma_personne()` renverra côté base.
    const { data: sienne } = await membre.from("personne").select("id").single();
    personneDuMembre = sienne!.id;

    const { data: autre } = await admin
      .from("personne")
      .insert({ nom: `Coaching ${Date.now()}` })
      .select("id")
      .single();
    autrePersonne = autre!.id;
    fiches.push(autre!.id);
  });

  afterAll(async () => {
    for (const id of appels) await admin.from("appel").delete().eq("id", id);
    for (const id of fiches) await admin.from("personne").delete().eq("id", id);
  });

  async function creerAppel(
    personneId: string,
    nature: "coaching" | "prospection",
    complement: Record<string, unknown> = {},
  ): Promise<string> {
    const { data, error } = await admin
      .from("appel")
      .insert({
        personne_id: personneId,
        prevu_le: new Date("2026-08-01T10:00:00Z").toISOString(),
        issue: "honore",
        nature,
        ...complement,
      })
      .select("id")
      .single();
    if (error) throw new Error(`Appel non créé : ${error.message}`);
    appels.push(data!.id);
    return data!.id;
  }

  it("lit son propre coaching", async () => {
    const id = await creerAppel(personneDuMembre, "coaching", {
      resume: "On a posé ton offre.",
      transcription: "Bonjour.",
    });

    const { data, error } = await membre
      .from("coaching_membre")
      .select("id, resume, transcription")
      .eq("id", id);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].resume).toBe("On a posé ton offre.");
  });

  it("ne lit pas ses propres appels de vente", async () => {
    // Le cas qui compte le plus : un client a été prospect avant de signer, et
    // le coach a noté ce qu'il pensait de lui pendant qu'il hésitait. Sans la
    // clause sur la nature, la clause sur la personne suffirait à les ouvrir.
    const id = await creerAppel(personneDuMembre, "prospection", {
      notes: "Il hésite, relancer lundi.",
    });

    const { data, error } = await membre.from("coaching_membre").select("id").eq("id", id);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("ne lit pas le coaching de quelqu'un d'autre", async () => {
    const id = await creerAppel(autrePersonne, "coaching");

    const { data, error } = await membre.from("coaching_membre").select("id").eq("id", id);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("ne peut rien écrire à travers la vue, ni corriger ni effacer ni ajouter", async () => {
    // LA FAILLE QUE CE TEST GARDE FERMÉE, et elle a été exploitée pour de
    // vrai avant d'être corrigée par la migration 0030.
    //
    // La vue s'exécute avec les droits de son propriétaire, ce qui lui permet
    // de lire `appel` alors que le membre ne le peut pas. Mais Supabase pose
    // des privilèges par défaut sur le schéma `public` : toute vue nouvelle y
    // reçoit INSERT, UPDATE et DELETE pour `authenticated`. Une vue simple
    // sur une seule table étant modifiable, le membre écrivait donc dans
    // `appel` avec les droits du propriétaire, sans qu'aucune politique ne
    // s'applique.
    //
    // Accorder SELECT ne suffit pas sur ce schéma. Il faut révoquer.
    const id = await creerAppel(personneDuMembre, "coaching", { resume: "AVANT" });

    const { error: erreurMaj } = await membre
      .from("coaching_membre")
      .update({ resume: "réécrit par le membre" })
      .eq("id", id);
    expect(erreurMaj).not.toBeNull();

    const { error: erreurSuppression } = await membre
      .from("coaching_membre")
      .delete()
      .eq("id", id);
    expect(erreurSuppression).not.toBeNull();

    const { error: erreurInsertion } = await membre.from("coaching_membre").insert({
      personne_id: personneDuMembre,
      prevu_le: new Date("2026-08-02T10:00:00Z").toISOString(),
      issue: "honore",
      titre: "Injecté",
    });
    expect(erreurInsertion).not.toBeNull();

    // Et la ligne n'a pas bougé : un refus qui laisserait passer l'écriture
    // en silence ne vaudrait rien.
    const { data: apres } = await admin.from("appel").select("resume").eq("id", id).single();
    expect(apres!.resume).toBe("AVANT");
  });

  it("ne voit jamais la note interne, même sur son propre coaching", async () => {
    // La politique donne la ligne entière : c'est la vue qui retire la note,
    // en ne la sélectionnant pas. Demander la colonne doit échouer, pas
    // renvoyer null, sinon on ne saurait pas si elle est absente ou vide.
    const id = await creerAppel(personneDuMembre, "coaching", {
      notes: "À ne jamais lui montrer.",
    });

    const { error } = await membre.from("coaching_membre").select("notes").eq("id", id);
    expect(error).not.toBeNull();

    // Et la table elle-même reste fermée : la vue n'est pas un contournement
    // qu'on pourrait éviter en s'adressant directement à la source.
    const { data, error: erreurTable } = await membre.from("appel").select("id").eq("id", id);
    expect(erreurTable).toBeNull();
    expect(data).toEqual([]);
  });
});
