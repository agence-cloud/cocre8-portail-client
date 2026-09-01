import type { ComponentProps } from "react";

/**
 * Deux tons, et c'est tout l'enjeu : sans eux, toutes les cartes d'un écran
 * ont le même poids et rien ne dit à l'oeil par où commencer. C'est le défaut
 * qu'on appelle « un style un peu vieillot ».
 *
 * `posee` porte l'ombre douce et flotte au-dessus du fond : c'est la carte
 * qu'on regarde en premier, une par écran.
 * `calme` n'a que sa bordure et recule : c'est tout le reste.
 *
 * Un ton et non une classe passée de l'extérieur : `shadow-none` ajouté au
 * `className` ne l'emporterait pas de façon fiable sur `shadow-carte`. À
 * spécificité égale, c'est l'ordre dans la feuille de style qui tranche, pas
 * l'ordre dans l'attribut. Le même piège avait déjà fait échouer un `p-0` sur
 * cette carte.
 */
const TONS = {
  posee: "shadow-carte",
  calme: "",
} as const;

type Props = ComponentProps<"div"> & { ton?: keyof typeof TONS };

export function Carte({ ton = "posee", className = "", ...props }: Props) {
  return (
    <div
      className={`rounded-carte border border-bordure bg-fond p-6 ${TONS[ton]} ${className}`}
      {...props}
    />
  );
}
