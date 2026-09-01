"use client";

import { useState, useTransition } from "react";
import { envoyerLesAcces, genererLeLien } from "@/modules/portail/actions";
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

  if (!aUnCompte) {
    return (
      <Carte className="mt-6">
        <h2 className="text-lg">Ses accès</h2>
        <p className="mt-2 text-sm text-texte-doux">
          Ce client n&apos;a pas encore de compte. Il s&apos;en crée un au
          moment où tu l&apos;ajoutes, et il lui faut une adresse email.
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
            Son espace est prêt. Envoie-lui le lien qui lui fera poser son mot
            de passe, ou copie-le pour le lui transmettre toi-même. Rien
            n&apos;est parti tant que tu n&apos;as pas cliqué.
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
            <p className="mt-2 text-sm text-orange">
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
                  className="text-sm text-orange transition-opacity duration-200 hover:opacity-70"
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
