import type { ComponentProps } from "react";

/**
 * Le petit libellé en capitales espacées qui coiffe une section.
 *
 * C'est l'une des trois choses que la refonte de la connexion a installées,
 * avec l'écart typographique fort et les survols qui bougent. Il fait deux
 * choses à la fois : il nomme la section, et il crée l'écart d'échelle qui
 * manquait partout, entre 12 pixels de capitales et le titre qui suit.
 *
 * Toujours au-dessus de ce qu'il annonce, jamais à côté. Et jamais deux fois
 * dans la même carte : il perdrait sa fonction de repère.
 */
export function MicroLibelle({ className = "", ...props }: ComponentProps<"p">) {
  return (
    <p
      className={`text-[11px] font-semibold tracking-[0.18em] text-texte-doux/60 uppercase ${className}`}
      {...props}
    />
  );
}
