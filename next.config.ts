import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * **La construction refuse de partir sans les valeurs de la base**, et c'est
 * la leçon de la première installation.
 *
 * Next recopie les valeurs `NEXT_PUBLIC_` dans le code au moment de la
 * construction, pas à l'exécution. Une construction sans elles réussit donc
 * très bien, se déploie, et l'app ne répond qu'une fois en ligne : l'écran
 * s'affiche, la connexion refuse, et rien ne dit pourquoi. Une soirée y est
 * passée.
 *
 * Mieux vaut échouer ici, où l'hébergeur affiche le message en rouge et où
 * personne ne peut le manquer. Seulement à la construction de production :
 * `next dev` continue de démarrer sans rien, pour qu'on puisse ouvrir le code
 * et se promener avant d'avoir créé quoi que ce soit.
 *
 * La forme est vérifiée en plus de la présence, parce qu'une valeur présente
 * mais fausse produit exactement le même silence. `lib/supabase/config.ts`
 * fait la même vérification à l'exécution, et `/diagnostic` la montre à
 * l'écran : trois filets sur le même trou, parce qu'il a coûté cher.
 */
const ADRESSE_PROJET = /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/;

function verifierLaConfiguration(): void {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const cle = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  const manquantes = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !cle && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  if (manquantes.length > 0) {
    throw new Error(
      `Construction impossible : ${manquantes.join(" et ")} ${
        manquantes.length > 1 ? "manquent" : "manque"
      }.\n\n` +
        "Ces valeurs se trouvent dans ton projet Supabase, sous Project Settings puis API Keys.\n" +
        "Chez Vercel, pose-les en type « Config » et non « Secret » : une variable Secret n'est\n" +
        "pas lisible pendant la construction, et arriverait vide sans que rien ne le montre.",
    );
  }

  if (!ADRESSE_PROJET.test(url.replace(/\/+$/, ""))) {
    throw new Error(
      "Construction impossible : NEXT_PUBLIC_SUPABASE_URL ne ressemble pas à l'adresse d'un\n" +
        "projet Supabase. Attendu : https://<reference>.supabase.co, sans rien après.\n\n" +
        "Ce n'est pas l'adresse du tableau de bord, qui commence par https://supabase.com/dashboard.",
    );
  }

  // Une clé Supabase est de l'ASCII imprimable. Tout ce qui en sort vient d'un
  // copier-coller sur la valeur affichée masquée, qui a la même longueur que
  // la vraie : c'est la faute que la première installation a faite.
  for (const caractere of cle) {
    const code = caractere.codePointAt(0) ?? 0;
    if (code < 33 || code > 126) {
      throw new Error(
        `Construction impossible : NEXT_PUBLIC_SUPABASE_ANON_KEY contient « ${caractere} ».\n\n` +
          "C'est la version masquée de la clé, pas la clé. Recopie-la avec le bouton de copie\n" +
          "de Supabase, jamais en sélectionnant le texte affiché à l'écran.",
      );
    }
  }
}

const configurer = (phase: string): NextConfig => {
  if (phase === PHASE_PRODUCTION_BUILD) verifierLaConfiguration();
  return {};
};

export default configurer;
