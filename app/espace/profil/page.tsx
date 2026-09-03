import { exigerMembre } from "@/lib/auth/compte";
import { lireQuestions, lireReponses } from "@/lib/profil/requetes";
import { completude, profilComplet } from "@/lib/profil/completude";
import { FormulaireProfil } from "@/modules/portail/FormulaireProfil";
import { PorteProfil } from "@/modules/portail/PorteProfil";
import { ResumeProfil } from "@/modules/portail/ResumeProfil";
import { Anneau } from "@/modules/portail/Anneau";
import { MonMotDePasse } from "@/lib/design/MonMotDePasse";

export default async function PageProfil() {
  const compte = await exigerMembre();
  const personneId = compte.personneId!;

  const [questions, reponses] = await Promise.all([
    lireQuestions(),
    lireReponses(personneId),
  ]);

  const bilan = completude(questions, reponses);
  const complet = profilComplet(questions, reponses);
  const valeurs = Object.fromEntries(
    reponses.map((r) => [r.question_id, r.reponse ?? ""]),
  );

  // Deux écrans qui n'ont plus rien en commun, et c'est voulu.
  //
  // Tant qu'il manque une réponse, c'est la porte : une question à la fois,
  // plein écran, sans barre ni titre ni jauge. On y répond, on n'y navigue
  // pas. Le premier écran d'un nouveau client montrait jusqu'ici dix cartes
  // empilées, c'est-à-dire la liste de ce qu'il lui restait à faire.
  //
  // Une fois la porte franchie, c'est une page comme les autres : le résumé
  // de ses réponses, et le stylo pour les rouvrir.
  if (!complet) {
    return (
      <PorteProfil
        questions={questions}
        reponses={valeurs}
        // Le premier mot du nom du compte : « Bienvenue, Léa » plutôt que
        // « Bienvenue, Léa Marchand », qui sonne comme un appel.
        prenom={compte.nom.split(" ")[0] ?? ""}
      />
    );
  }

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl">
            Ton <span className="text-accent">point de départ</span>
          </h1>
          <p className="mt-2 max-w-2xl text-texte-doux">
            C'est la photo d'avant. Dans trois mois, ce sont ces chiffres qui
            rendront tes résultats indiscutables. Le stylo les rouvre quand un
            chiffre bouge.
          </p>
        </div>
        <Anneau pourcentage={bilan.pourcentage} taille={88} />
      </div>

      <FormulaireProfil
        questions={questions}
        reponses={valeurs}
        resume={<ResumeProfil questions={questions} reponses={valeurs} />}
      />

      {/* Le seul écran de l'espace où le client règle quelque chose qui le
          concerne lui et non son accompagnement. Il est ici faute d'un écran
          de réglages, que rien d'autre ne justifierait : son mot de passe lui
          vient de son coach, qui l'a lu à l'écran en le lui transmettant. */}
      <div className="mt-10 max-w-2xl">
        <MonMotDePasse />
      </div>
    </>
  );
}
