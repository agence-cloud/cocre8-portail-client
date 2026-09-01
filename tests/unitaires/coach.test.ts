import { describe, it, expect } from "vitest";
import { joindreLeCoach } from "@/modules/portail/coach";
import { REGLAGES_PAR_DEFAUT } from "@/lib/reglages/types";

describe("joindreLeCoach", () => {
  it("rend le lien en international et l'affichage en français", () => {
    // Les deux formes du même numéro, et c'est tout l'objet de cette
    // fonction : le lien doit composer depuis l'étranger, l'affichage doit
    // se lire.
    expect(joindreLeCoach("0612345678")).toEqual({
      href: "tel:+33612345678",
      affichage: "06 12 34 56 78",
    });
  });

  it("donne le même résultat quelle que soit la façon d'écrire le numéro", () => {
    // La garde qui compte : la constante peut gagner des espaces ou des
    // points un jour, sans que personne pense au `tel:`. Sans le nettoyage
    // des séparateurs, ce lien-là ne composerait rien du tout.
    expect(joindreLeCoach("06 12 34 56 78")).toEqual(joindreLeCoach("0612345678"));
    expect(joindreLeCoach("06.12.34.56.78")).toEqual(joindreLeCoach("0612345678"));
  });

  it("rend un numéro qu'il ne reconnaît pas plutôt que de le mutiler", () => {
    // Un numéro étranger, ou une valeur incomplète. Mieux vaut un lien que
    // l'app n'a pas su embellir qu'un lien faux : un membre qui compose un
    // numéro tronqué tombe sur quelqu'un d'autre.
    expect(joindreLeCoach("+41 79 555 12 34")).toEqual({
      href: "tel:41795551234",
      affichage: "+41 79 555 12 34",
    });
  });

  it("ne fabrique aucun lien tant que le réglage est vide", () => {
    // Le réglage part vide, et c'est ce qui doit rester vrai : un numéro
    // d'exemple livré avec l'outil finirait affiché à de vrais clients. La
    // carte du tableau de bord se garde sur cette valeur, donc elle ne se
    // dessine pas tant que le coach n'a pas renseigné son numéro.
    const { href, affichage } = joindreLeCoach(REGLAGES_PAR_DEFAUT.coach_telephone);
    expect(href).toBe("tel:");
    expect(affichage).toBe("");
  });

  it("porte un numéro exploitable dès que la constante est remplie", () => {
    // Le filet pour le jour où quelqu'un la remplit : une faute de frappe ne
    // casserait rien de visible, la carte s'afficherait avec un lien mort, et
    // personne ne s'en apercevrait avant qu'un client essaie d'appeler.
    const { href, affichage } = joindreLeCoach("0612345678");
    expect(href).toMatch(/^tel:\+33\d{9}$/);
    expect(affichage).toMatch(/^\d{2}( \d{2}){4}$/);
  });
});
