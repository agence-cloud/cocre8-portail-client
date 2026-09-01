"use client";

import { useActionState } from "react";
import { installer, type EtatInstallation } from "./actions";
import { Bouton } from "@/lib/design/Bouton";
import {
  BOUTON_AUTH,
  CHAMP_AUTH,
  EcranAuth,
  ETIQUETTE_AUTH,
  TitreAuth,
} from "@/lib/design/EcranAuth";

const INITIAL: EtatInstallation = { erreur: null };

/** Ce qui attend le coach une fois entré, dans l'ordre où il le fera. */
const LES_PREMIERS_PAS = [
  "Charge un jeu de démonstration pour voir l'outil vivre",
  "Renomme les parties de ton accompagnement",
  "Ajoute ton premier client et envoie-lui ses accès",
];

export function FormulaireInstallation() {
  const [etat, action, enCours] = useActionState(installer, INITIAL);

  return (
    <EcranAuth
      titre={
        <>
          Ton outil est prêt, <span className="block text-orange">crée ton compte.</span>
        </>
      }
      accroche="Ce compte sera le tien, celui du coach. C'est la seule fois où cet écran s'affiche."
      points={LES_PREMIERS_PAS}
    >
      <TitreAuth>Mise en service</TitreAuth>

      <form action={action} className="cascade">
        <label className="block">
          <span className={ETIQUETTE_AUTH}>Ton nom</span>
          <input
            type="text"
            name="nom"
            required
            autoComplete="name"
            autoFocus
            placeholder="Camille Durand"
            className={CHAMP_AUTH}
          />
        </label>

        <label className="mt-5 block">
          <span className={ETIQUETTE_AUTH}>Ton adresse email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="toi@exemple.fr"
            className={CHAMP_AUTH}
          />
        </label>

        <label className="mt-5 block">
          <span className={ETIQUETTE_AUTH}>Ton mot de passe</span>
          <input
            type="password"
            name="motDePasse"
            required
            minLength={8}
            autoComplete="new-password"
            className={CHAMP_AUTH}
          />
          <span className="mt-2 block text-[13px] text-texte-doux/65">
            Huit caractères au minimum.
          </span>
        </label>

        {etat.erreur && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-orange-tint px-4 py-3 text-center text-[13px] text-orange"
          >
            {etat.erreur}
          </p>
        )}

        <Bouton type="submit" disabled={enCours} className={BOUTON_AUTH}>
          {enCours ? "Création..." : "Créer mon compte"}
          {!enCours && (
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          )}
        </Bouton>
      </form>
    </EcranAuth>
  );
}
