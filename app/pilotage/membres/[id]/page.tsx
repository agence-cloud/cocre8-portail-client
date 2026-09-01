import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerAdmin } from "@/lib/auth/compte";
import { lirePersonne, aUnCompte } from "@/lib/personne/requetes";
import { lirePiliers, lireCalendrier } from "@/lib/pilier/requetes";
import { etatPilier } from "@/lib/pilier/etat";
import { lireAccompagnements } from "@/lib/offre/requetes";
import { lireQuestions, lireReponses } from "@/lib/profil/requetes";
import { lireDocuments, signerDocument } from "@/lib/document/requetes";
import { lireCoachingsDuMembre } from "@/lib/coaching/requetes";
import { lireTaches } from "@/modules/portail/requetes";
import {
  grouperEnSections,
  progression,
  progressionPilier,
  pilierEnCours,
} from "@/modules/portail/progression";
import { Anneau } from "@/modules/portail/Anneau";
import { CalendrierPiliers } from "@/modules/portail/CalendrierPiliers";
import { TachesCoach } from "@/modules/portail/TachesCoach";
import { CoachingsCoach } from "@/modules/portail/CoachingsCoach";
import { EnvoyerLesAcces } from "@/modules/portail/EnvoyerLesAcces";
import { SectionTaches } from "@/modules/portail/SectionTaches";
import { CaseTache } from "@/modules/portail/CaseTache";
import { ListeDocuments } from "@/modules/portail/ListeDocuments";
import { DepotDocument } from "@/modules/portail/DepotDocument";
import { Carte } from "@/lib/design/Carte";

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
    piliers,
    calendrier,
    taches,
    accompagnements,
    questions,
    reponses,
    documents,
    coachings,
    compteExiste,
  ] =
    await Promise.all([
      lirePiliers(),
      lireCalendrier(id),
      lireTaches(id),
      lireAccompagnements(id),
      lireQuestions(),
      lireReponses(id),
      lireDocuments(id),
      lireCoachingsDuMembre(id),
      aUnCompte(id),
    ]);

  const aujourdhui = new Date();
  const ouverts = new Set(
    calendrier
      .filter((a) => etatPilier(a.date_ouverture, aujourdhui).statut === "ouvert")
      .map((a) => a.pilier_id),
  );

  const courant = pilierEnCours(piliers, taches, ouverts);
  const sections = courant
    ? grouperEnSections(taches.filter((t) => t.pilier_id === courant.id))
    : [];

  const liens = Object.fromEntries(
    await Promise.all(
      documents.map(async (document) => [
        document.id,
        (await signerDocument(document.chemin_storage)) ?? "#",
      ]),
    ),
  );

  const nomComplet = [personne.prenom, personne.nom].filter(Boolean).join(" ");
  const valeurs = new Map(reponses.map((r) => [r.question_id, r.reponse]));

  return (
    <>
      <Link href="/pilotage" className="text-sm text-texte-doux hover:text-texte">
        Retour aux clients
      </Link>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl">{nomComplet}</h1>
          <p className="mt-2 text-texte-doux">
            {accompagnements.length > 0
              ? accompagnements.map((a) => a.offre?.nom).filter(Boolean).join(", ")
              : "Aucun accompagnement enregistré"}
          </p>
        </div>
        <Anneau pourcentage={progression(taches, ouverts)} taille={88} />
      </div>

      <CalendrierPiliers
        personneId={id}
        piliers={piliers}
        calendrier={calendrier}
        demarrageSuggere={accompagnements[0]?.date_debut ?? null}
      />

      <TachesCoach personneId={id} piliers={piliers} />

      {courant && (
        <div className="mt-6">
          <h2 className="text-lg">
            Où il en est : pilier {courant.numero}, {courant.nom} (
            {progressionPilier(taches, courant.id)} %)
          </h2>
          <p className="mt-1 text-sm text-texte-doux">
            Seul le pilier en cours est déroulé ici. Les autres se lisent dans
            le calendrier ci-dessus.
          </p>
          {sections.map((section) => (
            <SectionTaches
              key={section.nom ?? "sans-section"}
              nom={section.nom}
              faites={section.faites}
              total={section.taches.length}
              terminee={section.terminee}
            >
              {section.taches.map((tache) => (
                <CaseTache
                  key={tache.id}
                  id={tache.id}
                  titre={tache.titre}
                  description={tache.description}
                  faite={tache.faite}
                />
              ))}
            </SectionTaches>
          ))}
        </div>
      )}

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
