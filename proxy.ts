import type { NextRequest } from "next/server";
import { rafraichirSession } from "@/lib/supabase/session";

/**
 * Convention Next 16 : ce fichier s'appelait `middleware.ts` jusqu'à Next 15,
 * et la fonction exportée `middleware`. Les deux noms sont dépréciés.
 */
export async function proxy(requete: NextRequest) {
  return rafraichirSession(requete);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
