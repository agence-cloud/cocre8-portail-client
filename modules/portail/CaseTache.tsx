"use client";

import { useOptimistic, useTransition } from "react";
import { cocherTache } from "@/modules/portail/actions";
import { Icone } from "@/lib/design/Icones";

type Props = {
  id: string;
  titre: string;
  description: string | null;
  faite: boolean;
};

/**
 * useOptimistic et non useState : la case suit l'état réel dès que la page
 * se rafraîchit, et revient d'elle-même si la base refuse. Avec useState, il
 * faudrait resynchroniser à la main, et une case qui ment est pire qu'une
 * case lente.
 *
 * C'est le geste le plus répété de l'app : il ne doit jamais attendre le
 * serveur.
 */
export function CaseTache({ id, titre, description, faite }: Props) {
  const [cochee, cocherTout_de_suite] = useOptimistic(faite);
  const [, demarrer] = useTransition();

  function basculer() {
    // La bascule part de `cochee`, l'état affiché, et non de `faite`, la
    // prop figée au dernier rendu du serveur : deux clics rapides avant le
    // rafraîchissement doivent inverser deux fois de suite, pas envoyer
    // deux fois la même valeur.
    const nouvelleValeur = !cochee;
    demarrer(async () => {
      cocherTout_de_suite(nouvelleValeur);
      try {
        await cocherTache(id, nouvelleValeur);
      } catch {
        // Rien à faire ici : ne pas relancer l'erreur laisse la transition
        // se terminer normalement, et `cochee` retombe alors sur `faite`,
        // qui n'a pas bougé puisque la base a refusé l'écriture. La relancer
        // ferait remonter une frontière d'erreur à la place de la case.
      }
    });
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={cochee}
      className="flex w-full items-start gap-3 py-3 text-left transition-colors duration-200 hover:text-accent"
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
          cochee ? "border-accent bg-accent text-white" : "border-bordure bg-fond"
        }`}
      >
        {cochee && <Icone nom="coche" className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0">
        <span className={`block text-[15px] ${cochee ? "text-texte-doux line-through" : ""}`}>
          {titre}
        </span>
        {description && (
          <span className="mt-1 block text-sm text-texte-doux">{description}</span>
        )}
      </span>
    </button>
  );
}
