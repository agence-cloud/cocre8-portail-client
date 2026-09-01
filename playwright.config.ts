import { defineConfig } from "@playwright/test";
import { config as chargerEnv } from "dotenv";

chargerEnv({ path: ".env.local" });

// Le port se surcharge par la variable PORT, pour le cas où 3000 est déjà pris.
const PORT = process.env.PORT ?? "3000";

// Et l'adresse entière se surcharge par URL_A_TESTER, pour lancer les mêmes
// parcours contre le site déployé :
//
//   URL_A_TESTER=https://... npm run test:parcours
//
// C'est la seule façon de vérifier un déploiement autrement qu'en regardant
// si la page de connexion s'affiche. Les parcours écrivent dans la base du
// déploiement visé, et nettoient derrière eux.
const DEPLOYE = process.env.URL_A_TESTER;
const BASE = DEPLOYE ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/parcours",
  use: { baseURL: BASE },
  // Les deux sessions partagées, ouvertes une seule fois avant toute la
  // suite. Voir tests/parcours/sessions.ts pour ce que ça évite.
  globalSetup: "./tests/parcours/sessions-avant.ts",
  // Les délais par défaut suffisent contre un serveur local, pas contre un
  // déploiement : chaque action serveur y coûte un aller-retour réseau, et
  // une fonction qui démarre à froid en coûte davantage. Un test qui échoue
  // une fois sur trois pour cette raison n'apprend rien et finit par être
  // ignoré, ce qui est pire qu'un test absent.
  //
  // Les deux comptent, et les relever séparément n'a pas suffi : `expect`
  // borne une attente, `timeout` borne le test entier. Un parcours de vingt
  // gestes dépasse le second bien avant le premier.
  expect: { timeout: DEPLOYE ? 15000 : 5000 },
  timeout: DEPLOYE ? 120000 : 30000,
  // Un seul worker : ces tests se connectent par mot de passe sur la vraie
  // authentification Supabase, plusieurs fois chacun. Avec le parallélisme
  // par défaut, plusieurs fichiers se connectent au même instant et
  // Supabase finit par refuser la rafale, exactement le défaut qui a motivé
  // fileParallelism: false côté vitest (voir vitest.config.ts).
  workers: 1,
  // Aucun serveur à démarrer quand on vise un site déjà en ligne : le lancer
  // ferait tourner les parcours contre le poste au lieu du déploiement, sans
  // que rien ne le dise.
  webServer: DEPLOYE
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT}`,
        url: BASE,
        reuseExistingServer: true,
        timeout: 120000,
      },
});
