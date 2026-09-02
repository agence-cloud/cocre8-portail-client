import type { ComponentProps } from "react";

type Variante = "primaire" | "secondaire" | "conversion";

const STYLES: Record<Variante, string> = {
  primaire: "bg-accent text-white hover:bg-accent-fonce",
  secondaire: "bg-fond text-texte border-[1.5px] border-texte/40 hover:border-texte hover:bg-surface",
  // Le seul vert de l'app.
  conversion: "bg-vert text-white hover:bg-vert-fonce",
};

type Props = ComponentProps<"button"> & { variante?: Variante };

export function Bouton({ variante = "primaire", className = "", ...props }: Props) {
  return (
    <button
      className={`rounded-pilule px-7 py-3.5 text-[15px] font-medium transition-all duration-200 disabled:opacity-50 ${STYLES[variante]} ${className}`}
      {...props}
    />
  );
}
