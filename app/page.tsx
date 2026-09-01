import { redirect } from "next/navigation";
import { lireCompteConnecte } from "@/lib/auth/compte";
import { cheminAccueil } from "@/lib/auth/roles";

export default async function Accueil() {
  const compte = await lireCompteConnecte();
  if (!compte) redirect("/connexion");
  redirect(cheminAccueil(compte.role));
}
