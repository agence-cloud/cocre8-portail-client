"use client";

import { useActionState, useState } from "react";
import { Bouton } from "@/lib/design/Bouton";
import { BoutonStylo } from "@/lib/design/BoutonStylo";
import { Carte } from "@/lib/design/Carte";
import { CHAMP_LIGNE } from "@/lib/design/champs";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import {
  enregistrerLesParties,
  enregistrerLesQuestions,
  enregistrerLesTaches,
  type EtatListe,
} from "@/modules/portail/actions-referentiel";
import type { Pilier } from "@/lib/pilier/types";
import type { QuestionProfilReglable, TypeQuestion } from "@/lib/profil/types";
import type { TacheModele } from "@/lib/parcours/requetes";

const INITIAL: EtatListe = { erreur: null, enregistre: false };

/**
 * Les trois listes qui font le parcours : les parties, les questions du
 * profil, et les tâches que chaque nouveau client reçoit.
 *
 * **Trois cartes et non un formulaire.** Elles n'ont ni la même longueur ni
 * les mêmes règles de suppression, et un seul « Enregistrer » pour les trois
 * obligerait à tout revalider pour corriger un titre.
 *
 * **Chaque liste s'envoie en JSON dans un champ caché.** Les champs sont
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
        className="mt-4 text-sm text-orange transition-opacity duration-200 hover:opacity-70"
      >
        + {ajout}
      </button>

      {etat.erreur && (
        <p role="alert" className="mt-5 rounded-xl bg-orange-tint px-4 py-3 text-[13px] text-orange">
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
      className="shrink-0 px-2 text-texte-doux transition-colors duration-200 hover:text-orange"
    >
      ×
    </button>
  );
}

type LignePartie = { id?: string; nom: string; description: string };

export function ReglagesParties({
  piliers,
  motSingulier,
  motPluriel,
}: {
  piliers: Pilier[];
  motSingulier: string;
  motPluriel: string;
}) {
  const [etat, action, enCours] = useActionState(enregistrerLesParties, INITIAL);
  const [edition, setEdition] = useState(false);
  const [lignes, setLignes] = useState<LignePartie[]>(() =>
    piliers.map((p) => ({ id: p.id, nom: p.nom, description: p.description ?? "" })),
  );

  const modifier = (rang: number, champ: keyof LignePartie, valeur: string) =>
    setLignes((liste) =>
      liste.map((ligne, i) => (i === rang ? { ...ligne, [champ]: valeur } : ligne)),
    );

  if (!edition) {
    return (
      <Carte ton="calme" className="mt-5">
        <EnTete
          intitule={`Tes ${motPluriel}`}
          aide="Les grandes parties de ton accompagnement, dans l'ordre où ton client les ouvre."
          onOuvrir={() => setEdition(true)}
        />
        <ol className="mt-5 flex flex-col gap-3 text-sm">
          {piliers.map((pilier, rang) => (
            <li key={pilier.id} className="flex gap-3">
              <span className="shrink-0 text-texte-doux">{rang + 1}.</span>
              <span>
                {pilier.nom}
                {pilier.description && (
                  <span className="block text-[13px] text-texte-doux">{pilier.description}</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </Carte>
    );
  }

  return (
    <Carte ton="calme" className="mt-5">
      <EnTete intitule={`Tes ${motPluriel}`} aide="Retire, renomme, réordonne." />
      <form action={action} className="mt-5">
        <input type="hidden" name="lignes" value={JSON.stringify(lignes)} />

        <div className="flex flex-col gap-3">
          {lignes.map((ligne, rang) => (
            <div key={rang} className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-sm text-texte-doux">{rang + 1}.</span>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={ligne.nom}
                  onChange={(e) => modifier(rang, "nom", e.target.value)}
                  placeholder="Son nom"
                  className={CHAMP_LIGNE}
                />
                <input
                  type="text"
                  value={ligne.description}
                  onChange={(e) => modifier(rang, "description", e.target.value)}
                  placeholder="Ce qu'on y fait, en une phrase"
                  className={CHAMP_LIGNE}
                />
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
          ajout={`Ajouter un ${motSingulier}`}
          onAjouter={() => setLignes((liste) => [...liste, { nom: "", description: "" }])}
          onFermer={() => setEdition(false)}
        />
      </form>
    </Carte>
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

type LigneTache = {
  id?: string;
  pilier_id: string;
  groupe: string;
  titre: string;
  description: string;
};

export function ReglagesTaches({
  taches,
  piliers,
  mot,
}: {
  taches: TacheModele[];
  piliers: Pilier[];
  mot: string;
}) {
  const [etat, action, enCours] = useActionState(enregistrerLesTaches, INITIAL);
  const [edition, setEdition] = useState(false);
  const [lignes, setLignes] = useState<LigneTache[]>(() =>
    taches.map((t) => ({
      id: t.id,
      pilier_id: t.pilier_id,
      groupe: t.groupe ?? "",
      titre: t.titre,
      description: t.description ?? "",
    })),
  );

  const nomDuPilier = (id: string) => piliers.find((p) => p.id === id)?.nom ?? "";

  const modifier = (rang: number, champs: Partial<LigneTache>) =>
    setLignes((liste) => liste.map((ligne, i) => (i === rang ? { ...ligne, ...champs } : ligne)));

  if (!edition) {
    return (
      <Carte ton="calme" className="mt-5">
        <EnTete
          intitule="Le parcours type"
          aide="Les tâches que chaque nouveau client reçoit en copie. Les modifier ici ne touche pas à celles déjà posées."
          onOuvrir={() => setEdition(true)}
        />
        <ul className="mt-5 flex flex-col gap-2 text-sm">
          {taches.map((tache) => (
            <li key={tache.id} className="flex gap-3">
              <span className="w-32 shrink-0 truncate text-texte-doux">
                {nomDuPilier(tache.pilier_id)}
              </span>
              <span>{tache.titre}</span>
            </li>
          ))}
        </ul>
      </Carte>
    );
  }

  return (
    <Carte ton="calme" className="mt-5">
      <EnTete
        intitule="Le parcours type"
        aide="Une tâche retirée ici ne disparaît pas chez les clients qui l'ont déjà."
      />
      <form action={action} className="mt-5">
        <input type="hidden" name="lignes" value={JSON.stringify(lignes)} />

        <div className="flex flex-col gap-3">
          {lignes.map((ligne, rang) => (
            <div key={rang} className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={ligne.pilier_id}
                    onChange={(e) => modifier(rang, { pilier_id: e.target.value })}
                    className={CHAMP_LIGNE}
                    aria-label={`Le ${mot} de cette tâche`}
                  >
                    {piliers.map((pilier) => (
                      <option key={pilier.id} value={pilier.id}>
                        {pilier.nom}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={ligne.groupe}
                    onChange={(e) => modifier(rang, { groupe: e.target.value })}
                    placeholder="Sa section"
                    className={CHAMP_LIGNE}
                  />
                </div>
                <input
                  type="text"
                  value={ligne.titre}
                  onChange={(e) => modifier(rang, { titre: e.target.value })}
                  placeholder="Ce qu'il y a à faire"
                  className={CHAMP_LIGNE}
                />
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
          ajout="Ajouter une tâche"
          onAjouter={() =>
            setLignes((liste) => [
              ...liste,
              {
                pilier_id: piliers[0]?.id ?? "",
                groupe: "",
                titre: "",
                description: "",
              },
            ])
          }
          onFermer={() => setEdition(false)}
        />
      </form>
    </Carte>
  );
}
