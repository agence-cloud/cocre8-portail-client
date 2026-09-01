import type { ComponentProps } from "react";

type Ton = "neutre" | "attention" | "succes";

const STYLES: Record<Ton, string> = {
  neutre: "bg-fond-alt text-texte-doux",
  attention: "bg-orange-tint text-orange",
  succes: "bg-surface text-texte",
};

type Props = ComponentProps<"span"> & { ton?: Ton };

export function Badge({ ton = "neutre", className = "", ...props }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-pilule px-3 py-1 text-xs font-medium ${STYLES[ton]} ${className}`}
      {...props}
    />
  );
}
