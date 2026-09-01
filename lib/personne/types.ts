/**
 * La fiche d'un client.
 *
 * Il n'y a pas d'étape ici, ni de canal, ni de motif de sortie : cet outil ne
 * suit pas de prospects. Toute fiche qu'il porte est celle d'un client qu'on
 * accompagne, et le suivi commercial appartient à un autre outil.
 */
export type Personne = {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  entreprise: string | null;
  /**
   * Fiche fictive du jeu de démonstration. Le drapeau est ce qui permet de la
   * reconnaître : c'est lui que « tout vider » suit, et lui qui empêche un
   * client inventé de compter comme un vrai.
   */
  demonstration: boolean;
  notes: string | null;
  cree_le: string;
  modifie_le: string;
};

/**
 * Le nom affichable d'une fiche. Ici plutôt que dans chaque écran : trois
 * écrans le recomposaient, et un prénom absent y produisait un espace en tête.
 */
export function nomComplet(personne: Pick<Personne, "nom" | "prenom">): string {
  return [personne.prenom, personne.nom].filter(Boolean).join(" ");
}
