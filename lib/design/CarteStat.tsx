import type { ReactNode } from "react";
import { Icone, type NomIcone } from "@/lib/design/Icones";

/**
 * Un chiffre isolé, son libellé, et une icône dans son conteneur teinté.
 *
 * **Deux éléments que la charte Cocre8 impose et que l'app n'appliquait nulle
 * part.** Le conteneur d'icône, d'abord : icône orange dans un carré arrondi
 * `#FFF0EA`, c'est écrit noir sur blanc dans la charte et ça n'existait dans
 * aucun écran. Le gros chiffre isolé ensuite, que la charte décrit comme un
 * élément de design à part entière et non comme du contenu.
 *
 * C'est de là que vient une bonne part de l'écart entre une app qu'on
 * trouve belle et une autre : les premières ouvrent sur une rangée comme
 * celle-ci, les secondes ouvrent sur du texte.
 *
 * **Le chiffre est en bleu nuit et non en charcoal**.
 * À cette taille, `#272727` paraît gris ; le nuit tranche et donne au chiffre
 * le poids qu'il doit avoir.
 *
 * `valeur` est un noeud et non une chaîne : certaines cartes veulent une
 * unité plus petite collée au nombre, ou une date en deux morceaux.
 */
export function CarteStat({
  icone,
  libelle,
  valeur,
  detail,
}: {
  icone: NomIcone;
  libelle: string;
  valeur: ReactNode;
  detail?: string;
}) {
  return (
    <div className="rounded-carte border border-bordure bg-fond p-5 shadow-douce">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-icone bg-orange-tint text-orange"
        >
          <Icone nom={icone} className="h-[22px] w-[22px]" />
        </span>
        <span className="text-[13px] font-medium text-texte-doux">{libelle}</span>
      </div>

      {/* `tabular-nums` : sans lui, une valeur qui passe de 9 à 10 fait sauter
          toute la carte, les chiffres n'ayant pas la même chasse. */}
      <p className="mt-4 text-[32px] font-bold leading-none tracking-[-0.03em] text-nuit tabular-nums">
        {valeur}
      </p>
      {detail && <p className="mt-2 text-sm text-texte-doux">{detail}</p>}
    </div>
  );
}
