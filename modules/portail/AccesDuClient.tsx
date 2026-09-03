"use client";

import { useState, useTransition } from "react";
import { ouvrirLesAcces, ouvrirLApercu } from "@/modules/portail/actions";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";

type Props = {
  personneId: string;
  email: string | null;
  /** Vrai quand le client a déjà un compte, donc déjà eu un mot de passe. */
  aUnCompte: boolean;
};

type Acces = { adresse: string; email: string; motDePasse: string };

/**
 * Les accès du client : une adresse, son email, un mot de passe.
 *
 * **Un bouton, trois lignes à recopier, rien d'autre.** Deux chemins par
 * email ont vécu ici et ont été retirés : l'envoi d'un lien et le même lien
 * copié à la main. Les deux dépendaient du service d'email de Supabase, dont
 * les textes sont en anglais, dont le plafond se heurte au cinquième client
 * du même après-midi, et dont le lien meurt en une heure. Le coach parle déjà
 * à ses clients par ailleurs : il lui suffit d'avoir quelque chose à leur
 * dire.
 *
 * **Le mot de passe ne s'affiche qu'une fois, et c'est assumé.** Il n'est
 * rangé nulle part en clair, donc l'écran ne saurait pas le retrouver. Le
 * bouton reste là pour en refaire un : c'est plus sûr que de le garder au
 * chaud quelque part pour l'afficher deux fois.
 */
export function AccesDuClient({ personneId, email, aUnCompte }: Props) {
  const [acces, setAcces] = useState<Acces | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const [enCours, demarrer] = useTransition();

  const message = acces
    ? `Voici tes accès à ton espace.\n\nAdresse : ${acces.adresse}\nIdentifiant : ${acces.email}\nMot de passe : ${acces.motDePasse}`
    : "";

  return (
    <Carte className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg">Ses accès</h2>
        {/* L'aperçu est ici et pas ailleurs : c'est la carte de tout ce qui
            touche à l'entrée du client dans son espace. Il ouvre son espace
            réel, pas une imitation, ce qui est la seule façon de vérifier ce
            qu'il verra vraiment. */}
        {aUnCompte && (
          <Bouton
            variante="secondaire"
            disabled={enCours}
            onClick={() =>
              demarrer(async () => {
                const obtenu = await ouvrirLApercu(personneId);
                if (obtenu?.pourquoi) setErreur(obtenu.pourquoi);
              })
            }
            className="px-4 py-2 text-sm"
          >
            Voir son espace
          </Bouton>
        )}
      </div>

      {!email ? (
        <p className="mt-2 text-sm text-texte-doux">
          Ce client n&apos;a pas d&apos;adresse email, et c&apos;est avec elle
          qu&apos;il se connectera. Ajoute-la sur sa fiche, puis reviens ici.
        </p>
      ) : acces ? (
        <>
          <p className="mt-2 text-sm text-texte-doux">
            Envoie-lui ces trois lignes. Note-les si tu ne les envoies pas tout
            de suite : le mot de passe ne se réaffiche pas.
          </p>

          <dl className="mt-4 space-y-3 rounded-xl bg-fond-alt px-4 py-4 text-sm">
            <div>
              <dt className="text-[12px] text-texte-doux/65">Adresse</dt>
              <dd className="mt-0.5 break-all">{acces.adresse}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-texte-doux/65">Identifiant</dt>
              <dd className="mt-0.5 break-all">{acces.email}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-texte-doux/65">Mot de passe</dt>
              <dd className="mt-0.5 font-mono text-base tracking-wide">{acces.motDePasse}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Le bouton n'est qu'un confort : l'accès au presse-papier est
                refusé hors connexion sécurisée, et un coach en local n'aurait
                alors aucun moyen de récupérer ses lignes. Elles restent
                lisibles et sélectionnables au dessus. */}
            <Bouton
              variante="secondaire"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message);
                  setCopie(true);
                } catch {
                  setCopie(false);
                }
              }}
              className="px-4 py-2 text-sm"
            >
              Copier le message
            </Bouton>
            <span className="text-[13px] text-texte-doux/65">
              {copie
                ? "Copié. Ne le colle qu'en privé : ces lignes ouvrent son espace."
                : "Ne les colle qu'en privé : elles ouvrent son espace."}
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-texte-doux">
            {aUnCompte
              ? "Son compte existe. Si son mot de passe est perdu, refais-en un : l'ancien cesse alors de fonctionner."
              : "Ouvre son accès : tu obtiendras l'adresse de connexion, son identifiant et son mot de passe, à lui transmettre toi-même."}
          </p>

          <Bouton
            disabled={enCours}
            className="mt-4 px-4 py-2 text-sm"
            onClick={() =>
              demarrer(async () => {
                setErreur(null);
                const obtenu = await ouvrirLesAcces(personneId);
                if (obtenu.motDePasse && obtenu.email && obtenu.adresse) {
                  setAcces({
                    adresse: obtenu.adresse,
                    email: obtenu.email,
                    motDePasse: obtenu.motDePasse,
                  });
                  setCopie(false);
                } else {
                  setErreur(obtenu.pourquoi ?? "Accès impossible à ouvrir.");
                }
              })
            }
          >
            {enCours
              ? "Un instant..."
              : aUnCompte
                ? "Refaire son mot de passe"
                : "Ouvrir son accès"}
          </Bouton>
        </>
      )}

      {erreur && (
        <p className="mt-3 text-sm text-accent">
          {erreur}
          <br />
          Si le message parle d&apos;une variable manquante, ouvre
          <code className="mx-1 rounded bg-fond-alt px-1.5 py-0.5">/diagnostic</code>
          sur ton installation : la clé de service n&apos;est probablement pas
          posée chez ton hébergeur.
        </p>
      )}
    </Carte>
  );
}
