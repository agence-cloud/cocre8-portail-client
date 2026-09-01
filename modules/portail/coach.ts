/**
 * Comment joindre le coach : les deux formes d'un numéro, dérivées d'une
 * seule écriture.
 *
 * **Son numéro est un réglage, et il part vide.** Un numéro d'exemple laissé
 * dans le code finit affiché à de vrais clients, et un lien `tel:` qui
 * compose le numéro de quelqu'un d'autre est pire qu'un lien absent. La carte
 * du tableau de bord ne se dessine pas tant qu'il n'est pas renseigné.
 *
 * **Une fonction plutôt que deux valeurs réglées séparément.** Le lien et
 * l'affichage doivent dire le même numéro, et deux chaînes saisies à la main
 * divergent. Ici il n'y a qu'une source, les chiffres, et deux vues dessus.
 *
 * Elle reçoit le numéro en paramètre plutôt que d'aller le lire : le module
 * met en forme, il ne décide pas d'où vient la valeur, et c'est ce qui la
 * rend éprouvable sans base.
 *
 * L'international dans le lien, parce qu'un `tel:` en `0…` ne compose rien
 * depuis l'étranger, et un client en déplacement doit pouvoir appeler. Le
 * format français à l'écran, parce que c'est celui qu'on lit.
 *
 * Tout ce qui n'est pas un chiffre est retiré avant : le réglage peut être
 * saisi avec des espaces ou des points sans que le lien casse.
 */
export function joindreLeCoach(telephone: string): {
  href: string;
  affichage: string;
} {
  const chiffres = telephone.replace(/\D/g, "");

  // Un numéro français commence par 0 et compte dix chiffres. Le préfixe
  // remplace ce 0. Tout autre format est rendu tel quel plutôt que mutilé :
  // mieux vaut un lien que l'app n'a pas su embellir qu'un lien faux.
  const international =
    chiffres.length === 10 && chiffres.startsWith("0")
      ? `+33${chiffres.slice(1)}`
      : chiffres;

  const affichage =
    chiffres.length === 10 ? (chiffres.match(/\d{2}/g) ?? []).join(" ") : telephone;

  return { href: `tel:${international}`, affichage };
}
