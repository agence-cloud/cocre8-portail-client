import { test, expect } from "@playwright/test";

test("un visiteur non connecté est renvoyé vers la connexion", async ({ page }) => {
  await page.goto("/pilotage");
  await expect(page).toHaveURL(/\/connexion/);
});

test("un mauvais mot de passe affiche une erreur sans révéler la cause", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill("inconnu@exemple.fr");
  await page.getByLabel("Mot de passe").fill("faux");
  await page.getByRole("button", { name: "Entrer dans mon espace" }).click();
  // Cibler le message et pas seulement le rôle : Next injecte dans chaque page
  // un annonceur de navigation qui porte lui aussi role="alert".
  const erreur = page
    .getByRole("alert")
    .filter({ hasText: "Email ou mot de passe" });

  // Message strictement générique : dire lequel des deux est faux révélerait
  // quels emails existent en base.
  await expect(erreur).toHaveText("Email ou mot de passe incorrect.");
});

test("un admin atterrit sur le pilotage", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill(process.env.TEST_ADMIN_EMAIL!);
  await page.getByLabel("Mot de passe").fill(process.env.TEST_ADMIN_MOTDEPASSE!);
  await page.getByRole("button", { name: "Entrer dans mon espace" }).click();
  await expect(page).toHaveURL(/\/pilotage/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("CRM");
});

test("un membre atterrit sur son espace et ne peut pas ouvrir le pilotage", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill(process.env.TEST_MEMBRE_EMAIL!);
  await page.getByLabel("Mot de passe").fill(process.env.TEST_MEMBRE_MOTDEPASSE!);
  await page.getByRole("button", { name: "Entrer dans mon espace" }).click();
  await expect(page).toHaveURL(/\/espace/);

  await page.goto("/pilotage");
  await expect(page).toHaveURL(/\/espace/);
});
