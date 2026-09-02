"use client";

import { useRef, useState, useTransition } from "react";
import {
  poserCoaching,
  modifierCompteRenduCoaching,
  retirerCoaching,
} from "@/modules/portail/actions";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";
import { Icone } from "@/lib/design/Icones";
import { CompteRendu } from "@/lib/design/CompteRendu";
import { formaterDateHeure } from "@/lib/dates";
import type { Appel } from "@/lib/personne/appels.types";

type Props = {
  personneId: string;
  coachings: Appel[];
};

const CHAMP = "rounded-icone border border-bordure px-3 py-2 text-sm";

/**
 * Les coachings d'un membre, côté coach : ce qui arrive, ce qui a eu lieu, et
 * le compte rendu de chacun.
 *
 * Une séance terminée doit porter tout ce qu'on en sait, comme n'importe
 * quel autre rendez-vous. C'est pour ça qu'une seule table dit « une
 * réunion » : un coaching posé par le coach n'aurait aucun moyen de recevoir
 * un compte rendu s'il vivait dans une table à part.
 *
 * Le panneau lui-même vient du socle : il ne porte pas l'action
 * d'enregistrement, elle arrive en propriété avec la garde du module.
 *
 * **Le compte rendu s'ouvre toujours.** Une séance portait auparavant une
 * « issue » à noter, Honoré ou No-show, et son compte rendu restait fermé
 * tant que le coach ne l'avait pas cliquée. C'était un reste de l'app de
 * prospection dont cet outil est extrait, où le taux de présence était une
 * métrique commerciale. Un coach qui suit ses clients ne compte pas leurs
 * absences : il pose une séance, il écrit ce qui s'y est dit, et il retire
 * celle qui n'a pas eu lieu.
 */
export function CoachingsCoach({ personneId, coachings }: Props) {
  const formulaire = useRef<HTMLFormElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [deplie, setDeplie] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function poser(donnees: FormData) {
    demarrer(async () => {
      const resultat = await poserCoaching(donnees);
      setErreur(resultat.erreur);
      if (!resultat.erreur) formulaire.current?.reset();
    });
  }

  return (
    <Carte className="mt-6">
      <h2 className="text-lg">Ses coachings</h2>

      {coachings.length === 0 ? (
        <p className="mt-2 text-sm text-texte-doux">Rien de posé pour l&apos;instant.</p>
      ) : (
        <div className="mt-3">
          {coachings.map((coaching) => (
            <div key={coaching.id} className="border-b border-bordure last:border-0">
              <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                {/* L'intitulé déplie, pas la ligne entière : elle porte déjà
                    des boutons, et un bouton dans un bouton n'est ni valide
                    ni utilisable au clavier. */}
                <button
                  type="button"
                  onClick={() => setDeplie(deplie === coaching.id ? null : coaching.id)}
                  aria-expanded={deplie === coaching.id}
                  className="flex items-center gap-2 text-left transition-colors duration-200 hover:text-accent"
                >
                  <Icone
                    nom="replier"
                    className={`h-3.5 w-3.5 shrink-0 text-texte-doux transition-transform duration-200 ${
                      deplie === coaching.id ? "-rotate-90" : "rotate-180"
                    }`}
                  />
                  <span className="text-sm font-medium">{coaching.titre ?? "Coaching"}</span>
                  <span className="text-xs text-texte-doux">
                    {formaterDateHeure(coaching.prevu_le)}
                  </span>
                </button>

                {/* Le retrait demande confirmation sur place, et l'écran
                    dit ce qui part : le compte rendu s'en va avec la séance,
                    et c'est lui qui a de la valeur. */}
                <ConfirmerRetrait
                  aUnCompteRendu={Boolean(
                    coaching.resume || coaching.transcription || coaching.notes,
                  )}
                  enCours={enCours}
                  onRetirer={() =>
                    demarrer(async () => {
                      await retirerCoaching(coaching.id);
                    })
                  }
                />
              </div>

              {deplie === coaching.id && (
                <div className="mt-1 mb-3 rounded-xl border border-bordure bg-fond-alt px-4 py-4">
                  <CompteRendu
                    valeurs={{
                      lien_enregistrement: coaching.lien_enregistrement,
                      transcription: coaching.transcription,
                      resume: coaching.resume,
                      notes: coaching.notes,
                    }}
                    source={coaching.source_externe}
                    onEnregistrer={(champs) =>
                      modifierCompteRenduCoaching(coaching.id, champs)
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form ref={formulaire} action={poser} className="mt-5 flex flex-wrap items-end gap-3">
        <input type="hidden" name="personne_id" value={personneId} />
        <input
          name="titre"
          required
          placeholder="Titre du coaching"
          className={`min-w-60 flex-1 ${CHAMP}`}
        />
        <input type="datetime-local" name="debut" required className={CHAMP} />
        <input
          type="number"
          name="duree_minutes"
          min="15"
          step="15"
          placeholder="min"
          className={`w-28 ${CHAMP}`}
        />
        <input name="lien_visio" placeholder="Lien visio" className={`min-w-60 flex-1 ${CHAMP}`} />
        <Bouton disabled={enCours}>{enCours ? "En cours..." : "Poser le coaching"}</Bouton>
      </form>

      {erreur && <p className="mt-3 text-sm text-accent">{erreur}</p>}
    </Carte>
  );
}

/**
 * Le retrait d'une séance, confirmé sur place.
 *
 * **Il dit ce qui part.** Une séance sans compte rendu ne coûte rien à
 * retirer, une séance qui en porte un emporte le résumé, la transcription et
 * la note interne du coach. Deux phrases différentes, parce que l'hésitation
 * n'est pas la même.
 *
 * L'état vit ici et non chez le parent : une seule séance est en cours de
 * confirmation à la fois, et un état par ligne dans le parent obligerait à
 * tenir une carte d'identifiants pour rien.
 */
function ConfirmerRetrait({
  aUnCompteRendu,
  enCours,
  onRetirer,
}: {
  aUnCompteRendu: boolean;
  enCours: boolean;
  onRetirer: () => void;
}) {
  const [confirme, setConfirme] = useState(false);

  if (!confirme) {
    return (
      <button
        type="button"
        onClick={() => setConfirme(true)}
        aria-label="Retirer ce coaching"
        className="text-texte-doux transition-colors duration-200 hover:text-accent"
      >
        <Icone nom="croix" className="h-4 w-4" />
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3 text-[13px]">
      <span className="text-texte-doux">
        {aUnCompteRendu ? "Son compte rendu part avec." : "Retirer ?"}
      </span>
      <button
        type="button"
        disabled={enCours}
        onClick={onRetirer}
        className="text-accent hover:underline disabled:opacity-60"
      >
        Confirmer
      </button>
      <button
        type="button"
        onClick={() => setConfirme(false)}
        className="text-texte-doux hover:text-texte"
      >
        Annuler
      </button>
    </span>
  );
}
