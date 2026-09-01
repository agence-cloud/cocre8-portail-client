import { describe, it, expect } from "vitest";
import {
  grouperEnSections,
  progression,
  progressionPilier,
  pilierEnCours,
} from "@/modules/portail/progression";
import type { Tache } from "@/modules/portail/types";
import type { Pilier } from "@/lib/pilier/types";

function tache(partiel: Partial<Tache> & { id: string }): Tache {
  return {
    personne_id: "p1",
    pilier_id: "pilier-1",
    groupe: null,
    titre: "Une tâche",
    description: null,
    ordre: 1,
    faite: false,
    faite_le: null,
    ...partiel,
  };
}

describe("grouperEnSections", () => {
  it("range les tâches sous le nom de leur section, dans l'ordre", () => {
    const sections = grouperEnSections([
      tache({ id: "b", groupe: "Clarifie ta cible", ordre: 2 }),
      tache({ id: "a", groupe: "Clarifie ta cible", ordre: 1 }),
      tache({ id: "c", groupe: "Construis ton offre", ordre: 3 }),
    ]);

    expect(sections.map((s) => s.nom)).toEqual([
      "Clarifie ta cible",
      "Construis ton offre",
    ]);
    expect(sections[0].taches.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("marque une section terminée quand tout est coché", () => {
    const sections = grouperEnSections([
      tache({ id: "a", groupe: "Section", ordre: 1, faite: true }),
      tache({ id: "b", groupe: "Section", ordre: 2, faite: true }),
    ]);

    expect(sections[0].faites).toBe(2);
    expect(sections[0].terminee).toBe(true);
  });

  it("garde une section ouverte s'il reste une tâche", () => {
    const sections = grouperEnSections([
      tache({ id: "a", groupe: "Section", ordre: 1, faite: true }),
      tache({ id: "b", groupe: "Section", ordre: 2 }),
    ]);

    expect(sections[0].terminee).toBe(false);
  });

  it("accepte des tâches sans section", () => {
    const sections = grouperEnSections([tache({ id: "a", ordre: 1 })]);

    expect(sections).toHaveLength(1);
    expect(sections[0].nom).toBeNull();
  });
});

describe("progression", () => {
  const ouverts = new Set(["pilier-1"]);

  it("ne compte que les piliers ouverts", () => {
    // Deux tâches faites sur deux dans le pilier ouvert : 100 %, même si le
    // pilier suivant est plein de tâches non faites. Compter les piliers à
    // venir punirait le membre pour ce qu'il n'a pas encore le droit de faire.
    const valeur = progression(
      [
        tache({ id: "a", faite: true }),
        tache({ id: "b", faite: true }),
        tache({ id: "c", pilier_id: "pilier-2" }),
        tache({ id: "d", pilier_id: "pilier-2" }),
      ],
      ouverts,
    );

    expect(valeur).toBe(100);
  });

  it("arrondit au plus proche", () => {
    const valeur = progression(
      [
        tache({ id: "a", faite: true }),
        tache({ id: "b" }),
        tache({ id: "c" }),
      ],
      ouverts,
    );

    expect(valeur).toBe(33);
  });

  it("renvoie zéro quand aucun pilier n'est ouvert", () => {
    expect(progression([tache({ id: "a", faite: true })], new Set())).toBe(0);
  });
});

describe("progressionPilier", () => {
  it("compte les tâches d'un seul pilier", () => {
    const valeur = progressionPilier(
      [
        tache({ id: "a", faite: true }),
        tache({ id: "b" }),
        tache({ id: "c", pilier_id: "pilier-2", faite: true }),
      ],
      "pilier-1",
    );

    expect(valeur).toBe(50);
  });

  it("renvoie zéro pour un pilier sans tâche", () => {
    expect(progressionPilier([], "pilier-1")).toBe(0);
  });
});

describe("pilierEnCours", () => {
  const piliers: Pilier[] = [
    { id: "pilier-1", numero: 1, nom: "Clarté", description: null, ordre: 1 },
    { id: "pilier-2", numero: 2, nom: "Plan", description: null, ordre: 2 },
    { id: "pilier-3", numero: 3, nom: "Action", description: null, ordre: 3 },
  ];

  it("prend le pilier ouvert le plus bas qui n'est pas fini", () => {
    const courant = pilierEnCours(
      piliers,
      [
        tache({ id: "a", pilier_id: "pilier-1", faite: true }),
        tache({ id: "b", pilier_id: "pilier-1" }),
      ],
      new Set(["pilier-1", "pilier-2"]),
    );

    expect(courant?.numero).toBe(1);
  });

  it("reste sur le dernier ouvert quand tout est fini", () => {
    const courant = pilierEnCours(
      piliers,
      [
        tache({ id: "a", pilier_id: "pilier-1", faite: true }),
        tache({ id: "b", pilier_id: "pilier-1", faite: true }),
      ],
      new Set(["pilier-1", "pilier-2"]),
    );

    expect(courant?.numero).toBe(1);
  });

  it("ignore un pilier ouvert qui n'a aucune tâche", () => {
    // Le pilier 4 ouvert à la main pour un membre de la cohorte fondatrice
    // n'a aucune tâche écrite. Sans ce filtre, il passerait pour le pilier en
    // cours à 0 %, et le tableau de bord enverrait le membre sur une page vide.
    const courant = pilierEnCours(
      piliers,
      [tache({ id: "a", pilier_id: "pilier-1" })],
      new Set(["pilier-1", "pilier-2"]),
    );

    expect(courant?.numero).toBe(1);
  });

  it("renvoie null quand aucun pilier n'est ouvert", () => {
    expect(pilierEnCours(piliers, [], new Set())).toBeNull();
  });
});
