// @vitest-environment node
//
// Environnement node et non jsdom, volontairement. Sous jsdom, `localStorage`
// existe et il est partagé par toutes les instances du client Supabase : les
// trois clients de ce fichier (admin, membre, anonyme) se retrouvent alors sur
// la session du dernier connecté, et chaque test vérifie le mauvais rôle sans
// que rien ne le signale. Sous node, chaque instance garde sa session pour
// elle. `persistSession: false` verrouille le comportement quel que soit
// l'environnement.

import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function client(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function connecter(
  email: string,
  motDePasse: string,
): Promise<SupabaseClient> {
  const c = client();
  const { error } = await c.auth.signInWithPassword({
    email,
    password: motDePasse,
  });
  if (error)
    throw new Error(`Connexion impossible pour ${email} : ${error.message}`);
  return c;
}

/**
 * Une lecture bloquée par les permissions renvoie une liste vide sans erreur.
 * Une requête cassée renvoie `data` à null, ce qui donnerait aussi une liste
 * vide via `data ?? []` : le test passerait alors sans rien prouver. On exige
 * donc explicitement l'absence d'erreur ET une liste vide.
 */
async function neVoitRien(
  requete: PromiseLike<{ data: unknown[] | null; error: unknown }>,
) {
  const { data, error } = await requete;
  expect(error).toBeNull();
  expect(data).toEqual([]);
}

describe("permissions par ligne", () => {
  let admin: SupabaseClient;
  let membre: SupabaseClient;
  let anonyme: SupabaseClient;

  beforeAll(async () => {
    admin = await connecter(
      process.env.TEST_ADMIN_EMAIL!,
      process.env.TEST_ADMIN_MOTDEPASSE!,
    );
    membre = await connecter(
      process.env.TEST_MEMBRE_EMAIL!,
      process.env.TEST_MEMBRE_MOTDEPASSE!,
    );
    anonyme = client();
  });

  it("un anonyme ne lit aucune personne", async () => {
    await neVoitRien(anonyme.from("personne").select("id"));
  });

  it("un admin lit les personnes", async () => {
    const { data, error } = await admin.from("personne").select("id");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("un membre ne lit que sa propre fiche", async () => {
    const { data, error } = await membre.from("personne").select("id, email");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].email).toBe(process.env.TEST_MEMBRE_EMAIL);
  });

  it("personne ne voit une ligne sans personne, membre compris", async () => {
    // Une ligne sans personne était lisible par tout membre connecté : c'est
    // ainsi qu'un coaching collectif atteignait tout le monde d'un coup. La
    // migration 0032 a fermé cette clause, les collectifs vivant désormais sur
    // Circle, et ce test dit maintenant l'inverse de ce qu'il disait : plus
    // personne ne doit voir cette ligne, ni l'anonyme, ni le membre.
    //
    // La garantie est plus forte qu'avant, et c'est le point. La clause
    // `personne_id is null` était vraie aussi pour un visiteur non connecté :
    // c'est le trou que la migration 0007 avait trouvé sur `rendez_vous`, que
    // la 0029 avait réécrit mot pour mot en fusionnant les deux tables, et
    // qu'il fallait refermer une troisième fois à chaque réécriture de la vue.
    // Il n'y a plus de clause à refermer.
    // Un titre horodaté, et non « Coaching collectif du mardi » : un
    // collectif n'appartient à personne, donc rien ne le rattache au test qui
    // l'a créé. Trois exécutions ratées en ont laissé trois en base, et ils
    // apparaissaient dans l'espace de tous les membres, démonstration
    // comprise. Un titre daté les rend reconnaissables au premier coup d'oeil.
    const titre = `Collectif de test ${Date.now()}`;

    const { data: cree, error } = await admin
      .from("appel")
      .insert({
        personne_id: null,
        titre,
        portee: "collectif",
        nature: "coaching",
        prevu_le: "2026-09-01T18:00:00Z",
        lien_visio: "https://exemple.fr/lien-prive",
      })
      .select()
      .single();
    expect(error).toBeNull();

    try {
      // Un refus net, et non une liste vide : le droit de lire la vue a été
      // retiré au rôle anonyme (migration 0029), donc la requête n'atteint
      // même pas le filtre. C'est plus fort que ce qu'on demandait.
      const vuAnonyme = await anonyme
        .from("coaching_membre")
        .select("titre, lien_visio")
        .eq("id", cree!.id);
      expect(vuAnonyme.error).not.toBeNull();

      // Et pas davantage la table elle-même, qui reste fermée au membre comme
      // à l'anonyme : la vue n'est pas un détour qu'on pourrait éviter.
      await neVoitRien(
        anonyme.from("appel").select("titre").eq("id", cree!.id),
      );
      await neVoitRien(membre.from("appel").select("titre").eq("id", cree!.id));

      // Et le membre non plus, désormais. La vue ne rend que ses propres
      // séances : une ligne sans personne n'est celle de personne. Filtré sur
      // la ligne créée, pas sur la table entière, le membre de démonstration
      // laissant ses propres coachings en base.
      //
      // Pas d'erreur mais zéro ligne, et la nuance compte : le membre a bien
      // le droit de lire la vue, c'est son contenu qui ne le concerne pas.
      const vuMembre = await membre
        .from("coaching_membre")
        .select("titre")
        .eq("id", cree!.id);
      expect(vuMembre.error).toBeNull();
      expect(vuMembre.data).toHaveLength(0);
    } finally {
      // Dans un finally : une assertion qui échoue plus haut laisserait sinon
      // ce collectif dans l'espace de tous les membres.
      await admin.from("appel").delete().eq("id", cree!.id);
    }
  });

  it("un membre coche son étape mais ne peut pas la réécrire", async () => {
    const { data: fiche } = await membre.from("personne").select("id").single();

    let objectifId: string | undefined;

    try {
      // Le coach pose l'objectif et son étape, comme dans la vraie vie.
      const { data: objectif, error: erreurObjectif } = await admin
        .from("objectif")
        .insert({ personne_id: fiche!.id, titre: "Poser ton offre", ordre: 90 })
        .select("id")
        .single();
      expect(erreurObjectif).toBeNull();
      objectifId = objectif!.id as string;

      const { data: creee, error: erreurCreation } = await admin
        .from("tache")
        .insert({ objectif_id: objectifId, titre: "Écrire les trois forfaits", ordre: 1 })
        .select("id")
        .single();
      expect(erreurCreation).toBeNull();

      // Le membre coche : autorisé.
      const coche = await membre
        .from("tache")
        .update({ faite: true, faite_le: new Date().toISOString() })
        .eq("id", creee!.id)
        .select("id");
      expect(coche.error).toBeNull();
      // Le compte des lignes touchées, et pas seulement l'absence d'erreur :
      // une mise à jour qu'aucune politique n'autorise ne lève rien, elle
      // ne touche simplement aucune ligne. Sans ce select, ce test resterait
      // vert le jour où le membre perdrait le droit de cocher.
      expect(coche.data).toHaveLength(1);

      // Le membre réécrit le titre : refusé par le déclencheur.
      const reecriture = await membre
        .from("tache")
        .update({ titre: "Autre chose" })
        .eq("id", creee!.id);
      expect(reecriture.error).not.toBeNull();
    } finally {
      // Dans un bloc finally : une assertion qui échoue plus haut ne doit pas
      // laisser traîner l'objectif dans l'espace du compte que partagent tous
      // les tests de ce fichier. Ses étapes partent en cascade avec lui.
      if (objectifId) await admin.from("objectif").delete().eq("id", objectifId);
    }
  });

  it("un membre ne peut ni créer un objectif, ni créer une étape", async () => {
    // Avec de vraies clés étrangères : sinon l'insertion échouerait sur la
    // contrainte de référence et le test passerait sans rien prouver de la
    // permission.
    const { data: fiche } = await membre.from("personne").select("id").single();

    const objectif = await membre
      .from("objectif")
      .insert({ personne_id: fiche!.id, titre: "Interdit", ordre: 91 });
    expect(objectif.error).not.toBeNull();

    let objectifId: string | undefined;
    try {
      const { data: pose } = await admin
        .from("objectif")
        .insert({ personne_id: fiche!.id, titre: "Posé par le coach", ordre: 92 })
        .select("id")
        .single();
      objectifId = pose!.id as string;

      const tache = await membre
        .from("tache")
        .insert({ objectif_id: objectifId, titre: "Interdit", ordre: 1 });
      expect(tache.error).not.toBeNull();
    } finally {
      if (objectifId) await admin.from("objectif").delete().eq("id", objectifId);
    }
  });

  it("un anonyme ne voit aucun objectif", async () => {
    await neVoitRien(anonyme.from("objectif").select("titre"));
  });

  it("un membre ne lit que ses propres objectifs, et les étapes qui vont avec", async () => {
    // Une fiche qui n'est pas la sienne, avec un objectif et une étape.
    const { data: autre } = await admin
      .from("personne")
      .insert({ nom: `Objectifs ${Date.now()}` })
      .select("id")
      .single();

    try {
      const { data: objectif } = await admin
        .from("objectif")
        .insert({ personne_id: autre!.id, titre: "Chez quelqu'un d'autre", ordre: 1 })
        .select("id")
        .single();

      await admin
        .from("tache")
        .insert({ objectif_id: objectif!.id, titre: "Étape d'un autre", ordre: 1 });

      const { data: objectifsVus } = await membre.from("objectif").select("personne_id");
      expect(objectifsVus?.some((ligne) => ligne.personne_id === autre!.id)).toBe(false);

      // Et les étapes aussi : leur politique passe par une jointure sur
      // l'objectif, elle pourrait tomber sans que celle des objectifs bouge.
      const { data: tachesVues } = await membre
        .from("tache")
        .select("id, objectif_id")
        .eq("objectif_id", objectif!.id);
      expect(tachesVues ?? []).toHaveLength(0);
    } finally {
      // Dans un bloc finally : une assertion qui échoue ne doit pas laisser
      // une fausse fiche cliente dans la base, à côté des vraies.
      await admin.from("personne").delete().eq("id", autre!.id);
    }
  });
});
