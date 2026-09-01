import { jourISO } from "@/lib/dates";

export type EtatPilier =
  | { statut: "ouvert" }
  | { statut: "a_venir"; date: string }
  | { statut: "ferme" };

/**
 * Trois états lus depuis une seule date. Sans date, le pilier n'est pas
 * prévu pour ce membre : c'est le cas du pilier 4, réservé.
 */
export function etatPilier(
  dateOuverture: string | null,
  aujourdhui: Date,
): EtatPilier {
  if (!dateOuverture) return { statut: "ferme" };
  if (dateOuverture <= jourISO(aujourdhui)) return { statut: "ouvert" };
  return { statut: "a_venir", date: dateOuverture };
}

/**
 * Ajoute des mois en ramenant au dernier jour du mois quand le jour n'existe
 * pas. setMonth déborde : 31 janvier plus un mois donne le 3 mars, et un
 * calendrier qui saute un mois ne se remarque qu'en février.
 */
function ajouterMois(iso: string, mois: number): string {
  const [annee, m, jour] = iso.split("-").map(Number);
  const cible = new Date(Date.UTC(annee, m - 1 + mois, 1));
  const dernierJour = new Date(
    Date.UTC(cible.getUTCFullYear(), cible.getUTCMonth() + 1, 0),
  ).getUTCDate();

  cible.setUTCDate(Math.min(jour, dernierJour));
  return jourISO(cible);
}

/**
 * Le calendrier type d'un accompagnement.
 *
 * Le pilier 0 ne suit pas la date de démarrage : il s'ouvre le jour même.
 * Un membre qui signe le 28 août pour une cohorte qui démarre le 1er
 * septembre fait son onboarding dans la foulée au lieu d'attendre quatre
 * jours devant un espace vide. Le pilier 4 n'est jamais proposé, il se
 * débloque à la main.
 */
export function calendrierPropose(
  demarrage: string,
  aujourdhui: Date,
): { numero: number; date: string }[] {
  return [
    { numero: 0, date: jourISO(aujourdhui) },
    { numero: 1, date: demarrage },
    { numero: 2, date: ajouterMois(demarrage, 1) },
    { numero: 3, date: ajouterMois(demarrage, 2) },
  ];
}
