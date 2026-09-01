import { describe, it, expect } from "vitest";
import { construireLiensCircle } from "@/modules/portail/circle";
import { REGLAGES_PAR_DEFAUT } from "@/lib/reglages/types";

describe("construireLiensCircle", () => {
  it("ne rend que les adresses remplies", () => {
    // Une adresse vide n'est pas une panne : tant qu'un espace n'existe pas,
    // mieux vaut ne rien montrer qu'un lien mort.
    //
    // Les adresses sont posées ici et non lues au même endroit que la
    // fonction : un test qui comparerait à la source verrait ses deux côtés
    // bouger ensemble, et retirer le filtre le laisserait vert.
    const liens = construireLiensCircle({
      communaute: "https://exemple.circle.so/communaute",
      formation: "",
      evenements: "https://exemple.circle.so/evenements",
    });

    expect(liens).toHaveLength(2);
    expect(liens.map((lien) => lien.libelle)).toEqual(["Communauté", "Événements"]);
  });

  it("ne rend rien du tout sur un outil qui vient d'être installé", () => {
    // Les trois adresses partent vides : ce sont les espaces de celui qui
    // installe, personne d'autre ne peut les deviner. Le groupe entier
    // disparaît alors de la barre, titre et filet compris.
    expect(construireLiensCircle(REGLAGES_PAR_DEFAUT.liens_externes)).toEqual([]);
  });

  it("marque tous ses liens comme externes", () => {
    // C'est ce drapeau qui déclenche le nouvel onglet et le `rel` dans la
    // barre. Un lien qui s'ouvrirait dans l'app reprendrait au client
    // l'écran sur lequel il travaille.
    const liens = construireLiensCircle({
      communaute: "https://exemple.circle.so/communaute",
      formation: "https://exemple.circle.so/formation",
      evenements: "https://exemple.circle.so/evenements",
    });

    expect(liens.every((lien) => lien.externe)).toBe(true);
  });
});
