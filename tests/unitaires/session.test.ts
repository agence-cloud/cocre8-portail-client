import { describe, it, expect } from "vitest";
import { ROUTES_PUBLIQUES } from "@/lib/supabase/session";

/**
 * Ces quatre adresses sont les seules que le proxy laisse passer sans session.
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
 * La deuxième est la connexion, traversée par tous. `/auth/confirmer` et
 * `/connexion/mot-de-passe` l'accompagnaient tant qu'un client entrait par un
 * lien reçu par email : ce chemin a été retiré, le coach donne son mot de
 * passe au client et celui-ci se connecte par le formulaire.
 *
 * La troisième est la première mise en service, traversée une seule fois dans
 * la vie de l'outil. Elle est publique par nécessité, et elle se garde
 * elle-même : elle rend un 404 dès que l'installation est faite.
 *
 * La quatrième est le diagnostic de l'installation. Publique par nécessité elle
 * aussi : elle sert quand personne ne peut se connecter, et la fermer
 * derrière une session la rendrait inutile. Elle n'affiche que l'adresse du
 * projet, déjà recopiée dans le code envoyé au navigateur, et la longueur des
 * clés, jamais leur valeur.
 *
 * Un test qui les nomme toutes est le seul filet qui reste. Sans lui, ouvrir
 * une adresse de trop passerait inaperçu, et en fermer une de trop ne se
 * verrait qu'à l'installation suivante.
 */
describe("les adresses ouvertes sans session", () => {
  it("laisse passer la racine, la connexion, l'installation et le diagnostic", () => {
    expect(ROUTES_PUBLIQUES).toEqual([
      "/",
      "/connexion",
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
