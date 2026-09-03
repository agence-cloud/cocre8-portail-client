/**
 * Une date ISO en français court : « 1er octobre », « 12 novembre ».
 *
 * Intl écrit « 1 octobre », qui se lit mal en français. L'ordinal du premier
 * du mois est la seule exception : les autres jours restent cardinaux.
 */
export function formaterJourMois(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  const jour = date.getUTCDate();
  const mois = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    timeZone: "UTC",
  }).format(date);

  return `${jour === 1 ? "1er" : jour} ${mois}`;
}

/**
 * « 14 mars 2026 ». L'année compte ici : un client peut être là depuis deux
 * ans, et « depuis le 14 mars » ne dirait pas lequel.
 */
export function formaterDateComplete(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  return `${formaterJourMois(iso)} ${date.getUTCFullYear()}`;
}

/** Une date ISO du jour, sans l'heure, pour comparer des jours entre eux. */
export function jourISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Le fuseau est fixé, jamais celui du serveur : les coachings se tiennent à
 * l'heure de Paris, et un rendu sur un serveur en UTC afficherait 16h pour
 * un live de 18h.
 */
const FUSEAU = "Europe/Paris";

/**
 * Un horodatage complet en date courte : « 7 sept. », « 1er oct. ».
 *
 * **Distincte de `formaterJourMois`, et il faut le savoir avant de choisir.**
 * Celle-là attend une date SEULE (`2026-09-07`) et lui ajoute une heure ;
 * lui passer un horodatage complet donne une date invalide, et le rendu
 * plante. Les deux prennent une `string`, donc le compilateur ne peut pas
 * trancher à ta place : c'est arrivé le 2026-09-01 sur le tableau de bord,
 * et seule une capture d'écran l'a vu, les tests restant verts.
 *
 * Le fuseau est celui de Paris, comme partout ailleurs ici.
 */
export function formaterJourMoisCourt(iso: string): string {
  const date = new Date(iso);
  const jour = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    timeZone: FUSEAU,
  }).format(date);
  const mois = new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    timeZone: FUSEAU,
  }).format(date);

  return `${jour === "1" ? "1er" : jour} ${mois}`;
}

export function formaterDateHeure(iso: string): string {
  const date = new Date(iso);
  const jour = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSEAU,
  }).format(date);

  const heure = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSEAU,
  }).format(date);

  return `${jour}, ${heure.replace(":", "h")}`;
}

export function estLeMemeJour(iso: string, reference: Date): boolean {
  const format = new Intl.DateTimeFormat("fr-CA", { timeZone: FUSEAU });
  return format.format(new Date(iso)) === format.format(reference);
}

/**
 * Le décalage de Paris par rapport à UTC, en minutes, à l'instant donné :
 * + 2h l'été, + 1h l'hiver. `shortOffset` est la seule façon standard de le
 * lire sans dépendance externe, la règle du changement d'heure n'étant pas
 * autre chose qu'un détail de la base de fuseaux que le moteur embarque.
 */
function decalageMinutes(instant: Date): number {
  const parties = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSEAU,
    timeZoneName: "shortOffset",
  }).formatToParts(instant);

  const nom = parties.find((partie) => partie.type === "timeZoneName")?.value ?? "GMT+0";
  const heures = Number(/GMT([+-]\d+)/.exec(nom)?.[1] ?? 0);
  return heures * 60;
}

/**
 * L'inverse de `formaterDateHeure` : un instant saisi en heure de Paris,
 * jamais laissé au fuseau du serveur.
 *
 * Un `<input type="datetime-local">` renvoie une chaîne sans fuseau
 * ("2026-09-01T18:00"). La confier telle quelle à `new Date` la fait lire
 * dans le fuseau du processus qui exécute le code : juste par accident en
 * local (souvent réglé sur Paris), faux en production où le serveur tourne
 * en UTC, un coaching de 18h s'écrirait alors 18h00Z, réaffiché 20h00.
 *
 * Le calcul part d'un instant UTC qui porte les mêmes chiffres que la
 * saisie, lit le décalage de Paris à cet instant (été ou hiver, l'écart
 * entre les deux ne dépasse jamais l'heure), puis le retranche : la saisie
 * devient l'instant UTC qui correspond réellement à cette heure parisienne.
 */
export function versInstantUTC(saisieLocale: string): string {
  const [datePart, heurePart] = saisieLocale.split("T");
  const [annee, mois, jour] = datePart.split("-").map(Number);
  const [heure, minute] = heurePart.split(":").map(Number);

  const brut = Date.UTC(annee, mois - 1, jour, heure, minute);
  const decalage = decalageMinutes(new Date(brut));

  return new Date(brut - decalage * 60_000).toISOString();
}
