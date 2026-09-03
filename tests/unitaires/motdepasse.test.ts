import { describe, it, expect } from "vitest";
import { fabriquerUnMotDePasse } from "@/lib/auth/motdepasse";

describe("fabriquerUnMotDePasse", () => {
  it("rend trois groupes de cinq caractères", () => {
    expect(fabriquerUnMotDePasse()).toMatch(/^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}$/);
  });

  it("n'emploie aucun caractère qui se confond à l'oeil", () => {
    // La raison d'être de l'alphabet réduit : le coach dicte ce mot de passe
    // au téléphone. Un `l` pris pour un `1` lui vaut un rappel.
    const cent = Array.from({ length: 100 }, fabriquerUnMotDePasse).join("");
    expect(cent).not.toMatch(/[oil01]/);
  });

  it("ne rend jamais deux fois le même", () => {
    // `Math.random` passerait ce test par chance et se rejouerait pourtant
    // d'une exécution à l'autre : ce qui compte est que la source soit
    // `crypto`, et cent tirages identiques le démentiraient tout de suite.
    const cent = new Set(Array.from({ length: 100 }, fabriquerUnMotDePasse));
    expect(cent.size).toBe(100);
  });
});
