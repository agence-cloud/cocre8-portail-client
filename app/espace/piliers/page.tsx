import { exigerMembre } from "@/lib/auth/compte";
import { exigerProfilComplet } from "@/modules/portail/garde";
import { lirePiliers, lireCalendrier } from "@/lib/pilier/requetes";
import { etatPilier } from "@/lib/pilier/etat";
import { lireTaches } from "@/modules/portail/requetes";
import { progressionPilier } from "@/modules/portail/progression";
import { CartePilier } from "@/modules/portail/CartePilier";
import { lireReglages } from "@/lib/reglages/requetes";

export default async function PagePiliers() {
  const compte = await exigerMembre();
  // La contrainte membre_a_une_personne garantit ce lien en base. Le lire
  // quand même évite de propager un type nullable dans tout l'écran.
  const personneId = compte.personneId!;
  await exigerProfilComplet(personneId);

  const reglages = await lireReglages();
  const [piliers, calendrier, taches] = await Promise.all([
    lirePiliers(),
    lireCalendrier(personneId),
    lireTaches(personneId),
  ]);

  const aujourdhui = new Date();
  const dates = new Map(calendrier.map((a) => [a.pilier_id, a.date_ouverture]));

  return (
    <>
      <h1 className="text-4xl">
        Tes <span className="text-orange">{reglages.mot_partie.pluriel}</span>
      </h1>
      <p className="mt-2 text-texte-doux">
        Ils s'ouvrent au fil de ton accompagnement. Un à la fois, dans l'ordre.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {piliers.map((pilier) => (
          <CartePilier
            mot={reglages.mot_partie.singulier}
            key={pilier.id}
            pilier={pilier}
            etat={etatPilier(dates.get(pilier.id) ?? null, aujourdhui)}
            progression={progressionPilier(taches, pilier.id)}
          />
        ))}
      </div>
    </>
  );
}
