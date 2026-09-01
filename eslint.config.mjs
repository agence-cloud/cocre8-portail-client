import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // La règle interdit par défaut l'apostrophe non échappée dans le JSX.
      // Dans une app écrite en français, un mot sur deux en porte une : la
      // suivre rendrait « Nom de l'offre » illisible en source, pour un
      // risque nul. On garde les deux caractères qui cassent réellement le
      // JSX, le chevron fermant et l'accolade.
      "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
