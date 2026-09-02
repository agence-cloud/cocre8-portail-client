// @vitest-environment node
//
// Environnement node et non jsdom : sous jsdom, localStorage est partagé par
// toutes les instances du client Supabase, et les sessions se mélangent.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function client(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

describe("les permissions du portail", () => {
  let admin: SupabaseClient;
  let membre: SupabaseClient;
  let personneId: string;
  let objectifId: string;
  let tacheId: string;
  const documentsCrees: string[] = [];
  const cheminsCrees: string[] = [];

  beforeAll(async () => {
    admin = client();
    const connexionAdmin = await admin.auth.signInWithPassword({
      email: process.env.TEST_ADMIN_EMAIL!,
      password: process.env.TEST_ADMIN_MOTDEPASSE!,
    });
    if (connexionAdmin.error) {
      throw new Error(`Connexion admin impossible : ${connexionAdmin.error.message}`);
    }

    membre = client();
    const connexionMembre = await membre.auth.signInWithPassword({
      email: process.env.TEST_MEMBRE_EMAIL!,
      password: process.env.TEST_MEMBRE_MOTDEPASSE!,
    });
    if (connexionMembre.error) {
      throw new Error(`Connexion membre impossible : ${connexionMembre.error.message}`);
    }

    const { data: compte } = await membre
      .from("compte")
      .select("personne_id")
      .single();
    personneId = compte!.personne_id as string;

    // Un objectif à soi, posé par le coach : les objectifs appartiennent
    // désormais à un client, il n'y a plus de référentiel commun où piocher.
    const { data: objectif } = await admin
      .from("objectif")
      .insert({ personne_id: personneId, titre: "Objectif de test", ordre: 99 })
      .select("id")
      .single();
    objectifId = objectif!.id as string;

    const { data: tache } = await admin
      .from("tache")
      .insert({ objectif_id: objectifId, titre: "Étape visible", ordre: 1 })
      .select("id")
      .single();
    tacheId = tache!.id as string;
  });

  afterAll(async () => {
    // Seulement l'objectif posé ci-dessus, pas tous ceux du compte :
    // permissions.test.ts en pose aussi pour ce même compte de test, et un
    // delete() sans filtre effacerait le sien si les deux fichiers se
    // croisent. Ses étapes partent en cascade avec lui.
    if (objectifId) await admin.from("objectif").delete().eq("id", objectifId);
    for (const id of documentsCrees) await admin.from("document").delete().eq("id", id);
    if (cheminsCrees.length > 0) await admin.storage.from("documents").remove(cheminsCrees);
  });

  it("laisse le membre lire son objectif et ses étapes", async () => {
    const { data } = await membre
      .from("tache")
      .select("titre")
      .eq("objectif_id", objectifId);

    expect(data?.map((t) => t.titre)).toContain("Étape visible");
  });

  it("cache au membre les objectifs de quelqu'un d'autre", async () => {
    // Le calendrier des parties tenait ce rôle auparavant : une tâche n'était
    // lisible que si sa partie était ouverte. Il n'y a plus de calendrier,
    // donc la seule frontière qui reste est celle du propriétaire, et c'est
    // elle qu'il faut éprouver.
    const { data: autre } = await admin
      .from("personne")
      .insert({ nom: `Cloison ${Date.now()}` })
      .select("id")
      .single();

    try {
      const { data: sien } = await admin
        .from("objectif")
        .insert({ personne_id: autre!.id, titre: "Objectif d'un autre", ordre: 1 })
        .select("id")
        .single();
      await admin
        .from("tache")
        .insert({ objectif_id: sien!.id, titre: "Étape d'un autre", ordre: 1 });

      const { data: objectifs } = await membre.from("objectif").select("titre");
      expect(objectifs?.map((o) => o.titre)).not.toContain("Objectif d'un autre");

      const { data: taches } = await membre
        .from("tache")
        .select("titre")
        .eq("objectif_id", sien!.id);
      expect(taches).toEqual([]);
    } finally {
      await admin.from("personne").delete().eq("id", autre!.id);
    }
  });

  it("laisse le membre cocher son étape", async () => {
    const { data } = await membre
      .from("tache")
      .update({ faite: true, faite_le: new Date().toISOString() })
      .eq("id", tacheId)
      .select("id");

    // Une mise à jour qu'aucune politique n'autorise ne lève pas d'erreur :
    // elle ne touche simplement aucune ligne. Vérifier le compte est la
    // seule façon de distinguer un refus d'un succès.
    expect(data?.length).toBe(1);
  });

  it("refuse au membre de créer une étape", async () => {
    const { error } = await membre.from("tache").insert({
      objectif_id: objectifId,
      titre: "Étape que je m'invente",
      ordre: 99,
    });

    expect(error).not.toBeNull();
  });

  it("refuse au membre de renommer une de ses étapes", async () => {
    const { error } = await membre
      .from("tache")
      .update({ titre: "Titre réécrit" })
      .eq("id", tacheId);

    expect(error?.message).toContain("pas les modifier");
  });

  it("cache au membre les documents et les fichiers non visibles", async () => {
    const contenu = new Blob(["contenu de test"], { type: "text/plain" });
    const cheminInterne = `${personneId}/interne.txt`;
    const cheminVisible = `${personneId}/plan.txt`;

    await admin.storage.from("documents").upload(cheminInterne, contenu, { upsert: true });
    await admin.storage.from("documents").upload(cheminVisible, contenu, { upsert: true });
    cheminsCrees.push(cheminInterne, cheminVisible);

    const { data } = await admin
      .from("document")
      .insert([
        {
          personne_id: personneId,
          nom: "Note interne.txt",
          chemin_storage: cheminInterne,
          visible_membre: false,
        },
        {
          personne_id: personneId,
          nom: "Ton plan.txt",
          chemin_storage: cheminVisible,
          visible_membre: true,
        },
      ])
      .select("id");
    documentsCrees.push(...(data ?? []).map((d) => d.id as string));

    // La ligne interne ne remonte pas.
    const { data: vus } = await membre.from("document").select("nom");
    expect(vus?.map((d) => d.nom)).toEqual(["Ton plan.txt"]);

    // Et le fichier lui-même reste hors de portée, même en connaissant son chemin.
    const signatureInterne = await membre.storage
      .from("documents")
      .createSignedUrl(cheminInterne, 60);
    expect(signatureInterne.error).not.toBeNull();

    const signatureVisible = await membre.storage
      .from("documents")
      .createSignedUrl(cheminVisible, 60);
    expect(signatureVisible.data?.signedUrl).toBeTruthy();
  });

  it("refuse au membre une adresse signée pour un fichier posé sans ligne document", async () => {
    const contenu = new Blob(["contenu de test"], { type: "text/plain" });
    const cheminOrphelin = `${personneId}/orphelin.txt`;

    await admin.storage.from("documents").upload(cheminOrphelin, contenu, { upsert: true });
    cheminsCrees.push(cheminOrphelin);

    // Le dossier appartient bien au membre, mais aucune ligne `document` ne
    // couvre ce fichier : c'est la branche où un repli permissif (un
    // dossier seul, sans `exists` sur la table) passerait inaperçu.
    const signature = await membre.storage
      .from("documents")
      .createSignedUrl(cheminOrphelin, 60);
    expect(signature.error).not.toBeNull();
  });

  it("refuse au membre de téléverser un fichier dans le dossier d'une autre personne", async () => {
    // Aucun test n'exerçait `membre_depose_dans_son_dossier` avant celui-ci :
    // tous les téléversements du fichier passaient par le client admin, qui
    // n'est soumis à aucune politique. On pourrait supprimer cette politique
    // sans faire rougir un seul test.
    const dossierAutrui = "00000000-0000-0000-0000-000000000000";
    const contenu = new Blob(["contenu de test"], { type: "text/plain" });
    const chemin = `${dossierAutrui}/intrusion.txt`;

    try {
      const { error } = await membre.storage.from("documents").upload(chemin, contenu);
      expect(error).not.toBeNull();
    } finally {
      // Si la politique a une faille, le fichier existe malgré le refus
      // attendu : on le retire pour ne rien laisser traîner dans le coffre.
      await admin.storage.from("documents").remove([chemin]);
    }
  });

  it("refuse au membre de créer une ligne document dont le chemin désigne le dossier d'une autre personne", async () => {
    // La preuve que le 0024 ferme la faille du défaut 1 : avant cette
    // migration, cette ligne s'insérait avec le personne_id du membre
    // connecté et la politique de lecture du coffre s'ouvrait sur le
    // fichier visé, sans qu'aucun admin n'ait rien approuvé ni que le
    // membre n'ait eu besoin de passer par l'app.
    const dossierAutrui = "00000000-0000-0000-0000-000000000000";
    const cheminIntrus = `${dossierAutrui}/plan.txt`;
    let idCree: string | undefined;

    try {
      const { data, error } = await membre
        .from("document")
        .insert({
          personne_id: personneId,
          nom: "Intrusion.txt",
          chemin_storage: cheminIntrus,
          visible_membre: true,
        })
        .select("id")
        .maybeSingle();
      idCree = data?.id as string | undefined;
      expect(error).not.toBeNull();
    } finally {
      if (idCree) await admin.from("document").delete().eq("id", idCree);
    }
  });
});
