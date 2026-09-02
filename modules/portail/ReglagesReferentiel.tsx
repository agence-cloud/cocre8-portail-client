"use client";

import { useActionState, useState } from "react";
import { Bouton } from "@/lib/design/Bouton";
import { BoutonStylo } from "@/lib/design/BoutonStylo";
import { Carte } from "@/lib/design/Carte";
import { CHAMP_LIGNE } from "@/lib/design/champs";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import {
  enregistrerLesQuestions,
  type EtatListe,
} from "@/modules/portail/actions-referentiel";
import type { QuestionProfilReglable, TypeQuestion } from "@/lib/profil/types";

const INITIAL: EtatListe = { erreur: null, enregistre: false };

/**
 * La liste des questions du profil, celle que le client remplit en arrivant.
 *
 * **Deux autres listes vivaient ici**, les parties du parcours et les tâches
 * que chaque nouveau client recevait. Elles sont parties avec le parcours
 * type : les objectifs s'écrivent désormais pour un client, sur son écran de
 * suivi, et rien n'est plus commun à tous.
 *
 * **La liste s'envoie en JSON dans un champ caché.** Les champs sont
 * contrôlés, l'état React est la source, et le champ caché n'en est que la
 * sérialisation au moment de l'envoi. Des noms indexés se seraient décalés au
 * premier retrait de ligne.
 */

/** L'en-tête commun : un intitulé, une phrase, et le stylo. */
function EnTete({
  intitule,
  aide,
  onOuvrir,
}: {
  intitule: string;
  aide: string;
  onOuvrir?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <MicroLibelle>{intitule}</MicroLibelle>
        <p className="mt-2 text-[13px] text-texte-doux">{aide}</p>
      </div>
      {onOuvrir && <BoutonStylo onClick={onOuvrir} intitule={`Modifier : ${intitule}`} />}
    </div>
  );
}

/** Le pied commun : enregistrer, renoncer, et le message d'erreur. */
function Pied({
  etat,
  enCours,
  onFermer,
  onAjouter,
  ajout,
}: {
  etat: EtatListe;
  enCours: boolean;
  onFermer: () => void;
  onAjouter: () => void;
  ajout: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onAjouter}
        className="mt-4 text-sm text-accent transition-opacity duration-200 hover:opacity-70"
      >
        + {ajout}
      </button>

      {etat.erreur && (
        <p role="alert" className="mt-5 rounded-xl bg-accent-doux px-4 py-3 text-[13px] text-accent">
          {etat.erreur}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Bouton type="submit" disabled={enCours}>
          {enCours ? "Enregistrement..." : "Enregistrer"}
        </Bouton>
        <button
          type="button"
          onClick={onFermer}
          className="text-sm text-texte-doux transition-colors duration-200 hover:text-texte"
        >
          Annuler
        </button>
      </div>
    </>
  );
}

function BoutonRetirer({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retirer cette ligne"
      title="Retirer cette ligne"
      className="shrink-0 px-2 text-texte-doux transition-colors duration-200 hover:text-accent"
    >
      ×
    </button>
  );
}

type LigneQuestion = {
  id?: string;
  libelle: string;
  aide: string;
  type: TypeQuestion;
  active: boolean;
};

const TYPES: { valeur: TypeQuestion; libelle: string }[] = [
  { valeur: "texte_court", libelle: "Texte court" },
  { valeur: "texte_long", libelle: "Texte long" },
  { valeur: "nombre", libelle: "Nombre" },
  { valeur: "choix", libelle: "Choix" },
];

export function ReglagesQuestions({ questions }: { questions: QuestionProfilReglable[] }) {
  const [etat, action, enCours] = useActionState(enregistrerLesQuestions, INITIAL);
  const [edition, setEdition] = useState(false);
  const [lignes, setLignes] = useState<LigneQuestion[]>(() =>
    questions.map((q) => ({
      id: q.id,
      libelle: q.libelle,
      aide: q.aide ?? "",
      type: q.type,
      active: q.active,
    })),
  );

  const modifier = (rang: number, champs: Partial<LigneQuestion>) =>
    setLignes((liste) => liste.map((ligne, i) => (i === rang ? { ...ligne, ...champs } : ligne)));

  if (!edition) {
    return (
      <Carte ton="calme" className="mt-5">
        <EnTete
          intitule="Les questions d'accueil"
          aide="Ce que ton client remplit en arrivant. Tant qu'une réponse manque, son espace reste fermé."
          onOuvrir={() => setEdition(true)}
        />
        <ol className="mt-5 flex flex-col gap-3 text-sm">
          {questions.map((question, rang) => (
            <li key={question.id} className="flex gap-3">
              <span className="shrink-0 text-texte-doux">{rang + 1}.</span>
              <span className={question.active ? "" : "text-texte-doux/65 line-through"}>
                {question.libelle}
              </span>
            </li>
          ))}
        </ol>
      </Carte>
    );
  }

  return (
    <Carte ton="calme" className="mt-5">
      <EnTete
        intitule="Les questions d'accueil"
        aide="Une question déjà répondue ne se retire pas : décoche-la pour ne plus la poser."
      />
      <form action={action} className="mt-5">
        <input type="hidden" name="lignes" value={JSON.stringify(lignes)} />

        <div className="flex flex-col gap-4">
          {lignes.map((ligne, rang) => (
            <div key={rang} className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-sm text-texte-doux">{rang + 1}.</span>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={ligne.libelle}
                  onChange={(e) => modifier(rang, { libelle: e.target.value })}
                  placeholder="La question"
                  className={CHAMP_LIGNE}
                />
                <input
                  type="text"
                  value={ligne.aide}
                  onChange={(e) => modifier(rang, { aide: e.target.value })}
                  placeholder="L'aide sous le champ, si besoin"
                  className={CHAMP_LIGNE}
                />
                <div className="flex items-center gap-4">
                  <select
                    value={ligne.type}
                    onChange={(e) => modifier(rang, { type: e.target.value as TypeQuestion })}
                    className={CHAMP_LIGNE}
                  >
                    {TYPES.map((type) => (
                      <option key={type.valeur} value={type.valeur}>
                        {type.libelle}
                      </option>
                    ))}
                  </select>
                  <label className="flex shrink-0 items-center gap-2 text-sm text-texte-doux">
                    <input
                      type="checkbox"
                      checked={ligne.active}
                      onChange={(e) => modifier(rang, { active: e.target.checked })}
                    />
                    Posée
                  </label>
                </div>
              </div>
              <BoutonRetirer
                onClick={() => setLignes((liste) => liste.filter((_, i) => i !== rang))}
              />
            </div>
          ))}
        </div>

        <Pied
          etat={etat}
          enCours={enCours}
          ajout="Ajouter une question"
          onAjouter={() =>
            setLignes((liste) => [
              ...liste,
              { libelle: "", aide: "", type: "texte_long", active: true },
            ])
          }
          onFermer={() => setEdition(false)}
        />
      </form>
    </Carte>
  );
}
