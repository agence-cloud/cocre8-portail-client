"use server";

import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/serveur";

/**
 * Sans elle, sortir de l'app demandait de vider ses cookies à la main. Le cas
 * arrive en démo : montrer l'espace d'un membre puis la vue de pilotage
 * suppose de changer de compte au milieu d'un appel.
 */
export async function seDeconnecter() {
  const supabase = await creerClientServeur();
  await supabase.auth.signOut();
  redirect("/connexion");
}
