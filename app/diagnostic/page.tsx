import { lireConfigSupabase } from "@/lib/supabase/config";

/**
 * L'écran qui dit pourquoi l'app ne joint pas sa base.
 *
 * **Pourquoi une page et non un journal.** Le README promet une installation
 * sans ligne de commande, à quelqu'un qui n'ouvrira jamais les journaux de
 * Vercel. Quand la configuration est fausse, tout ce qu'il voit est une app
 * qui s'affiche et une connexion qui refuse : rien à l'écran ne distingue une
 * adresse erronée d'un mot de passe faux. Cette page fait la différence à sa
 * place.
 *
 * Elle a été écrite le jour où la première installation a perdu une soirée
 * sur exactement ça : l'adresse du projet Supabase pointait à côté, la
 * connexion répondait « Email ou mot de passe incorrect. », et la recherche
 * est partie sur les comptes.
 *
 * **Publique, et c'est réfléchi.** Elle ne montre que ce qui est déjà public :
 * l'adresse du projet, qui est recopiée dans le code envoyé au navigateur à
 * chaque visite. Les clés ne sont jamais affichées, seulement leur présence et
 * leur longueur, ce qui suffit à repérer une valeur vide ou tronquée. La
 * fermer derrière une session la rendrait inutile, puisqu'elle sert justement
 * quand personne ne peut se connecter.
 */
export const dynamic = "force-dynamic";

type Ligne = { quoi: string; valeur: string; bon: boolean };

/**
 * **La faute qui a coûté la première installation, et qu'aucune vérification
 * de longueur n'attrape.** La clé collée dans l'hébergeur faisait exactement
 * les 208 caractères de la vraie, et portait des « • » au milieu : c'était la
 * version masquée, recopiée depuis un écran qui la cache tout en gardant sa
 * longueur. Tout paraissait juste, et le seul symptôme était une connexion qui
 * refusait.
 *
 * Une clé Supabase est de l'ASCII imprimable, jeton JWT ou `sb_publishable_`.
 * Tout ce qui sort de cette plage vient d'un copier-coller sur du texte
 * affiché plutôt que sur la valeur.
 */
function premierCaractereInterdit(valeur: string): string | null {
  for (const caractere of valeur) {
    const code = caractere.codePointAt(0) ?? 0;
    if (code < 33 || code > 126) return caractere;
  }
  return null;
}

function verifierUneCle(quoi: string, valeur: string): Ligne {
  if (!valeur) return { quoi, valeur: "absente", bon: false };

  const interdit = premierCaractereInterdit(valeur);
  if (interdit) {
    return {
      quoi,
      valeur: `contient « ${interdit} » : c'est la version masquée, pas la clé`,
      bon: false,
    };
  }

  // Une clé Supabase, ancienne ou nouvelle, dépasse largement cette longueur.
  // En dessous, c'est une valeur tronquée.
  return { quoi, valeur: `${valeur.length} caractères`, bon: valeur.length > 30 };
}

async function essayer(url: string, cle: string): Promise<Ligne> {
  // Un appel réel, pas une vérification de forme : c'est la seule façon de
  // distinguer une adresse bien écrite d'une adresse qui existe. Le
  // point de santé de l'authentification répond sans session.
  try {
    const reponse = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: cle },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return {
      quoi: "Réponse du projet",
      valeur: `${reponse.status} ${reponse.statusText}`,
      bon: reponse.ok,
    };
  } catch (erreur) {
    return {
      quoi: "Réponse du projet",
      valeur: `injoignable (${erreur instanceof Error ? erreur.message : "erreur inconnue"})`,
      bon: false,
    };
  }
}

export default async function PageDiagnostic() {
  let config: { url: string; cle: string };
  try {
    config = lireConfigSupabase();
  } catch (erreur) {
    return (
      <main className="mx-auto max-w-2xl px-8 py-16">
        <h1 className="text-3xl">Diagnostic</h1>
        <p className="mt-6 rounded-xl border border-bordure bg-fond px-5 py-4 text-[15px] leading-relaxed">
          {erreur instanceof Error ? erreur.message : "Configuration illisible."}
        </p>
      </main>
    );
  }

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anon = verifierUneCle("Clé anon", config.cle);
  const lignes: Ligne[] = [
    { quoi: "Adresse du projet", valeur: config.url, bon: true },
    anon,
    verifierUneCle("Clé de service", service),
    // L'appel réel n'a de sens qu'avec une clé qui peut voyager dans un
    // en-tête. Sinon il échouerait sur le caractère interdit et masquerait la
    // ligne au-dessus, qui est la vraie réponse.
    anon.bon
      ? await essayer(config.url, config.cle)
      : { quoi: "Réponse du projet", valeur: "pas tentée, la clé est illisible", bon: false },
  ];

  const tout = lignes.every((ligne) => ligne.bon);

  return (
    <main className="mx-auto max-w-2xl px-8 py-16">
      <h1 className="text-3xl">Diagnostic</h1>
      <p className="mt-2 text-texte-doux">
        Ce que cette installation a reçu, et ce qu'elle en fait.
      </p>

      <dl className="mt-8 border-t border-bordure">
        {lignes.map((ligne) => (
          <div
            key={ligne.quoi}
            className="flex items-baseline justify-between gap-6 border-b border-bordure py-4"
          >
            <dt className="text-[15px] text-texte-doux">{ligne.quoi}</dt>
            <dd
              className={`text-right text-[15px] break-all ${ligne.bon ? "text-texte" : "text-accent"}`}
            >
              {ligne.valeur}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-8 text-[15px] leading-relaxed text-texte-doux">
        {tout ? (
          "Tout répond. Si la connexion refuse quand même, c'est l'email ou le mot de passe."
        ) : (
          <>
            L&apos;adresse et les clés se trouvent dans ton projet Supabase, sous Project
            Settings puis API Keys. <strong className="text-texte">Copie-les avec le bouton
            de copie</strong>, jamais en sélectionnant le texte à l&apos;écran : la clé y est
            affichée masquée, et une clé masquée a la bonne longueur sans être la bonne
            valeur. Corrige-les dans les variables de ton hébergeur, puis redéploie : une
            valeur corrigée ne prend effet qu&apos;au déploiement suivant.
          </>
        )}
      </p>
    </main>
  );
}
