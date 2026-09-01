import { Carte } from "@/lib/design/Carte";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import { Bouton } from "@/lib/design/Bouton";
import { Icone } from "@/lib/design/Icones";
import { formaterDateHeure, estLeMemeJour } from "@/lib/dates";
import type { Coaching } from "@/lib/coaching/types";

export function ProchainsCoachings({ coachings }: { coachings: Coaching[] }) {
  const maintenant = new Date();

  return (
    <Carte ton="calme">
      <MicroLibelle>Tes prochains coachings</MicroLibelle>

      {coachings.length === 0 ? (
        <p className="mt-3 text-sm text-texte-doux">
          Rien de posé pour l&apos;instant. Ton coach pose ici tes points
          individuels. Les coachings collectifs, eux, se passent sur Circle.
        </p>
      ) : (
        <ul className="mt-3">
          {coachings.map((coaching) => (
            <li key={coaching.id} className="-mx-2 flex gap-3 rounded-xl border-b border-bordure px-2 py-3 transition-colors duration-200 last:border-0 hover:bg-fond-alt">
              {/* Le glyphe dans son conteneur arrondi, comme les documents et
                  les piliers : c'est ce qui fait qu'une liste se balaie de
                  l'oeil au lieu de se lire ligne à ligne. */}
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-icone bg-fond-alt">
                <Icone nom="evenement" className="h-5 w-5 text-texte-doux" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px]">{coaching.titre}</span>
                </div>
                <p className="mt-1 text-sm text-texte-doux">
                  {formaterDateHeure(coaching.prevu_le)}
                </p>

                {/* Le lien n'apparaît que le jour même. Un bouton qui ne sert
                    pas onze jours sur douze est du bruit, et il fait douter de
                    ceux qui servent. */}
                {coaching.lien_visio && estLeMemeJour(coaching.prevu_le, maintenant) && (
                  <a href={coaching.lien_visio} target="_blank" rel="noopener noreferrer">
                    <Bouton className="mt-3">Rejoindre</Bouton>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}
