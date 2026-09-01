"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { creerClientNavigateur } from "@/lib/supabase/navigateur";
import { EcranAuth, TitreAuth } from "@/lib/design/EcranAuth";

/**
 * L'atterrissage du lien reçu par email.
 *
 * Une page client et non un gestionnaire de route, et c'est le point à
 * comprendre avant d'y toucher : selon le flux que Supabase emploie, la
 * session arrive soit dans le fragment de l'URL (`#access_token=...`), soit
 * dans un paramètre (`?code=...`). Le fragment ne quitte jamais le
 * navigateur, il n'est jamais envoyé au serveur : un gestionnaire de route ne
 * verrait rien dans ce cas-là.
 *
 * Les deux formes sont donc traitées ici. Ce n'est pas de l'excès de
 * précaution : le flux dépend de la façon dont la cliente qui a demandé
 * l'envoi a été construite, et un jour où l'autre cette construction
 * changera sans que personne ne pense à cette page.
 *
 * **Cette page ne peut se vérifier qu'à la main**, avec un vrai lien reçu par
 * email : un jeton de récupération ne se fabrique pas, et un test qui en
 * demanderait un enverrait un vrai message à quelqu'un.
 */
export default function PageConfirmer() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const supabase = creerClientNavigateur();

    async function ouvrirLaSession() {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const acces = fragment.get("access_token");
      const rafraichissement = fragment.get("refresh_token");

      if (acces && rafraichissement) {
        const { error } = await supabase.auth.setSession({
          access_token: acces,
          refresh_token: rafraichissement,
        });
        if (error) return setErreur(error.message);
        return router.replace("/connexion/mot-de-passe");
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return setErreur(error.message);
        return router.replace("/connexion/mot-de-passe");
      }

      // Ni l'un ni l'autre : le lien a été ouvert deux fois, ou il a expiré.
      // Supabase les fait tenir une heure.
      setErreur(
        "Ce lien n'est plus valable. Demande à ton coach de te le renvoyer.",
      );
    }

    ouvrirLaSession();
  }, [router]);

  return (
    /* Sans liste : on ne fait que passer ici, la session s'ouvre et la page
       se remplace toute seule. Trois lignes à lire seraient trois lignes que
       personne ne lit. Elles reviennent à l'écran suivant.

       La coquille reste la même que les deux autres écrans, et c'est tout
       l'intérêt : un nouveau client traverse les trois en moins d'une
       minute, un changement de décor entre deux donnerait l'impression
       d'avoir changé de site. */
    <EcranAuth
      titre={
        erreur ? (
          <>
            Ce lien <span className="block text-orange">ne marche plus.</span>
          </>
        ) : (
          <>
            On ouvre <span className="block text-orange">ton espace.</span>
          </>
        )
      }
      accroche={
        erreur
          ? "Un lien d'accès ne vaut qu'une heure, et ne sert qu'une fois."
          : "Encore un instant, le temps de vérifier ton lien."
      }
    >
      <TitreAuth>{erreur ? "Ce qu'il faut faire" : "Ouverture"}</TitreAuth>

      <p role={erreur ? "alert" : undefined} className="text-[15px] text-texte-doux">
        {erreur ?? "On ouvre ta session..."}
      </p>
    </EcranAuth>
  );
}
