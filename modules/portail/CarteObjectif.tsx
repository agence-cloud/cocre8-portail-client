"use client";

import { useState } from "react";
import { Carte } from "@/lib/design/Carte";
import { Icone } from "@/lib/design/Icones";
import { formaterJourMois } from "@/lib/dates";

type Props = {
  titre: string;
  description: string | null;
  echeance: string | null;
  faites: number;
  total: number;
  terminee: boolean;
  children: React.ReactNode;
};

/**
 * Un objectif, ses étapes en dessous, et son compte.
 *
 * Un objectif terminé s'ouvre replié, avec sa coche. Un client qui en a cinq
 * ne voit jamais quarante lignes : il voit ce qui reste.
 *
 * Il recule aussi : un objectif fini n'a plus rien à demander, et lui laisser
 * l'ombre de celui en cours mettrait tout l'écran sur le même plan.
 */
export function CarteObjectif({
  titre,
  description,
  echeance,
  faites,
  total,
  terminee,
  children,
}: Props) {
  const [ouverte, setOuverte] = useState(!terminee);

  return (
    <Carte ton={terminee ? "calme" : "posee"} className="mt-4">
      <button
        type="button"
        onClick={() => setOuverte(!ouverte)}
        aria-expanded={ouverte}
        className="group -mx-2 flex w-full items-center justify-between gap-4 rounded-xl px-2 py-1 text-left transition-colors duration-200 hover:bg-fond-alt"
      >
        <span className="flex min-w-0 items-start gap-3">
          {terminee && (
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pilule bg-accent-doux">
              <Icone nom="coche" className="h-3.5 w-3.5 text-accent" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-lg">{titre}</span>
            {description && (
              <span className="mt-1 block text-sm text-texte-doux">{description}</span>
            )}
          </span>
        </span>
        <span className="shrink-0 text-right text-sm text-texte-doux">
          <span className="block">
            {faites} sur {total}
          </span>
          {echeance && (
            <span className="block text-[13px]">pour le {formaterJourMois(echeance)}</span>
          )}
        </span>
      </button>

      {ouverte && <div className="mt-2 divide-y divide-bordure">{children}</div>}
    </Carte>
  );
}
