"use client";

import { useActionState, useState } from "react";
import { Bouton } from "@/lib/design/Bouton";
import { BoutonStylo } from "@/lib/design/BoutonStylo";
import { Carte } from "@/lib/design/Carte";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import { CHAMP, ETIQUETTE } from "@/lib/design/champs";
import { enregistrerLesReglages, type EtatReglages } from "@/modules/portail/actions-reglages";
import type { Reglages as TypeReglages } from "@/lib/reglages/types";

const INITIAL: EtatReglages = { erreur: null, enregistre: false };

/**
 * Les réglages de l'outil : ce que le coach change pour se l'approprier.
 *
 * **Le geste du dépôt : on lit d'abord, le stylo ouvre l'édition, un seul
 * « Enregistrer » envoie tout.** Un formulaire toujours ouvert donnerait
 * l'impression que ces valeurs se modifient tout le temps, alors qu'on y
 * touche une fois à l'installation et presque plus jamais.
 *
 * Ne sont ici que les valeurs simples. Les parties, les questions du profil
 * et les tâches modèles sont des listes à part entière : elles auront leur
 * propre écran, et les mettre dans le même formulaire ferait un mur.
 */
export function Reglages({ reglages }: { reglages: TypeReglages }) {
  const [etat, action, enCours] = useActionState(enregistrerLesReglages, INITIAL);
  const [edition, setEdition] = useState(false);

  if (!edition) {
    return (
      <Carte ton="posee">
        <div className="flex items-start justify-between gap-4">
          <MicroLibelle>Ton outil</MicroLibelle>
          <BoutonStylo onClick={() => setEdition(true)} intitule="Modifier tes réglages" />
        </div>

        <dl className="mt-5 flex flex-col gap-4 text-sm">
          <Ligne intitule="Nom du programme" valeur={reglages.nom_programme} />
          <Ligne
            intitule="Le mot des parties"
            valeur={`${reglages.mot_partie.singulier}, ${reglages.mot_partie.pluriel}`}
          />
          <Ligne intitule="Ton nom" valeur={reglages.coach_nom} />
          <Ligne intitule="Ton téléphone" valeur={reglages.coach_telephone} />
          <Ligne intitule="Lien communauté" valeur={reglages.liens_externes.communaute} />
          <Ligne intitule="Lien formation" valeur={reglages.liens_externes.formation} />
          <Ligne intitule="Lien événements" valeur={reglages.liens_externes.evenements} />
        </dl>

        {/* Pas de vert : c'est la couleur du bouton de conversion et de rien
            d'autre. Un accusé de réception n'a pas besoin d'une couleur qu'un
            seul geste de l'app est censé porter. */}
        {etat.enregistre && (
          <p className="mt-5 text-[13px] text-texte-doux">Tes réglages sont enregistrés.</p>
        )}
      </Carte>
    );
  }

  return (
    <Carte ton="posee">
      <MicroLibelle>Ton outil</MicroLibelle>

      <form action={action} className="mt-5">
        <Champ
          nom="nom_programme"
          intitule="Nom du programme"
          aide="Affiché en tête de l'espace de tes clients, et sur l'écran de connexion."
          defaut={reglages.nom_programme}
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Champ
            nom="mot_singulier"
            intitule="Une partie s'appelle"
            aide="Module, pilier, phase, axe."
            defaut={reglages.mot_partie.singulier}
            requis
          />
          <Champ
            nom="mot_pluriel"
            intitule="Plusieurs s'appellent"
            defaut={reglages.mot_partie.pluriel}
            requis
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Champ nom="coach_nom" intitule="Ton nom" defaut={reglages.coach_nom} />
          <Champ
            nom="coach_telephone"
            intitule="Ton téléphone"
            aide="Laissé vide, la carte d'appel ne s'affiche pas."
            defaut={reglages.coach_telephone}
          />
        </div>

        <p className="mt-8 mb-4 text-[13px] text-texte-doux">
          Tes liens externes, affichés dans la barre de tes clients. Un lien
          laissé vide ne s'affiche pas.
        </p>

        <div className="flex flex-col gap-4">
          <Champ
            nom="lien_communaute"
            intitule="Communauté"
            defaut={reglages.liens_externes.communaute}
          />
          <Champ
            nom="lien_formation"
            intitule="Formation"
            defaut={reglages.liens_externes.formation}
          />
          <Champ
            nom="lien_evenements"
            intitule="Événements"
            defaut={reglages.liens_externes.evenements}
          />
        </div>

        {etat.erreur && (
          <p role="alert" className="mt-5 rounded-xl bg-orange-tint px-4 py-3 text-[13px] text-orange">
            {etat.erreur}
          </p>
        )}

        <div className="mt-8 flex items-center gap-3">
          <Bouton type="submit" disabled={enCours}>
            {enCours ? "Enregistrement..." : "Enregistrer"}
          </Bouton>
          {/* Renoncer ferme sans rien envoyer : c'est la contrepartie du
              « tout d'un coup ». Le coach corrige deux champs, se ravise, et
              rien n'a bougé. */}
          <button
            type="button"
            onClick={() => setEdition(false)}
            className="text-sm text-texte-doux transition-colors duration-200 hover:text-texte"
          >
            Annuler
          </button>
        </div>
      </form>
    </Carte>
  );
}

function Ligne({ intitule, valeur }: { intitule: string; valeur: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-bordure pb-4 last:border-0 last:pb-0">
      <dt className="shrink-0 text-texte-doux">{intitule}</dt>
      <dd className={`text-right ${valeur ? "" : "text-texte-doux/65"}`}>
        {valeur || "Non renseigné"}
      </dd>
    </div>
  );
}

function Champ({
  nom,
  intitule,
  aide,
  defaut,
  requis = false,
}: {
  nom: string;
  intitule: string;
  aide?: string;
  defaut: string;
  requis?: boolean;
}) {
  return (
    <label className="block">
      <span className={ETIQUETTE}>{intitule}</span>
      <input type="text" name={nom} defaultValue={defaut} required={requis} className={CHAMP} />
      {aide && <span className="mt-1.5 block text-[12px] text-texte-doux/65">{aide}</span>}
    </label>
  );
}
