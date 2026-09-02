import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

import { Anneau } from "@/modules/portail/Anneau";
import { CarteObjectif } from "@/modules/portail/CarteObjectif";
import { DepotDocument } from "@/modules/portail/DepotDocument";
import { FormulaireProfil } from "@/modules/portail/FormulaireProfil";
import { PorteProfil } from "@/modules/portail/PorteProfil";
import { ResumeProfil } from "@/modules/portail/ResumeProfil";
import { iconeDocument } from "@/lib/document/types";

const enregistrerReponses = vi.fn().mockResolvedValue(undefined);
const enregistrerReponse = vi.fn().mockResolvedValue(undefined);
const enregistrerDerniereReponse = vi.fn().mockResolvedValue(undefined);
const ouvrirLEspace = vi.fn().mockResolvedValue(undefined);

vi.mock("@/modules/portail/actions", () => ({
  cocherTache: vi.fn(),
  enregistrerLeDocument: vi.fn(),
  enregistrerReponse: (...a: unknown[]) => enregistrerReponse(...a),
  enregistrerDerniereReponse: (...a: unknown[]) => enregistrerDerniereReponse(...a),
  enregistrerReponses: (...a: unknown[]) => enregistrerReponses(...a),
  ouvrirLEspace: (...a: unknown[]) => ouvrirLEspace(...a),
}));

vi.mock("@/lib/auth/actions", () => ({ seDeconnecter: vi.fn() }));

afterEach(() => cleanup());

describe("Anneau", () => {
  it("affiche le pourcentage en gras", () => {
    render(<Anneau pourcentage={68} />);
    expect(screen.getByText("68 %")).toHaveClass("font-bold");
  });
});

describe("CarteObjectif", () => {
  it("s'ouvre repliée quand l'objectif est atteint", () => {
    render(
      <CarteObjectif
        titre="Arrêter de facturer à l'heure"
        description={null}
        echeance={null}
        faites={3}
        total={3}
        terminee
      >
        <p>Une étape</p>
      </CarteObjectif>,
    );
    expect(screen.queryByText("Une étape")).toBeNull();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("s'ouvre dépliée quand il reste une étape", () => {
    render(
      <CarteObjectif
        titre="Annoncer le prix sans se justifier"
        description="Le blocage n'est pas le tarif."
        echeance={null}
        faites={1}
        total={4}
        terminee={false}
      >
        <p>Une étape</p>
      </CarteObjectif>,
    );
    expect(screen.getByText("Une étape")).toBeInTheDocument();
    expect(screen.getByText("Le blocage n'est pas le tarif.")).toBeInTheDocument();
  });

  it("affiche l'échéance quand il y en a une, et rien sinon", () => {
    // Une échéance est facultative : tous les objectifs ne se datent pas, et
    // une ligne « pour le » vide vaudrait moins que pas de ligne du tout.
    const { rerender } = render(
      <CarteObjectif
        titre="Trois forfaits signés"
        description={null}
        echeance="2026-10-01"
        faites={0}
        total={3}
        terminee={false}
      >
        <p>Une étape</p>
      </CarteObjectif>,
    );
    expect(screen.getByText(/1er octobre/)).toBeInTheDocument();

    rerender(
      <CarteObjectif
        titre="Trois forfaits signés"
        description={null}
        echeance={null}
        faites={0}
        total={3}
        terminee={false}
      >
        <p>Une étape</p>
      </CarteObjectif>,
    );
    expect(screen.queryByText(/pour le/)).toBeNull();
  });
});

describe("DepotDocument", () => {
  it("invite à déposer ou à choisir un fichier", () => {
    render(<DepotDocument personneId="p1" />);
    expect(screen.getByText(/Dépose un fichier ici/)).toBeInTheDocument();
  });

  it("ne montre le bouton d'envoi qu'une fois un fichier choisi", () => {
    render(<DepotDocument personneId="p1" />);
    expect(screen.queryByRole("button", { name: /Déposer ce fichier/ })).toBeNull();

    const fichier = new File(["contenu"], "brief.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Choisir un fichier à déposer"), {
      target: { files: [fichier] },
    });

    expect(screen.getByRole("button", { name: /Déposer ce fichier/ })).toBeInTheDocument();
  });
});

describe("iconeDocument", () => {
  it("reconnaît une image à son type mime", () => {
    expect(iconeDocument("image/png")).toBe("image");
  });

  it("range tout le reste sous l'icône générique", () => {
    expect(iconeDocument("application/pdf")).toBe("documents");
    expect(iconeDocument(null)).toBe("documents");
  });
});

/**
 * Les trois visages du profil entrepreneur. C'est le genre d'enchaînement où
 * le troisième cas se casse sans que personne le voie : la porte et le
 * résumé se regardent tous les jours, le retour en édition presque jamais.
 */
/**
 * La porte d'entrée : trois temps, une question à la fois, pas de saut en
 * avant.
 */
describe("la porte du profil entrepreneur", () => {
  const questions = [
    {
      id: "q1",
      libelle: "Combien factures-tu par mois ?",
      aide: null,
      type: "nombre" as const,
      options: null,
      ordre: 1,
    },
    {
      id: "q2",
      libelle: "D'où viennent tes clients ?",
      aide: null,
      type: "choix" as const,
      options: ["Bouche à oreille", "Publicité"],
      ordre: 2,
    },
  ];

  function porte(reponses: Record<string, string> = {}) {
    return <PorteProfil questions={questions} reponses={reponses} prenom="Léa" />;
  }

  afterEach(() => {
    enregistrerReponse.mockClear();
    enregistrerDerniereReponse.mockClear();
    ouvrirLEspace.mockClear();
  });

  it("accueille avant de questionner", () => {
    render(porte());

    // On accueille, puis on annonce ce qui va se passer, et seulement après
    // on questionne. Un questionnaire qui démarre sans prévenir se subit ;
    // annoncé, il se traverse.
    expect(screen.getByText("Bienvenue, Léa.")).toBeInTheDocument();
    expect(screen.queryByText("Combien factures-tu par mois ?")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "C'est parti" }));
    expect(screen.getByText("Combien factures-tu par mois ?")).toBeInTheDocument();
  });

  it("ne montre qu'une question, et n'avance pas sans réponse", () => {
    render(porte());
    fireEvent.click(screen.getByRole("button", { name: "C'est parti" }));

    expect(screen.getByText("Question 1 sur 2")).toBeInTheDocument();
    expect(screen.queryByText("D'où viennent tes clients ?")).not.toBeInTheDocument();

    // Le retour qui a produit cette règle, mot pour mot : « tant qu'il n'a pas
    // répondu à la première, il ne peut pas répondre à la deuxième ».
    expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();
  });

  it("enregistre au passage à la suivante, jamais à la fin", async () => {
    render(porte());
    fireEvent.click(screen.getByRole("button", { name: "C'est parti" }));

    fireEvent.change(screen.getByLabelText("Combien factures-tu par mois ?"), {
      target: { value: "8000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));

    // Un seul envoi à la fin ferait perdre son travail à qui ferme l'onglet
    // à la septième question. L'attente est nécessaire : l'écran n'avance
    // qu'une fois le serveur revenu, sinon on passerait à la suivante en
    // croyant la précédente enregistrée.
    await waitFor(() => expect(enregistrerReponse).toHaveBeenCalledWith("q1", "8000"));
    await waitFor(() =>
      expect(screen.getByText("D'où viennent tes clients ?")).toBeInTheDocument(),
    );
  });

  it("reprend là où l'on s'était arrêté, sans repasser par l'accueil", () => {
    // Revenir sur la porte ne doit ni refaire lire les réponses déjà données,
    // ni raconter le début d'une histoire qu'on a commencée.
    render(porte({ q1: "8000" }));

    expect(screen.queryByText("Bienvenue, Léa.")).not.toBeInTheDocument();
    expect(screen.getByText("Question 2 sur 2")).toBeInTheDocument();
  });

  it("un choix vaut réponse : il avance sans second clic", async () => {
    render(porte({ q1: "8000" }));

    // Pas de « Suivant » sur une question à options : il ne servirait jamais.
    expect(screen.queryByRole("button", { name: "Suivant" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Bouche à oreille/ }));

    // La dernière réponse passe par l'action qui ne revalide pas : revalider
    // ferait de cette page celle d'un profil complet, et l'écran de
    // chargement disparaîtrait au milieu de son animation.
    await waitFor(() =>
      expect(enregistrerDerniereReponse).toHaveBeenCalledWith("q2", "Bouche à oreille"),
    );
    expect(enregistrerReponse).not.toHaveBeenCalled();
  });

  it("la dernière réponse charge l'espace, puis l'ouvre", async () => {
    render(porte({ q1: "8000" }));
    fireEvent.click(screen.getByRole("button", { name: /Publicité/ }));

    // Le chargement occupe l'attente pendant que l'espace s'ouvre, et il ne
    // ment pas : ses lignes correspondent à ce qui existe derrière.
    await waitFor(() => expect(screen.getByText("On prépare ton espace.")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Ton espace est prêt")).toBeInTheDocument(), {
      timeout: 5000,
    });

    // L'ouverture part du serveur, qui invalide le layout partagé avant de
    // rediriger : sans quoi le membre débarque sans barre latérale.
    await waitFor(() => expect(ouvrirLEspace).toHaveBeenCalled(), { timeout: 5000 });
  });
});

describe("le profil entrepreneur une fois rempli", () => {
  const questions = [
    {
      id: "q1",
      libelle: "Combien factures-tu par mois ?",
      aide: null,
      type: "nombre" as const,
      options: null,
      ordre: 1,
    },
    {
      id: "q2",
      libelle: "D'où viennent tes clients ?",
      aide: null,
      type: "texte_court" as const,
      options: null,
      ordre: 2,
    },
  ];

  afterEach(() => enregistrerReponses.mockClear());

  it("profil complet, au repos : le résumé, et rien à saisir", () => {
    const reponses = { q1: "8000", q2: "" };
    render(
      <FormulaireProfil
        questions={questions}
        reponses={reponses}
        resume={<ResumeProfil questions={questions} reponses={reponses} />}
      />,
    );

    expect(screen.getByText("Combien factures-tu par mois ?")).toBeInTheDocument();
    expect(screen.getByText("8000")).toBeInTheDocument();
    // Une question sans réponse le dit, plutôt que de laisser une ligne vide.
    expect(screen.getByText("Pas encore répondu")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("8000")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modifier mon profil" })).toBeInTheDocument();
  });

  it("profil complet, stylo cliqué : le formulaire, et un seul enregistrement", () => {
    const reponses = { q1: "8000", q2: "Bouche à oreille" };
    render(
      <FormulaireProfil
        questions={questions}
        reponses={reponses}
        resume={<ResumeProfil questions={questions} reponses={reponses} />}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Modifier mon profil" }));

    const champ = screen.getByDisplayValue("8000");
    expect(champ).toBeInTheDocument();
    expect(screen.queryByText("Pas encore répondu")).not.toBeInTheDocument();

    // Quitter le champ n'envoie rien : sinon « Annuler » n'annulerait plus.
    fireEvent.change(champ, { target: { value: "12000" } });
    fireEvent.blur(champ);
    expect(enregistrerReponses).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    // Une seule écriture, et seulement ce qui a bougé : réécrire les dix
    // repousserait la date de réponses auxquelles on n'a pas touché.
    expect(enregistrerReponses).toHaveBeenCalledWith([
      { question_id: "q1", reponse: "12000" },
    ]);
  });

  it("annuler referme le résumé sans rien envoyer", () => {
    const reponses = { q1: "8000", q2: "Bouche à oreille" };
    render(
      <FormulaireProfil
        questions={questions}
        reponses={reponses}
        resume={<ResumeProfil questions={questions} reponses={reponses} />}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Modifier mon profil" }));
    fireEvent.change(screen.getByDisplayValue("8000"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(enregistrerReponses).not.toHaveBeenCalled();
    expect(screen.getByText("8000")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("1")).not.toBeInTheDocument();
  });
});
