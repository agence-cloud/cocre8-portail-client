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
  const aujourdhui = new Date("2026-08-28T09:00:00Z");

  it("ouvre le pilier 0 tout de suite et le 1 au démarrage", () => {
    const calendrier = calendrierPropose("2026-09-01", aujourdhui);
    expect(calendrier).toEqual([
      { numero: 0, date: "2026-08-28" },
      { numero: 1, date: "2026-09-01" },
      { numero: 2, date: "2026-10-01" },
      { numero: 3, date: "2026-11-01" },
    ]);
  });

  it("ne propose rien pour le pilier 4, réservé", () => {
    const calendrier = calendrierPropose("2026-09-01", aujourdhui);
    expect(calendrier.some((ligne) => ligne.numero === 4)).toBe(false);
  });

  it("ramène au dernier jour du mois quand le jour n'existe pas", () => {
    // 31 janvier plus un mois n'est pas le 3 mars. L'arithmétique naïve de
    // JavaScript déborde, et un calendrier qui saute un mois est un bug qu'on
    // ne remarque qu'en février.
    const calendrier = calendrierPropose("2026-01-31", aujourdhui);
    expect(calendrier[2]).toEqual({ numero: 2, date: "2026-02-28" });
    expect(calendrier[3]).toEqual({ numero: 3, date: "2026-03-31" });
  });
});

describe("phraseCadenas", () => {
  it("insère la date quand elle existe", () => {
    expect(phraseCadenas(2, "2026-10-01")).toContain("1er octobre");
  });

  it("ignore la date sur le pilier 4, débloqué à la main", () => {
    expect(phraseCadenas(4, null)).toContain("ton coach t'ouvrira la porte");
  });

  it("reste compréhensible quand aucune date n'est posée", () => {
    expect(phraseCadenas(2, null)).toContain("pas encore programmé");
  });
});
