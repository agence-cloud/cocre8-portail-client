import type { PorteeReunion } from "@/lib/personne/appels.types";

/**
 * Un coaching tel que le membre le voit, et rien de plus.
 *
 * Ce type est plus pauvre que `Appel`, et c'est tout son intérêt : il n'a pas
 * de `notes`, pas de `nature`, pas de `source_externe`. Il reflète la vue
 * `coaching_membre` (migrations 0028 et 0029), qui est ce qui tient la note
 * interne du coach hors de portée. Ajouter un champ ici sans l'ajouter à la
 * vue ne donnerait rien ; l'ajouter aux deux ouvrirait une porte, et c'est le
 * genre de geste qui se fait sans y penser.
 */
export type Coaching = {
  id: string;
  /** Toujours celui du membre : la vue ne rend que ses propres séances. */
  personne_id: string | null;
  titre: string | null;
  portee: PorteeReunion;
  prevu_le: string;
  duree_minutes: number | null;
  lien_visio: string | null;
  lien_enregistrement: string | null;
  transcription: string | null;
  resume: string | null;
};
