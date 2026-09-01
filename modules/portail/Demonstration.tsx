"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bouton } from "@/lib/design/Bouton";
import { Carte } from "@/lib/design/Carte";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import {
  chargerLaDemonstration,
  viderLaDemonstration,
} from "@/modules/portail/actions-demonstration";

/**
 * Charger et vider le jeu de démonstration.
 *
 * **Le vidage demande confirmation, le chargement non.** L'un ajoute une
 * fiche inventée qu'on peut retirer d'un clic, l'autre efface pour de bon. Ce
 * n'est pas la même chose, et deux confirmations pour deux gestes de poids
 * différents apprendraient surtout à cliquer sans lire.
 *
 * La confirmation nomme ce qui part : elle ne dit pas « es-tu sûr », elle dit
 * ce que le bouton fait.
 */
export function Demonstration({ chargee }: { chargee: boolean }) {
  const router = useRouter();
  const [confirme, setConfirme] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  return (
    <Carte ton="calme" className="mt-5">
      <MicroLibelle>Le jeu de démonstration</MicroLibelle>
      <p className="mt-2 text-[13px] text-texte-doux">
        Une cliente inventée, son profil rempli, ses tâches à moitié faites et
        deux séances passées. De quoi voir l&apos;outil vivre avant d&apos;y
        mettre tes vrais clients.
      </p>

      {chargee ? (
        <>
          <p className="mt-4 text-sm">
            Il est chargé. Ouvre sa fiche depuis tes clients : elle porte un
            badge « démo ».
          </p>
          <p className="mt-2 text-[13px] text-texte-doux/65">
            Pour voir son espace comme elle le voit, prends « Obtenir un lien à
            copier » sur son écran de suivi et ouvre-le dans une fenêtre
            privée. C&apos;est le chemin que tes vrais clients emprunteront.
          </p>

          {confirme ? (
            <div className="mt-4">
              <p className="text-sm">
                Retirer la cliente inventée, ses tâches, ses réponses et ses
                séances ? Tes vrais clients ne sont pas touchés.
              </p>
              <div className="mt-3 flex gap-3">
                <Bouton
                  disabled={enCours}
                  onClick={() =>
                    demarrer(async () => {
                      const { retirees, pourquoi } = await viderLaDemonstration();
                      setConfirme(false);
                      setMessage(
                        pourquoi ??
                          (retirees === 0
                            ? "Il n'y avait rien à retirer."
                            : "C'est vidé. À toi de jouer."),
                      );
                      router.refresh();
                    })
                  }
                >
                  {enCours ? "Retrait..." : "Oui, tout vider"}
                </Bouton>
                <Bouton variante="secondaire" onClick={() => setConfirme(false)}>
                  Annuler
                </Bouton>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Bouton variante="secondaire" onClick={() => setConfirme(true)}>
                Tout vider
              </Bouton>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4">
          <Bouton
            disabled={enCours}
            onClick={() =>
              demarrer(async () => {
                const { fait, pourquoi } = await chargerLaDemonstration();
                setMessage(pourquoi ?? (fait ? "C'est chargé. Va voir tes clients." : null));
                router.refresh();
              })
            }
          >
            {enCours ? "Chargement..." : "Charger la démonstration"}
          </Bouton>
        </div>
      )}

      {message && <p className="mt-4 text-[13px] text-texte-doux">{message}</p>}
    </Carte>
  );
}
