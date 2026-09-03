"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajouterUnClient } from "@/modules/portail/actions";
import { Bouton } from "@/lib/design/Bouton";
import { Modale } from "@/lib/design/Modale";
import { CHAMP, ETIQUETTE } from "@/lib/design/champs";

/**
 * Ajouter un client : le seul chemin par lequel un client naît ici.
 *
 * **Le formulaire ne s'ouvre qu'au clic.** Ce geste ne se fait pas dix fois
 * par jour, et un formulaire déplié en permanence au-dessus de la liste
 * ferait passer l'ajout pour l'action principale de l'écran, alors que
 * l'écran sert d'abord à retrouver quelqu'un.
 *
 * **Rien ne part.** Le compte est créé et l'espace prêt, mais son mot de
 * passe attend un second clic sur l'écran de suivi, où le coach le lit pour
 * le transmettre lui-même.
 */
export function AjouterClient() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  if (!ouvert) {
    return (
      <div className="mt-6">
        <Bouton onClick={() => setOuvert(true)}>Ajouter un client</Bouton>
      </div>
    );
  }

  function envoyer(donnees: FormData) {
    demarrer(async () => {
      const resultat = await ajouterUnClient({
        nom: String(donnees.get("nom") ?? ""),
        prenom: String(donnees.get("prenom") ?? ""),
        email: String(donnees.get("email") ?? ""),
        demarrage: String(donnees.get("demarrage") ?? ""),
      });

      if (!resultat.fait) {
        setErreur(resultat.pourquoi ?? "Ajout impossible.");
        return;
      }

      // Le client est créé, et son compte a pu échouer quand même : l'ajout
      // se fait en trois temps, et seul le dernier peut rater tout seul. La
      // raison était renvoyée mais jamais lue, et le client atterrissait sur
      // une fiche sans accès sans que rien ne dise pourquoi. On la garde
      // pour l'écran de suivi, où le bouton de rattrapage l'attend.
      if (resultat.pourquoi) {
        setErreur(resultat.pourquoi);
        return;
      }

      // Droit sur son écran de suivi : c'est là qu'on lui envoie ses accès,
      // et c'est la suite naturelle du geste qu'on vient de faire.
      router.push(`/pilotage/membres/${resultat.personneId}`);
    });
  }

  return (
    <Modale
      titre="Nouveau client"
      sous_titre="Son espace sera prêt tout de suite. Rien ne lui sera envoyé."
      onFermer={() => setOuvert(false)}
    >
      <form action={envoyer}>
        <div className="px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={ETIQUETTE}>Son prénom</span>
            <input type="text" name="prenom" autoFocus className={CHAMP} />
          </label>
          <label className="block">
            <span className={ETIQUETTE}>Son nom</span>
            <input type="text" name="nom" required className={CHAMP} />
          </label>
        </div>

        <label className="mt-4 block">
          <span className={ETIQUETTE}>Son adresse email</span>
          <input type="email" name="email" required className={CHAMP} />
          <span className="mt-1.5 block text-[12px] text-texte-doux/65">
            C&apos;est avec elle qu&apos;il se connectera.
          </span>
        </label>

        <label className="mt-4 block">
          <span className={ETIQUETTE}>Date de démarrage</span>
          <input
            type="date"
            name="demarrage"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={CHAMP}
          />
          <span className="mt-1.5 block text-[12px] text-texte-doux/65">
            Elle pose son calendrier : la première partie s&apos;ouvre ce
            jour-là, puis une par mois. Tu corriges chaque date ensuite.
          </span>
        </label>

        {erreur && (
          <p role="alert" className="mt-5 rounded-xl bg-accent-doux px-4 py-3 text-[13px] text-accent">
            {erreur}
          </p>
        )}
        </div>

        {/* Les actions dans leur propre bande : sur une fenêtre qui défile,
            elles restaient sinon collées au dernier champ et se lisaient
            comme si elles lui appartenaient. */}
        <div className="flex items-center gap-3 border-t border-bordure bg-fond-alt px-6 py-5">
          <Bouton type="submit" disabled={enCours}>
            {enCours ? "Création..." : "Créer son espace"}
          </Bouton>
          <Bouton type="button" variante="secondaire" onClick={() => setOuvert(false)}>
            Annuler
          </Bouton>
        </div>
      </form>
    </Modale>
  );
}
