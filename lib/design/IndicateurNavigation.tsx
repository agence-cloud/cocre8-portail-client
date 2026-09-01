"use client";

import { useLinkStatus } from "next/link";

/**
 * Le retour visuel sur le lien qu'on vient de cliquer.
 *
 * **Ce qu'il répare.** Entre le clic et l'arrivée du squelette, il ne se
 * passait rien : le lien restait au repos, la page précédente restait
 * affichée, et rien ne disait que l'app avait entendu. Les `loading.tsx`
 * couvrent la suite, pas cet instant-là, parce qu'ils n'apparaissent qu'une
 * fois la navigation commencée côté routeur.
 *
 * **Il doit vivre DANS le `Link`**, c'est la contrainte de `useLinkStatus` :
 * le hook lit l'état du lien le plus proche au-dessus de lui. Posé à côté,
 * il ne saurait rien.
 *
 * **Il ne se montre qu'après 120 ms**, et c'est le point délicat. Une
 * navigation préchargée arrive en quelques dizaines de millisecondes : un
 * indicateur immédiat clignoterait à chaque clic, et un clignotement
 * permanent fait paraître une app plus agitée, pas plus rapide. Le composant
 * se monte tout de suite mais son animation part en `opacity: 0` avec un
 * retard : une navigation rapide le démonte avant qu'il n'ait rien montré.
 */
export function IndicateurNavigation() {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span
      aria-hidden="true"
      className="apparait-retarde size-3.5 shrink-0 rounded-full border-[1.5px] border-current border-t-transparent motion-safe:animate-spin"
    />
  );
}
