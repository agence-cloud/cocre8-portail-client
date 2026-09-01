"use client";

import { useState, useTransition, type ReactNode } from "react";
import { enregistrerReponses } from "@/modules/portail/actions";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import { BoutonStylo } from "@/lib/design/BoutonStylo";
import type { QuestionProfil } from "@/lib/profil/types";

type Props = {
  questions: QuestionProfil[];
  reponses: Record<string, string>;
  /** Le profil en lecture, montré tant que le stylo n'a pas été cliqué. */
  resume: ReactNode;
};

const CHAMP =
  "mt-3 w-full rounded-icone border border-bordure bg-fond px-4 py-3 text-[15px] outline-none transition-colors duration-200 focus:border-orange";

/**
 * Le profil déjà rempli, qu'on rouvre pour corriger un chiffre.
 *
 * Au repos : le résumé, et le stylo en haut à droite, le même geste que la
 * fiche du pilotage. Stylo cliqué : les dix champs, avec « Enregistrer » et
 * « Annuler ».
 *
 * L'enregistrement est groupé, à l'inverse de la porte d'entrée
 * (`PorteProfil`), et pour la raison inverse : ici on vient corriger deux
 * chiffres sur dix et on veut pouvoir renoncer, alors que là-bas on remplit
 * en plusieurs fois et perdre son travail serait impardonnable. Deux écrans,
 * deux moments, deux règles.
 */
export function FormulaireProfil({ questions, reponses, resume }: Props) {
  const [brouillons, setBrouillons] = useState(reponses);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enEdition, setEnEdition] = useState(false);
  const [enCours, demarrer] = useTransition();

  function ouvrir() {
    setBrouillons(reponses);
    setErreur(null);
    setEnEdition(true);
  }

  function annuler() {
    setBrouillons(reponses);
    setErreur(null);
    setEnEdition(false);
  }

  function enregistrer() {
    if (enCours) return;
    setErreur(null);

    // Seulement ce qui a bougé : réécrire les dix repousserait la date de
    // modification de réponses auxquelles on n'a pas touché.
    const modifiees = questions
      .filter((q) => (brouillons[q.id] ?? "") !== (reponses[q.id] ?? ""))
      .map((q) => ({ question_id: q.id, reponse: brouillons[q.id] ?? "" }));

    if (modifiees.length === 0) {
      setEnEdition(false);
      return;
    }

    demarrer(async () => {
      try {
        await enregistrerReponses(modifiees);
        setEnEdition(false);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
      }
    });
  }

  if (!enEdition) {
    return (
      /* Dans une carte comme partout ailleurs dans l'espace : cette liste
         était le seul contenu de l'app posé à même le fond de la page, et
         l'écart se voyait dès qu'on passait d'un écran à l'autre. */
      <Carte ton="calme" className="mt-8">
        <div className="flex items-start justify-between gap-6">
          <MicroLibelle>Tes réponses</MicroLibelle>
          <BoutonStylo onClick={ouvrir} intitule="Modifier mon profil" />
        </div>
        {resume}
      </Carte>
    );
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-bordure bg-fond px-4 py-3">
        <div>
          <p className="text-sm text-texte-doux">Tu modifies ton profil.</p>
          {erreur && <p className="mt-1 text-sm text-orange">{erreur}</p>}
        </div>
        <div className="flex gap-3">
          <Bouton onClick={enregistrer} disabled={enCours}>
            {enCours ? "Enregistrement..." : "Enregistrer"}
          </Bouton>
          <Bouton variante="secondaire" onClick={annuler} disabled={enCours}>
            Annuler
          </Bouton>
        </div>
      </div>

      {questions.map((question) => {
        const commun = {
          id: question.id,
          value: brouillons[question.id] ?? "",
          className: CHAMP,
          onChange: (evenement: { target: { value: string } }) =>
            setBrouillons({ ...brouillons, [question.id]: evenement.target.value }),
        };

        return (
          <Carte key={question.id} className="mt-4">
            <label htmlFor={question.id} className="text-[15px]">
              {question.libelle}
            </label>
            {question.aide && (
              <p className="mt-1 text-sm text-texte-doux">{question.aide}</p>
            )}

            {question.type === "texte_long" && <textarea rows={4} {...commun} />}

            {question.type === "choix" && (
              <select {...commun}>
                <option value="">Choisis une réponse</option>
                {(question.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {(question.type === "nombre" || question.type === "texte_court") && (
              <input
                type={question.type === "nombre" ? "number" : "text"}
                inputMode={question.type === "nombre" ? "numeric" : undefined}
                {...commun}
              />
            )}
          </Carte>
        );
      })}
    </>
  );
}
