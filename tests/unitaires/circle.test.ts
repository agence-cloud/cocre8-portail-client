import { describe, it, expect } from "vitest";
import { CIRCLE, construireLiensCircle, liensCircle } from "@/modules/portail/circle";

describe("construireLiensCircle", () => {
  it("ne rend que les adresses remplies", () => {
    // Une adresse vide n'est pas une panne : tant qu'un espace Circle
    // n'existe pas, mieux vaut ne rien montrer qu'un lien mort.
    //
    // La comparaison ne porte pas sur `CIRCLE` : au 2026-08-28, ses trois
    // adresses sont remplies, et un test qui les comparerait à
    // `liensCircle().length` bougerait avec elles, retirer le filtre
    // laisserait alors ce test vert. Une adresse vide posée ici-même est ce
    // qui éprouve vraiment la règle.
    const liens = construireLiensCircle({
      communaute: "https://exemple.circle.so/communaute",
      formation: "",
      evenements: "https://exemple.circle.so/evenements",
    });

    expect(liens).toHaveLength(2);
    expect(liens.map((lien) => lien.libelle)).toEqual(["Communauté", "Événements"]);
  });
});

describe("liensCircle", () => {
  it("applique la même règle aux adresses réelles", () => {
    // `liensCircle` n'est qu'un appel de `construireLiensCircle` sur
    // `CIRCLE` : ce test garde le lien entre les deux, pendant que le test
    // du dessus garde la règle elle-même.
    const liens = liensCircle();
    const remplies = Object.values(CIRCLE).filter((adresse) => adresse !== "");

    expect(liens).toHaveLength(remplies.length);
    expect(liens.every((lien) => lien.href !== "")).toBe(true);
  });

  it("marque tous ses liens comme externes", () => {
    // C'est ce drapeau qui déclenche le nouvel onglet et le rel dans la
    // barre. Un lien Circle qui s'ouvre dans l'app reprendrait au membre
    // l'écran sur lequel il travaille.
    expect(liensCircle().every((lien) => lien.externe)).toBe(true);
  });

  it("n'expose que des adresses absolues", () => {
    // Une adresse relative sortirait sur l'app elle-même, pas sur Circle.
    for (const adresse of Object.values(CIRCLE)) {
      if (adresse !== "") expect(adresse).toMatch(/^https:\/\//);
    }
  });
});
