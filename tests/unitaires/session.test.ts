import { describe, it, expect } from "vitest";
import { ROUTES_PUBLIQUES } from "@/lib/supabase/session";

/**
 * Ces six adresses sont les seules que le proxy laisse passer sans session.
 *
 * La première est la racine. **Elle n'affiche rien** : elle regarde si un
 * compte existe, puis renvoie vers l'installation ou vers la connexion. Elle
 * était fermée jusqu'au 2026-09-03, et ce test l'exigeait explicitement.
 * C'était une erreur, découverte à la première installation faite pour de
 * vrai : le proxy interceptait la racine avant qu'elle ait pu poser sa
 * question, et celui qui venait de déployer l'outil atterrissait sur un
 * formulaire de connexion sans compte et sans moyen d'en créer un. Le README
 * lui promettait un écran de mise en service ; il ne pouvait pas l'atteindre.
 *
 * Trois sont les écrans du chemin d'accès d'un client : `/connexion` est
 * traversé par tous, les deux autres demandent un vrai lien reçu par email.
 *
 * La cinquième est la première mise en service, traversée une seule fois dans
 * la vie de l'outil. Elle est publique par nécessité, et elle se garde
 * elle-même : elle rend un 404 dès que l'installation est faite.
 *
 * La sixième est le diagnostic de l'installation. Publique par nécessité elle
 * aussi : elle sert quand personne ne peut se connecter, et la fermer
 * derrière une session la rendrait inutile. Elle n'affiche que l'adresse du
 * projet, déjà recopiée dans le code envoyé au navigateur, et la longueur des
 * clés, jamais leur valeur.
 *
 * Un test qui les nomme toutes est le seul filet qui reste. Sans lui, retirer
 * `/auth/confirmer` de la liste casserait tout le chemin d'accès d'un nouveau
 * client, et rien ne le dirait avant que le premier ne s'en plaigne.
 */
describe("les adresses ouvertes sans session", () => {
  it("laisse passer la racine, la connexion et le chemin du lien d'accès", () => {
    expect(ROUTES_PUBLIQUES).toEqual([
      "/",
      "/connexion",
      "/connexion/mot-de-passe",
      "/auth/confirmer",
      "/installation",
      "/diagnostic",
    ]);
  });

  it("n'ouvre rien de l'espace ni du pilotage", () => {
    // Une comparaison exacte, pas un préfixe : c'est ce que le proxy fait.
    // La racine est ouverte, ce qui pend sous elle ne l'est pas.
    for (const ferme of ["/espace", "/espace/profil", "/pilotage", "/pilotage/membres"]) {
      expect(ROUTES_PUBLIQUES).not.toContain(ferme);
    }
  });
});
