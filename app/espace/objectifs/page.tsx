import { exigerMembre } from "@/lib/auth/compte";
import { exigerProfilComplet } from "@/modules/portail/garde";
import { lireObjectifs } from "@/lib/objectif/requetes";
import { progression, progressionObjectif } from "@/modules/portail/progression";
import { CarteObjectif } from "@/modules/portail/CarteObjectif";
import { CaseTache } from "@/modules/portail/CaseTache";
import { Anneau } from "@/modules/portail/Anneau";

export default async function PageObjectifs() {
  const compte = await exigerMembre();
  // La contrainte membre_a_une_personne garantit ce lien en base. Le lire
  // quand même évite de propager un type nullable dans tout l'écran.
  const personneId = compte.personneId!;
  await exigerProfilComplet(personneId);

  const objectifs = await lireObjectifs(personneId);

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl">
            Tes <span className="text-accent">objectifs</span>
          </h1>
          <p className="mt-2 text-texte-doux">
            Ce sur quoi tu avances, et les étapes pour y arriver.
          </p>
        </div>
        {objectifs.length > 0 && (
          /* `shrink-0` : un titre long comprimerait l'anneau, qui n'a pas de
             largeur minimale à lui. */
          <div className="shrink-0">
            <Anneau pourcentage={progression(objectifs)} taille={88} />
          </div>
        )}
      </div>

      {objectifs.length === 0 ? (
        <p className="mt-8 text-texte-doux">
          Ton coach n&apos;a pas encore posé tes objectifs. Ils arriveront avant
          ton prochain coaching.
        </p>
      ) : (
        objectifs.map((objectif) => (
          <CarteObjectif
            key={objectif.id}
            titre={objectif.titre}
            description={objectif.description}
            echeance={objectif.echeance}
            faites={objectif.taches.filter((tache) => tache.faite).length}
            total={objectif.taches.length}
            terminee={
              objectif.taches.length > 0 && progressionObjectif(objectif) === 100
            }
          >
            {objectif.taches.length === 0 ? (
              <p className="py-3 text-sm text-texte-doux">
                Pas encore d&apos;étapes sur cet objectif.
              </p>
            ) : (
              objectif.taches.map((tache) => (
                <CaseTache
                  key={tache.id}
                  id={tache.id}
                  titre={tache.titre}
                  description={tache.description}
                  faite={tache.faite}
                />
              ))
            )}
          </CarteObjectif>
        ))
      )}
    </>
  );
}
