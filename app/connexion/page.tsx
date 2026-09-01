"use client";

import { useActionState } from "react";
import { seConnecter, type EtatConnexion } from "./actions";
import { Bouton } from "@/lib/design/Bouton";
import {
  BOUTON_AUTH,
  CHAMP_AUTH,
  EcranAuth,
  ETIQUETTE_AUTH,
  TitreAuth,
} from "@/lib/design/EcranAuth";

const INITIAL: EtatConnexion = { erreur: null };

/**
 * Ce que le membre voit derrière la porte, dans l'ordre où il le vivra.
 * Trois, pas cinq : une liste qu'on lit d'un regard vaut mieux qu'un
 * inventaire qu'on survole.
 */
const CE_QUI_ATTEND = [
  "Tes piliers, tes tâches et ta progression",
  "Tes coachings, leurs enregistrements et leurs résumés",
  "Tes documents et ceux de ton coach",
];

export default function PageConnexion() {
  const [etat, action, enCours] = useActionState(seConnecter, INITIAL);

  return (
    <EcranAuth
      titre={
        <>
          Accède à ton <span className="block text-orange">espace personnel.</span>
        </>
      }
      accroche="Tout ton parcours, au même endroit."
      points={CE_QUI_ATTEND}
    >
      <TitreAuth>Connexion</TitreAuth>

      <form action={action} className="cascade">
        <label className="block">
          <span className={ETIQUETTE_AUTH}>Ton adresse email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            autoFocus
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
            autoComplete="current-password"
            className={CHAMP_AUTH}
          />
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
          {enCours ? "Connexion..." : "Entrer dans mon espace"}
          {!enCours && (
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          )}
        </Bouton>

        <p className="mt-6 text-center text-[13px] text-texte-doux/65">
          Un souci pour te connecter ? Écris à ton coach.
        </p>
      </form>
    </EcranAuth>
  );
}
