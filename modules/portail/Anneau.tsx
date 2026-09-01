/**
 * La progression en anneau, avec le chiffre au centre.
 *
 * Le chiffre est le seul élément en gras de l'écran : la charte réserve le
 * gras aux chiffres, qui sont un élément de design à part entière.
 */
export function Anneau({
  pourcentage,
  taille = 104,
}: {
  pourcentage: number;
  taille?: number;
}) {
  const epaisseur = 6;
  const rayon = (taille - epaisseur) / 2;
  const circonference = 2 * Math.PI * rayon;
  const rempli = (circonference * pourcentage) / 100;

  return (
    <div className="relative inline-flex" style={{ width: taille, height: taille }}>
      <svg
        width={taille}
        height={taille}
        viewBox={`0 0 ${taille} ${taille}`}
        aria-hidden="true"
      >
        {/* La piste. Sa couleur est la bordure et non `fond-alt` : posé sur
            une page dont le fond est justement `fond-alt`, l'anneau perdait sa
            piste et paraissait coupé net à l'endroit où la part remplie
            s'arrête. La bordure se voit sur les deux fonds de la charte. */}
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke="var(--color-bordure)"
          strokeWidth={epaisseur}
        />
        {/* Le quart de tour part du haut : un anneau qui démarre à droite se
            lit mal, l'œil cherche midi. */}
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke="var(--color-orange)"
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeDasharray={`${rempli} ${circonference}`}
          transform={`rotate(-90 ${taille / 2} ${taille / 2})`}
          className="transition-all duration-200"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
        aria-label={`${pourcentage} pour cent`}
      >
        {pourcentage} %
      </span>
    </div>
  );
}
