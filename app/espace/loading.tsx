import { Squelette } from "@/lib/design/Squelette";

// Une bordure fine, en plus du gris du squelette : le fond de /espace est
// lui-même gris clair (bg-fond-alt), presque du même ton que le squelette.
// Sans bordure, le squelette se fond dans la page et redevient invisible,
// exactement ce qu'il est censé empêcher.
const CONTOUR = "border border-bordure";

/**
 * Next affiche ce squelette pendant qu'une route de /espace charge, à la
 * place de la page blanche qui laissait croire que l'app s'était figée.
 */
export default function ChargementEspace() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Squelette className={`h-9 w-72 ${CONTOUR}`} />
        <Squelette className={`h-4 w-56 ${CONTOUR}`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Squelette className={`h-48 lg:col-span-2 ${CONTOUR}`} />
        <Squelette className={`h-48 ${CONTOUR}`} />
      </div>
    </div>
  );
}
