"use client";

import { useTransition } from "react";
import { quitterLApercu } from "@/modules/portail/actions";

/**
 * Le bandeau qui rappelle au coach qu'il n'est pas chez lui.
 *
 * **Il ne se ferme pas, et c'est le point.** Un aperçu agit sous l'identité du
 * client : une case cochée là est cochée pour de bon. Un bandeau qu'on peut
 * réduire finirait par être réduit, et le coach oublierait où il se trouve.
 *
 * En haut du flux plutôt qu'en flottant : il pousse la page vers le bas au
 * lieu de recouvrir la barre du client, dont on est précisément venu vérifier
 * l'allure.
 */
export function BandeauApercu({ nom }: { nom: string }) {
  const [enCours, demarrer] = useTransition();

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-accent px-6 py-2.5 text-center text-[13px] text-white"
    >
      <span>
        Tu regardes l&apos;espace de {nom}. Ce que tu coches ici est coché chez
        {" "}
        {nom}.
      </span>
      <button
        type="button"
        disabled={enCours}
        onClick={() => demarrer(async () => void (await quitterLApercu()))}
        className="font-medium underline underline-offset-2 disabled:opacity-60"
      >
        {enCours ? "Retour..." : "Revenir à mon pilotage"}
      </button>
    </div>
  );
}
