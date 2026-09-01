import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Bouton } from "@/lib/design/Bouton";
import { Carte } from "@/lib/design/Carte";
import { Badge } from "@/lib/design/Badge";
import { contientTiretLong } from "@/lib/design/typographie";

// Vitest ne tourne pas avec les globales, donc le nettoyage automatique de
// testing-library ne se déclenche pas : sans ça, les rendus s'accumulent
// dans le DOM et le test suivant trouve plusieurs éléments au lieu d'un.
afterEach(() => cleanup());

describe("Bouton", () => {
  it("affiche son libellé", () => {
    render(<Bouton>Valider</Bouton>);
    expect(screen.getByRole("button", { name: "Valider" })).toBeInTheDocument();
  });

  it("est orange en variante primaire", () => {
    render(<Bouton>Valider</Bouton>);
    expect(screen.getByRole("button")).toHaveClass("bg-orange");
  });

  it("est blanc bordé en variante secondaire", () => {
    render(<Bouton variante="secondaire">Annuler</Bouton>);
    const bouton = screen.getByRole("button");
    expect(bouton).toHaveClass("bg-fond");
    expect(bouton).not.toHaveClass("bg-orange");
  });

  it("transmet les props natives", () => {
    render(<Bouton disabled>Valider</Bouton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("Carte", () => {
  it("affiche son contenu", () => {
    render(<Carte>Contenu</Carte>);
    expect(screen.getByText("Contenu")).toBeInTheDocument();
  });

  it("a un fond blanc et un rayon de carte", () => {
    render(<Carte>Contenu</Carte>);
    const carte = screen.getByText("Contenu");
    expect(carte).toHaveClass("bg-fond");
    expect(carte).toHaveClass("rounded-carte");
  });
});

describe("Badge", () => {
  it("affiche son libellé", () => {
    render(<Badge>À relier</Badge>);
    expect(screen.getByText("À relier")).toBeInTheDocument();
  });

  it("passe en orange sur le ton attention", () => {
    render(<Badge ton="attention">À relier</Badge>);
    expect(screen.getByText("À relier")).toHaveClass("text-orange");
  });
});

/**
 * Tous les fichiers lisibles du dépôt, en descendant dans les dossiers.
 *
 * Un dossier absent rend une liste vide plutôt que de lever : l'outil n'a pas
 * tous les dossiers d'une app complète, et une racine qui n'existe pas ici ne
 * doit pas faire échouer la règle sur celles qui existent.
 */
function fichiersSource(dossier: string): string[] {
  if (!existsSync(dossier)) return [];

  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) return fichiersSource(chemin);
    return /\.(m?ts|tsx|css|sql|md)$/.test(entree.name) ? [chemin] : [];
  });
}

describe("le vert reste une exception", () => {
  it("n'apparaît que dans le composant Bouton et sa définition", () => {
    // La règle promet que cette couleur ne servira qu'au
    // bouton de conversion. Une promesse qu'aucun test ne tient vieillit mal.
    const fichiers = ["app", "lib", "modules"]
      .flatMap((racine) => fichiersSource(join(process.cwd(), racine)))
      .map((chemin) => chemin.replace(process.cwd() + "/", ""))
      .filter((chemin) => /bg-vert|--color-vert/.test(readFileSync(chemin, "utf8")));

    expect(fichiers.sort()).toEqual(["app/globals.css", "lib/design/Bouton.tsx"]);
  });
});

describe("le code respecte la charte typographique", () => {


  it("aucun fichier du dépôt ne contient de tiret long", () => {
    // Trois fichiers portent ces caractères parce qu'ils définissent la règle
    // elle-même ou citent le code qui la définit. Les nommer un par un plutôt
    // que d'exclure un dossier entier : une exception se justifie, elle ne se
    // déclare pas en gros.
    const exceptions = [
      join("lib", "design", "typographie.ts"),
      join("tests", "unitaires", "typographie.test.ts"),
    ];

    const fautifs = ["app", "lib", "modules", "docs", "supabase", "tests", "scripts"]
      .flatMap((racine) => fichiersSource(join(process.cwd(), racine)))
      .map((chemin) => chemin.replace(process.cwd() + "/", ""))
      .filter((chemin) => !exceptions.includes(chemin))
      .filter((chemin) => contientTiretLong(readFileSync(chemin, "utf8")));

    expect(fautifs).toEqual([]);
  });
});
