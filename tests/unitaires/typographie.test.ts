import { describe, it, expect } from "vitest";
import { contientTiretLong } from "@/lib/design/typographie";

describe("contientTiretLong", () => {
  it("détecte le tiret cadratin", () => {
    expect(contientTiretLong("un texte — coupé")).toBe(true);
  });

  it("détecte le tiret demi-cadratin", () => {
    expect(contientTiretLong("2020–2024")).toBe(true);
  });

  it("accepte le trait d'union", () => {
    expect(contientTiretLong("porte-parole")).toBe(false);
  });

  it("accepte un texte conforme à la charte", () => {
    expect(contientTiretLong("Active ta communauté, fidélise tes clients.")).toBe(false);
  });

  it("accepte une chaîne vide", () => {
    expect(contientTiretLong("")).toBe(false);
  });
});
