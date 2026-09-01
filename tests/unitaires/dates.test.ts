import { describe, it, expect } from "vitest";
import {
  formaterDateHeure,
  formaterJourMois,
  formaterJourMoisCourt,
  estLeMemeJour,
  versInstantUTC,
} from "@/lib/dates";

describe("formaterDateHeure", () => {
  it("écrit le jour, la date et l'heure", () => {
    expect(formaterDateHeure("2026-09-03T16:00:00Z")).toBe(
      "jeudi 3 septembre, 18h00",
    );
  });
});

describe("estLeMemeJour", () => {
  it("reconnaît le jour même", () => {
    expect(
      estLeMemeJour("2026-09-03T16:00:00Z", new Date("2026-09-03T08:00:00Z")),
    ).toBe(true);
  });

  it("distingue la veille", () => {
    // 23h00 UTC un 2 septembre tombe déjà le 3 à Paris (CEST, UTC+2) : ça
    // testerait le même jour au lieu de la veille. Midi UTC reste le 2 sans
    // ambiguïté, été comme hiver.
    expect(
      estLeMemeJour("2026-09-03T16:00:00Z", new Date("2026-09-02T12:00:00Z")),
    ).toBe(false);
  });
});

describe("versInstantUTC", () => {
  it("retranche deux heures l'été, Paris étant alors en avance de deux heures", () => {
    expect(versInstantUTC("2026-09-01T18:00")).toBe("2026-09-01T16:00:00.000Z");
  });

  it("retranche une heure l'hiver, la même saisie n'étant plus au même décalage", () => {
    expect(versInstantUTC("2026-01-05T18:00")).toBe("2026-01-05T17:00:00.000Z");
  });
});

describe("formaterJourMoisCourt", () => {
  it("rend un horodatage complet en date courte", () => {
    expect(formaterJourMoisCourt("2026-09-07T09:00:00.000Z")).toBe("7 sept.");
  });

  it("dit « 1er » et non « 1 » le premier du mois", () => {
    expect(formaterJourMoisCourt("2026-10-01T09:00:00.000Z")).toBe("1er oct.");
  });

  it("compte en heure de Paris et non en UTC", () => {
    // 22h30 UTC le 6, donc 00h30 le 7 à Paris. Sans le fuseau, la carte
    // annoncerait la veille du coaching.
    expect(formaterJourMoisCourt("2026-09-06T22:30:00.000Z")).toBe("7 sept.");
  });

  it("ne se confond pas avec formaterJourMois, qui attend une date seule", () => {
    // Le défaut du 2026-09-01 : passer un horodatage complet à
    // `formaterJourMois` produit une date invalide et fait planter le rendu.
    // Les deux prennent une `string`, le compilateur ne peut pas le voir.
    expect(() => formaterJourMois("2026-09-07T09:00:00.000Z")).toThrow(RangeError);
  });
});
