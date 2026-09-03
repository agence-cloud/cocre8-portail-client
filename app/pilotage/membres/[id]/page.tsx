import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerAdmin } from "@/lib/auth/compte";
import { lirePersonne, aUnCompte } from "@/lib/personne/requetes";
import { lireObjectifs } from "@/lib/objectif/requetes";
import { lireAccompagnements } from "@/lib/accompagnement/requetes";
import { formaterDateComplete } from "@/lib/dates";
import { lireQuestions, lireReponses } from "@/lib/profil/requetes";
import { lireDocuments, signerDocument } from "@/lib/document/requetes";
import { lireCoachingsDuMembre } from "@/lib/coaching/requetes";
import { progression } from "@/modules/portail/progression";
import { Anneau } from "@/modules/portail/Anneau";
import { ObjectifsCoach } from "@/modules/portail/ObjectifsCoach";
import { CoachingsCoach } from "@/modules/portail/CoachingsCoach";
import { EnvoyerLesAcces } from "@/modules/portail/EnvoyerLesAcces";
import { ListeDocuments } from "@/modules/portail/ListeDocuments";
import { DepotDocument } from "@/modules/portail/DepotDocument";
import { Carte } from "@/lib/design/Carte";
import { nomComplet } from "@/lib/personne/types";

export default async function SuiviMembre({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigerAdmin();
  const { id } = await params;

  const personne = await lirePersonne(id);
  if (!personne) notFound();

  const [
    objectifs,
    accompagnements,
    questions,
    reponses,
    documents,
    coachings,
    compteExiste,
  ] = await Promise.all([
    lireObjectifs(id),
    lireAccompagnements(id),
    lireQuestions(),
    lireReponses(id),
    lireDocuments(id),
    lireCoachingsDuMembre(id),
    aUnCompte(id),
  ]);

  const liens = Object.fromEntries(
    await Promise.all(
      documents.map(async (document) => [
        document.id,
        (await signerDocument(document.chemin_storage)) ?? "#",
      ]),
    ),
  );

  const nom = nomComplet(personne);
  const valeurs = new Map(reponses.map((r) => [r.question_id, r.reponse]));

  // La plus ancienne date de démarrage : un client peut cumuler plusieurs
  // accompagnements, et c'est le premier qui dit depuis quand il est là.
  const debut = accompagnements
    .map((a) => a.date_debut)
    .sort()
    .at(0);

  return (
    <>
      <Link href="/pilotage" className="text-sm text-texte-doux hover:text-texte">
        Retour aux clients
      </Link>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl">{nom}</h1>
          <p className="mt-2 text-texte-doux">
            {debut
              ? `Client depuis le ${formaterDateComplete(debut)}`
              : "Aucun accompagnement enregistré"}
          </p>
        </div>
        <Anneau pourcentage={progression(objectifs)} taille={88} />
      </div>

      <ObjectifsCoach personneId={id} objectifs={objectifs} />

      <CoachingsCoach personneId={id} coachings={coachings} />

      <EnvoyerLesAcces personneId={id} email={personne.email} aUnCompte={compteExiste} />

      <Carte className="mt-6">
        <h2 className="text-lg">Ses documents</h2>
        <DepotDocument personneId={id} avecVisibilite />
        <ListeDocuments documents={documents} liens={liens} montrerVisibilite />
      </Carte>

      <Carte className="mt-6">
        <h2 className="text-lg">Son point de départ</h2>
        <div className="mt-3">
          {questions.map((question) => (
            <div key={question.id} className="border-b border-bordure py-2 last:border-0">
              <p className="text-sm text-texte-doux">{question.libelle}</p>
              <p className="text-[15px]">
                {valeurs.get(question.id) || "Pas encore répondu"}
              </p>
            </div>
          ))}
        </div>
      </Carte>
    </>
  );
}
