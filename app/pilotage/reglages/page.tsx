import { exigerAdmin } from "@/lib/auth/compte";
import { lireReglages } from "@/lib/reglages/requetes";
import { lirePiliers } from "@/lib/pilier/requetes";
import { lireToutesLesQuestions } from "@/lib/profil/requetes";
import { lireTachesModeles } from "@/lib/parcours/requetes";
import { lireClients } from "@/lib/personne/requetes";
import { Reglages } from "@/modules/portail/Reglages";
import { Demonstration } from "@/modules/portail/Demonstration";
import {
  ReglagesParties,
  ReglagesQuestions,
  ReglagesTaches,
} from "@/modules/portail/ReglagesReferentiel";

export default async function PageReglages() {
  // Chaque page se garde elle-même, le layout ne suffit pas.
  await exigerAdmin();

  const [reglages, piliers, questions, taches, clients] = await Promise.all([
    lireReglages(),
    lirePiliers(),
    lireToutesLesQuestions(),
    lireTachesModeles(),
    lireClients(),
  ]);

  return (
    <>
      <h1 className="text-4xl">
        Tes <span className="text-orange">réglages</span>
      </h1>
      <p className="mt-2 text-texte-doux">
        Ce que tes clients voient, et comment tu appelles les choses.
      </p>

      <div className="mt-8 max-w-2xl">
        <Reglages reglages={reglages} />
        <ReglagesParties
          piliers={piliers}
          motSingulier={reglages.mot_partie.singulier}
          motPluriel={reglages.mot_partie.pluriel}
        />
        <ReglagesQuestions questions={questions} />
        <ReglagesTaches taches={taches} piliers={piliers} mot={reglages.mot_partie.singulier} />
        <Demonstration chargee={clients.some((client) => client.demonstration)} />
      </div>
    </>
  );
}
