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
 * serait fausse dès que quelqu'un renomme la sienne. Le mot lui-même est un
 * réglage, il arrive donc en paramètre.
 */
export function phraseCadenas(date: string | null, mot: string): string {
  if (!date) return `Ce ${mot} n'est pas encore programmé, ton coach s'en occupe.`;

  return `Il s'ouvre le ${formaterJourMois(date)}.`;
}

/** Les cinq glyphes dessinés, parcourus en boucle. */
const GLYPHES = 5;

/**
 * L'icône d'une partie.
 *
 * **Elle est décorative, et c'est le changement.** Les glyphes ont été
 * dessinés pour une méthode précise, où le deuxième pilier parlait de
 * livraison et le troisième d'acquisition. Ici les parties se nomment et se
 * comptent depuis les réglages : aucun dessin ne peut plus dire ce qu'elles
 * contiennent, et c'est le numéro affiché à côté du nom qui les distingue.
 *
 * Le tour de boucle sert donc à une seule chose : qu'une sixième partie ait
 * une icône plutôt qu'un trou. Un jeu neutre reste à dessiner.
 */
export function iconePilier(numero: number): NomIcone {
  const rang = ((numero % GLYPHES) + GLYPHES) % GLYPHES;
  return `pilier-${rang}` as NomIcone;
}
