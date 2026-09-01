/**
 * Règle de marque Cocre8 : les tirets longs sont interdits dans tous les
 * textes visibles. Virgules, deux-points ou parenthèses à la place.
 * U+2014 = cadratin, U+2013 = demi-cadratin.
 */
const TIRETS_INTERDITS = /[—–]/;

export function contientTiretLong(texte: string): boolean {
  return TIRETS_INTERDITS.test(texte);
}
