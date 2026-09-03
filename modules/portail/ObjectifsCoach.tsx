"use client";

import { useState, useTransition } from "react";
import { Carte } from "@/lib/design/Carte";
import { Modale } from "@/lib/design/Modale";
import { Bouton } from "@/lib/design/Bouton";
import { Icone } from "@/lib/design/Icones";
import { CHAMP, CHAMP_LIGNE, ETIQUETTE } from "@/lib/design/champs";
import { formaterJourMois } from "@/lib/dates";
import type { Objectif } from "@/lib/objectif/types";
import {
  ajouterObjectif,
  retirerObjectif,
  ajouterTache,
  retirerTache,
} from "@/modules/portail/actions";

/**
 * Là où le coach écrit les objectifs d'un client, et leurs étapes.
 *
 * **C'est l'écran qui a remplacé le parcours type et son calendrier.** L'outil
 * copiait auparavant un parcours commun chez chaque client, puis ouvrait ses
 * parties une par mois : le coach héritait de la méthode de l'éditeur et ne
 * pouvait qu'ajouter des tâches à la marge. Ici il n'hérite de rien, il écrit.
 *
 * **Tout est déplié, rien n'est en modale.** Le coach prépare souvent la
 * séance suivante en même temps qu'il parle à son client : ouvrir une fenêtre
 * par tâche lui ferait perdre le fil de ce qu'il vient d'écrire au-dessus.
 *
 * Le retrait d'un objectif demande confirmation et dit combien d'étapes
 * partent avec lui : c'est le nombre qui fait hésiter, pas le mot
 * « supprimer ».
 */
export function ObjectifsCoach({
  personneId,
  objectifs,
}: {
  personneId: string;
  objectifs: Objectif[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [echeance, setEcheance] = useState("");
  const [enCours, demarrer] = useTransition();

  function poser() {
    if (!titre.trim()) return;
    demarrer(async () => {
      await ajouterObjectif(
        personneId,
        titre.trim(),
        description.trim() || null,
        echeance || null,
      );
      setTitre("");
      setDescription("");
      setEcheance("");
      setOuvert(false);
    });
  }

  return (
    <Carte className="mt-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg">Ses objectifs</h2>
        <Bouton
          variante="secondaire"
          onClick={() => setOuvert(true)}
          className="px-4 py-2 text-sm"
        >
          Ajouter un objectif
        </Bouton>
      </div>

      {ouvert && (
        <Modale
          titre="Nouvel objectif"
          sous_titre="Ce qu'il vient chercher. Les étapes se posent ensuite, sous l'objectif."
          onFermer={() => setOuvert(false)}
        >
          <div className="px-6 py-6">
            <label className="block">
              <span className={ETIQUETTE}>L&apos;objectif</span>
              <input
                className={CHAMP}
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Passer son offre au forfait"
              />
            </label>
            <label className="mt-4 block">
              <span className={ETIQUETTE}>Pourquoi, en une phrase (facultatif)</span>
              <input
                className={CHAMP}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="mt-4 block">
              <span className={ETIQUETTE}>Pour quand (facultatif)</span>
              <input
                type="date"
                className={CHAMP}
                value={echeance}
                onChange={(e) => setEcheance(e.target.value)}
              />
            </label>
          </div>

          {/* Les actions dans leur propre bande : sur une fenêtre qui défile,
              elles restaient sinon collées au dernier champ et se lisaient
              comme si elles lui appartenaient. */}
          <div className="flex gap-3 border-t border-bordure bg-fond-alt px-6 py-5">
            <Bouton onClick={poser} disabled={enCours || !titre.trim()}>
              {enCours ? "Enregistrement..." : "Poser cet objectif"}
            </Bouton>
            <Bouton type="button" variante="secondaire" onClick={() => setOuvert(false)}>
              Annuler
            </Bouton>
          </div>
        </Modale>
      )}

      {objectifs.length === 0 ? (
        <p className="mt-4 text-sm text-texte-doux">
          Aucun objectif pour l&apos;instant. Son espace reste vide tant que tu
          n&apos;en as pas posé un.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {objectifs.map((objectif) => (
            <LigneObjectif key={objectif.id} objectif={objectif} />
          ))}
        </div>
      )}
    </Carte>
  );
}

function LigneObjectif({ objectif }: { objectif: Objectif }) {
  const [titre, setTitre] = useState("");
  const [enCours, demarrer] = useTransition();
  const [confirme, setConfirme] = useState(false);

  const faites = objectif.taches.filter((tache) => tache.faite).length;

  function poser() {
    if (!titre.trim()) return;
    demarrer(async () => {
      await ajouterTache(objectif.id, titre.trim(), null);
      setTitre("");
    });
  }

  return (
    <div className="rounded-xl border border-bordure p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[15px]">{objectif.titre}</p>
          {objectif.description && (
            <p className="mt-1 text-sm text-texte-doux">{objectif.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm text-texte-doux">
          <span className="tabular-nums">
            {faites}/{objectif.taches.length}
          </span>
          {objectif.echeance && <span>{formaterJourMois(objectif.echeance)}</span>}
          {confirme ? (
            <button
              type="button"
              onClick={() => demarrer(async () => void (await retirerObjectif(objectif.id)))}
              className="text-accent hover:underline"
            >
              Confirmer le retrait
              {objectif.taches.length > 0 &&
                ` (${objectif.taches.length} étape${objectif.taches.length > 1 ? "s" : ""})`}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirme(true)}
              aria-label="Retirer cet objectif"
              className="transition-colors duration-200 hover:text-accent"
            >
              <Icone nom="croix" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {objectif.taches.length > 0 && (
        <ul className="mt-3 divide-y divide-bordure border-t border-bordure">
          {objectif.taches.map((tache) => (
            <li key={tache.id} className="flex items-center justify-between gap-4 py-2">
              <span className={`text-sm ${tache.faite ? "text-texte-doux line-through" : ""}`}>
                {tache.titre}
              </span>
              <button
                type="button"
                onClick={() => demarrer(async () => void (await retirerTache(tache.id)))}
                aria-label="Retirer cette étape"
                className="shrink-0 text-texte-doux transition-colors duration-200 hover:text-accent"
              >
                <Icone nom="croix" className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <input
          className={CHAMP_LIGNE}
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && poser()}
          placeholder="Ajouter une étape"
        />
        <Bouton
          variante="secondaire"
          onClick={poser}
          disabled={enCours || !titre.trim()}
          className="shrink-0 px-4 py-2 text-sm"
        >
          Ajouter
        </Bouton>
      </div>
    </div>
  );
}
