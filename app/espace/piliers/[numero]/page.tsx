import Link from "next/link";
import { redirect } from "next/navigation";
import { exigerMembre } from "@/lib/auth/compte";
import { exigerProfilComplet } from "@/modules/portail/garde";
import { Icone } from "@/lib/design/Icones";
import { lirePiliers, lireCalendrier } from "@/lib/pilier/requetes";
import { etatPilier } from "@/lib/pilier/etat";
import { iconePilier } from "@/lib/pilier/types";
import { lireTaches } from "@/modules/portail/requetes";
import { grouperEnSections, progressionPilier } from "@/modules/portail/progression";
import { SectionTaches } from "@/modules/portail/SectionTaches";
import { CaseTache } from "@/modules/portail/CaseTache";
import { Anneau } from "@/modules/portail/Anneau";

export default async function PagePilier({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const compte = await exigerMembre();
  const personneId = compte.personneId!;
  await exigerProfilComplet(personneId);
  const { numero } = await params;

  const [piliers, calendrier, taches] = await Promise.all([
    lirePiliers(),
    lireCalendrier(personneId),
    lireTaches(personneId),
  ]);

  const pilier = piliers.find((p) => String(p.numero) === numero);
  if (!pilier) redirect("/espace/piliers");

  // Le pilier fermé n'est pas seulement caché derrière un cadenas : son
  // adresse ne mène nulle part non plus. Les permissions le protègent déjà en
  // base, mais une page vide sans explication serait un cul-de-sac.
  const acces = calendrier.find((a) => a.pilier_id === pilier.id);
  if (etatPilier(acces?.date_ouverture ?? null, new Date()).statut !== "ouvert") {
    redirect("/espace/piliers");
  }

  const duPilier = taches.filter((t) => t.pilier_id === pilier.id);
  const sections = grouperEnSections(duPilier);

  return (
    <>
      <Link href="/espace/piliers" className="text-sm text-texte-doux hover:text-texte">
        Retour à tes piliers
      </Link>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-icone bg-accent-doux">
            <Icone nom={iconePilier(pilier.numero)} className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl">
              {pilier.numero}. <span className="text-accent">{pilier.nom}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-texte-doux">{pilier.description}</p>
          </div>
        </div>
        {/* `shrink-0` : un titre de pilier long comprimerait l'anneau, qui
            n'a pas de largeur minimale à lui. */}
        <div className="shrink-0">
          <Anneau pourcentage={progressionPilier(taches, pilier.id)} taille={88} />
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="mt-8 text-texte-doux">
          Ton coach n'a pas encore posé tes tâches sur ce pilier. Elles
          arriveront avant ton prochain coaching.
        </p>
      ) : (
        sections.map((section) => (
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
        ))
      )}
    </>
  );
}
