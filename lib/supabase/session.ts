import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { lireConfigSupabase } from "@/lib/supabase/config";

/**
 * Les seules adresses qu'on atteint sans session.
 *
 * Les deux dernières sont arrivées avec le plan 10, et les oublier ici
 * aurait cassé tout le chemin d'accès d'un nouveau client sans que rien ne
 * le signale : il clique sur le lien reçu par email, il n'a pas encore de
 * session puisque c'est justement ce lien qui va la lui ouvrir, et le proxy
 * le renvoie vers la connexion, où il n'a pas de mot de passe à saisir.
 *
 * `/auth/confirmer` établit la session à partir du lien. `/connexion/mot-de-
 * passe` en dépend, et se garde elle-même : sans session, l'appel de
 * changement de mot de passe échoue et la page le dit.
 *
 * Comparaison exacte et non par préfixe : `/connexion` ouvert en préfixe
 * n'ouvrirait rien de plus aujourd'hui, mais la première page ajoutée
 * dessous deviendrait publique sans que personne le décide.
 */
export const ROUTES_PUBLIQUES = [
  "/connexion",
  "/connexion/mot-de-passe",
  "/auth/confirmer",
];

export async function rafraichirSession(requete: NextRequest) {
  let reponse = NextResponse.next({ request: requete });
  const { url: urlSupabase, cle } = lireConfigSupabase();

  const supabase = createServerClient(
    urlSupabase,
    cle,
    {
      cookies: {
        getAll: () => requete.cookies.getAll(),
        setAll: (liste) => {
          liste.forEach(({ name, value }) => requete.cookies.set(name, value));
          reponse = NextResponse.next({ request: requete });
          liste.forEach(({ name, value, options }) =>
            reponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Ne rien mettre entre createServerClient et getUser : le jeton doit être
  // rafraîchi avant toute décision, sinon des sessions valides se font
  // déconnecter au hasard.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const chemin = requete.nextUrl.pathname;
  if (!user && !ROUTES_PUBLIQUES.includes(chemin)) {
    const destination = requete.nextUrl.clone();
    destination.pathname = "/connexion";
    return NextResponse.redirect(destination);
  }

  return reponse;
}
