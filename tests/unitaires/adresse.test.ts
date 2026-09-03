import { describe, expect, it } from "vitest";
import { normaliserAdresseSupabase } from "@/lib/supabase/adresse";

/**
 * **Chaque cas accepté ici vient d'un écran réel de Supabase.** Ce n'est pas
 * de la tolérance de principe : c'est la liste de ce que le tableau de bord
 * met sous le bouton de copie, et que quelqu'un collera forcément.
 */
describe("normaliserAdresseSupabase", () => {
  const attendu = "https://cvzzstnsztyjfqsrdtin.supabase.co";

  it("laisse passer l'adresse déjà propre", () => {
    expect(normaliserAdresseSupabase(attendu)).toBe(attendu);
  });

  it("retire le /rest/v1/ du champ « API URL »", () => {
    // C'est ce que donne le bouton de copie de Data API, et c'est ce qui a
    // fait échouer la première installation faite par quelqu'un d'autre que
    // l'auteur.
    expect(
      normaliserAdresseSupabase("https://cvzzstnsztyjfqsrdtin.supabase.co/rest/v1/"),
    ).toBe(attendu);
  });

  it("retire une simple barre finale", () => {
    expect(normaliserAdresseSupabase(`${attendu}/`)).toBe(attendu);
  });

  it("retrouve la référence dans l'adresse du tableau de bord", () => {
    expect(
      normaliserAdresseSupabase(
        "https://supabase.com/dashboard/project/cvzzstnsztyjfqsrdtin/integrations/data_api/overview",
      ),
    ).toBe(attendu);
  });

  it("accepte la référence collée toute seule", () => {
    expect(normaliserAdresseSupabase("cvzzstnsztyjfqsrdtin")).toBe(attendu);
  });

  it("ignore les espaces autour", () => {
    expect(normaliserAdresseSupabase(`  ${attendu}  `)).toBe(attendu);
  });

  it("accepte aussi les projets en .supabase.in", () => {
    expect(normaliserAdresseSupabase("https://abc.supabase.in/rest/v1/")).toBe(
      "https://abc.supabase.in",
    );
  });

  it("refuse ce qui n'est pas une adresse Supabase", () => {
    // Elle range, elle ne devine pas. Une valeur qui ne ressemble à rien de
    // connu doit rester une erreur, sans quoi l'app démarrerait sur du vide.
    expect(normaliserAdresseSupabase("")).toBeNull();
    expect(normaliserAdresseSupabase("   ")).toBeNull();
    expect(normaliserAdresseSupabase("https://exemple.fr")).toBeNull();
    expect(normaliserAdresseSupabase("http://abc.supabase.co")).toBeNull();
    expect(normaliserAdresseSupabase("https://supabase.com/dashboard")).toBeNull();
    expect(normaliserAdresseSupabase("Mon projet")).toBeNull();
  });
});
