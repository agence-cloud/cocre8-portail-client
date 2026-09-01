/**
 * Le logotype du programme, affiché sur l'écran de connexion, dans la barre
 * latérale et sur la porte du profil.
 *
 * **Deux mots, et c'est structurel.** L'italique porte les deux, le gras ne
 * porte que le second : c'est ce contraste qui fait la signature. Un nom
 * d'un seul mot s'affiche donc en gras entier, sans que la composition
 * casse.
 *
 * Composé en texte et non en tracé : c'est un mot-symbole typographique, il
 * suit la police de l'app et reste net à toutes les tailles.
 *
 * **Le nom deviendra un réglage.** Il est ici en constante le temps que
 * l'écran de réglages existe, et il n'a jamais eu à être une variable
 * d'environnement : un `NEXT_PUBLIC_` est recopié dans le paquet à la
 * construction, il n'offre donc aucune souplesse qu'une constante n'ait
 * déjà, et une variable oubliée fait disparaître le contenu sans rien dire.
 *
 * La taille est un choix parmi deux, pas une classe qu'on passe de
 * l'extérieur. Un `text-[22px]` ajouté au `className` ne l'emporterait pas
 * de façon fiable sur le `text-[40px]` d'ici : à spécificité égale, c'est
 * l'ordre dans la feuille de style qui tranche, pas l'ordre dans l'attribut.
 */
export const NOM_PROGRAMME = "Espace Client";

const TAILLES = {
  /** La page de connexion, où le logotype accueille. */
  grand: "text-[40px]",
  /** La barre latérale, où il signe sans prendre la place. */
  petit: "text-[21px]",
} as const;

export function LogoProgramme({
  taille = "grand",
  className = "",
  nom = NOM_PROGRAMME,
}: {
  taille?: keyof typeof TAILLES;
  className?: string;
  nom?: string;
}) {
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
