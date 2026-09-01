/**
 * Les classes des champs de formulaire de l'app, en dehors des écrans
 * d'authentification qui ont les leurs.
 *
 * Ici plutôt que recopiées dans chaque écran : trois formulaires les
 * portaient déjà, et une bordure changée dans l'un aurait laissé les deux
 * autres derrière.
 */
export const ETIQUETTE = "mb-1.5 block text-[13px] text-texte-doux";

export const CHAMP =
  "w-full rounded-xl border-[1.5px] border-bordure bg-fond px-4 py-3 text-[15px] outline-none transition-colors duration-200 focus:border-orange";

/** La même chose en plus compact, pour les lignes d'une liste. */
export const CHAMP_LIGNE =
  "w-full rounded-lg border-[1.5px] border-bordure bg-fond px-3 py-2 text-sm outline-none transition-colors duration-200 focus:border-orange";
