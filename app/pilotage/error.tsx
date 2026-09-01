"use client";

import { Bouton } from "@/lib/design/Bouton";
import { Carte } from "@/lib/design/Carte";

/**
 * Sans cette limite, un incident de base sur le pipe affiche l'écran d'erreur
 * générique de Next, sans retour possible. Le pilotage est le chemin le plus
 * cliqué de la journée : il lui faut une porte de sortie.
 */
export default function ErreurPilotage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Carte className="max-w-lg">
      <h1 className="text-2xl">Quelque chose a coincé</h1>
      <p className="mt-2 text-texte-doux">
        L'écran n'a pas pu se charger. Réessaie : si ça recommence, c'est
        probablement la base de données qui ne répond pas.
      </p>
      <p className="mt-4 rounded-xl bg-fond-alt px-4 py-3 text-[13px] text-texte-doux">
        {error.message}
      </p>
      <div className="mt-6">
        <Bouton onClick={reset}>Réessayer</Bouton>
      </div>
    </Carte>
  );
}
