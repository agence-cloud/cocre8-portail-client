"use client";

import { useState } from "react";
import { Carte } from "@/lib/design/Carte";
import { Icone } from "@/lib/design/Icones";

type Props = {
  nom: string | null;
  faites: number;
  total: number;
  terminee: boolean;
  children: React.ReactNode;
};

/**
 * Une section terminée s'ouvre repliée, avec sa coche. Un pilier à seize
 * tâches ne montre jamais seize lignes : il montre ce qui reste.
 *
 * Elle recule aussi : une section finie n'a plus rien à demander, et lui
 * laisser l'ombre de celle en cours revenait à mettre tout l'écran sur le
 * même plan. C'est le défaut que la refonte du tableau de bord a fermé.
 */
export function SectionTaches({ nom, faites, total, terminee, children }: Props) {
  const [ouverte, setOuverte] = useState(!terminee);

  return (
    <Carte ton={terminee ? "calme" : "posee"} className="mt-4">
      <button
        type="button"
        onClick={() => setOuverte(!ouverte)}
        aria-expanded={ouverte}
        className="group -mx-2 flex w-full items-center justify-between gap-4 rounded-xl px-2 py-1 text-left transition-colors duration-200 hover:bg-fond-alt"
      >
        <span className="flex items-center gap-3">
          {terminee && (
            <span className="flex h-6 w-6 items-center justify-center rounded-pilule bg-orange-tint">
              <Icone nom="coche" className="h-3.5 w-3.5 text-orange" />
            </span>
          )}
          <span className="text-lg">{nom ?? "Tes tâches"}</span>
        </span>
        <span className="shrink-0 text-sm text-texte-doux">
          {faites} sur {total}
        </span>
      </button>

      {ouverte && <div className="mt-2 divide-y divide-bordure">{children}</div>}
    </Carte>
  );
}
