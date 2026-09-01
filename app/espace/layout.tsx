import { cookies } from "next/headers";
import { exigerMembre } from "@/lib/auth/compte";
import { lireQuestions, lireReponses } from "@/lib/profil/requetes";
import { profilComplet } from "@/lib/profil/completude";
import { NavigationLaterale } from "@/lib/design/NavigationLaterale";
import { construireLiensCircle } from "@/modules/portail/circle";
import { lireReglages } from "@/lib/reglages/requetes";

const LIENS = [
  {
    libelle: "Mon tableau de bord",
    href: "/espace",
    icone: "tableau" as const,
  },
  {
    libelle: "Mon profil",
    href: "/espace/profil",
    icone: "profil" as const,
  },
  {
    libelle: "Mes piliers",
    href: "/espace/piliers",
    icone: "piliers" as const,
  },
  {
    libelle: "Mes coachings",
    href: "/espace/coachings",
    icone: "evenement" as const,
  },
  {
    libelle: "Mes documents",
    href: "/espace/documents",
    icone: "documents" as const,
  },
];

export default async function LayoutEspace({
  children,
}: {
  children: React.ReactNode;
}) {
  const compte = await exigerMembre();
  const personneId = compte.personneId!;
  const repliee = (await cookies()).get("nav_repliee")?.value === "1";
  const reglages = await lireReglages();

  const [questions, reponses] = await Promise.all([
    lireQuestions(),
    lireReponses(personneId),
  ]);
  const complet = profilComplet(questions, reponses);

  // Tant que la porte est fermée, il n'y a pas de barre du tout. Elle
  // n'aurait qu'un lien, celui de la page où l'on se trouve déjà, et cet
  // écran-là se veut « au centre, avec aucune interface nulle part ». La page
  // du profil dessine alors la sienne, plein écran.
  if (!complet) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <NavigationLaterale
        liens={LIENS}
        nom={compte.nom}
        zone="Ton espace"
        repliee={repliee}
        /* Le groupe vit ici et non dans le socle : la barre reçoit un titre
           et des liens, elle n'a pas à savoir ce qu'est Circle. Vide, elle
           ne dessine rien. */
        groupes={[
          { titre: "Liens externes", liens: construireLiensCircle(reglages.liens_externes) },
        ]}
      />
      {/* min-w-0 est indispensable : un enfant flex a min-width:auto par
          défaut, donc sans lui cette zone refuse de rétrécir sous la largeur
          de son contenu, et le débordement du pipe emporte toute la page au
          lieu de rester dans son propre conteneur. */}
      <div className="flex min-w-0 flex-1 flex-col bg-fond-alt">
        <main className="min-w-0 flex-1 p-10">{children}</main>
      </div>
    </div>
  );
}
