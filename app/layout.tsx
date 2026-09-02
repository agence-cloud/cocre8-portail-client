import type { Metadata } from "next";
import { lireNomDuProgramme } from "@/lib/reglages/requetes";
import { ProgrammeProvider } from "@/lib/design/LogoProgramme";
import "./globals.css";

/**
 * Aucune police n'est chargée ici, et c'est voulu : la pile système, définie
 * dans `globals.css`. Une police prise chez Google ferait partir un appel
 * vers un tiers depuis l'espace des clients de chaque coach, pour un gain
 * typographique que personne ne verrait sur un outil de ce genre.
 */

/**
 * Le nom du programme est un réglage, donc le titre de l'onglet aussi : un
 * coach qui appelle son accompagnement autrement ne doit pas voir le nom
 * d'usine dans son navigateur.
 */
export async function generateMetadata(): Promise<Metadata> {
  const nom = await lireNomDuProgramme();

  return {
    title: nom,
    description: "Ton espace pour avancer, étape par étape.",
  };
}

/**
 * Le nom descend par un contexte posé ici.
 *
 * **Ce que ça coûte, et pourquoi c'est accepté.** Lire un réglage dans la
 * mise en page racine rend toute l'app dynamique, y compris l'écran de
 * connexion qui était figé à la construction. C'est une requête légère de
 * plus sur une page publique, contre un logotype qui dit le bon nom partout.
 * Sur un outil que chacun héberge pour lui, l'échange est bon.
 *
 * La lecture passe par une fonction de la base qui ne rend que ce nom : le
 * reste des réglages, dont le numéro du coach, n'est pas lisible sans compte.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nomProgramme = await lireNomDuProgramme();

  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ProgrammeProvider nom={nomProgramme}>{children}</ProgrammeProvider>
      </body>
    </html>
  );
}
