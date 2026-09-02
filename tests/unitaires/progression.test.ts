import { describe, it, expect } from "vitest";
import {
  progression,
  progressionObjectif,
  objectifEnCours,
} from "@/modules/portail/progression";
import type { Objectif, Tache } from "@/lib/objectif/types";

function tache(partiel: Partial<Tache> & { id: string }): Tache {
  return {
    objectif_id: "o1",
    titre: "Une étape",
    description: null,
    ordre: 1,
    faite: false,
    faite_le: null,
    ...partiel,
  };
}

function objectif(partiel: Partial<Objectif> & { id: string }): Objectif {
  return {
    personne_id: "p1",
    titre: "Un objectif",
    description: null,
    echeance: null,
    ordre: 1,
    taches: [],
    ...partiel,
  };
}

describe("progressionObjectif", () => {
  it("compte les étapes cochées de cet objectif", () => {
    expect(
      progressionObjectif(
        objectif({
          id: "o1",
          taches: [tache({ id: "a", faite: true }), tache({ id: "b" })],
        }),
      ),
    ).toBe(50);
  });

  it("rend zéro pour un objectif sans étape, et non une division par rien", () => {
    expect(progressionObjectif(objectif({ id: "o1" }))).toBe(0);
  });
});

describe("progression", () => {
  it("compte toutes les étapes de tous les objectifs", () => {
    // Le calcul écartait auparavant les parties non ouvertes. Il n'y a plus de
    // parties : tout ce qui est posé est visible, donc tout compte.
    expect(
      progression([
        objectif({
          id: "o1",
          taches: [tache({ id: "a", faite: true }), tache({ id: "b", faite: true })],
        }),
        objectif({ id: "o2", ordre: 2, taches: [tache({ id: "c" }), tache({ id: "d" })] }),
      ]),
    ).toBe(50);
  });

  it("rend zéro sans aucun objectif", () => {
    expect(progression([])).toBe(0);
  });

  it("ignore un objectif vide dans le compte, sans le faire tomber à zéro", () => {
    // Un objectif que le coach vient de poser sans l'avoir découpé ne doit
    // pas diluer la progression : il n'apporte ni numérateur ni dénominateur.
    expect(
      progression([
        objectif({ id: "o1", taches: [tache({ id: "a", faite: true })] }),
        objectif({ id: "o2", ordre: 2 }),
      ]),
    ).toBe(100);
  });
});

describe("objectifEnCours", () => {
  it("rend le premier objectif qui n'est pas fini", () => {
    const courant = objectifEnCours([
      objectif({ id: "o1", taches: [tache({ id: "a", faite: true })] }),
      objectif({ id: "o2", ordre: 2, taches: [tache({ id: "b" })] }),
    ]);

    expect(courant?.id).toBe("o2");
  });

  it("écarte les objectifs sans étape, qui passeraient pour celui en cours", () => {
    // Sans cette règle, un objectif posé et pas encore découpé apparaîtrait
    // à 0 % sur le tableau de bord, sans rien à proposer de faire.
    const courant = objectifEnCours([
      objectif({ id: "vide" }),
      objectif({ id: "o2", ordre: 2, taches: [tache({ id: "b" })] }),
    ]);

    expect(courant?.id).toBe("o2");
  });

  it("rend le dernier quand tout est fini, plutôt que rien", () => {
    const courant = objectifEnCours([
      objectif({ id: "o1", taches: [tache({ id: "a", faite: true })] }),
      objectif({ id: "o2", ordre: 2, taches: [tache({ id: "b", faite: true })] }),
    ]);

    expect(courant?.id).toBe("o2");
  });

  it("rend le premier objectif quand aucun n'est découpé", () => {
    // La carte du tableau de bord garde quelque chose à montrer plutôt que de
    // disparaître le jour où le coach vient de poser ses objectifs.
    expect(objectifEnCours([objectif({ id: "o1" })])?.id).toBe("o1");
  });

  it("rend null sans aucun objectif", () => {
    expect(objectifEnCours([])).toBeNull();
  });
});
