import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Le code ne doit lire que des colonnes qu'`install.sql` crée.
 *
 * **Ce test est né d'une panne, et elle tombait au pire moment.** Le socle
 * lisait `compte.role`, hérité de l'outil dont celui-ci est copié, mais
 * `install.sql` ne créait pas cette colonne. Rien ne le disait : ni la
 * compilation, qui ne connaît pas la base, ni les autres tests, qui n'y
 * touchaient pas, ni la mise en service, qui écrit dans `compte` sans jamais
 * le relire. La panne apparaissait à la toute première connexion, juste après
 * que l'installateur ait posé son compte, sous la forme d'une erreur serveur
 * sans explication. Toute installation neuve butait là.
 *
 * **La lecture est textuelle, et c'est le bon niveau ici** : ce qu'on veut
 * attraper est un écart entre deux fichiers du dépôt, pas un comportement de
 * Postgres. Une base de test le dirait aussi, mais seulement à qui en a une,
 * et personne n'en a une en clonant ce dépôt.
 *
 * **Ce qu'il ne regarde pas, et pourquoi.** Les vues, dont les colonnes
 * viennent d'un `select` qu'il faudrait interpréter. Les sous-sélections
 * (`accompagnement (id)`), qui nomment une table liée et non une colonne. Et
 * `supabase.storage.from(...)`, qui désigne un seau de fichiers et non une
 * table.
 */
const RACINE = join(import.meta.dirname, "..", "..");
const DOSSIERS = ["lib", "modules", "app", "scripts"];

/** Les colonnes de chaque `create table` d'install.sql. */
function tablesDInstall(): Map<string, string[]> {
  const sql = readFileSync(join(RACINE, "install.sql"), "utf8");
  const tables = new Map<string, string[]>();

  for (const bloc of sql.matchAll(/create table (\w+) \(([\s\S]*?)\n\);/g)) {
    const colonnes = bloc[2]
      .split("\n")
      .map((ligne) => ligne.trim())
      .filter((ligne) => ligne !== "" && !ligne.startsWith("--"))
      .map((ligne) => ligne.split(/[\s(]/)[0])
      // Les contraintes de table s'écrivent comme des lignes, sans être des
      // colonnes : elles commencent toutes par un de ces mots.
      .filter((mot) => !["primary", "unique", "foreign", "constraint", "check", "exclude"].includes(mot));
    tables.set(bloc[1], colonnes);
  }

  return tables;
}

/** Les noms d'objets qu'install.sql crée, tables et vues confondues. */
function objetsDInstall(): Set<string> {
  const sql = readFileSync(join(RACINE, "install.sql"), "utf8");
  const noms = new Set<string>();
  for (const m of sql.matchAll(/create (?:table|(?:or replace )?view) (\w+)/g)) noms.add(m[1]);
  return noms;
}

function fichiers(): string[] {
  const trouves: string[] = [];

  function parcourir(chemin: string) {
    for (const entree of readdirSync(chemin, { withFileTypes: true })) {
      const complet = join(chemin, entree.name);
      if (entree.isDirectory()) parcourir(complet);
      else if (/\.(ts|tsx|mts)$/.test(entree.name)) trouves.push(complet);
    }
  }

  for (const dossier of DOSSIERS) {
    try {
      parcourir(join(RACINE, dossier));
    } catch {
      // Un outil n'a pas forcément les quatre dossiers.
    }
  }

  return trouves;
}

type Lecture = { fichier: string; table: string; colonne: string };

function lecturesDuCode(objets: Set<string>): Lecture[] {
  const lectures: Lecture[] = [];

  for (const fichier of fichiers()) {
    const source = readFileSync(fichier, "utf8");

    for (const appel of source.matchAll(
      /(\.storage)?\s*\.from\("(\w+)"\)([\s\S]{0,400}?)\.select\(\s*"([^"]+)"/g,
    )) {
      // `supabase.storage.from("documents")` désigne un seau, pas une table.
      if (appel[1]) continue;
      // Un second `.from(` avant le `.select(` : les deux ne vont pas
      // ensemble, et rattacher les colonnes à la mauvaise table dirait n'importe quoi.
      if (appel[3].includes(".from(")) continue;

      const table = appel[2];
      // Les sous-sélections portent leurs propres colonnes entre parenthèses :
      // on retire le groupe entier, étiquette comprise.
      const liste = appel[4].replace(/[\w:]+\s*\([^)]*\)/g, "");

      for (const brut of liste.split(",")) {
        const colonne = brut.split(":").pop()!.trim();
        if (colonne === "" || colonne === "*") continue;
        // Une table nommée dans un select est une jointure, pas une colonne.
        if (objets.has(colonne)) continue;
        lectures.push({ fichier: fichier.slice(RACINE.length + 1), table, colonne });
      }
    }
  }

  return lectures;
}

describe("les colonnes que le code demande à la base", () => {
  const tables = tablesDInstall();
  const objets = objetsDInstall();
  const lectures = lecturesDuCode(objets);

  it("trouve bien des lectures à vérifier", () => {
    // Sans cette garde, une expression régulière cassée rendrait tout le
    // fichier vert en ne vérifiant plus rien.
    expect(tables.size).toBeGreaterThan(0);
    expect(lectures.length).toBeGreaterThan(0);
  });

  it("ne nomme que des tables et des vues qu'install.sql crée", () => {
    const inconnues = lectures.filter((l) => !objets.has(l.table));
    expect(inconnues.map((l) => `${l.fichier} -> ${l.table}`)).toEqual([]);
  });

  it("ne demande que des colonnes qui existent", () => {
    const manquantes = lectures.filter((lecture) => {
      const colonnes = tables.get(lecture.table);
      // Une vue : ses colonnes viennent d'un select qu'il faudrait
      // interpréter. Elle n'est pas vérifiée ici, et le dit.
      if (!colonnes) return false;
      return !colonnes.includes(lecture.colonne);
    });

    expect(manquantes.map((l) => `${l.fichier} -> ${l.table}.${l.colonne}`)).toEqual([]);
  });
});
