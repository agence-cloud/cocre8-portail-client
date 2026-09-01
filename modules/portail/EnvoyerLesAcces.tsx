"use client";

import { useState, useTransition } from "react";
import { envoyerLesAcces } from "@/modules/portail/actions";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";

type Props = {
  personneId: string;
  email: string | null;
  /** Vrai quand le membre a déjà un compte, donc quelque chose à recevoir. */
  aUnCompte: boolean;
};

/**
 * L'invitation du membre, au clic et pas avant.
 *
 * La bascule en client crée son compte et prépare son espace, sans rien
 * envoyer. Ce bouton est le seul geste de l'application qui sorte vers
 * quelqu'un, et il demande confirmation en nommant l'adresse : un email
 * d'accès parti chez la mauvaise personne ne se rattrape pas.
 *
 * On peut le relancer, un lien de récupération n'ayant qu'une heure de vie.
 * Le libellé change alors, pour ne pas laisser croire à un premier envoi.
 */
export function EnvoyerLesAcces({ personneId, email, aUnCompte }: Props) {
  const [confirme, setConfirme] = useState(false);
  const [resultat, setResultat] = useState<{ envoye: boolean; pourquoi?: string } | null>(null);
  const [enCours, demarrer] = useTransition();

  if (!aUnCompte) {
    return (
      <Carte className="mt-6">
        <h2 className="text-lg">Ses accès</h2>
        <p className="mt-2 text-sm text-texte-doux">
          Ce membre n&apos;a pas encore de compte. Il s&apos;en crée un au
          passage en client, sur sa fiche du CRM.
        </p>
      </Carte>
    );
  }

  return (
    <Carte className="mt-6">
      <h2 className="text-lg">Ses accès</h2>

      {resultat?.envoye ? (
        <p className="mt-2 text-sm text-texte-doux">
          Le lien est parti à {email}. Il tient une heure : au delà, renvoie-le.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-texte-doux">
            Son espace est prêt. Ce bouton lui envoie le lien qui lui fera poser
            son mot de passe. Rien n&apos;est parti tant que tu n&apos;as pas
            cliqué.
          </p>

          {resultat?.pourquoi && (
            <p className="mt-3 text-sm text-orange">{resultat.pourquoi}</p>
          )}

          {confirme ? (
            <div className="mt-4">
              <p className="text-sm">
                Envoyer ses accès à <span className="font-medium">{email}</span> ?
              </p>
              <div className="mt-3 flex gap-3">
                <Bouton
                  disabled={enCours}
                  onClick={() =>
                    demarrer(async () => {
                      setResultat(await envoyerLesAcces(personneId));
                      setConfirme(false);
                    })
                  }
                >
                  {enCours ? "Envoi..." : "Oui, envoyer"}
                </Bouton>
                <Bouton variante="secondaire" onClick={() => setConfirme(false)}>
                  Annuler
                </Bouton>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Bouton variante="secondaire" onClick={() => setConfirme(true)} disabled={!email}>
                {resultat ? "Renvoyer ses accès" : "Envoyer ses accès"}
              </Bouton>
              {!email && (
                <p className="mt-2 text-sm text-orange">
                  Cette fiche n&apos;a pas d&apos;email. Ajoute-le sur sa fiche
                  du CRM.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Carte>
  );
}
