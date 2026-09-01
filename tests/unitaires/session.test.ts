import { describe, it, expect } from "vitest";
import { ROUTES_PUBLIQUES } from "@/lib/supabase/session";

/**
 * Ces trois adresses sont les seules que le proxy laisse passer sans session.
 *
 * Ce sont les écrans du chemin d'accès d'un client : `/connexion` est
 * traversé par tous, les deux autres demandent un vrai lien reçu par email.
 *
 * Un test qui les nomme toutes est le seul filet qui reste. Sans lui, retirer
 * `/auth/confirmer` de la liste casserait tout le chemin d'accès d'un nouveau
 * client, et rien ne le dirait avant que le premier ne s'en plaigne.
 */
describe("les adresses ouvertes sans session", () => {
  it("laisse passer la connexion et le chemin du lien d'accès", () => {
    expect(ROUTES_PUBLIQUES).toEqual([
      "/connexion",
      "/connexion/mot-de-passe",
      "/auth/confirmer",
    ]);
  });

  it("n'ouvre rien de l'espace ni du pilotage", () => {
    // Une comparaison exacte, pas un préfixe : c'est ce que le proxy fait.
    for (const ferme of ["/espace", "/espace/profil", "/pilotage", "/"]) {
      expect(ROUTES_PUBLIQUES).not.toContain(ferme);
    }
  });
});
