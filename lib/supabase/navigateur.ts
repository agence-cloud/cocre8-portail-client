import { createBrowserClient } from "@supabase/ssr";
import { lireConfigSupabase } from "@/lib/supabase/config";

export function creerClientNavigateur() {
  const { url, cle } = lireConfigSupabase();
  return createBrowserClient(url, cle);
}
