import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { lireNomDuProgramme } from "@/lib/reglages/requetes";
import { ProgrammeProvider } from "@/lib/design/LogoProgramme";
import "./globals.css";

/**
 * La charte demande BDO Grotesk, une police premium qui n'est ni achetée ni
 * hébergée ici. Plus Jakarta Sans en est le repli le plus proche, et se
 * charge depuis Google Fonts. Jamais de serif.
 */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ProgrammeProvider nom={nomProgramme}>{children}</ProgrammeProvider>
      </body>
    </html>
  );
}
