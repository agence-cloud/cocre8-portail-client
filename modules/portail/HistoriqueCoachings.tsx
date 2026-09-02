"use client";

import { useState } from "react";
import { Carte } from "@/lib/design/Carte";
import { Icone } from "@/lib/design/Icones";
import { formaterDateHeure } from "@/lib/dates";
import type { Coaching } from "@/lib/coaching/types";

/**
 * Les coachings passés d'un membre, avec ce qui en reste.
 *
 * Le client doit pouvoir retrouver les séances faites ensemble, avec le lien
 * de l'enregistrement, la transcription et le résumé.
 *
 * Trois morceaux sur quatre arrivent donc ici : le lien, le résumé, la
 * transcription. Le quatrième, la note interne du coach, n'existe même pas
 * dans le type reçu : la vue `coaching_membre` ne la sélectionne pas.
 *
 * **Une seule séance ouverte à la fois, et repliée par défaut.** Une
 * transcription fait des milliers de mots : dépliées ensemble, elles font de
 * cette page un mur de texte où le résumé, qui est ce qu'on vient chercher,
 * disparaît. Repliée, chaque séance ne montre que ce qui permet de la
 * reconnaître, son titre et sa date.
 *
 * **L'enregistrement s'ouvre chez son hébergeur, il ne se joue pas ici**, et
 * ce n'est pas un choix de confort. La plupart des outils de visio refusent
 * d'être intégrés : leurs pages renvoient `x-frame-options: SAMEORIGIN` ou
 * `frame-ancestors 'none'`, donc un lecteur dans une iframe serait bloqué par
 * le navigateur, quoi qu'on code. Le lien ouvre donc un onglet.
 */
export function HistoriqueCoachings({ coachings }: { coachings: Coaching[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null);

  if (coachings.length === 0) {
    return (
      <Carte className="mt-8">
        <p className="text-sm text-texte-doux">
          Aucun coaching passé pour l&apos;instant. Dès qu&apos;une séance aura
          eu lieu, tu la retrouveras ici avec son enregistrement et son résumé.
        </p>
      </Carte>
    );
  }

  return (
    /* Une vraie liste, pas une pile de cartes : c'en est une, et le balisage
       le dit à qui navigue au lecteur d'écran. */
    <ul className="mt-8 space-y-4">
      {coachings.map((coaching) => {
        const depliee = ouverte === coaching.id;

        return (
          <li key={coaching.id}>
            {/* Les tokens de `Carte` sans son rembourrage, et non
                `<Carte className="p-0">` : Tailwind ne résout pas deux
                utilitaires contradictoires par l'ordre dans l'attribut, c'est
                l'ordre dans la feuille qui tranche, et `p-6` y est défini
                après `p-0`. Le rembourrage serait resté. Ici chaque moitié
                pose le sien, et le filet qui les sépare doit courir d'un bord
                à l'autre.

                `overflow-hidden` pour que le survol de l'en-tête respecte les
                coins arrondis. */}
            <div className="overflow-hidden rounded-carte border border-bordure bg-fond shadow-carte">
              {/* Toute l'en-tête est le bouton, pas seulement le titre : une
                  cible de la largeur de la carte se clique sans viser, et
                  c'est ce qu'on attend d'une carte qui s'ouvre. */}
              <button
                type="button"
                onClick={() => setOuverte(depliee ? null : coaching.id)}
                aria-expanded={depliee}
                className="group flex w-full items-center gap-3 px-6 py-5 text-left transition-colors duration-200 hover:bg-fond-alt"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-icone bg-fond-alt transition-colors duration-200 group-hover:bg-fond">
                  <Icone nom="evenement" className="h-5 w-5 text-texte-doux" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[15px]">
                    {coaching.titre ?? "Coaching"}
                  </span>
                  <span className="mt-1 block text-sm text-texte-doux">
                    {formaterDateHeure(coaching.prevu_le)}
                  </span>
                </span>

                <Icone
                  nom="replier"
                  className={`h-4 w-4 shrink-0 text-texte-doux transition-transform duration-200 ${
                    depliee ? "-rotate-90" : "rotate-180"
                  }`}
                />
              </button>

              {depliee && (
                <div className="border-t border-bordure px-6 py-5">
                  {coaching.lien_enregistrement ? (
                    <a
                      href={coaching.lien_enregistrement}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-bordure bg-fond-alt px-4 py-3 transition-colors duration-200 hover:border-accent"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Icone nom="demo" className="h-5 w-5 text-fond" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        Revoir l&apos;enregistrement
                      </span>
                      <span aria-hidden="true" className="text-xs text-texte-doux/60">
                        ↗
                      </span>
                    </a>
                  ) : (
                    <p className="text-sm text-texte-doux">
                      L&apos;enregistrement de cette séance n&apos;est pas
                      disponible.
                    </p>
                  )}

                  <h3 className="mt-6 text-sm text-texte-doux">Le résumé</h3>
                  {coaching.resume ? (
                    <p className="mt-2 text-[15px] whitespace-pre-wrap">
                      {coaching.resume}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-texte-doux">
                      Le résumé de cette séance n&apos;est pas encore écrit.
                    </p>
                  )}

                  {coaching.transcription && (
                    <>
                      <h3 className="mt-6 text-sm text-texte-doux">
                        La transcription
                      </h3>
                      {/* Bornée en hauteur et défilante pour elle-même : des
                          milliers de mots posés d'un bloc repousseraient le
                          coaching suivant hors de l'écran. */}
                      <p className="mt-2 max-h-96 overflow-y-auto rounded-xl border border-bordure bg-fond-alt px-4 py-3 text-sm whitespace-pre-wrap text-texte-doux">
                        {coaching.transcription}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
