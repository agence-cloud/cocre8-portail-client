import { exigerAdmin } from "@/lib/auth/compte";
import { lireReglages } from "@/lib/reglages/requetes";
import { lireToutesLesQuestions } from "@/lib/profil/requetes";
import { lireClients } from "@/lib/personne/requetes";
import { Reglages } from "@/modules/portail/Reglages";
import { Demonstration } from "@/modules/portail/Demonstration";
import { ReglagesQuestions } from "@/modules/portail/ReglagesReferentiel";

export default async function PageReglages() {
  // Chaque page se garde elle-même, le layout ne suffit pas.
  await exigerAdmin();

  const [reglages, questions, clients] = await Promise.all([
    lireReglages(),
    lireToutesLesQuestions(),
    lireClients(),
  ]);

  return (
    <>
      <h1 className="text-4xl">
        Tes <span className="text-accent">réglages</span>
      </h1>
      <p className="mt-2 text-texte-doux">
        Ton outil, et les questions que tes clients remplissent en arrivant.
      </p>

      <div className="mt-8 max-w-2xl">
        <Reglages reglages={reglages} />
        <ReglagesQuestions questions={questions} />
        <Demonstration chargee={clients.some((client) => client.demonstration)} />
      </div>
    </>
  );
}
