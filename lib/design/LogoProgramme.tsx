"use client";

import { createContext, useContext } from "react";
import { REGLAGES_PAR_DEFAUT } from "@/lib/reglages/types";

/**
 * Le logotype du programme, affiché sur l'écran de connexion, dans la barre
 * latérale et sur la porte du profil.
 *
 * **Le nom, en toutes lettres, et rien de plus.** Il portait auparavant
 * l'italique sur tout et le gras sur le dernier mot : c'était le mot-symbole
 * de l'éditeur, une signature reconnaissable, donc exactement ce qui n'a rien
 * à faire dans un outil que chacun installe pour soi. Un coach qui écrit
 * « Master Lab » doit lire « Master Lab », pas la mise en forme de quelqu'un
 * d'autre.
 *
 * Composé en texte et non en tracé : il suit la police de l'app et reste net
 * à toutes les tailles.
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

  return (
    <p
      aria-label={nom}
      className={`font-sans leading-none font-medium tracking-[-0.03em] ${TAILLES[taille]} ${className}`}
    >
      {nom}
    </p>
  );
}
