"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icone } from "@/lib/design/Icones";

/**
 * Une fenêtre posée par dessus l'écran, pour un formulaire qui n'a pas sa
 * place dans le flux.
 *
 * **Pourquoi elle existe.** Chaque formulaire de création se dépliait là où
 * son bouton se trouvait : sous l'en-tête, au milieu d'une carte, au bas
 * d'une liste. La page sautait à l'ouverture, ce qu'on venait de lire partait
 * plus bas, et rien ne disait par où commencer. Un formulaire n'est pas une
 * annexe de ce qui l'entoure, c'est ce qu'on fait à ce moment-là.
 *
 * **Elle rend le reste inerte pour de bon.** La page derrière ne défile plus
 * tant qu'elle est ouverte, sans quoi le fond bouge sous la fenêtre à la
 * première molette. `aria-modal` et le rôle disent la même chose aux lecteurs
 * d'écran.
 *
 * **Trois façons d'en sortir**, parce qu'aucune n'est évidente pour tout le
 * monde : la croix, le fond, la touche Échap.
 */
export function Modale({
  titre,
  sous_titre,
  onFermer,
  children,
}: {
  titre: string;
  sous_titre?: string;
  onFermer: () => void;
  children: ReactNode;
}) {
  const panneau = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") onFermer();
    }
    document.addEventListener("keydown", auClavier);

    const defilement = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Le premier champ prend le curseur : la fenêtre s'ouvre sur un geste,
    // autant qu'il soit déjà commencé.
    panneau.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();

    return () => {
      document.removeEventListener("keydown", auClavier);
      document.body.style.overflow = defilement;
    };
  }, [onFermer]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8"
      // Le fond ferme, mais seulement quand c'est bien lui qu'on a pressé :
      // sans cette égalité, un glisser commencé dans un champ et relâché sur
      // le fond effacerait tout ce qui vient d'être saisi.
      onMouseDown={(evenement) => {
        if (evenement.target === evenement.currentTarget) onFermer();
      }}
    >
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className="my-auto w-full max-w-xl overflow-hidden rounded-carte border border-bordure bg-fond shadow-haute"
      >
        <div className="flex items-start justify-between gap-4 border-b border-bordure px-6 py-5">
          <div>
            <h2 className="text-xl text-titre">{titre}</h2>
            {sous_titre && <p className="mt-1 text-[13px] text-texte-doux">{sous_titre}</p>}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="-mr-1 shrink-0 rounded-icone p-1.5 text-texte-doux transition-colors duration-200 hover:bg-surface hover:text-texte"
          >
            <Icone nom="croix" className="h-4 w-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
