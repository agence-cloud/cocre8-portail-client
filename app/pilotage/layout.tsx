import { cookies } from "next/headers";
import { exigerAdmin } from "@/lib/auth/compte";
import { NavigationLaterale } from "@/lib/design/NavigationLaterale";

/**
 * Les liens du côté coach.
 *
 * Deux, et c'est volontaire : cet outil fait une chose, suivre les clients
 * qu'on accompagne, et se règle depuis un seul endroit.
 */
const LIENS = [
  { libelle: "Mes clients", href: "/pilotage", icone: "clients" as const },
  { libelle: "Réglages", href: "/pilotage/reglages", icone: "crm" as const },
];

export default async function LayoutPilotage({
  children,
}: {
  children: React.ReactNode;
}) {
  const compte = await exigerAdmin();
  const repliee = (await cookies()).get("nav_repliee")?.value === "1";

  return (
    <div className="flex min-h-screen">
      <NavigationLaterale liens={LIENS} nom={compte.nom} zone="Pilotage" repliee={repliee} />
      {/* min-w-0 est indispensable : un enfant flex a min-width:auto par
          défaut, donc sans lui cette zone refuse de rétrécir sous la largeur
          de son contenu, et un tableau large emporterait toute la page au
          lieu de rester dans son propre conteneur. */}
      <main className="min-w-0 flex-1 bg-fond-alt p-10">{children}</main>
    </div>
  );
}
