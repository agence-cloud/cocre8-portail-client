/**
 * Les tirets longs sont interdits dans tous les textes visibles : ils se
 * saisissent mal, se cherchent au clavier, et un coach qui reprend un libellé
 * n'a aucune raison d'aller en chercher un. Virgules, deux-points ou
 * parenthèses à la place.
 * U+2014 = cadratin, U+2013 = demi-cadratin.
 */
const TIRETS_INTERDITS = /[—–]/;

export function contientTiretLong(texte: string): boolean {
  return TIRETS_INTERDITS.test(texte);
}
