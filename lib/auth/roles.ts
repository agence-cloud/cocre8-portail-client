export type Role = "admin" | "membre";

export type CompteConnecte = {
  id: string;
  role: Role;
  nom: string;
  personneId: string | null;
};

/** Où atterrit un compte selon son rôle. Un membre ne voit jamais le pilotage. */
export function cheminAccueil(role: Role): string {
  return role === "admin" ? "/pilotage" : "/espace";
}
