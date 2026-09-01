"use client";

import { useState, useTransition } from "react";
import { Bouton } from "@/lib/design/Bouton";

/** Les quatre morceaux d'un compte rendu de réunion. */
export type ChampsCompteRendu = {
  lien_enregistrement: string | null;
  transcription: string | null;
  resume: string | null;
  notes: string | null;
};

const CHAMP =
  "mt-1.5 w-full rounded-xl border border-bordure bg-fond px-3 py-2 text-sm outline-none focus:border-orange disabled:opacity-60";

type Props = {
  valeurs: ChampsCompteRendu;
  /** La source externe, quand la réunion vient d'un import. Nulle sinon. */
  source: string | null;
  /**
   * L'enregistrement, fourni par le module. Le socle ne connaît ni la garde
   * ni les routes à rafraîchir : c'est ce qui lui permet de servir le CRM et
   * le portail sans que l'un connaisse l'autre.
   */
  onEnregistrer: (champs: ChampsCompteRendu) => Promise<void>;
};

/**
 * Le compte rendu d'une réunion : le lien, la transcription complète, le
 * résumé et la note interne, dans cet ordre.
 *
 * Il vit dans le socle parce que deux modules le montrent, chacun de son
 * côté : le CRM sur la fiche d'un prospect, le portail sur le suivi d'un
 * membre. Sans lui ici, l'un importerait le composant de l'autre, ce que
 * l'architecture interdit, ou bien on recopierait cent lignes de formulaire.
 *
 * Ce qu'il ne porte pas, volontairement : l'action d'enregistrement. Elle
 * arrive en propriété, avec sa garde et ses routes à rafraîchir, qui
 * appartiennent au module.
 *
 * **Le partage des écritures avec un import automatique**, tenu ici et pas
 * seulement dans l'action. Sur une réunion importée, le lien et la
 * transcription se lisent mais ne se corrigent pas : ils appartiennent à la
 * source, et les corriger à la main donnerait une correction que la
 * prochaine synchronisation écraserait sans prévenir.
 *
 * Le résumé et la note interne restent modifiables dans tous les cas, pour
 * deux raisons différentes. La note appartient au coach, aucun import n'a de
 * raison de l'écraser. Le résumé est le seul texte que le membre lit dans son
 * espace, donc il faut pouvoir le corriger : la contrepartie est qu'un
 * import ne le remplit que s'il est vide.
 */
export function CompteRendu({ valeurs, source, onEnregistrer }: Props) {
  const [brouillon, setBrouillon] = useState(valeurs);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [enCours, demarrer] = useTransition();

  const importe = source !== null;

  const inchange = (Object.keys(valeurs) as (keyof ChampsCompteRendu)[]).every(
    (cle) => (brouillon[cle] ?? "") === (valeurs[cle] ?? ""),
  );

  function definir(champ: keyof ChampsCompteRendu, valeur: string) {
    setEnregistre(false);
    setBrouillon((precedent) => ({ ...precedent, [champ]: valeur === "" ? null : valeur }));
  }

  function enregistrer() {
    setErreur(null);
    demarrer(async () => {
      try {
        // Un seul appel pour les quatre champs : un compte rendu à moitié
        // enregistré ne veut rien dire.
        await onEnregistrer(brouillon);
        setEnregistre(true);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-[13px] font-medium text-texte-doux">
          Lien de l&apos;enregistrement
        </span>
        <input
          type="url"
          className={CHAMP}
          value={brouillon.lien_enregistrement ?? ""}
          onChange={(e) => definir("lien_enregistrement", e.target.value)}
          disabled={enCours || importe}
          readOnly={importe}
          placeholder="https://..."
        />
      </label>

      {/* Le champ porte l'adresse, ce lien la rend cliquable. */}
      {valeurs.lien_enregistrement && (
        <a
          href={valeurs.lien_enregistrement}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-texte-doux underline decoration-texte-doux/40 underline-offset-2 transition-colors duration-200 hover:text-orange"
        >
          Ouvrir l&apos;enregistrement
        </a>
      )}

      <label className="block">
        <span className="text-[13px] font-medium text-texte-doux">Transcription complète</span>
        <textarea
          rows={8}
          className={CHAMP}
          value={brouillon.transcription ?? ""}
          onChange={(e) => definir("transcription", e.target.value)}
          disabled={enCours || importe}
          readOnly={importe}
          placeholder="Ce qui s'est dit, mot pour mot."
        />
      </label>

      <label className="block">
        <span className="text-[13px] font-medium text-texte-doux">Résumé du transcript</span>
        <span className="mt-0.5 block text-[13px] text-texte-doux">
          Le seul texte du compte rendu que le membre lit dans son espace.
        </span>
        <textarea
          rows={5}
          className={CHAMP}
          value={brouillon.resume ?? ""}
          onChange={(e) => definir("resume", e.target.value)}
          disabled={enCours}
          placeholder="Ce qu'il faut retenir de la séance, écrit pour lui."
        />
      </label>

      <label className="block">
        <span className="text-[13px] font-medium text-texte-doux">Note interne</span>
        <span className="mt-0.5 block text-[13px] text-texte-doux">
          Pour toi seul. Ne sort jamais vers le membre.
        </span>
        <textarea
          rows={4}
          className={CHAMP}
          value={brouillon.notes ?? ""}
          onChange={(e) => definir("notes", e.target.value)}
          disabled={enCours}
          placeholder="Ce que tu retiens, et que tu ne lui dirais pas."
        />
      </label>

      {importe && (
        <p className="text-[13px] text-texte-doux">
          Le lien et la transcription viennent de {source} et ne se corrigent
          pas ici : la prochaine synchronisation écraserait la correction. Le
          résumé et ta note interne, eux, restent à toi.
        </p>
      )}

      {erreur && <p className="text-sm text-orange">{erreur}</p>}

      <div className="flex items-center gap-3">
        <Bouton onClick={enregistrer} disabled={enCours || inchange}>
          {enCours ? "Enregistrement..." : "Enregistrer le compte rendu"}
        </Bouton>
        {enregistre && inchange && <span className="text-sm text-texte-doux">Enregistré.</span>}
      </div>
    </div>
  );
}
