"use client";

import { useRef, useState, useTransition } from "react";
import { poserCoaching, modifierCompteRenduCoaching } from "@/modules/portail/actions";
import { noterIssueCoaching } from "@/modules/portail/actions";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";
import { Badge } from "@/lib/design/Badge";
import { Icone } from "@/lib/design/Icones";
import { CompteRendu } from "@/lib/design/CompteRendu";
import { formaterDateHeure } from "@/lib/dates";
import { ISSUES, libelleIssue, type Appel, type IssueAppel } from "@/lib/personne/appels.types";

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
 * Le compte rendu ne s'ouvre qu'une fois l'issue notée : tant que la séance
 * est à venir, il n'y a rien à en dire.
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

                <div className="flex items-center gap-2">
                  {coaching.issue === "a_venir" ? (
                    ISSUES.filter(
                      (i): i is { valeur: Exclude<IssueAppel, "a_venir">; libelle: string } =>
                        i.valeur !== "a_venir",
                    ).map((issue) => (
                      <button
                        key={issue.valeur}
                        onClick={() =>
                          demarrer(async () => {
                            await noterIssueCoaching(coaching.id, issue.valeur);
                          })
                        }
                        className="rounded-pilule bg-fond-alt px-2.5 py-1 text-[11px] transition-colors duration-200 hover:bg-accent hover:text-white"
                      >
                        {issue.libelle}
                      </button>
                    ))
                  ) : (
                    <Badge ton={coaching.issue === "honore" ? "succes" : "attention"}>
                      {libelleIssue(coaching.issue)}
                    </Badge>
                  )}
                </div>
              </div>

              {deplie === coaching.id && (
                <div className="mt-1 mb-3 rounded-xl border border-bordure bg-fond-alt px-4 py-4">
                  {coaching.issue === "a_venir" ? (
                    <p className="text-sm text-texte-doux">
                      Cette séance n&apos;a pas encore eu lieu. Son compte rendu
                      s&apos;ouvrira quand tu auras noté son issue.
                    </p>
                  ) : (
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
                  )}
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
