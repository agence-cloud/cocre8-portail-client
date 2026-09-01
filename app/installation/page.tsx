import { notFound } from "next/navigation";
import { installationFaite } from "@/lib/auth/installation";
import { FormulaireInstallation } from "./FormulaireInstallation";

/**
 * La porte de la première mise en service.
 *
 * Elle n'existe que sur une base vierge. Une fois l'outil installé, elle rend
 * un 404 : c'est la seconde garde, celle qui se voit. La première, invisible
 * et décisive, est la table `installation` qui n'accepte qu'une ligne, et qui
 * tient même si deux personnes soumettent le formulaire au même instant.
 *
 * Cette page est publique, forcément : celui qui installe n'a pas encore de
 * compte. Elle est donc listée dans `ROUTES_PUBLIQUES`, comme les écrans du
 * chemin d'accès d'un client.
 */
export default async function PageInstallation() {
  if (await installationFaite()) notFound();

  return <FormulaireInstallation />;
}
