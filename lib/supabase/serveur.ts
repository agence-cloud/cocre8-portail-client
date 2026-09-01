import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { lireConfigSupabase } from "@/lib/supabase/config";

export async function creerClientServeur() {
  const magasin = await cookies();
  const { url, cle } = lireConfigSupabase();

  return createServerClient(
    url,
    cle,
    {
      cookies: {
        getAll: () => magasin.getAll(),
        setAll: (liste) => {
          try {
            liste.forEach(({ name, value, options }) =>
              magasin.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component, où l'écriture de cookies est
            // interdite. Le middleware rafraîchit la session, donc on ignore.
          }
        },
      },
    },
  );
}
