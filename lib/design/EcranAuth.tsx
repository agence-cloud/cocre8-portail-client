import type { ReactNode } from "react";
import { LogoProgramme } from "@/lib/design/LogoProgramme";

/**
 * Les deux pages juridiques appartiennent à celui qui installe l'outil : ce
 * sont ses mentions et sa politique, sur son site, avec son entité comme
 * responsable de traitement. Elles sont donc vides par défaut.
 *
 * **Une adresse vide n'affiche pas son lien.** Mieux vaut aucun lien qu'un
 * lien mort, et surtout aucune page juridique qui serait celle de quelqu'un
 * d'autre. C'est la même règle que pour les liens externes du membre.
 */
const LEGAL = [
  { libelle: "Mentions légales", href: "" },
  { libelle: "Politique de confidentialité", href: "" },
].filter((page) => page.href !== "");

type Props = {
  /** Le grand titre du volet de marque. Un `ReactNode` pour porter l'orange. */
  titre: ReactNode;
  /** La phrase sous le titre. Masquée sur téléphone, comme la liste. */
  accroche: string;
  /**
   * Ce qui attend derrière la porte. Sans liste, le volet garde son titre et
   * son accroche : c'est le cas de la page qui ouvre la session, où l'on ne
   * fait que passer.
   */
  points?: readonly string[];
  /** Le contenu du volet de droite : un formulaire, ou un message. */
  children: ReactNode;
};

/**
 * La coquille des trois écrans d'authentification : la connexion, la pose du
 * mot de passe, et l'atterrissage du lien reçu par email.
 *
 * **Extraite parce que les trois doivent se ressembler et qu'ils se
 * suivent.** Un nouveau client les traverse dans l'ordre en moins d'une
 * minute : le lien de son email, puis son mot de passe, puis son espace. Un
 * changement de décor entre deux donne l'impression d'avoir changé de site.
 * Recopiée trois fois, cette mise en page aurait divergé au premier retour
 * sur l'une d'elles.
 *
 * **Le volet de gauche n'est pas une décoration.** Il dit ce qu'il y a
 * derrière la porte, pour que quelqu'un qui arrive par un lien sache où il
 * met les pieds avant de saisir quoi que ce soit. C'est aussi le seul écran
 * que voient les prospects pendant une démonstration.
 *
 * **Sur téléphone, il se réduit au logotype et au titre**, sur fond blanc et
 * sans filet. L'accroche, la liste et les arcs ne s'affichent qu'à partir de
 * `lg` : quelqu'un qui arrive ici vient entrer, et chaque ligne de plus
 * repousse le premier champ sous la ligne de flottaison.
 *
 * Le premium vient du mouvement et de la hiérarchie, jamais d'un fond
 * sombre : la charte Cocre8 est une marque à fond blanc, et elle le reste.
 */
export function EcranAuth({ titre, accroche, points = [], children }: Props) {
  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative flex flex-col overflow-hidden bg-fond px-8 pt-14 pb-2 lg:min-h-screen lg:flex-[1.05] lg:justify-between lg:border-r lg:border-bordure lg:bg-fond-alt lg:px-16 lg:py-14">
        {/* Les cercles concentriques du logotype Cocre8, agrandis et coupés
            par le bord. Une texture, pas un motif : assez présente pour que
            le volet ne soit pas un aplat, assez discrète pour ne rien
            disputer au titre. Un seul arc porte l'orange.

            `aria-hidden` et `pointer-events-none` : c'est du décor, il n'a
            rien à dire à un lecteur d'écran ni à intercepter un clic. */}
        <svg
          viewBox="0 0 600 600"
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -bottom-52 hidden h-[600px] w-[600px] opacity-55 lg:block"
        >
          <g fill="none" stroke="currentColor" strokeWidth="1" className="text-texte/12">
            <circle cx="300" cy="300" r="100" />
            <circle cx="300" cy="300" r="170" />
            <circle cx="300" cy="300" r="298" />
          </g>
          <circle
            cx="300"
            cy="300"
            r="240"
            fill="none"
            strokeWidth="1"
            className="stroke-orange/45"
          />
        </svg>

        <div className="cascade relative flex flex-col gap-8 lg:flex-1 lg:justify-between lg:gap-12">
          <LogoProgramme taille="petit" />

          <div>
            {/* La seconde ligne du titre est un bloc chez l'appelant, pas un
                simple `span` : laissée au fil du texte, elle casse selon la
                largeur et l'orange se retrouve à cheval sur deux lignes. Le
                passage à la ligne fait partie de la composition. */}
            <h1 className="text-[32px] leading-[1.03] tracking-[-0.045em] sm:text-[38px] lg:text-[50px]">
              {titre}
            </h1>
            <p className="mt-5 hidden max-w-[34ch] text-[17px] leading-relaxed text-texte-doux lg:block lg:text-[18px]">
              {accroche}
            </p>

            {points.length > 0 && (
              <ul className="mt-10 hidden max-w-lg border-t border-texte/8 lg:block">
                {points.map((ligne, rang) => (
                  <li
                    key={ligne}
                    className="flex items-baseline gap-6 border-b border-texte/8 py-3.5 transition-[padding] duration-300 hover:pl-2.5"
                  >
                    <span className="shrink-0 text-[12px] font-semibold tracking-wider text-orange">
                      {String(rang + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px]">{ligne}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Au pied du volet sur grand écran, au pied de la page sur
              téléphone, où il n'y a plus qu'une colonne. */}
          <p className="hidden text-[13px] text-texte-doux/65 lg:block">Propulsé par Cocre8</p>
        </div>
      </section>

      <section className="flex flex-1 flex-col px-8 py-12 lg:min-h-screen lg:px-16">
        {/* Centré seulement à partir de `lg`, où le volet fait la hauteur de
            l'écran. Sous cette largeur, il se pose juste sous le volet de
            marque : centré, il tomberait au milieu d'un vide et obligerait à
            faire défiler pour trouver le premier champ. */}
        <div className="mt-8 mb-auto w-full max-w-[400px] self-center lg:my-auto">{children}</div>

        <p className="mt-12 text-center text-[13px] text-texte-doux/65 lg:hidden">
          Propulsé par Cocre8
        </p>

        <p className="mt-6 text-center text-[12px] text-texte-doux/65 lg:mt-10">
          {LEGAL.map((page, rang) => (
            <span key={page.href}>
              {rang > 0 && <span className="mx-2.5 opacity-50">·</span>}
              <a
                href={page.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200 hover:text-texte"
              >
                {page.libelle}
              </a>
            </span>
          ))}
        </p>
      </section>
    </main>
  );
}

/** Le titre du volet de droite. Masqué sur téléphone, où il n'y a plus deux
 *  volets et où il se poserait entre le titre et les champs pour ne rien
 *  dire de plus. */
export function TitreAuth({ children }: { children: ReactNode }) {
  return <h2 className="mb-8 hidden text-[27px] tracking-[-0.035em] lg:block">{children}</h2>;
}

/** Le gabarit d'un champ, partagé par les deux formulaires. */
export const CHAMP_AUTH =
  "w-full rounded-xl border border-bordure bg-fond px-4 py-3 text-[15px] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-texte/30 hover:border-texte/25 focus:border-orange focus:shadow-[0_0_0_3px_var(--color-orange-tint)]";

/** Le gabarit d'un libellé de champ. */
export const ETIQUETTE_AUTH =
  "mb-2 block text-[12px] font-semibold tracking-[0.1em] text-texte-doux/65 uppercase";

/**
 * Le bouton se soulève d'un pixel et projette une ombre orange diffuse :
 * c'est le seul endroit de l'écran où quelque chose bouge sous la souris, et
 * il gagne à être celui-là.
 */
export const BOUTON_AUTH =
  "group mt-7 flex w-full items-center justify-center gap-2.5 hover:-translate-y-px hover:shadow-[0_8px_20px_-6px_rgba(255,99,32,0.45)] disabled:translate-y-0 disabled:shadow-none";
