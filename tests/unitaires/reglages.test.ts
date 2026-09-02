import { describe, it, expect } from "vitest";
import {
  composerReglages,
  REGLAGES_PAR_DEFAUT,
} from "@/lib/reglages/types";

describe("composerReglages", () => {
  it("rend les défauts quand la base ne porte rien", () => {
    // Une base neuve n'a aucune ligne de réglage, et l'app doit tourner quand
    // même. C'est ce qui permet aussi d'ajouter un réglage sans migration.
    expect(composerReglages([])).toEqual(REGLAGES_PAR_DEFAUT);
  });

  it("garde les défauts des clés qu'on ne lui donne pas", () => {
    // Le cas courant : un coach règle son nom et son numéro, et ne touche
    // jamais au reste. Les autres valeurs ne doivent pas disparaître.
    const reglages = composerReglages([{ cle: "coach_nom", valeur: "Camille" }]);

    expect(reglages.coach_nom).toBe("Camille");
    expect(reglages.nom_programme).toBe(REGLAGES_PAR_DEFAUT.nom_programme);
    expect(reglages.liens_externes).toEqual(REGLAGES_PAR_DEFAUT.liens_externes);
  });

  it("complète un objet partiel plutôt que de le rejeter", () => {
    // Un réglage écrit avant qu'un champ existe, ou modifié à la main : les
    // champs présents sont retenus, les manquants retombent sur le défaut.
    const reglages = composerReglages([
      { cle: "liens_externes", valeur: { communaute: "https://exemple.fr" } },
    ]);

    expect(reglages.liens_externes.communaute).toBe("https://exemple.fr");
    expect(reglages.liens_externes.formation).toBe("");
  });

  it("retombe sur le défaut quand la valeur n'a pas la bonne forme", () => {
    // Une base qui a vieilli, ou qu'on a modifiée à la main, ne doit pas
    // faire tomber un écran. Le défaut se voit et se corrige, une exception
    // laisse le client devant une page cassée.
    const reglages = composerReglages([
      { cle: "nom_programme", valeur: { pas: "une chaîne" } },
      { cle: "liens_externes", valeur: null },
    ]);

    expect(reglages.nom_programme).toBe(REGLAGES_PAR_DEFAUT.nom_programme);
    expect(reglages.liens_externes).toEqual(REGLAGES_PAR_DEFAUT.liens_externes);
  });
});
