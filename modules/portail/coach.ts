/**
 * Le coach du client, et comment le joindre.
 *
 * **Vide par défaut, et c'est voulu.** Un numéro d'exemple laissé là finit
 * affiché à de vrais clients, et un lien `tel:` qui compose le numéro de
 * quelqu'un d'autre est pire qu'un lien absent. La carte ne se dessine pas
 * tant que le numéro n'est pas renseigné.
 *
 * En constante et non en variable d'environnement : un `NEXT_PUBLIC_` est
 * recopié dans le paquet à la construction, il n'offre donc aucune souplesse
 * qu'une constante n'ait déjà, et une variable oubliée fait disparaître le
 * contenu sans rien dire. Elle deviendra un réglage, modifiable depuis
 * l'écran des réglages, quand celui-ci existera.
 */
export const COACH = {
  nom: "",
  telephone: "",
};

/**
 * Les deux formes d'un numéro, dérivées d'une seule écriture.
 *
 * **Pourquoi une fonction plutôt que deux chaînes dans `COACH`.** Le lien et
 * l'affichage doivent dire le même numéro, et deux valeurs saisies à la main
 * divergent : c'est exactement la faute que ce dépôt documente sur
 * `telephone_court`, où deux calculs du même identifiant devaient être tenus
 * identiques. Ici il n'y a qu'une source, les chiffres, et deux vues dessus.
 *
 * L'international dans le lien, parce qu'un `tel:` en `0…` ne compose rien
 * depuis l'étranger, et un membre en déplacement doit pouvoir appeler.
 * Le format français à l'écran, parce que c'est celui qu'on lit.
 *
 * Tout ce qui n'est pas un chiffre est retiré avant : la constante peut être
 * écrite avec des espaces ou des points sans que le lien casse.
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
