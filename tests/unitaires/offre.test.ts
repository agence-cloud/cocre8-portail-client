import { describe, it, expect } from "vitest";
import { formaterEuros, valeurAnnuelle, type Offre } from "@/lib/offre/types";

function offre(surcharge: Partial<Offre> = {}): Offre {
  return {
    id: "offre-1",
    nom: "Beta fondateur",
    prix_defaut: 1500,
    type: "ponctuel",
    duree_mois: 3,
    active: true,
    ...surcharge,
  };
}

describe("formaterEuros", () => {
  it("omet les décimales quand elles sont nulles", () => {
    expect(formaterEuros(1500)).toBe("1 500 €");
  });

  it("garde les décimales quand elles comptent", () => {
    expect(formaterEuros(1499.5)).toBe("1 499,50 €");
  });

  it("affiche zéro plutôt qu'un vide", () => {
    expect(formaterEuros(0)).toBe("0 €");
  });
});

describe("valeurAnnuelle", () => {
  it("prend le prix tel quel pour une offre ponctuelle", () => {
    expect(valeurAnnuelle(offre(), 1500)).toBe(1500);
  });

  it("ramène une offre mensuelle à douze mois", () => {
    // Un récurrent à 400 euros vaut 4 800 euros sur un an : sans cette
    // conversion, il pèserait 400 dans le pipe face à un programme à 1 500,
    // alors qu'il rapporte trois fois plus.
    expect(valeurAnnuelle(offre({ type: "mensuel", duree_mois: null }), 400)).toBe(4800);
  });
});
