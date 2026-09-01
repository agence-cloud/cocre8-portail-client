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
 * Un pilier fermé n'affiche pas un cadenas muet mais une phrase qui explique
 * l'attente et enseigne la méthode au passage. Écrites une fois ici, la date
 * s'y insère au rendu.
 */
const PHRASES: Record<number, string> = {
  1: "Ton accompagnement démarre le {date}. D'ici là, boucle Commence ici, tu arriveras prêt.",
  2: "Le cœur de la méthode. Il s'ouvre le {date}, une fois tes fondations posées.",
  3: "On remet du carburant le {date}. Pas avant : un tunnel qui remplit une bassine percée, c'est de l'argent jeté.",
  4: "Il se débloque quand tes chiffres sont au vert, ton coach t'ouvrira la porte.",
};

export function phraseCadenas(numero: number, date: string | null): string {
  // Le pilier 4 se débloque à la main, jamais par le calendrier : lui poser
  // une date serait un mensonge.
  if (numero === 4) return PHRASES[4];

  const phrase = PHRASES[numero];
  if (!phrase) return "Ton coach ne l'a pas encore programmé.";
  if (!date) return "Ce pilier n'est pas encore programmé, ton coach s'en occupe.";

  return phrase.replace("{date}", formaterJourMois(date));
}

/**
 * Le numéro décide de l'icône. Un pilier hors des cinq connus retombe sur
 * celle du départ plutôt que de casser l'écran : le référentiel peut
 * grandir avant que quelqu'un pense à dessiner.
 */
export function iconePilier(numero: number): NomIcone {
  const nom = `pilier-${numero}` as NomIcone;
  return numero >= 0 && numero <= 4 ? nom : ("pilier-0" as NomIcone);
}
