/**
 * Le mot de passe qu'on donne au client, et rien d'autre.
 *
 * **Il se lit à voix haute et se recopie sans faute.** Le coach le transmet
 * par le canal qu'il utilise déjà, souvent en le dictant : un mot de passe
 * qui contient un `l` et un `1` côte à côte se retape mal, et c'est le coach
 * qui reçoit l'appel. L'alphabet écarte donc tout ce qui se confond à
 * l'oeil : ni O ni 0, ni I ni l ni 1.
 *
 * **Cet alphabet le raccourcit, la longueur le rattrape.** Trente et un
 * caractères possibles au lieu de soixante-deux, sur quinze tirages, valent
 * encore plus de soixante-dix bits de hasard : c'est indevinable, et c'est ce
 * qui compte, puisque ce mot de passe ouvre un espace entier.
 *
 * **Le hasard vient de `crypto`, jamais de `Math.random`.** Ce dernier n'est
 * pas fait pour ça et se rejoue : deux clients créés à la suite pourraient
 * recevoir le même.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Trois groupes de cinq, séparés par des traits : c'est ce qui se dicte. */
const GROUPES = 3;
const PAR_GROUPE = 5;

export function fabriquerUnMotDePasse(): string {
  const tirages = new Uint32Array(GROUPES * PAR_GROUPE);
  crypto.getRandomValues(tirages);

  const lettres = Array.from(tirages, (n) => ALPHABET[n % ALPHABET.length]);

  const groupes: string[] = [];
  for (let debut = 0; debut < lettres.length; debut += PAR_GROUPE) {
    groupes.push(lettres.slice(debut, debut + PAR_GROUPE).join(""));
  }

  return groupes.join("-");
}
