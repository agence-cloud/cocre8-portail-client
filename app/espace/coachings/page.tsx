import { exigerMembre } from "@/lib/auth/compte";
import { exigerProfilComplet } from "@/modules/portail/garde";
import { lireCoachingsPasses } from "@/lib/coaching/requetes";
import { HistoriqueCoachings } from "@/modules/portail/HistoriqueCoachings";

export default async function PageCoachings() {
  const compte = await exigerMembre();
  const personneId = compte.personneId!;
  await exigerProfilComplet(personneId);

  const coachings = await lireCoachingsPasses();

  return (
    <>
      <h1 className="text-4xl">
        Tes <span className="text-accent">coachings</span>
      </h1>
      <p className="mt-2 max-w-2xl text-texte-doux">
        Ce qui a déjà eu lieu, avec l'enregistrement et le résumé de chaque
        séance. Ce qui arrive est sur ton tableau de bord.
      </p>

      <HistoriqueCoachings coachings={coachings} />
    </>
  );
}
