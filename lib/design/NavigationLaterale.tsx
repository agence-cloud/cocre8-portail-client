"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { seDeconnecter } from "@/lib/auth/actions";
import { Icone, type NomIcone } from "@/lib/design/Icones";
import { LogoProgramme } from "@/lib/design/LogoProgramme";
import { BasculeNavigation } from "@/lib/design/BasculeNavigation";
import { IndicateurNavigation } from "@/lib/design/IndicateurNavigation";

export type LienNav = {
  libelle: string;
  href: string;
  icone: NomIcone;
  bientot?: boolean;
  /**
   * Le lien sort de l'app. Il s'ouvre dans un onglet à lui, et un chevron le
   * dit avant le clic : le membre est au milieu de son travail, on ne lui
   * reprend pas son écran sans prévenir.
   */
  externe?: boolean;
  /**
   * Un nombre en attente, affiché en pastille. Absent ou nul, rien ne
   * s'affiche : une pastille à zéro est du bruit permanent, et on finit par
   * ne plus la voir le jour où elle compte enfin quelque chose.
   */
  pastille?: number;
};

/**
 * Des liens rassemblés sous un titre, posés après les liens principaux. Le
 * groupe porte son titre, la barre ne sait pas ce qu'il contient : c'est ce
 * qui permet au socle d'ignorer jusqu'à l'existence de Circle.
 */
export type GroupeNav = {
  titre: string;
  liens: LienNav[];
};

/**
 * Un geste posé dans la barre, à côté des liens. « Lancer la démo » est le
 * premier, et la barre n'a pas à savoir ce que c'est : elle reçoit une action
 * serveur et un libellé.
 *
 * Une action serveur traverse la frontière serveur-client, contrairement à
 * une fonction ordinaire : c'est ce qui permet à un layout de composer cette
 * liste sans que le socle connaisse la démonstration.
 */
export type ActionNav = {
  libelle: string;
  icone: NomIcone;
  action: () => Promise<void>;
};

type Props = {
  liens: LienNav[];
  nom: string;
  zone: string;
  repliee: boolean;
  groupes?: GroupeNav[];
  actions?: ActionNav[];
};

/**
 * Une ligne de la barre. Extraite parce que les liens principaux et ceux des
 * groupes se dessinent exactement pareil : les laisser en double, c'était
 * s'assurer qu'un jour l'un des deux dériverait de l'autre.
 */
function LienDeBarre({ lien, repliee }: { lien: LienNav; repliee: boolean }) {
  const contenu = (
    <>
      <Icone nom={lien.icone} className="h-[18px] w-[18px] shrink-0" />
      {!repliee && <span className="flex-1 max-md:hidden">{lien.libelle}</span>}
      {/* La pastille reste visible barre repliée, contrairement au libellé :
          c'est justement l'information qu'on ne veut pas rater. */}
      {lien.pastille !== undefined && lien.pastille > 0 && (
        <span
          className={`rounded-pilule bg-accent px-1.5 py-0.5 text-[10px] font-medium text-fond ${
            repliee ? "absolute right-1 top-1" : "ml-auto"
          }`}
        >
          {lien.pastille}
        </span>
      )}
      {!repliee && lien.bientot && (
        <span className="rounded-pilule bg-fond-alt px-2 py-0.5 text-[10px] text-texte-doux max-md:hidden">
          bientôt
        </span>
      )}
      {!repliee && lien.externe && !lien.bientot && (
        <span aria-hidden="true" className="text-xs text-texte-doux/60 max-md:hidden">
          ↗
        </span>
      )}
    </>
  );

  // Le libellé disparaît quand la barre est repliée : l'attribut title
  // le rend au survol, sinon les icônes seules deviennent des devinettes.
  // `relative` porte la pastille quand la barre est repliée : sans elle,
  // elle irait se caler sur le premier ancêtre positionné, très loin d'ici.
  const classes = `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
    repliee ? "justify-center" : "max-md:justify-center"
  }`;

  if (lien.bientot) {
    return (
      <li>
        <span className={`${classes} text-texte-doux/50`} title={`${lien.libelle} (bientôt)`}>
          {contenu}
        </span>
      </li>
    );
  }

  // Une balise `a` nue et non `Link` : le routeur de Next n'a rien à
  // précharger d'une adresse qui n'est pas à lui, et `rel` est obligatoire
  // avec `target="_blank"`, sans quoi la page ouverte garde une prise sur
  // celle qui l'a ouverte.
  if (lien.externe) {
    return (
      <li>
        <a
          href={lien.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`${lien.libelle} (nouvel onglet)`}
          className={`${classes} text-texte-doux hover:bg-surface hover:text-texte`}
        >
          {contenu}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={lien.href}
        title={lien.libelle}
        className={`${classes} text-texte-doux hover:bg-surface hover:text-texte`}
      >
        {contenu}
        {/* Dans le `Link` et non à côté : `useLinkStatus` lit l'état du lien
            le plus proche au-dessus de lui. */}
        <IndicateurNavigation />
      </Link>
    </li>
  );
}

/**
 * Sur téléphone, la barre est toujours dans sa forme étroite, quel que soit
 * le réglage. Dépliée, elle prendrait 256 des 375 pixels de l'écran et il en
 * resterait 119 pour la page : ce n'est plus une navigation, c'est un mur.
 * Le repli forcé se fait en CSS (`max-md:`) et non en JavaScript, pour que le
 * rendu serveur et le rendu client disent la même chose : mesurer la largeur
 * de la fenêtre au premier rendu ferait diverger les deux.
 *
 * Le repli vit dans l'état du composant, pas dans le cookie : c'est ce qui
 * rend la bascule instantanée. Le cookie ne sert qu'à initialiser cet état au
 * premier rendu (pour que la barre ne s'ouvre pas avant de se refermer) et à
 * retenir le choix pour la prochaine visite. useOptimistic ne convient pas
 * ici, la valeur ne revient jamais du serveur : c'est un réglage, pas un
 * résultat en attente de confirmation.
 */
export function NavigationLaterale({
  liens,
  nom,
  zone,
  repliee: replieePersistee,
  groupes = [],
  actions = [],
}: Props) {
  const [repliee, setRepliee] = useState(replieePersistee);

  function basculer() {
    const nouvelle = !repliee;
    setRepliee(nouvelle);
    // L'écriture du cookie ne doit jamais retarder ce que l'oeil vient de
    // voir changer : elle part dans une transition, à part du rendu urgent.
    startTransition(() => {
      document.cookie = `nav_repliee=${nouvelle ? "1" : "0"}; path=/; max-age=31536000; SameSite=Lax`;
    });
  }

  return (
    /* `sticky top-0 h-screen` et non la hauteur du contenu : sans eux, la
       barre s'étire à la hauteur de la page, et sur un écran long son pied
       (le nom, « Se déconnecter ») descend tout en bas avec elle au lieu de
       rester sous les yeux.

       `self-start` est nécessaire dans ce conteneur en flex : sans lui,
       l'étirement par défaut reprendrait la main sur la hauteur et le
       collant n'aurait plus rien à quoi se tenir. */
    <nav
      className={`sticky top-0 flex h-screen shrink-0 flex-col self-start overflow-hidden border-r border-bordure bg-fond py-6 transition-[width] duration-200 ${
        repliee ? "w-16 px-2" : "w-64 px-4 max-md:w-16 max-md:px-2"
      }`}
    >
      <div
        className={`flex items-center ${
          repliee ? "justify-center" : "justify-between px-3 max-md:justify-center max-md:px-0"
        }`}
      >
        {/* Le logotype du programme et non celui de l'éditeur : le client
            vient chez son coach, et l'éditeur signe ailleurs, sur l'écran de
            connexion.

            Repliée, la barre n'affiche rien plutôt que des initiales : il
            reste 48 pixels une fois les marges retirées, et la bascule en
            occupe 32. Deux lettres y tiendraient mal, et mal placé un logo
            dessert la marque plus qu'il ne la sert. */}
        {!repliee && (
          <div className="max-md:hidden">
            <LogoProgramme taille="petit" />
            <p className="mt-1 text-xs text-texte-doux">{zone}</p>
          </div>
        )}
        <BasculeNavigation repliee={repliee} onBasculer={basculer} />
      </div>

      {/* Elle défile pour elle-même si les liens débordent, plutôt que de
          pousser le pied hors de l'écran. `min-h-0` est indispensable : un
          enfant flex refuse par défaut de rétrécir sous la hauteur de son
          contenu, et sans lui le défilement ne se déclencherait jamais.

          Un `div` autour des listes, et non une seule `ul` : chaque groupe a
          son titre, et un titre n'est pas un élément de liste. */}
      <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {/* La clé porte sur le libellé, pas sur l'adresse : deux liens
              peuvent viser la même page (les trois liens Circle pointent
              tous sur l'adresse provisoire de l'académie), mais deux liens
              ne portent jamais le même libellé dans une même barre. */}
          {liens.map((lien) => (
            <LienDeBarre key={lien.libelle} lien={lien} repliee={repliee} />
          ))}
        </ul>

        {/* Le filet sépare les groupes même repliée, où le titre ne tient
            pas : sans lui les icônes formeraient une seule colonne continue
            et le regroupement disparaîtrait justement là où il aide le
            plus. */}
        {groupes
          .filter((groupe) => groupe.liens.length > 0)
          .map((groupe) => (
            <div key={groupe.titre} className="mt-6 border-t border-bordure pt-4">
              {!repliee && (
                <p className="px-3 pb-2 text-[10px] uppercase tracking-wider text-texte-doux/70 max-md:hidden">
                  {groupe.titre}
                </p>
              )}
              <ul className="space-y-1">
                {/* Même règle que la liste principale : la clé porte sur le
                    libellé, c'est ici que les trois liens Circle
                    partageraient sinon la même adresse. */}
                {groupe.liens.map((lien) => (
                  <LienDeBarre key={lien.libelle} lien={lien} repliee={repliee} />
                ))}
              </ul>
            </div>
          ))}
      </div>

      {/* Les gestes, entre les liens et le pied : ce ne sont pas des
          destinations, ils n'ont donc rien à faire dans la liste au-dessus,
          et ils ne sont pas non plus du compte connecté.

          Sans filet à eux : le pied en porte déjà un juste en dessous, et
          deux traits à trois pixels l'un de l'autre enferment le bouton dans
          une bande étroite au lieu de le poser. Exactement le même gabarit
          que les liens, sans quoi son icône ne tombe pas sur la même
          colonne que les leurs. */}
      {actions.length > 0 && (
        <ul className="mt-4 space-y-1">
          {actions.map((geste) => (
            <li key={geste.libelle}>
              <form action={geste.action}>
                <button
                  type="submit"
                  title={geste.libelle}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-texte-doux transition-colors duration-200 hover:bg-surface hover:text-texte ${
                    repliee ? "justify-center" : "max-md:justify-center"
                  }`}
                >
                  <Icone nom={geste.icone} className="h-[18px] w-[18px] shrink-0" />
                  {!repliee && (
                    <span className="flex-1 text-left max-md:hidden">{geste.libelle}</span>
                  )}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* `mt-auto` en plus de `flex-1` au-dessus : les deux disent la même
          chose, mais le pied reste collé en bas même le jour où la liste
          perdra son `flex-1`. */}
      <div className="mt-auto border-t border-bordure pt-4">
        {!repliee && <p className="px-3 text-sm text-texte-doux max-md:hidden">{nom}</p>}
        <form action={seDeconnecter}>
          <button
            type="submit"
            title="Se déconnecter"
            className={`mt-1 w-full rounded-lg px-3 py-2 text-sm text-texte-doux transition-colors duration-200 hover:bg-surface hover:text-texte ${
              repliee ? "text-center" : "text-left max-md:text-center"
            }`}
          >
            {repliee ? (
              "↩"
            ) : (
              <>
                <span className="max-md:hidden">Se déconnecter</span>
                <span className="md:hidden">↩</span>
              </>
            )}
          </button>
        </form>
      </div>
    </nav>
  );
}
