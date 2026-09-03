"use client";

import { useState, useTransition } from "react";
import {
  envoyerLesAcces,
  genererLeLien,
  ouvrirLApercu,
  creerLeCompteDuClient,
} from "@/modules/portail/actions";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";
import { CHAMP } from "@/lib/design/champs";

type Props = {
  personneId: string;
  email: string | null;
  /** Vrai quand le client a déjà un compte, donc quelque chose à recevoir. */
  aUnCompte: boolean;
};

/**
 * L'invitation du client, au clic et pas avant.
 *
 * L'ajout d'un client crée son compte et prépare son espace sans rien
 * envoyer. C'est ici que quelque chose sort, et seulement ici.
 *
 * **Deux chemins, et le second n'est pas un pis-aller.** L'envoi par email
 * demande confirmation en nommant l'adresse : un accès parti chez la mauvaise
 * personne ne se rattrape pas. Le lien copié, lui, ne sort de nulle part et
 * se colle où le coach parle déjà à ses clients.
 *
 * **Le lien copié est ce qui fait marcher l'outil le premier jour.** Une
 * installation neuve utilise le service d'email de Supabase, plafonné à
 * quelques envois par heure et dont les textes sont en anglais tant que
 * personne ne les a réécrits. Un coach qui ajoute ses cinq premiers clients
 * le même après-midi se heurterait au plafond sans comprendre pourquoi.
 *
 * Les deux se relancent : un lien de récupération n'a qu'une heure de vie.
 */
export function EnvoyerLesAcces({ personneId, email, aUnCompte }: Props) {
  const [confirme, setConfirme] = useState(false);
  const [resultat, setResultat] = useState<{ envoye: boolean; pourquoi?: string } | null>(null);
  const [lien, setLien] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const [enCours, demarrer] = useTransition();

  // Sans compte, la carte n'annonce plus une fatalité : elle propose de le
  // créer. Le compte se crée normalement à l'ajout du client, mais cette
  // étape-là peut échouer toute seule, et le client restait alors sans accès
  // possible et sans rien à cliquer.
  if (!aUnCompte) {
    return (
      <Carte className="mt-6">
        <h2 className="text-lg">Ses accès</h2>

        {email ? (
          <>
            <p className="mt-2 text-sm text-texte-doux">
              Ce client n&apos;a pas encore de compte. Il s&apos;en crée
              normalement un quand tu l&apos;ajoutes : si tu vois ce message,
              c&apos;est que cette étape a échoué.
            </p>
            <Bouton
              disabled={enCours}
              className="mt-4 px-4 py-2 text-sm"
              onClick={() =>
                demarrer(async () => {
                  const obtenu = await creerLeCompteDuClient(personneId);
                  setResultat(
                    obtenu.fait
                      ? null
                      : { envoye: false, pourquoi: obtenu.pourquoi ?? "Création impossible." },
                  );
                })
              }
            >
              {enCours ? "Création..." : "Créer son compte"}
            </Bouton>
            {resultat?.pourquoi && (
              <p className="mt-3 text-sm text-accent">
                {resultat.pourquoi}
                <br />
                Si le message parle d&apos;une variable manquante, ouvre
                <code className="mx-1 rounded bg-fond-alt px-1.5 py-0.5">/diagnostic</code>
                sur ton installation : la clé de service n&apos;est
                probablement pas posée chez ton hébergeur.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-texte-doux">
            Ce client n&apos;a pas d&apos;adresse email, et c&apos;est avec
            elle qu&apos;il se connectera. Ajoute-la sur sa fiche, puis reviens
            créer son compte.
          </p>
        )}
      </Carte>
    );
  }

  return (
    <Carte className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg">Ses accès</h2>
        {/* L'aperçu est ici et pas ailleurs : c'est la carte de tout ce qui
            touche à l'entrée du client dans son espace. Il ouvre son espace
            réel, pas une imitation, ce qui est la seule façon de vérifier ce
            qu'il verra vraiment. */}
        <Bouton
          variante="secondaire"
          disabled={enCours}
          onClick={() =>
            demarrer(async () => {
              const obtenu = await ouvrirLApercu(personneId);
              if (obtenu?.pourquoi) setResultat({ envoye: false, pourquoi: obtenu.pourquoi });
            })
          }
          className="px-4 py-2 text-sm"
        >
          Voir son espace
        </Bouton>
      </div>

      {resultat?.envoye ? (
        <p className="mt-2 text-sm text-texte-doux">
          Le lien est parti à {email}. Il tient une heure : au delà, renvoie-le.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-texte-doux">
            Son espace est prêt. Envoie-lui le lien qui lui fera poser son mot
            de passe, ou copie-le pour le lui transmettre toi-même. Rien
            n&apos;est parti tant que tu n&apos;as pas cliqué.
          </p>

          {resultat?.pourquoi && (
            <p className="mt-3 text-sm text-accent">{resultat.pourquoi}</p>
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
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Bouton variante="secondaire" onClick={() => setConfirme(true)} disabled={!email}>
                {resultat ? "Renvoyer par email" : "Envoyer par email"}
              </Bouton>
              <button
                type="button"
                disabled={!email || enCours}
                onClick={() =>
                  demarrer(async () => {
                    const obtenu = await genererLeLien(personneId);
                    if (obtenu.lien) {
                      setLien(obtenu.lien);
                      setCopie(false);
                    } else {
                      setResultat({ envoye: false, pourquoi: obtenu.pourquoi });
                    }
                  })
                }
                className="text-sm text-texte-doux transition-colors duration-200 hover:text-texte disabled:opacity-50"
              >
                {enCours ? "..." : "Obtenir un lien à copier"}
              </button>
            </div>
          )}

          {!email && (
            <p className="mt-2 text-sm text-accent">
              Cette fiche n&apos;a pas d&apos;email. Ajoute-le sur sa fiche.
            </p>
          )}

          {lien && (
            <div className="mt-4">
              {/* Le champ est toujours là, et le bouton n'est qu'un confort :
                  l'accès au presse-papier est refusé hors connexion sécurisée,
                  et un coach en local n'aurait alors aucun moyen de récupérer
                  son lien. Il peut toujours le sélectionner à la main. */}
              <input
                readOnly
                value={lien}
                onFocus={(e) => e.currentTarget.select()}
                className={CHAMP}
                aria-label="Le lien d'accès de ce client"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(lien);
                      setCopie(true);
                    } catch {
                      setCopie(false);
                    }
                  }}
                  className="text-sm text-accent transition-opacity duration-200 hover:opacity-70"
                >
                  Copier
                </button>
                <span className="text-[13px] text-texte-doux/65">
                  {copie
                    ? "Copié. Il tient une heure, et ouvre son espace : ne le colle qu'en privé."
                    : "Il tient une heure, et ouvre son espace : ne le colle qu'en privé."}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </Carte>
  );
}
