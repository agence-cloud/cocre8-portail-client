/**
 * Remet une adresse Supabase dans la forme que la cliente attend, à partir
 * de ce que les gens collent vraiment.
 *
 * **Ce fichier existe à cause d'un écran, pas d'un caprice.** Le tableau de
 * bord Supabase affiche en gros, avec un bouton de copie juste à côté, un
 * champ « API URL » qui vaut `https://<reference>.supabase.co/rest/v1/`. Le
 * bouton de copie emporte le `/rest/v1/`, et la cliente Supabase, elle,
 * attend l'adresse nue. Résultat : celui qui suit l'écran le plus visible du
 * tableau de bord obtient une valeur refusée.
 *
 * Refuser cette valeur était juste, et inutile. La bonne réponse n'est pas
 * d'écrire une instruction plus précise, c'est d'accepter ce que l'écran
 * donne. Sont donc admis, et ramenés à la même chose :
 *
 *   https://abc.supabase.co                     déjà propre
 *   https://abc.supabase.co/                    barre finale
 *   https://abc.supabase.co/rest/v1/            le champ « API URL »
 *   https://supabase.com/dashboard/project/abc  la barre d'adresse
 *   abc                                         la référence seule
 *
 * Rend `null` sur tout le reste, pour que l'appelant lève l'erreur qui va
 * bien. Cette fonction range, elle ne devine pas : une adresse qui ne
 * ressemble à rien de connu reste une erreur.
 */

/** Une référence de projet : des minuscules, des chiffres, des tirets. */
const REFERENCE = /^[a-z0-9-]+$/;

/** L'adresse d'un projet, une fois nettoyée de son chemin. */
const ADRESSE_PROJET = /^https:\/\/([a-z0-9-]+)\.supabase\.(co|in)$/;

/** L'adresse du tableau de bord, qui porte la référence dans son chemin. */
const TABLEAU_DE_BORD = /^https:\/\/supabase\.com\/dashboard\/project\/([a-z0-9-]+)/;

export function normaliserAdresseSupabase(brut: string): string | null {
  const valeur = brut.trim();
  if (valeur === "") return null;

  // Le tableau de bord d'abord : son hôte est `supabase.com`, donc retirer
  // son chemin comme on le fait plus bas laisserait une adresse qui n'est
  // pas celle d'un projet. C'est la référence dans le chemin qui compte.
  const tableau = TABLEAU_DE_BORD.exec(valeur);
  if (tableau) return `https://${tableau[1]}.supabase.co`;

  // La référence collée seule. Sans point ni barre, elle ne peut être que
  // ça : aucune adresse ne prend cette forme.
  if (REFERENCE.test(valeur)) return `https://${valeur}.supabase.co`;

  // Tout le reste : on coupe au premier `/` qui suit l'hôte, ce qui emporte
  // `/rest/v1/` comme une barre finale seule.
  const sansChemin = valeur.replace(/^(https:\/\/[^/]+).*$/, "$1");

  return ADRESSE_PROJET.test(sansChemin) ? sansChemin : null;
}
