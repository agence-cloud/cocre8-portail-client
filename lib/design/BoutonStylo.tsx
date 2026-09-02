"use client";

import { Icone } from "@/lib/design/Icones";

/**
 * Le stylo qui bascule un écran de la lecture à l'édition. Il vit dans le
 * socle parce que deux modules s'en servent, chacun de son côté : la fiche du
 * pilotage et le profil entrepreneur du portail. Sans lui ici, l'un des deux
 * importerait le composant de l'autre, ce que l'architecture interdit
 * (voir CLAUDE.md).
 *
 * Ce qui se partage s'arrête au bouton. La mécanique d'édition, elle, ne se
 * partage pas : la fiche tient un brouillon de champs typés et l'envoie en
 * une action, le profil tient des réponses libres et n'a pas les mêmes
 * règles. Un contexte commun aurait dû connaître les deux, donc les relier,
 * ce qui est exactement ce qu'on veut éviter.
 */
export function BoutonStylo({
  onClick,
  intitule,
  className = "",
}: {
  onClick: () => void;
  /** Ce que le bouton ouvre, pour l'infobulle et le lecteur d'écran. */
  intitule: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={intitule}
      title={intitule}
      className={`flex items-center justify-center rounded-pilule border-[1.5px] border-bordure px-4 py-3.5 text-texte-doux transition-colors duration-200 hover:border-accent hover:text-accent ${className}`}
    >
      <Icone nom="stylo" className="h-4 w-4" />
    </button>
  );
}
