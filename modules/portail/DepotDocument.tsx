"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import { enregistrerLeDocument } from "@/modules/portail/actions";
import { creerClientNavigateur } from "@/lib/supabase/navigateur";
import { Bouton } from "@/lib/design/Bouton";
import { Icone } from "@/lib/design/Icones";
import { formaterTaille } from "@/lib/document/types";

/** 20 Mo : au-delà, c'est une vidéo, et une vidéo se partage par un lien. */
const TAILLE_MAX = 20 * 1024 * 1024;

type Props = {
  personneId: string;
  /** Vrai côté coach : lui seul choisit de garder un document interne. */
  avecVisibilite?: boolean;
};

export function DepotDocument({ personneId, avecVisibilite = false }: Props) {
  const champ = useRef<HTMLInputElement>(null);
  const [choisi, setChoisi] = useState<File | null>(null);
  const [survole, setSurvole] = useState(false);
  const [interne, setInterne] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function deposer(evenement: DragEvent<HTMLDivElement>) {
    evenement.preventDefault();
    setSurvole(false);
    const fichier = evenement.dataTransfer.files[0];
    if (fichier) setChoisi(fichier);
  }

  /**
   * **Le fichier va au coffre depuis le navigateur, pas par une action
   * serveur.** Il passait par là, et une action serveur plafonne à 1 Mo chez
   * Next et à 4,5 Mo chez Vercel : au-delà, la requête était coupée avant
   * d'arriver et l'écran affichait un message anglais sans rapport avec la
   * taille, alors que ce cadre annonce 20 Mo. Les permissions du coffre
   * décident déjà de qui écrit où, elles n'avaient pas besoin du détour.
   *
   * L'action serveur reste, pour enregistrer la ligne qui décrit le fichier :
   * quelques centaines d'octets, et c'est elle qui tient la visibilité.
   */
  function envoyer() {
    if (!choisi) return;

    if (choisi.size > TAILLE_MAX) {
      setErreur("Ce fichier dépasse 20 Mo. Partage plutôt un lien.");
      return;
    }

    demarrer(async () => {
      setErreur(null);
      const supabase = creerClientNavigateur();
      // Le nom d'origine est gardé pour l'affichage, mais le chemin porte un
      // identifiant : deux fichiers du même nom ne doivent pas s'écraser, et
      // un nom de fichier peut contenir n'importe quoi.
      const chemin = `${personneId}/${crypto.randomUUID()}`;

      const { error } = await supabase.storage
        .from("documents")
        .upload(chemin, choisi, { contentType: choisi.type || undefined });

      if (error) {
        setErreur(`Dépôt impossible : ${error.message}`);
        return;
      }

      const resultat = await enregistrerLeDocument({
        personneId,
        chemin,
        nom: choisi.name,
        taille: choisi.size,
        typeMime: choisi.type || null,
        interne,
      });

      setErreur(resultat.erreur);
      if (!resultat.erreur) {
        setChoisi(null);
        setInterne(false);
        if (champ.current) champ.current.value = "";
      }
    });
  }

  return (
    <div className="mt-6">
      {/* Le clic et le glisser mènent au même endroit : l'un se découvre,
          l'autre est plus rapide une fois qu'on le sait. */}
      <div
        onClick={() => champ.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setSurvole(true); }}
        onDragLeave={() => setSurvole(false)}
        onDrop={deposer}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-carte border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 focus-within:border-accent ${
          survole ? "border-accent bg-accent-doux" : "border-bordure bg-fond-alt hover:border-texte-doux"
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-icone bg-accent-doux">
          <Icone nom="depot" className="h-5 w-5 text-accent" />
        </span>
        {choisi ? (
          <>
            <span className="mt-4 text-[15px] font-medium">{choisi.name}</span>
            <span className="mt-1 text-sm text-texte-doux">
              {formaterTaille(choisi.size)}
            </span>
          </>
        ) : (
          <>
            <span className="mt-4 text-[15px]">
              Dépose un fichier ici, ou clique pour le choisir
            </span>
            <span className="mt-1 text-sm text-texte-doux">
              20 Mo au maximum
            </span>
          </>
        )}

        {/* sr-only et non hidden : un champ en display:none sort du parcours
            clavier et de l'arbre d'accessibilité, ce qui annulerait la
            raison même de garder un vrai input. */}
        <input
          ref={champ}
          type="file"
          aria-label="Choisir un fichier à déposer"
          className="sr-only"
          onChange={(e) => setChoisi(e.target.files?.[0] ?? null)}
        />
      </div>

      {choisi && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Bouton disabled={enCours} onClick={envoyer}>
            {enCours ? "Dépôt..." : "Déposer ce fichier"}
          </Bouton>
          <Bouton variante="secondaire" onClick={() => setChoisi(null)}>
            Changer
          </Bouton>

          {avecVisibilite && (
            <label className="flex items-center gap-2 text-sm text-texte-doux">
              <input
                type="checkbox"
                checked={interne}
                onChange={(e) => setInterne(e.target.checked)}
                className="accent-accent"
              />
              Garder ce document interne
            </label>
          )}
        </div>
      )}

      {erreur && <p className="mt-3 text-sm text-accent">{erreur}</p>}
    </div>
  );
}
