import { formaterJourMois } from "@/lib/dates";
import type { NomIcone } from "@/lib/design/Icones";

export type Pilier = {
  id: string;
  numero: number;
  nom: string;
  description: string | null;
  ordre: number;
};

export type AccesPilier = {
  pilier_id: string;
  date_ouverture: string;
};

/**
 * Un pilier fermé n'affiche pas un cadenas muet mais une phrase qui dit
 * l'attente.
 *
 * Une seule phrase pour toutes les parties, et non une par numéro : leurs
 * noms se règlent depuis l'app, donc une phrase écrite pour « la partie 2 »
 * serait fausse dès que quelqu'un renomme la sienne.
 */
export function phraseCadenas(_numero: number, date: string | null): string {
  if (!date) return "Cette partie n'est pas encore programmée, ton coach s'en occupe.";

  return `Elle s'ouvre le ${formaterJourMois(date)}.`;
}

/**
 * Le numéro décide de l'icône. Une partie hors des cinq dessinées retombe sur
 * la première plutôt que de casser l'écran : le nombre de parties se règle
 * depuis l'app, il peut donc grandir avant que quelqu'un pense à dessiner.
 */
export function iconePilier(numero: number): NomIcone {
  const nom = `pilier-${numero}` as NomIcone;
  return numero >= 0 && numero <= 4 ? nom : ("pilier-0" as NomIcone);
}
