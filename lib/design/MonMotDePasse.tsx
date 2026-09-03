"use client";

import { useActionState, useState } from "react";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";
import { BoutonStylo } from "@/lib/design/BoutonStylo";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import { CHAMP, ETIQUETTE } from "@/lib/design/champs";
import {
  changerMonMotDePasse,
  type EtatMotDePasse,
} from "@/lib/auth/actions-mot-de-passe";

const INITIAL: EtatMotDePasse = { erreur: null, change: false };

/**
 * Le bloc « Ton mot de passe », dans les réglages.
 *
 * Il suit le geste des autres blocs : on lit d'abord, le stylo ouvre
 * l'édition, un seul bouton envoie. Sauf qu'il n'y a rien à lire, un mot de
 * passe ne s'affichant jamais : le repos annonce donc seulement qu'on peut le
 * changer.
 *
 * **Les deux champs sont volontaires.** Un mot de passe se tape à l'aveugle,
 * et celui-ci ouvre le seul compte de l'outil : une faute de frappe non
 * rattrapée enfermerait dehors celui qui vient de la faire, sans autre
 * recours que le tableau de bord Supabase.
 */
export function MonMotDePasse() {
  const [etat, action, enCours] = useActionState(changerMonMotDePasse, INITIAL);
  const [edition, setEdition] = useState(false);

  if (!edition) {
    return (
      <Carte className="mt-5">
        <div className="flex items-start justify-between gap-4">
          <MicroLibelle>Ton mot de passe</MicroLibelle>
          <BoutonStylo
            onClick={() => setEdition(true)}
            intitule="Changer ton mot de passe"
          />
        </div>
        <p className="mt-5 text-sm text-texte-doux">
          {etat.change
            ? "Ton mot de passe est changé. C'est celui-là qu'il faudra la prochaine fois."
            : "Celui avec lequel tu te connectes. Le stylo en pose un autre."}
        </p>
      </Carte>
    );
  }

  return (
    <Carte className="mt-5">
      {/* Le formulaire ne se referme pas tout seul après l'envoi : il
          porterait sinon la réussite comme l'échec hors de l'écran, et un
          mot de passe refusé par Supabase pour sa longueur disparaîtrait
          sans que personne ait lu pourquoi. C'est « Fermer » qui referme. */}
      <form action={action}>
        <MicroLibelle>Ton mot de passe</MicroLibelle>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={ETIQUETTE}>Nouveau mot de passe</span>
            <input type="password" name="nouveau" autoComplete="new-password" className={CHAMP} />
          </label>
          <label className="block">
            <span className={ETIQUETTE}>Le même, pour vérifier</span>
            <input
              type="password"
              name="confirmation"
              autoComplete="new-password"
              className={CHAMP}
            />
          </label>
        </div>

        {etat.erreur && <p className="mt-4 text-sm text-accent">{etat.erreur}</p>}
        {etat.change && (
          <p className="mt-4 text-sm text-texte-doux">
            Ton mot de passe est changé. C&apos;est celui-là qu&apos;il faudra la
            prochaine fois.
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <Bouton type="submit" disabled={enCours}>
            {enCours ? "Enregistrement..." : "Enregistrer"}
          </Bouton>
          <Bouton type="button" variante="secondaire" onClick={() => setEdition(false)}>
            {etat.change ? "Fermer" : "Annuler"}
          </Bouton>
        </div>
      </form>
    </Carte>
  );
}
