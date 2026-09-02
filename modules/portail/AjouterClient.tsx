"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajouterUnClient } from "@/modules/portail/actions";
import { Bouton } from "@/lib/design/Bouton";
import { Carte } from "@/lib/design/Carte";
import { CHAMP, ETIQUETTE } from "@/lib/design/champs";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import type { Offre } from "@/lib/offre/types";

/**
 * Ajouter un client : le seul chemin par lequel un client naît ici.
 *
 * **Le formulaire ne s'ouvre qu'au clic.** Ce geste ne se fait pas dix fois
 * par jour, et un formulaire déplié en permanence au-dessus de la liste
 * ferait passer l'ajout pour l'action principale de l'écran, alors que
 * l'écran sert d'abord à retrouver quelqu'un.
 *
 * **Rien ne part.** Le compte est créé et l'espace prêt, mais l'invitation
 * attend un second clic sur l'écran de suivi, où le coach choisit entre
 * l'email et le lien à copier.
 */
export function AjouterClient({ offres }: { offres: Offre[] }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const [offreId, setOffreId] = useState(offres[0]?.id ?? "");
  const [prix, setPrix] = useState(String(offres[0]?.prix_defaut ?? 0));

  // Le prix suit l'offre choisie, et reste modifiable : c'est le prix de
  // cette personne-là, pas celui du catalogue. Le champ se remplit pour
  // éviter une saisie, il ne se verrouille pas.
  function choisirLOffre(id: string) {
    setOffreId(id);
    const offre = offres.find((o) => o.id === id);
    if (offre) setPrix(String(offre.prix_defaut));
  }

  if (offres.length === 0) {
    return (
      <Carte ton="calme" className="mt-6">
        <MicroLibelle>Ajouter un client</MicroLibelle>
        <p className="mt-2 text-sm text-texte-doux">
          Aucune offre active. Un client s&apos;attache à une offre, c&apos;est
          elle qui fige son prix : commence par en créer une.
        </p>
      </Carte>
    );
  }

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
        offreId,
        prix: Number(prix) || 0,
        demarrage: String(donnees.get("demarrage") ?? ""),
      });

      if (!resultat.fait) {
        setErreur(resultat.pourquoi ?? "Ajout impossible.");
        return;
      }

      // Droit sur son écran de suivi : c'est là qu'on lui envoie ses accès,
      // et c'est la suite naturelle du geste qu'on vient de faire.
      router.push(`/pilotage/membres/${resultat.personneId}`);
    });
  }

  return (
    <Carte className="mt-6">
      <MicroLibelle>Ajouter un client</MicroLibelle>

      <form action={envoyer} className="mt-5">
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

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className={ETIQUETTE}>Son offre</span>
            <select
              value={offreId}
              onChange={(e) => choisirLOffre(e.target.value)}
              className={CHAMP}
            >
              {offres.map((offre) => (
                <option key={offre.id} value={offre.id}>
                  {offre.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={ETIQUETTE}>Son prix</span>
            <input
              type="number"
              min="0"
              step="1"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              className={CHAMP}
            />
          </label>
        </div>

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

        <div className="mt-6 flex items-center gap-3">
          <Bouton type="submit" disabled={enCours}>
            {enCours ? "Création..." : "Créer son espace"}
          </Bouton>
          <button
            type="button"
            onClick={() => setOuvert(false)}
            className="text-sm text-texte-doux transition-colors duration-200 hover:text-texte"
          >
            Annuler
          </button>
        </div>

        <p className="mt-4 text-[13px] text-texte-doux/65">
          Son espace sera prêt, mais rien ne lui sera envoyé : tu lui donnes
          ses accès depuis son écran de suivi, par email ou par un lien à
          copier.
        </p>
      </form>
    </Carte>
  );
}
