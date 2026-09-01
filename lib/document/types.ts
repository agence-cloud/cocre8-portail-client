import type { NomIcone } from "@/lib/design/Icones";

export type Document = {
  id: string;
  personne_id: string;
  nom: string;
  chemin_storage: string;
  taille_octets: number | null;
  type_mime: string | null;
  depose_par: string | null;
  visible_membre: boolean;
  cree_le: string;
};

/** Une taille de fichier lisible : 1,4 Mo plutôt que 1468006. */
export function formaterTaille(octets: number | null): string {
  if (octets === null) return "";
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

/**
 * Une image se reconnaît d'un coup d'œil dans une liste, le reste non.
 * Deux icônes suffisent donc : au delà, on ferait un catalogue de formats
 * que personne ne lit.
 */
export function iconeDocument(typeMime: string | null): NomIcone {
  return typeMime?.startsWith("image/") ? "image" : "documents";
}
