import { redirect } from "next/navigation";
import { lireCompteConnecte } from "@/lib/auth/compte";
import { installationFaite } from "@/lib/auth/installation";
import { cheminAccueil } from "@/lib/auth/roles";

export default async function Accueil() {
  const compte = await lireCompteConnecte();
  if (compte) redirect(cheminAccueil(compte.role));

  // Une base vierge n'envoie pas vers un formulaire de connexion qui ne peut
  // fonctionner pour personne. Celui qui vient de déployer l'outil ouvre son
  // adresse et tombe sur la seule chose qu'il puisse faire.
  //
  // La question n'est posée qu'ici, et seulement pour un visiteur sans
  // session : sur une app installée, c'est une requête de plus sur la page
  // d'accueil, et rien du tout sur les autres.
  if (!(await installationFaite())) redirect("/installation");

  redirect("/connexion");
}
