#!/usr/bin/env node
/**
 * Refuse de laisser partir une donnée qui appartient à l'éditeur.
 *
 * **Pourquoi un script et non une relecture.** Ce dépôt est né de la copie
 * d'une application réelle, qui portait un numéro de téléphone, des adresses,
 * des prix, des noms de clients et une méthode nommée. La relecture qui a
 * suivi la copie n'a protégé qu'un jour : celui où elle a été faite. Ce script
 * protège tous les autres.
 *
 * Il ne lit que les fichiers suivis par git : ce qui n'est pas versionné ne
 * part pas, et `.env.local` n'a donc pas à être inspecté.
 *
 * **Il ne cherche pas la marque, il cherche les personnes et les valeurs.**
 * « Cocre8 » a le droit d'apparaître, c'est la signature de l'éditeur, posée
 * exprès sur l'écran de connexion et dans la licence. Ce qui n'a pas le droit
 * d'apparaître, c'est quelqu'un.
 *
 *     npm run verifier
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Ce qui ne doit jamais partir, et ce qu'on répond quand ça part. */
const INTERDITS = [
  { motif: /hippolyte/i, quoi: "le prénom de l'éditeur" },
  { motif: /\bjulian\b/i, quoi: "le prénom d'un associé" },
  { motif: /nouvelle[- ]?[ée]cole/i, quoi: "le nom du programme d'origine" },
  { motif: /academie\.cocre8/i, quoi: "une adresse de communauté réelle" },
  { motif: /0783137283|07[ .]83[ .]13[ .]72[ .]83/, quoi: "un numéro de téléphone réel" },
  { motif: /camille roussel|membre-test@/i, quoi: "une fiche de démonstration d'origine" },
  { motif: /fathom|x-cocre8-jeton/i, quoi: "une intégration qui n'existe pas ici" },
  { motif: /\beyJ[A-Za-z0-9_-]{20,}/, quoi: "ce qui ressemble à une clé Supabase" },
  { motif: /sb_secret_[A-Za-z0-9_-]+/, quoi: "une clé de service" },
  { motif: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S/, quoi: "une clé de service renseignée" },
];

/**
 * Les fichiers qui parlent de ce qui a été retiré ont le droit de le nommer :
 * sans eux, on ne saurait plus pourquoi ces règles existent. Ce sont des
 * documents, ils ne partent avec aucune installation.
 */
const EXCEPTIONS = new Set([
  "scripts/verifier-la-purge.mjs",
  "docs/decisions/0001-un-outil-isole-et-reglable.md",
  "docs/plans/2026-09-01-01-de-la-copie-a-l-outil.md",
  "CLAUDE.md",
]);

const fichiers = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter((chemin) => !EXCEPTIONS.has(chemin))
  .filter((chemin) => !/\.(png|jpe?g|gif|svg|ico|woff2?|pdf)$/i.test(chemin));

const trouvailles = [];

for (const chemin of fichiers) {
  let contenu;
  try {
    contenu = readFileSync(chemin, "utf8");
  } catch {
    continue;
  }

  contenu.split("\n").forEach((ligne, rang) => {
    for (const { motif, quoi } of INTERDITS) {
      if (motif.test(ligne)) {
        trouvailles.push({ chemin, rang: rang + 1, quoi, ligne: ligne.trim().slice(0, 110) });
      }
    }
  });
}

if (trouvailles.length === 0) {
  console.log(`Purge vérifiée : ${fichiers.length} fichiers lus, rien de personnel.`);
  process.exit(0);
}

console.error(`${trouvailles.length} chose(s) qui ne doivent pas partir :\n`);
for (const { chemin, rang, quoi, ligne } of trouvailles) {
  console.error(`  ${chemin}:${rang}  ${quoi}`);
  console.error(`    ${ligne}\n`);
}
process.exit(1);
