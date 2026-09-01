import { describe, it, expect } from "vitest";
import { formaterJourMois } from "@/lib/dates";
import { etatPilier, calendrierPropose } from "@/lib/pilier/etat";
import { phraseCadenas } from "@/lib/pilier/types";

describe("formaterJourMois", () => {
  it("écrit le premier du mois en ordinal", () => {
    expect(formaterJourMois("2026-10-01")).toBe("1er octobre");
  });

  it("écrit les autres jours en cardinal", () => {
    expect(formaterJourMois("2026-11-12")).toBe("12 novembre");
  });
});

describe("etatPilier", () => {
  const aujourdhui = new Date("2026-09-15T10:00:00Z");

  it("ouvre un pilier dont la date est passée", () => {
    expect(etatPilier("2026-09-01", aujourdhui)).toEqual({ statut: "ouvert" });
  });

  it("ouvre un pilier dont la date est aujourd'hui", () => {
    expect(etatPilier("2026-09-15", aujourdhui)).toEqual({ statut: "ouvert" });
  });

  it("annonce la date d'un pilier à venir", () => {
    expect(etatPilier("2026-10-01", aujourdhui)).toEqual({
      statut: "a_venir",
      date: "2026-10-01",
    });
  });

  it("ferme un pilier sans date", () => {
    expect(etatPilier(null, aujourdhui)).toEqual({ statut: "ferme" });
  });
});

describe("calendrierPropose", () => {
  it("ouvre la première partie au démarrage, puis une par mois", () => {
    const calendrier = calendrierPropose("2026-09-01");
    expect(calendrier).toEqual([
      { numero: 1, date: "2026-09-01" },
      { numero: 2, date: "2026-10-01" },
      { numero: 3, date: "2026-11-01" },
      { numero: 4, date: "2026-12-01" },
    ]);
  });

  it("propose les quatre parties, aucune n'est réservée", () => {
    // Le jeu de départ en compte quatre, et la dernière n'est pas un privilège
    // à débloquer : un coach qui en veut trois en retire une depuis ses
    // réglages, il ne compte pas sur une partie muette.
    const calendrier = calendrierPropose("2026-09-01");
    expect(calendrier.map((ligne) => ligne.numero)).toEqual([1, 2, 3, 4]);
  });

  it("ramène au dernier jour du mois quand le jour n'existe pas", () => {
    // 31 janvier plus un mois n'est pas le 3 mars. L'arithmétique naïve de
    // JavaScript déborde, et un calendrier qui saute un mois est un bug qu'on
    // ne remarque qu'en février.
    const calendrier = calendrierPropose("2026-01-31");
    expect(calendrier[1]).toEqual({ numero: 2, date: "2026-02-28" });
    expect(calendrier[2]).toEqual({ numero: 3, date: "2026-03-31" });
  });
});

describe("phraseCadenas", () => {
  it("insère la date quand elle existe", () => {
    expect(phraseCadenas(2, "2026-10-01")).toContain("1er octobre");
  });

  it("dit la même chose quel que soit le numéro de la partie", () => {
    // Une phrase par numéro serait fausse dès qu'un coach renomme ses parties
    // ou en ajoute une : leurs noms se règlent depuis l'app.
    expect(phraseCadenas(2, "2026-10-01")).toBe(phraseCadenas(7, "2026-10-01"));
  });

  it("reste compréhensible quand aucune date n'est posée", () => {
    expect(phraseCadenas(2, null)).toContain("pas encore programmé");
  });
});
