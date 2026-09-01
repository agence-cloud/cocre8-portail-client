"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerClientNavigateur } from "@/lib/supabase/navigateur";
import { Bouton } from "@/lib/design/Bouton";
import {
  BOUTON_AUTH,
  CHAMP_AUTH,
  EcranAuth,
  ETIQUETTE_AUTH,
  TitreAuth,
} from "@/lib/design/EcranAuth";

/** Ce qui attend derrière la porte, les mêmes trois que sur la connexion. */
const CE_QUI_ATTEND = [
  "Ton programme, tes tâches et ta progression",
  "Tes coachings, leurs enregistrements et leurs résumés",
  "Tes documents et ceux de ton coach",
];

/** Huit caractères : la règle que Supabase applique de toute façon. */
const LONGUEUR_MINIMALE = 8;

/**
 * Le membre pose son mot de passe, une fois son lien ouvert.
 *
 * La session existe déjà quand on arrive ici : c'est `/auth/confirmer` qui
 * l'a ouverte à partir du lien. Cette page ne fait donc qu'une chose, changer
 * le mot de passe de l'utilisateur connecté.
 *
 * Les deux règles sont vérifiées avant l'aller-retour : le serveur les
 * refuserait de toute façon, mais avec un message en anglais et après une
 * attente. Les dire ici coûte trois lignes.
 */
export default function PageMotDePasse() {
  const router = useRouter();
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function poser() {
    if (motDePasse.length < LONGUEUR_MINIMALE) {
      return setErreur(`Ton mot de passe doit faire au moins ${LONGUEUR_MINIMALE} caractères.`);
    }
    if (motDePasse !== confirmation) {
      return setErreur("Les deux mots de passe ne sont pas les mêmes.");
    }

    setErreur(null);
    demarrer(async () => {
      const supabase = creerClientNavigateur();
      const { error } = await supabase.auth.updateUser({ password: motDePasse });

      if (error) {
        // Deux refus très différents arrivaient par la même porte, et le
        // message ne parlait que du premier.
        //
        // Si le mot de passe est jugé trop faible, renvoyer vers le lien
        // envoie dans une impasse : le lien n'y est pour rien, et le membre
        // le rouvrira autant de fois qu'il le faudra sans jamais comprendre.
        // Supabase dit précisément ce qui manque, on lui laisse la parole.
        //
        // Ce cas n'est pas théorique : les exigences de mot de passe et la
        // longueur minimale se règlent dans Supabase, et les durcir rend ce
        // refus courant du jour au lendemain.
        if (error.code === "weak_password" || error.message.toLowerCase().includes("password")) {
          return setErreur(error.message);
        }

        return setErreur(
          "Ton mot de passe n'a pas pu être posé. Ouvre à nouveau le lien reçu par email.",
        );
      }

      // `refresh` avant `push` : la session vient de changer, et ce que le
      // routeur garde en cache a été rendu sans elle. Sans lui, l'espace
      // pourrait s'ouvrir sur une page rendue pour un visiteur déconnecté.
      router.refresh();
      router.push("/espace");
    });
  }

  return (
    <EcranAuth
      titre={
        <>
          Un dernier geste, <span className="block text-orange">et ton espace s&apos;ouvre.</span>
        </>
      }
      accroche="Choisis ton mot de passe, tu ne le poseras qu'une fois."
      points={CE_QUI_ATTEND}
    >
      <TitreAuth>Ton accès</TitreAuth>

      <div className="cascade">
        <label className="block">
          <span className={ETIQUETTE_AUTH}>Ton mot de passe</span>
          <input
            type="password"
            autoComplete="new-password"
            autoFocus
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder={`Au moins ${LONGUEUR_MINIMALE} caractères`}
            className={CHAMP_AUTH}
          />
        </label>

        <label className="mt-5 block">
          <span className={ETIQUETTE_AUTH}>Encore une fois</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") poser();
            }}
            className={CHAMP_AUTH}
          />
        </label>

        {erreur && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-orange-tint px-4 py-3 text-center text-[13px] text-orange"
          >
            {erreur}
          </p>
        )}

        <Bouton onClick={poser} disabled={enCours} className={BOUTON_AUTH}>
          {enCours ? "Un instant..." : "Entrer dans mon espace"}
          {!enCours && (
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          )}
        </Bouton>
      </div>
    </EcranAuth>
  );
}
