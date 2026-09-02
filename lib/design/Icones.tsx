type Nom =
  | "crm"
  | "clients"
  | "statistiques"
  | "tableau"
  | "profil"
  | "personne"
  | "piliers"
  | "documents"
  | "depot"
  | "image"
  | "evenement"
  | "communaute"
  | "formation"
  | "direct"
  | "demo"
  | "replier"
  | "cadenas"
  | "coche"
  | "stylo"
  | "pilier-0"
  | "pilier-1"
  | "pilier-2"
  | "pilier-3"
  | "pilier-4";

/**
 * Icônes dessinées à la main plutôt qu'importées : une librairie ajouterait
 * une dépendance pour huit glyphes, et rendrait l'outil reconnaissable au jeu
 * d'icônes qu'il emprunte. Toutes en trait, jamais pleines, sur une grille de
 * 24.
 */
const CHEMINS: Record<Nom, React.ReactNode> = {
  // Trois colonnes : un pipe se lit comme un tableau de colonnes.
  crm: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.5" />
      <rect x="16" y="4" width="5" height="7" rx="1.5" />
    </>
  ),
  // Deux personnes : des clients, pas un seul utilisateur.
  clients: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 5.5M17.5 15c2 .6 3.5 2.4 3.5 5" />
    </>
  ),
  // Des barres qui montent.
  statistiques: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  tableau: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
    </>
  ),
  profil: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </>
  ),
  // Un buste dans un rond : une fiche client, pas la navigation de l'espace
  // membre qui appartient déjà à `profil`.
  personne: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="10" r="2.7" />
      <path d="M6.8 17.5c0.9-2.6 2.8-4 5.2-4s4.3 1.4 5.2 4" />
    </>
  ),
  // Des paliers à gravir.
  piliers: (
    <>
      <path d="M3 20h5v-5H3zM9.5 20h5V10h-5zM16 20h5V4h-5z" />
    </>
  ),
  documents: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
    </>
  ),
  // Une flèche qui entre dans un bac : déposer.
  depot: (
    <>
      <path d="M12 3v11M8 10.5l4 3.5 4-3.5" />
      <path d="M4 16v3.5h16V16" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5-5-9 9" />
    </>
  ),
  // Un calendrier : le corps, la barre qui sépare l'en-tête, et les deux
  // anneaux qui le tiennent. Sans les anneaux, la forme se lit comme une
  // simple fenêtre, et rien ne dit qu'il s'agit d'une date.
  evenement: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10.5h17" />
      <path d="M8 3.5v4M16 3.5v4" />
    </>
  ),
  // Deux bulles qui se chevauchent : on se parle. Le buste de `profil` et
  // les deux de `clients` disent des personnes, pas un collectif, et à 18
  // pixels trois bustes côte à côte deviennent une tache.
  communaute: (
    <>
      <path d="M3 7.5a2.5 2.5 0 0 1 2.5-2.5h7A2.5 2.5 0 0 1 15 7.5v3a2.5 2.5 0 0 1-2.5 2.5H7l-4 3z" />
      <path d="M9.5 15.5v.5a2.5 2.5 0 0 0 2.5 2.5h3l3 2.5v-2.5h.5a2.5 2.5 0 0 0 2.5-2.5v-2a2.5 2.5 0 0 0-2.5-2.5H18" />
    </>
  ),
  // Une toque de diplômé : le plateau, la tête dessous, le gland qui pend.
  // Un livre ouvert aurait dit la ressource, pas le parcours qu'on suit.
  formation: (
    <>
      <path d="M12 4 2.5 8.5 12 13l9.5-4.5z" />
      <path d="M6.5 10.7v4.6c0 1.5 2.5 2.7 5.5 2.7s5.5-1.2 5.5-2.7v-4.6" />
      <path d="M21.5 8.5v5" />
    </>
  ),
  // Un point qui émet : un rendez-vous en direct. Le calendrier appartient
  // déjà à `evenement`, et repliée la barre ne montre que des icônes : deux
  // calendriers dans la même colonne ne se distinguent plus.
  direct: (
    <>
      <circle cx="12" cy="12" r="2.2" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4" />
      <path d="M4.8 4.8a10 10 0 0 0 0 14.4M19.2 19.2a10 10 0 0 0 0-14.4" />
    </>
  ),
  // Une lecture dans un rond : « lancer ». Le buste de `personne` disait un
  // contact, pas un geste, et sur un bouton un glyphe qui décrit son voisin
  // au lieu de son action se lit de travers.
  demo: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10.2 8.4 16 12l-5.8 3.6z" />
    </>
  ),
  // Un chevron : il pivote selon le sens.
  replier: <path d="M14 6l-6 6 6 6" />,
  // Un cadenas fermé : l'anse au-dessus, le corps en dessous.
  cadenas: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  coche: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  // Un crayon en diagonale, la pointe en bas à gauche, comme quand on le
  // tient pour écrire. Le second tracé sépare la mine du corps : sans
  // lui la forme se lit comme un simple losange allongé, c'est ce trait qui
  // fait reconnaître un crayon.
  stylo: (
    <>
      <path d="M16.3 4.2l3.5 3.5L9 18.5l-4.6 1.1 1.1-4.6z" />
      <path d="M5.5 15l3.5 3.5" />
    </>
  ),
  // L'icône de repli, servie à toute partie sans dessin : un drapeau
  // planté, le point de départ.
  "pilier-0": (
    <>
      <path d="M6 21V4.5" />
      <path d="M6 5h10.5l-2.2 3.6L16.5 12H6" />
    </>
  ),
  // Pilier 1 : des colonnes sur un socle, sous un fronton.
  // Deux dessins ont précédé celui-ci, une maison à cheminée puis des blocs
  // empilés qui ressemblaient à tout sauf à des fondations.
  "pilier-1": (
    <>
      <path d="M2.8 8.6 12 3.5l9.2 5.1" />
      <path d="M4.5 20.5h15" />
      <path d="M6.5 20.5v-9M12 20.5v-9M17.5 20.5v-9" />
    </>
  ),
  // Pilier 2 : un colis. La boucle abstraite qui l'a précédé
  // disait le mécanisme, pas la promesse. Ce pilier parle de ce qu'on livre.
  "pilier-2": (
    <>
      <path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9z" />
      <path d="M3.5 7.5 12 12l8.5-4.5" />
      <path d="M12 12v9" />
    </>
  ),
  // Pilier 3 : un aimant en fer à cheval, ses deux pôles
  // marqués. Sans les pôles, la forme se lit comme un simple U.
  "pilier-3": (
    <>
      <path d="M5 5v7a7 7 0 0 0 14 0V5" />
      <path d="M9 5v7a3 3 0 0 0 6 0V5" />
      <path d="M5 10h4M15 10h4" />
    </>
  ),
  // Pilier 4 : la courbe qui passe par-dessus les paliers. Les
  // paliers seuls se confondaient avec l'icône des statistiques.
  "pilier-4": (
    <>
      <rect x="3.5" y="15" width="4" height="5.5" rx="1.4" />
      <rect x="10" y="12" width="4" height="8.5" rx="1.4" />
      <rect x="16.5" y="9" width="4" height="11.5" rx="1.4" />
      <path d="M4 9.5 9.5 6l3.5 2.2L20 3.5" />
      <path d="M20.5 7.6V3.5h-4.1" />
    </>
  ),
};

export function Icone({ nom, className = "" }: { nom: Nom; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {CHEMINS[nom]}
    </svg>
  );
}

export type NomIcone = Nom;
