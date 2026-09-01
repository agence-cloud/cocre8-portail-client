"use client";

import { createContext, useContext } from "react";
import { REGLAGES_PAR_DEFAUT } from "@/lib/reglages/types";

/**
 * Le logotype du programme, affiché sur l'écran de connexion, dans la barre
 * latérale et sur la porte du profil.
 *
 * **Deux mots, et c'est structurel.** L'italique porte les deux, le gras ne
 * porte que le dernier : c'est ce contraste qui fait la signature. Un nom
 * d'un seul mot s'affiche donc en gras entier, sans que la composition casse.
 *
 * Composé en texte et non en tracé : c'est un mot-symbole typographique, il
 * suit la police de l'app et reste net à toutes les tailles.
 *
 * **Le nom vient d'un contexte et non d'une propriété**, parce que les trois
 * écrans qui l'affichent sont des composants clients, et que deux d'entre eux
 * sont trop loin de leur page pour qu'une propriété descende sans traverser
 * quatre composants qui n'en ont que faire. Le contexte est posé une fois
 * dans la mise en page racine.
 *
 * La taille est un choix parmi deux, pas une classe qu'on passe de
 * l'extérieur. Un `text-[22px]` ajouté au `className` ne l'emporterait pas de
 * façon fiable sur le `text-[40px]` d'ici : à spécificité égale, c'est
 * l'ordre dans la feuille de style qui tranche, pas l'ordre dans l'attribut.
 */
const ContexteProgramme = createContext<string>(REGLAGES_PAR_DEFAUT.nom_programme);

export function ProgrammeProvider({
  nom,
  children,
}: {
  nom: string;
  children: React.ReactNode;
}) {
  return <ContexteProgramme.Provider value={nom}>{children}</ContexteProgramme.Provider>;
}

export function useNomDuProgramme(): string {
  return useContext(ContexteProgramme);
}

const TAILLES = {
  /** La page de connexion, où le logotype accueille. */
  grand: "text-[40px]",
  /** La barre latérale, où il signe sans prendre la place. */
  petit: "text-[21px]",
} as const;

export function LogoProgramme({
  taille = "grand",
  className = "",
}: {
  taille?: keyof typeof TAILLES;
  className?: string;
}) {
  const nom = useNomDuProgramme();

  // Le dernier mot porte le gras, tout ce qui précède reste en normal. Un nom
  // d'un seul mot n'a donc pas de partie normale, et le `join` rend une
  // chaîne vide plutôt qu'un espace parasite.
  const mots = nom.trim().split(/\s+/);
  const dernier = mots[mots.length - 1];
  const debut = mots.slice(0, -1).join(" ");

  return (
    <p
      aria-label={nom}
      className={`font-sans leading-none tracking-[-0.04em] italic ${TAILLES[taille]} ${className}`}
    >
      {debut && <span className="font-normal">{debut} </span>}
      <span className="font-bold">{dernier}</span>
    </p>
  );
}
