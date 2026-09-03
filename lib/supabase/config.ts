import { normaliserAdresseSupabase } from "@/lib/supabase/adresse";

/**
 * L'erreur dit aussi ce qu'elle voit, et cette liste a déjà servi deux fois.
 *
 * **Premier piège, le type d'une variable chez Vercel.** Au premier
 * déploiement, la variable était bien posée, avec sa valeur visible à
 * l'écran, et l'app la réclamait quand même. Une variable de type « Secret »
 * n'est pas lisible pendant la construction, or les valeurs `NEXT_PUBLIC_`
 * sont recopiées dans le code à ce moment-là. Elles arrivaient donc vides, et
 * rien à l'écran de Vercel ne le montrait. Il faut le type « Config » pour
 * toute variable lue à la construction.
 *
 * Nommer les variables reçues et la longueur de leur valeur est ce qui a
 * permis de trancher : une valeur de zéro caractère face à un écran qui la
 * montre bien remplie ne laisse plus qu'une explication.
 *
 * **Second piège, une valeur présente mais qui n'est pas la bonne.** Une fois
 * le type corrigé, l'app s'est construite, s'est affichée, et n'a plus rien
 * dit : elle interrogeait une adresse qui n'était pas celle du projet. Le
 * nom du programme retombait sur sa valeur par défaut et la connexion
 * échouait, sans qu'aucune des deux ne s'en plaigne. Une heure perdue à
 * chercher un mot de passe qui n'avait rien à se reprocher.
 *
 * D'où la vérification de forme ci-dessous. Elle ne cherche pas à valider le
 * projet, elle attrape ce qui se colle par erreur : l'adresse du tableau de
 * bord Supabase, une clé à la place d'une adresse, un chemin en trop.
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

function malformee(valeur: string): Error {
  // On dit ce qu'on a reçu jusqu'au premier point : de quoi reconnaître
  // « supabase.com » ou « localhost » sans recopier la référence du projet
  // dans un journal.
  const debut = valeur.slice(0, valeur.indexOf(".") + 1 || 24);

  return new Error(
    "NEXT_PUBLIC_SUPABASE_URL ne ressemble pas à l'adresse d'un projet Supabase. " +
      `Reçu, début : ${debut}... ` +
      "Prends l'adresse dans ton projet Supabase, sous Data API : elle a la forme " +
      "https://quelquechose.supabase.co. Le bout de chemin à la fin, du genre /rest/v1/, " +
      "n'est pas un problème, on le retire pour toi.",
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

  const propre = normaliserAdresseSupabase(url);
  if (propre === null) throw malformee(url.trim());

  return { url: propre, cle };
}
