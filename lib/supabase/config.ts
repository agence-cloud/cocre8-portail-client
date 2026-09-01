/**
 * L'erreur dit aussi ce qu'elle voit, et cette liste a déjà servi.
 *
 * Au premier déploiement, la variable était bien posée dans Vercel, avec sa
 * valeur visible à l'écran, et l'app la réclamait quand même. Le message
 * d'origine envoyait donc chercher là où il n'y avait rien à trouver.
 *
 * **La cause, à connaître : le type d'une variable chez Vercel.** Une
 * variable de type « Secret » n'est pas lisible pendant la construction, or
 * les valeurs `NEXT_PUBLIC_` sont recopiées dans le code à ce moment-là. Elles
 * arrivaient donc vides, et rien à l'écran de Vercel ne le montrait. Il faut
 * le type « Config » pour toute variable lue à la construction.
 *
 * Nommer les variables reçues et la longueur de leur valeur est ce qui a
 * permis de trancher : une valeur de zéro caractère face à un écran qui la
 * montre bien remplie ne laisse plus qu'une explication.
 *
 * Les noms et les longueurs, jamais les valeurs. Et Next masque le détail
 * d'une erreur serveur en production : ceci n'apparaît que dans les journaux.
 */
function manquante(nom: string): Error {
  const vues = Object.keys(process.env)
    .filter((cle) => cle.toUpperCase().includes("SUPABASE"))
    .sort()
    .map((cle) => `${cle}=${(process.env[cle] ?? "").length} car.`);

  // La longueur de ce que l'accès littéral a donné, à côté de celle de
  // l'accès dynamique : c'est l'écart entre les deux qui dit si la valeur
  // manque, ou si elle est seulement absente de la compilation.
  const litteral = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").length;

  return new Error(
    `Variable d'environnement manquante : ${nom}. Vérifie .env.local en local, et les variables du projet sur Vercel en ligne. ` +
      `Reçus à l'exécution : ${vues.length ? vues.join(", ") : "aucun"}. ` +
      `Accès littéral à NEXT_PUBLIC_SUPABASE_URL : ${litteral} car.`,
  );
}

/**
 * Lue par les trois clients (navigateur, serveur, proxy) pour que la
 * même variable manquante produise partout la même erreur nommée.
 *
 * Les deux accès sont écrits en toutes lettres, et doivent le rester : Next
 * remplace process.env.NEXT_PUBLIC_* à la compilation, donc un accès
 * dynamique du type process.env[nom] renvoie undefined côté navigateur, et
 * le client se construit avec une URL vide sans que rien ne le signale.
 */
export function lireConfigSupabase(): { url: string; cle: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw manquante("NEXT_PUBLIC_SUPABASE_URL");
  if (!cle) throw manquante("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return { url, cle };
}
