import { describe, it, expect } from "vitest";
import { completude, profilComplet } from "@/lib/profil/completude";
import type { QuestionProfil, ReponseProfil } from "@/lib/profil/types";

const questions = [
  { id: "q1", ordre: 1 },
  { id: "q2", ordre: 2 },
  { id: "q3", ordre: 3 },
] as QuestionProfil[];

function reponse(questionId: string, texte: string): ReponseProfil {
  return { id: questionId, question_id: questionId, reponse: texte, modifie_le: "" };
}

describe("completude", () => {
  it("compte les questions répondues", () => {
    const bilan = completude(questions, [reponse("q1", "96000"), reponse("q2", "9")]);
    expect(bilan).toEqual({ repondues: 2, total: 3, pourcentage: 67 });
  });

  it("ne compte pas une réponse vide", () => {
    // Un champ ouvert puis quitté sans rien écrire enregistre une chaîne
    // vide. La compter ferait afficher une complétude qui ne correspond à
    // aucune information.
    const bilan = completude(questions, [reponse("q1", "  ")]);
    expect(bilan.repondues).toBe(0);
  });

  it("renvoie zéro quand il n'y a aucune question", () => {
    expect(completude([], [])).toEqual({ repondues: 0, total: 0, pourcentage: 0 });
  });
});

describe("profilComplet", () => {
  it("est vrai quand toutes les questions ont une réponse", () => {
    expect(
      profilComplet(questions, [
        reponse("q1", "1"),
        reponse("q2", "2"),
        reponse("q3", "3"),
      ]),
    ).toBe(true);
  });

  it("est faux s'il en manque une", () => {
    expect(profilComplet(questions, [reponse("q1", "1")])).toBe(false);
  });

  it("est vrai quand il n'y a aucune question", () => {
    // Un référentiel vide ne doit enfermer personne dehors.
    expect(profilComplet([], [])).toBe(true);
  });
});
