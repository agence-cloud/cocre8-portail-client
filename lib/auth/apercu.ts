import "server-only";

import { cookies } from "next/headers";
import { clienteDeService } from "@/lib/supabase/service";
import { creerClientServeur } from "@/lib/supabase/serveur";

/**
 * L'aperçu : le coach ouvre l'espace d'un client, tel que ce client le voit.
 *
 * **Pourquoi c'est nécessaire.** Un coach ne peut ni vendre ni expliquer un
 * espace qu'il n'a jamais vu. Son écran de suivi montre les mêmes données,
 * mais dans une mise en page qui n'est pas celle du client, et avec la note
 * interne de ses séances en plus. Le seul chemin qui existait était « obtenir
 * un lien à copier » puis l'ouvrir en fenêtre privée : un détour que personne
 * ne fait deux fois.
 *
 * **Ce que ça donne au coach, et ce que ça ne lui donne pas.** Il voit
 * exactement ce que son client voit, ce qui est moins que ce qu'il voit déjà
 * sur l'écran de suivi : aucune donnée nouvelle ne lui est ouverte. En
 * revanche il agit sous l'identité de son client le temps de l'aperçu, donc
 * une case cochée là est cochée pour de bon. C'est le prix de voir le vrai
 * écran plutôt qu'une imitation, et un bandeau le rappelle en permanence.
 *
 * **Les trois gardes :**
 *
 * 1. **L'appelant doit être admin**, vérifié par l'action qui appelle. Ce
 *    module ne se garde pas lui-même, mais il ne s'atteint pas non plus
 *    depuis le navigateur.
 * 2. **L'adresse email n'est jamais un paramètre.** L'appelant passe
 *    l'identifiant d'une fiche, ce module lit le compte puis son adresse
 *    auprès de Supabase. Sans cette règle, une requête forgée ouvrirait une
 *    session sur n'importe quelle adresse.
 * 3. **Seul un compte membre s'emprunte.** Jamais un admin : un second coach,
 *    le jour où il en existe, ne devient pas une porte vers les droits de
 *    l'autre.
 *
 * `server-only` en tête : une importation depuis un composant client casse la
 * compilation au lieu de faire fuiter la clé dans le paquet du navigateur.
 */

/**
 * Le jeton de retour du coach, mis de côté le temps de l'aperçu.
 *
 * `httpOnly` : le navigateur ne le lit pas, seul le serveur le relit. C'est ce
 * qui fait qu'un client ne peut pas s'en fabriquer un pour se retrouver dans
 * la peau de son coach, la seule écriture de ce cookie passant par une action
 * qui exige déjà les droits d'admin.
 */
const RETOUR = "retour_coach";

export async function entrerDansLEspaceDe(
  personneId: string,
): Promise<{ pourquoi?: string }> {
  const service = clienteDeService();

  const { data: compte, error } = await service
    .from("compte")
    .select("id, role, actif")
    .eq("personne_id", personneId)
    .maybeSingle();

  if (error) return { pourquoi: error.message };
  if (!compte) return { pourquoi: "Ce client n'a pas encore de compte." };
  if (compte.role !== "membre") return { pourquoi: "Ce compte n'est pas celui d'un client." };
  if (!compte.actif) return { pourquoi: "L'accès de ce client est clôturé." };

  // L'adresse se lit ici, à partir de l'identifiant du compte, et n'arrive
  // jamais en paramètre.
  const { data: utilisateur, error: erreurUtilisateur } =
    await service.auth.admin.getUserById(compte.id as string);
  if (erreurUtilisateur || !utilisateur.user?.email) {
    return { pourquoi: "Ce compte n'a pas d'adresse email." };
  }

  const { data: lien, error: erreurLien } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: utilisateur.user.email,
  });
  if (erreurLien || !lien.properties?.hashed_token) {
    return { pourquoi: erreurLien?.message ?? "Aperçu impossible." };
  }

  const supabase = await creerClientServeur();

  // Le jeton du coach est mis de côté avant la bascule : après, sa session
  // n'existe plus dans les cookies, et il n'y aurait plus aucun moyen de le
  // ramener sans lui redemander son mot de passe.
  const { data: session } = await supabase.auth.getSession();
  const jetonCoach = session.session?.refresh_token;
  if (!jetonCoach) return { pourquoi: "Ta session a expiré, reconnecte-toi." };

  const { error: erreurBascule } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: lien.properties.hashed_token,
  });
  if (erreurBascule) return { pourquoi: erreurBascule.message };

  const magasin = await cookies();
  magasin.set(RETOUR, jetonCoach, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Une heure : la durée d'un aperçu, pas celle d'une session. Passé ce
    // délai le bandeau propose de se reconnecter plutôt que de mentir.
    maxAge: 3600,
  });

  return {};
}

/** Vrai quand la session en cours est un aperçu, et non le client lui-même. */
export async function estUnApercu(): Promise<boolean> {
  return (await cookies()).has(RETOUR);
}

export async function revenirAuPilotage(): Promise<{ pourquoi?: string }> {
  const magasin = await cookies();
  const jeton = magasin.get(RETOUR)?.value;
  if (!jeton) return { pourquoi: "Aucun aperçu en cours." };

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.refreshSession({ refresh_token: jeton });

  // Le cookie part dans tous les cas : le garder après un échec laisserait un
  // bandeau qui promet un retour impossible, et le coach n'aurait plus qu'à
  // se déconnecter sans comprendre.
  magasin.delete(RETOUR);

  if (error) return { pourquoi: "Ta session de coach a expiré, reconnecte-toi." };
  return {};
}
