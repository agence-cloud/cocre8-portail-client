"use client";

import { useRef, useState, useTransition } from "react";
import { appliquerParcours, ajouterTache } from "@/modules/portail/actions";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";
import type { Pilier } from "@/lib/pilier/types";

type Props = {
  personneId: string;
  piliers: Pilier[];
};

export function TachesCoach({ personneId, piliers }: Props) {
  const formulaire = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function appliquer() {
    demarrer(async () => {
      const ajoutees = await appliquerParcours(personneId);
      setMessage(
        ajoutees === 0
          ? "Son parcours était déjà complet, rien n'a été ajouté."
          : `${ajoutees} tâche${ajoutees > 1 ? "s" : ""} ajoutée${ajoutees > 1 ? "s" : ""}.`,
      );
    });
  }

  function ajouter(donnees: FormData) {
    demarrer(async () => {
      await ajouterTache(
        personneId,
        String(donnees.get("pilier_id")),
        String(donnees.get("titre")).trim(),
        String(donnees.get("description") ?? "").trim() || null,
      );
      formulaire.current?.reset();
      setMessage("Tâche ajoutée.");
    });
  }

  return (
    <Carte className="mt-6">
      <h2 className="text-lg">Son parcours</h2>
      <p className="mt-2 text-sm text-texte-doux">
        Appliquer le parcours type n'ajoute que ce qui manque : tu peux
        recliquer sans rien doubler ni décocher.
      </p>

      <Bouton className="mt-4" disabled={enCours} onClick={appliquer}>
        {enCours ? "En cours..." : "Appliquer le parcours type"}
      </Bouton>

      <form ref={formulaire} action={ajouter} className="mt-6 flex flex-wrap items-end gap-3">
        <select
          name="pilier_id"
          required
          className="rounded-icone border border-bordure px-3 py-2 text-sm"
        >
          {piliers.map((pilier) => (
            <option key={pilier.id} value={pilier.id}>
              {pilier.numero}. {pilier.nom}
            </option>
          ))}
        </select>
        <input
          name="titre"
          required
          placeholder="Une tâche sur mesure"
          className="min-w-60 flex-1 rounded-icone border border-bordure px-3 py-2 text-sm"
        />
        <input
          name="description"
          placeholder="Une précision (facultatif)"
          className="min-w-60 flex-1 rounded-icone border border-bordure px-3 py-2 text-sm"
        />
        <Bouton type="submit" variante="secondaire" disabled={enCours}>
          Ajouter
        </Bouton>
      </form>

      {message && <p className="mt-3 text-sm text-texte-doux">{message}</p>}
    </Carte>
  );
}
