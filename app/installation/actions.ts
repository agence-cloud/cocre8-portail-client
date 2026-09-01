"use server";

import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/serveur";
import { installerLePremierCompte } from "@/lib/auth/installation";

export type EtatInstallation = { erreur: string | null };

export async function installer(
  _precedent: EtatInstallation,
  donnees: FormData,
): Promise<EtatInstallation> {
  const nom = String(donnees.get("nom") ?? "");
  const email = String(donnees.get("email") ?? "");
  const motDePasse = String(donnees.get("motDePasse") ?? "");

  const resultat = await installerLePremierCompte(nom, email, motDePasse);

  if (resultat.fait === "deja_faite") {
    return {
      erreur: "Cet outil a déjà été mis en service. Connecte-toi avec ton compte.",
    };
  }

  if (resultat.fait === "impossible") return { erreur: resultat.pourquoi };

  // La connexion dans la foulée, et non un renvoi vers le formulaire : celui
  // qui vient de poser son mot de passe n'a aucune raison de le ressaisir
  // trois secondes plus tard.
  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: motDePasse,
  });

  // Le compte existe, seule la connexion a échoué : on l'envoie se connecter
  // plutôt que de lui laisser croire que l'installation a raté.
  if (error) redirect("/connexion");

  redirect("/pilotage");
}
