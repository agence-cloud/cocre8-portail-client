"use client";

import { Icone } from "@/lib/design/Icones";

/**
 * Le bouton n'écrit plus rien lui-même : il ne fait que prévenir son parent,
 * qui bascule son état tout de suite. Faire dépendre l'affichage d'un aller
 * retour serveur pour une simple bascule visuelle, c'était exactement ce qui
 * rendait ce clic lent.
 */
export function BasculeNavigation({
  repliee,
  onBasculer,
}: {
  repliee: boolean;
  onBasculer: () => void;
}) {
  return (
    <button
      onClick={onBasculer}
      aria-label={repliee ? "Déplier la navigation" : "Replier la navigation"}
      title={repliee ? "Déplier" : "Replier"}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-texte-doux transition-colors duration-200 hover:bg-surface hover:text-texte"
    >
      <Icone
        nom="replier"
        className={`h-4 w-4 transition-transform duration-200 ${repliee ? "rotate-180" : ""}`}
      />
    </button>
  );
}
