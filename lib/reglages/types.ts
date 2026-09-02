/**
 * Ce que chaque coach règle depuis l'app, sans toucher au code.
 *
 * **Les valeurs par défaut vivent ici, en code, et non en base.** Une base
 * neuve n'a aucune ligne de réglage, et l'app doit tourner quand même : une
 * valeur manquante retombe sur celle d'ici plutôt que de laisser un trou à
 * l'écran. C'est aussi ce qui permet d'ajouter un réglage sans migration.
 *
 * **Rien de secret n'entre dans ces réglages.** Ils sont lus par le client
 * autant que par le coach : tout ce qu'on y pose est public pour lui.
 */
export type LiensExternes = {
  communaute: string;
  formation: string;
  evenements: string;
};

export type Reglages = {
  /** Le nom affiché en tête de l'espace du client et sur la connexion. */
  nom_programme: string;
  coach_nom: string;
  coach_telephone: string;
  liens_externes: LiensExternes;
};

/**
 * Le nom du programme a son double dans `install.sql`, dans la fonction
 * `nom_du_programme()` qui répond à l'écran de connexion. Les deux doivent
 * dire la même chose : c'est la seule valeur dupliquée, et elle l'est parce
 * qu'un visiteur sans session ne peut pas lire la table.
 */
export const REGLAGES_PAR_DEFAUT: Reglages = {
  nom_programme: "Espace Client",
  coach_nom: "",
  coach_telephone: "",
  liens_externes: { communaute: "", formation: "", evenements: "" },
};

/**
 * Recompose des réglages complets à partir de ce que la base porte.
 *
 * Chaque valeur est vérifiée dans sa forme avant d'être retenue. Une base qui
 * a vieilli, ou qu'on a modifiée à la main, ne doit pas faire tomber un écran
 * pour un objet qui ne ressemble plus à ce qu'on attend : elle retombe sur le
 * défaut, ce qui se voit et se corrige, plutôt que de lever.
 */
export function composerReglages(lignes: { cle: string; valeur: unknown }[]): Reglages {
  const brut = new Map(lignes.map((ligne) => [ligne.cle, ligne.valeur]));

  const texte = (cle: keyof Reglages, defaut: string): string => {
    const valeur = brut.get(cle);
    return typeof valeur === "string" ? valeur : defaut;
  };

  const objet = <T extends Record<string, string>>(cle: keyof Reglages, defaut: T): T => {
    const valeur = brut.get(cle);
    if (!valeur || typeof valeur !== "object") return defaut;

    const rempli = { ...defaut };
    for (const champ of Object.keys(defaut) as (keyof T)[]) {
      const trouve = (valeur as Record<string, unknown>)[champ as string];
      if (typeof trouve === "string") rempli[champ] = trouve as T[keyof T];
    }
    return rempli;
  };

  return {
    nom_programme: texte("nom_programme", REGLAGES_PAR_DEFAUT.nom_programme),
    coach_nom: texte("coach_nom", REGLAGES_PAR_DEFAUT.coach_nom),
    coach_telephone: texte("coach_telephone", REGLAGES_PAR_DEFAUT.coach_telephone),
    liens_externes: objet("liens_externes", REGLAGES_PAR_DEFAUT.liens_externes),
  };
}

/** Un mot en tête de phrase, quand un libellé réglé arrive en minuscules. */
export function majuscule(mot: string): string {
  return mot.charAt(0).toUpperCase() + mot.slice(1);
}
