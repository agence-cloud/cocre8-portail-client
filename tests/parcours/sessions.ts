import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Une session ouverte une fois, partagée par tous les parcours.
 *
 * **Pourquoi.** Chaque test se connectait par le formulaire, donc chaque test
 * demandait un jeton à Supabase : vingt-cinq connexions en trois minutes. Le
 * 2026-09-01, une exécution sur trois voyait trois parcours tomber, tous
 * passants seuls. C'est le défaut que `workers: 1` avait déjà réduit une fois,
 * et que deux fichiers de parcours de plus ont ramené.
 *
 * Deux connexions suffisent désormais pour toute la suite.
 *
 * **Ce qui ne partage pas.** `connexion.spec.ts` continue de se connecter à
 * la main, évidemment : c'est la connexion qu'il éprouve. Les parcours qui
 * ouvrent deux fenêtres à la fois, un coach et un membre, gardent aussi leur
 * geste explicite.
 */

const DOSSIER = join(tmpdir(), "portail-client-sessions");

export const SESSION_ADMIN = join(DOSSIER, "admin.json");
export const SESSION_MEMBRE = join(DOSSIER, "membre.json");

async function ouvrir(
  base: string,
  email: string,
  motDePasse: string,
  vers: RegExp,
  fichier: string,
): Promise<void> {
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ baseURL: base });

  try {
    await page.goto("/connexion");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill(motDePasse);
    await page.getByRole("button", { name: "Entrer dans mon espace" }).click();
    // Attendre l'atterrissage, sinon l'état serait enregistré avant que les
    // cookies de session ne soient posés, et tous les parcours partiraient
    // déconnectés sans qu'on comprenne pourquoi.
    await page.waitForURL(vers, { timeout: 30000 });
    await page.context().storageState({ path: fichier });
  } finally {
    await navigateur.close();
  }
}

/** Ouvre les deux sessions et les écrit sur le disque. */
export async function ouvrirLesSessions(base: string): Promise<void> {
  mkdirSync(DOSSIER, { recursive: true });

  await ouvrir(
    base,
    process.env.TEST_ADMIN_EMAIL!,
    process.env.TEST_ADMIN_MOTDEPASSE!,
    /\/pilotage/,
    SESSION_ADMIN,
  );

  await ouvrir(
    base,
    process.env.TEST_MEMBRE_EMAIL!,
    process.env.TEST_MEMBRE_MOTDEPASSE!,
    /\/espace/,
    SESSION_MEMBRE,
  );
}
