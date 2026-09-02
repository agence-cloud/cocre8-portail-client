import { config as chargerEnv } from "dotenv";
chargerEnv({ path: ".env.local" });

import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // `server-only` lève dès l'import s'il ne voit pas la condition
      // `react-server`, que seul le bundler de Next pose. Vitest ne la pose
      // jamais, donc tout fichier qui commence par `import "server-only"`
      // (lib/auth/creation.ts) plante à l'import,
      // sans rapport avec ce que le test vérifie. Le paquet fournit lui même
      // le remplacement neutre qu'il sert en présence de cette condition :
      // on le prend directement, sans dupliquer sa logique.
      "server-only": path.resolve(process.cwd(), "node_modules/server-only/empty.js"),
    },
  },
  test: {
    /**
     * **Deux projets, et c'est ce qui rend `npm test` utilisable à froid.**
     *
     * Les unitaires ne touchent rien : ils passent sur un dépôt qu'on vient
     * de récupérer, sans base, sans `.env.local`, sans compte. C'est eux que
     * `npm test` lance.
     *
     * Les tests d'intégration se connectent pour de vrai à un projet
     * Supabase et y écrivent. Ils ont donc leur propre commande,
     * `npm run test:integration` : les mêler aux autres faisait échouer
     * cinq fichiers sur une installation neuve, pour la seule raison
     * qu'aucune base n'existait encore.
     */
    projects: [
      {
        extends: true,
        test: {
          name: "unitaires",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/unitaires/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          testTimeout: 20000,
          // Les fichiers d'intégration écrivent dans la vraie base et
          // partagent le même compte de test : deux fichiers ouverts en même
          // temps finissent par se marcher dessus, et la rafale de connexions
          // qu'un lancement en parallèle déclenche finit par se faire refuser
          // par Supabase.
          fileParallelism: false,
        },
      },
    ],
  },
});
