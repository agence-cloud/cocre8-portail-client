import { redirect } from "next/navigation";
import { installationFaite } from "@/lib/auth/installation";
import { FormulaireConnexion } from "./FormulaireConnexion";

/**
 * L'écran de connexion, précédé d'une question : cet outil a-t-il seulement
 * déjà été mis en service ?
 *
 * **Un formulaire de connexion sur une base vierge est un cul-de-sac.**
 * Personne n'a de compte, il n'y a pas d'inscription, et rien à l'écran ne
 * dit où aller. La racine pose déjà la question, mais elle ne couvre pas
 * celui qui arrive ici par un lien, un signet, ou une redirection.
 *
 * Le coût est d'une requête sur le seul écran de connexion, et seulement
 * pour un visiteur sans session. L'écran d'installation, lui, se referme de
 * son côté dès que l'outil est installé.
 */
export default async function PageConnexion() {
  if (!(await installationFaite())) redirect("/installation");

  return <FormulaireConnexion />;
}
