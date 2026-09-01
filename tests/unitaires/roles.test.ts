import { describe, it, expect } from "vitest";
import { cheminAccueil } from "@/lib/auth/roles";

describe("cheminAccueil", () => {
  it("envoie un admin sur le pilotage", () => {
    expect(cheminAccueil("admin")).toBe("/pilotage");
  });

  it("envoie un membre sur son espace", () => {
    expect(cheminAccueil("membre")).toBe("/espace");
  });
});
