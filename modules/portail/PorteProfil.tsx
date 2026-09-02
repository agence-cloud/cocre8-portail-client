"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  enregistrerReponse,
  enregistrerDerniereReponse,
  ouvrirLEspace,
} from "@/modules/portail/actions";
import { seDeconnecter } from "@/lib/auth/actions";
import { LogoProgramme } from "@/lib/design/LogoProgramme";
import { Icone } from "@/lib/design/Icones";
import { Bouton } from "@/lib/design/Bouton";
import type { QuestionProfil } from "@/lib/profil/types";

type Props = {
  questions: QuestionProfil[];
  reponses: Record<string, string>;
  /** Le prénom du membre, pour que l'accueil s'adresse à quelqu'un. */
  prenom: string;
};

/** Les trois temps de la porte. */
type Temps = "accueil" | "questions" | "chargement";

const CHAMP =
  "champ-nu w-full border-b-2 border-bordure bg-transparent pb-3 text-2xl outline-none transition-colors duration-200 placeholder:text-texte-doux/40 focus:border-accent";

/** Ce que l'écran de chargement annonce, dans l'ordre où il l'annonce. */
const ETAPES_CHARGEMENT = [
  "Ton point de départ est enregistré",
  "On ouvre tes piliers",
  "On prépare tes coachings",
  "Ton espace est prêt",
];

/** Le temps entre deux lignes du chargement. */
const RYTHME = 550;

/**
 * La porte d'entrée : trois temps, une question à la fois.
 *
 * Un questionnaire posé à plat, en un seul écran, se lit comme un formulaire
 * administratif et se remplit à contrecoeur. Or c'est le tout premier contact
 * du client avec son espace, et ce qu'il en retient décide de la suite.
 *
 * D'où trois temps plutôt qu'un seul écran de formulaire :
 *
 * **L'accueil** dit où l'on est et ce qui va se passer. Un questionnaire qui
 * démarre sans prévenir se subit ; annoncé, il se traverse.
 *
 * **Les questions**, une par écran. Le glissement porte un sens : la suivante
 * arrive par la droite, la précédente revient par la gauche, et l'on sent
 * qu'on avance dans une file au lieu de sauter d'un écran à l'autre.
 *
 * **Le chargement** occupe l'attente pendant que l'espace s'ouvre. Il ne
 * ment pas : chacune de ses lignes correspond à quelque chose qui existe
 * derrière (les piliers, les coachings), et il dure le temps qu'il annonce.
 *
 * **La porte reste une porte** : rien n'est accessible
 * tant que les dix réponses ne sont pas là. Seule la traversée change.
 *
 * Chaque réponse part au passage à la suivante, jamais à la fin : on peut
 * s'arrêter au milieu et revenir, et l'écran rouvre alors sur la première
 * question sans réponse, en sautant l'accueil qu'on a déjà vu.
 */
export function PorteProfil({ questions, reponses, prenom }: Props) {
  const [brouillons, setBrouillons] = useState(reponses);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  // On reprend là où l'on s'était arrêté. `useMemo` sans dépendance sur les
  // brouillons, volontairement : ce calcul ne sert qu'à choisir le point de
  // départ, le recalculer à chaque frappe ferait sauter l'écran en avant dès
  // qu'une réponse devient valide.
  const depart = useMemo(() => {
    const manquante = questions.findIndex((q) => (reponses[q.id] ?? "").trim() === "");
    return manquante === -1 ? 0 : manquante;
  }, [questions, reponses]);

  // L'accueil ne se montre qu'à celui qui n'a encore rien répondu. Le revoir à
  // chaque retour ferait raconter le début d'une histoire qu'on a déjà
  // commencée.
  const [temps, setTemps] = useState<Temps>(depart === 0 ? "accueil" : "questions");
  const [rang, setRang] = useState(depart);
  const [recule, setRecule] = useState(false);
  const [etapesVues, setEtapesVues] = useState(0);

  const question = questions[rang];
  const valeur = brouillons[question.id] ?? "";
  const remplie = valeur.trim() !== "";
  const derniere = rang === questions.length - 1;

  // Le chargement se déroule de lui-même, puis ouvre l'espace. La garde de
  // l'espace relit le profil : y aller avant que la dernière réponse soit
  // écrite renverrait ici même, et la porte paraîtrait refuser de s'ouvrir.
  // C'est `avancer` qui n'entre dans ce temps qu'une fois le serveur revenu.
  //
  // L'ouverture part du serveur, qui invalide le layout avant de rediriger :
  // il est partagé avec cette page-ci et garde sinon le profil incomplet
  // qu'il a lu en arrivant, si bien que le membre débarquerait dans son
  // espace sans barre latérale.
  useEffect(() => {
    if (temps !== "chargement") return;

    if (etapesVues >= ETAPES_CHARGEMENT.length) {
      const fin = setTimeout(() => void ouvrirLEspace(), RYTHME);
      return () => clearTimeout(fin);
    }

    const suivante = setTimeout(() => setEtapesVues((vues) => vues + 1), RYTHME);
    return () => clearTimeout(suivante);
  }, [temps, etapesVues]);

  // Les chiffres choisissent, quand la question a des options. Le raccourci
  // est annoncé sur chaque option : le montrer sans le brancher serait pire
  // que de ne rien montrer.
  //
  // Sur le document et non sur un champ : à ce moment-là il n'y a aucun
  // champ à l'écran, donc rien qui puisse tenir le focus.
  useEffect(() => {
    if (temps !== "questions" || question.type !== "choix") return;

    function auClavier(evenement: KeyboardEvent) {
      const options = question.options ?? [];
      const rang = Number(evenement.key);
      if (!Number.isInteger(rang) || rang < 1 || rang > options.length) return;
      evenement.preventDefault();
      choisir(options[rang - 1]);
    }

    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
    // `choisir` se referme sur l'état du rendu courant, ce qui est voulu :
    // l'écouteur est reposé à chaque question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temps, question]);

  function definir(nouvelle: string) {
    setBrouillons((precedents) => ({ ...precedents, [question.id]: nouvelle }));
  }

  function avancer(forcee?: string) {
    const reponse = forcee ?? valeur;
    if (reponse.trim() === "" || enCours) return;
    setErreur(null);

    demarrer(async () => {
      try {
        // Rien à renvoyer si la réponse n'a pas bougé : revenir en arrière
        // puis repartir en avant ne doit pas réécrire dix lignes.
        if ((reponses[question.id] ?? "") !== reponse) {
          // La dernière passe par une action qui ne revalide pas : revalider
          // ferait de cette page celle d'un profil complet, et l'écran de
          // chargement disparaîtrait au milieu de son animation.
          await (derniere
            ? enregistrerDerniereReponse(question.id, reponse)
            : enregistrerReponse(question.id, reponse));
        }

        if (!derniere) {
          setRecule(false);
          setRang(rang + 1);
          return;
        }

        setTemps("chargement");
      } catch {
        setErreur("Ta réponse n'a pas pu être enregistrée. Réessaie.");
      }
    });
  }

  /** Un choix vaut réponse : il se pose et l'écran avance, sans second clic. */
  function choisir(option: string) {
    if (enCours) return;
    definir(option);
    avancer(option);
  }

  function reculer() {
    if (rang === 0 || enCours) return;
    setRecule(true);
    setRang(rang - 1);
  }

  const entree = recule ? "entree-arriere" : "entree-avant";

  if (temps === "accueil") {
    return (
      <Cadre progression={0}>
        <div className="entree-monte">
          <LogoProgramme />
        </div>

        <h1 className="entree-monte mt-10 text-4xl" style={{ animationDelay: "120ms" }}>
          Bienvenue{prenom ? `, ${prenom}` : ""}.
        </h1>

        <p
          className="entree-monte mt-4 max-w-xl text-[17px] text-texte-doux"
          style={{ animationDelay: "220ms" }}
        >
          On va te poser {questions.length} questions avant de démarrer, pour
          charger ton espace. C'est la photo d'avant : dans trois mois, ce sont
          ces chiffres qui rendront tes résultats indiscutables.
        </p>

        <p
          className="entree-monte mt-2 text-sm text-texte-doux"
          style={{ animationDelay: "300ms" }}
        >
          Cinq minutes, pas plus.
        </p>

        <div className="entree-monte mt-10" style={{ animationDelay: "380ms" }}>
          <Bouton onClick={() => setTemps("questions")}>C&apos;est parti</Bouton>
        </div>
      </Cadre>
    );
  }

  if (temps === "chargement") {
    return (
      <Cadre progression={100}>
        <div className="entree-monte">
          <LogoProgramme />
        </div>

        <h1 className="entree-monte mt-10 text-4xl" style={{ animationDelay: "120ms" }}>
          On prépare ton espace.
        </h1>

        <ul className="mt-10 space-y-4">
          {ETAPES_CHARGEMENT.slice(0, etapesVues).map((etape) => (
            <li key={etape} className="entree-avant flex items-center gap-3 text-[17px]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pilule bg-accent text-white">
                <Icone nom="coche" className="h-3.5 w-3.5" />
              </span>
              {etape}
            </li>
          ))}
        </ul>
      </Cadre>
    );
  }

  const commun = {
    id: question.id,
    autoFocus: true,
    value: valeur,
    disabled: enCours,
    className: CHAMP,
    onChange: (e: { target: { value: string } }) => definir(e.target.value),
  };

  return (
    <Cadre progression={((rang + 1) / questions.length) * 100}>
      {/* La clé force le remontage à chaque question : sans elle, React
          réutilise les mêmes noeuds et l'animation d'entrée ne rejoue pas. */}
      <div key={question.id} className={entree}>
        <p className="text-sm text-texte-doux">
          Question {rang + 1} sur {questions.length}
        </p>

        <label htmlFor={question.id} className="mt-3 block text-3xl leading-tight">
          {question.libelle}
        </label>
        {question.aide && <p className="mt-3 text-[15px] text-texte-doux">{question.aide}</p>}

        <div className="mt-10">
          {question.type === "choix" ? (
            <div className="flex max-w-xl flex-col gap-3">
              {(question.options ?? []).map((option, index) => (
                <button
                  key={option}
                  type="button"
                  disabled={enCours}
                  onClick={() => choisir(option)}
                  className={`entree-monte flex items-center gap-4 rounded-icone border-[1.5px] px-5 py-4 text-left text-[17px] transition-colors duration-200 disabled:opacity-60 ${
                    valeur === option
                      ? "border-accent bg-accent-doux text-accent"
                      : "border-bordure hover:border-accent hover:text-accent"
                  }`}
                  style={{ animationDelay: `${80 + index * 60}ms` }}
                >
                  {/* La touche du clavier, montrée : on répond au doigt ou à
                      la souris, mais dix questions se passent bien plus vite
                      quand la main ne quitte pas les touches. */}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[13px] ${
                      valeur === option ? "border-accent text-accent" : "border-bordure text-texte-doux"
                    }`}
                  >
                    {index + 1}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          ) : question.type === "texte_long" ? (
            <textarea rows={3} {...commun} placeholder="Écris ta réponse" />
          ) : (
            <input
              type={question.type === "nombre" ? "number" : "text"}
              inputMode={question.type === "nombre" ? "numeric" : undefined}
              placeholder={question.type === "nombre" ? "0" : "Écris ta réponse"}
              // Entrée fait avancer : c'est le geste attendu quand il n'y a
              // qu'un champ à l'écran. Sur un texte long, elle sert à passer
              // une ligne, donc elle n'y est pas branchée.
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  avancer();
                }
              }}
              {...commun}
            />
          )}
        </div>

        {erreur && <p className="mt-6 text-sm text-accent">{erreur}</p>}

        {/* Un choix s'enregistre au clic : lui laisser un « Suivant » qui ne
            sert jamais donnerait un bouton mort à chaque question à options. */}
        {question.type !== "choix" && (
          <div className="mt-10 flex items-center gap-6">
            <Bouton onClick={() => avancer()} disabled={!remplie || enCours}>
              {enCours ? "Un instant..." : derniere ? "Entrer dans mon espace" : "Suivant"}
            </Bouton>
            <Retour rang={rang} enCours={enCours} onReculer={reculer} />
          </div>
        )}

        {question.type === "choix" && (
          <div className="mt-10">
            <Retour rang={rang} enCours={enCours} onReculer={reculer} />
          </div>
        )}
      </div>
    </Cadre>
  );
}

/**
 * Revenir n'est possible que sur ce qui est déjà derrière soi : on n'avance
 * pas sans répondre, mais se relire est le seul moyen de corriger un chiffre
 * tapé de travers.
 */
function Retour({
  rang,
  enCours,
  onReculer,
}: {
  rang: number;
  enCours: boolean;
  onReculer: () => void;
}) {
  if (rang === 0) return null;

  return (
    <button
      type="button"
      onClick={onReculer}
      disabled={enCours}
      className="text-sm text-texte-doux transition-colors duration-200 hover:text-texte"
    >
      Revenir à la précédente
    </button>
  );
}

/**
 * Le décor commun aux trois temps : le trait de progression, le centrage, et
 * la sortie.
 *
 * Il ne bouge pas d'un temps à l'autre, et c'est ce qui rend les transitions
 * lisibles : seul le contenu glisse, le cadre tient.
 */
function Cadre({
  progression,
  children,
}: {
  progression: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-fond">
      {/* La progression, réduite à un trait. C'est la seule chose qui reste à
          l'écran en plus de la question : sans elle, on ne sait pas si l'on
          en a pour une minute ou pour un quart d'heure, et c'est ce doute qui
          fait abandonner. */}
      <div className="h-1 w-full bg-fond-alt">
        <div
          className="h-1 bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progression}%` }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">{children}</div>
      </div>

      {/* La seule sortie, discrète, en bas. Sans elle, quelqu'un qui arrive
          sur le mauvais compte reste enfermé devant une question qui n'est
          pas la sienne. */}
      <form action={seDeconnecter} className="px-6 pb-6 text-right">
        <button type="submit" className="text-xs text-texte-doux hover:text-texte">
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
