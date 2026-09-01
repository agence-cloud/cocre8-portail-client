import { describe, it, expect, beforeEach, vi } from "vitest";
import { lireConfigSupabase } from "@/lib/supabase/config";
import { creerClientNavigateur } from "@/lib/supabase/navigateur";

describe("lireConfigSupabase", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemple.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "cle-de-test");
  });

  it("renvoie l'url et la clé", () => {
    expect(lireConfigSupabase()).toEqual({
      url: "https://exemple.supabase.co",
      cle: "cle-de-test",
    });
  });

  it("échoue clairement si l'URL manque", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(() => lireConfigSupabase()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("échoue clairement si la clé manque", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => lireConfigSupabase()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });
});

describe("creerClientNavigateur", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemple.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "cle-de-test");
  });

  it("construit un client utilisable", () => {
    const client = creerClientNavigateur();
    expect(client.auth).toBeDefined();
    expect(typeof client.from).toBe("function");
  });
});
