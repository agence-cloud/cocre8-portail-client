"use client";

import { useState, useTransition } from "react";
import {
  planifierCalendrier,
  changerDateOuverture,
} from "@/modules/portail/actions";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";
import { Badge } from "@/lib/design/Badge";
import { etatPilier } from "@/lib/pilier/etat";
import { formaterJourMois, jourISO } from "@/lib/dates";
import type { Pilier, AccesPilier } from "@/lib/pilier/types";

type Props = {
  personneId: string;
  piliers: Pilier[];
  calendrier: AccesPilier[];
  /** La date de début de l'accompagnement, proposée par défaut. */
  demarrageSuggere: string | null;
};

export function CalendrierPiliers({
  personneId,
  piliers,
  calendrier,
  demarrageSuggere,
}: Props) {
  const aujourdhui = new Date();
  const [demarrage, setDemarrage] = useState(
    demarrageSuggere ?? jourISO(aujourdhui),
  );
  const [confirme, setConfirme] = useState(false);
  const [, demarrer] = useTransition();

  const dates = new Map(calendrier.map((a) => [a.pilier_id, a.date_ouverture]));

  return (
    <Carte className="mt-6">
      <h2 className="text-lg">Son calendrier de piliers</h2>
      <p className="mt-2 text-sm text-texte-doux">
        Le pilier 0 s'ouvre le jour où tu génères le calendrier, pour qu'il
        fasse son onboarding sans attendre. Les trois suivants suivent la date
        de démarrage, à un mois d'intervalle.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label htmlFor="demarrage" className="text-sm text-texte-doux">
          Démarrage
        </label>
        <input
          id="demarrage"
          type="date"
          value={demarrage}
          onChange={(evenement) => setDemarrage(evenement.target.value)}
          className="rounded-icone border border-bordure px-3 py-2 text-sm"
        />

        {confirme ? (
          <>
            <span className="text-sm text-texte-doux">
              Ça écrasera les dates déjà posées, y compris celles corrigées à la main.
            </span>
            <Bouton
              onClick={() =>
                demarrer(async () => {
                  await planifierCalendrier(personneId, demarrage);
                  setConfirme(false);
                })
              }
            >
              Confirmer
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setConfirme(false)}>
              Annuler
            </Bouton>
          </>
        ) : (
          <Bouton onClick={() => setConfirme(true)}>Générer le calendrier</Bouton>
        )}
      </div>

      <div className="mt-6">
        {piliers.map((pilier) => {
          const date = dates.get(pilier.id) ?? null;
          const etat = etatPilier(date, aujourdhui);

          return (
            <div
              key={pilier.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-bordure py-3 last:border-0"
            >
              <span className="text-sm">
                {pilier.numero}. {pilier.nom}
              </span>

              <span className="flex items-center gap-3">
                {etat.statut === "ouvert" && <Badge ton="succes">ouvert</Badge>}
                {etat.statut === "a_venir" && (
                  <Badge>le {formaterJourMois(etat.date)}</Badge>
                )}
                {etat.statut === "ferme" && <Badge ton="attention">fermé</Badge>}

                <input
                  type="date"
                  defaultValue={date ?? ""}
                  onChange={(evenement) =>
                    demarrer(async () => {
                      await changerDateOuverture(
                        personneId,
                        pilier.id,
                        evenement.target.value || null,
                      );
                    })
                  }
                  className="rounded-icone border border-bordure px-3 py-1.5 text-sm"
                />
              </span>
            </div>
          );
        })}
      </div>
    </Carte>
  );
}
