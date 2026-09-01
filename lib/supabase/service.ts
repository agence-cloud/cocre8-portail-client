import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { lireConfigSupabase } from "@/lib/supabase/config";

/**
 * **Le seul endroit du dépôt où `SUPABASE_SERVICE_ROLE_KEY` est lue.**
 *
 * Cette clé contourne toutes les permissions par ligne. Tant qu'elle était
 * lue directement dans chaque fichier qui en avait besoin, la règle du projet
 * s'énonçait par une liste d'exceptions, et une liste d'exceptions s'allonge :
 * elle est passée de un à deux le 2026-08-28, et un troisième besoin est
 * arrivé trois jours plus tard. Une règle qui gagne une exception par semaine
 * ne protège plus rien.
 *
 * La règle est donc retournée. Un fichier lit la clé, celui-ci. Savoir qui
 * peut écrire sans permissions ne demande plus de faire confiance à une
 * liste : il suffit de chercher qui l'importe.
 *
 *     grep -rn "supabase/service" lib modules app
 *
 * **Un seul appelant à ce jour, et il porte ses propres gardes, écrites en
 * tête de son fichier :**
 *
 * - `lib/auth/creation.ts` : crée le compte d'un client. Appelé par un coach
 *   connecté, il se méfie de ses paramètres, et l'adresse email n'en est
 *   jamais un.
 *
 * Le jour où un second appelant apparaît, il s'ajoute à cette liste et il
 * arrive avec sa propre garde. Un appelant sans garde n'a rien à faire ici.
 *
 * `server-only` en tête : une importation depuis un composant client casse la
 * compilation au lieu de faire fuiter la clé dans le paquet du navigateur.
 */
export function clienteDeService(): SupabaseClient {
  const { url } = lireConfigSupabase();
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!cle) {
    throw new Error(
      "Variable d'environnement manquante : SUPABASE_SERVICE_ROLE_KEY. Vérifie .env.local en local, et les variables du projet en ligne.",
    );
  }

  return createClient(url, cle, {
    // Aucune session : ces clientes ne servent qu'à un appel administratif, et
    // une session persistée se mêlerait à celle de l'admin connecté.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
