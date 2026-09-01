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
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unitaires/**/*.test.{ts,tsx}", "tests/integration/**/*.test.ts"],
    testTimeout: 20000,
    // Les fichiers d'intégration écrivent dans la vraie base et partagent le
    // même compte de test membre : deux fichiers ouverts en même temps
    // finissent par se marcher dessus (un calendrier posé par l'un que
    // l'autre efface), et la rafale de connexions par mot de passe qu'un
    // lancement en parallèle déclenche finit par se faire refuser par
    // Supabase. Un fichier à la fois coûte quelques secondes, contre une
    // suite qui échoue en bloc une fois sur deux.
    fileParallelism: false,
  },
});
