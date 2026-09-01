import Link from "next/link";
import { exigerAdmin } from "@/lib/auth/compte";
import { lireClients } from "@/lib/personne/requetes";
import { lireOffres } from "@/lib/offre/requetes";
import { AjouterClient } from "@/modules/portail/AjouterClient";
import { Badge } from "@/lib/design/Badge";
import { Carte } from "@/lib/design/Carte";
import { Icone } from "@/lib/design/Icones";
import { nomComplet } from "@/lib/personne/types";

export default async function AccueilPilotage() {
  // Chaque page se garde elle-même, le layout ne suffit pas.
  await exigerAdmin();

  const [clients, offres] = await Promise.all([lireClients(), lireOffres()]);

  return (
    <>
      <h1 className="text-4xl">
        Tes <span className="text-orange">clients</span>
      </h1>
      <p className="mt-2 text-texte-doux">
        {clients.length === 0
          ? "Aucun client pour l'instant."
          : `${clients.length} client${clients.length > 1 ? "s" : ""} accompagné${clients.length > 1 ? "s" : ""}.`}
      </p>

      <AjouterClient offres={offres} />

      {clients.length > 0 && (
        <Carte className="mt-8">
          {clients.map((client) => (
            // Toute la ligne mène au suivi du client : c'est le seul endroit
            // où l'on agit sur lui, inutile de multiplier les cibles de clic.
            <Link
              key={client.id}
              href={`/pilotage/membres/${client.id}`}
              className="group -mx-6 flex items-center gap-3 border-b border-bordure px-6 py-3 transition-colors duration-200 last:border-0 hover:bg-fond-alt"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-icone bg-orange-tint">
                <Icone nom="personne" className="h-5 w-5 text-orange" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium transition-colors duration-200 group-hover:text-orange">
                    {nomComplet(client)}
                  </span>
                  {/* Le client du jeu de démonstration reste dans la liste,
                      sans quoi son écran de suivi deviendrait inatteignable.
                      Le ton neutre et non `attention` : ce n'est pas un
                      problème à régler, c'est une nature à connaître. */}
                  {client.demonstration && <Badge ton="neutre">démo</Badge>}
                </span>
                <span className="text-xs text-texte-doux">
                  {client.entreprise ?? "Sans entreprise"}
                </span>
              </span>
            </Link>
          ))}
        </Carte>
      )}
    </>
  );
}
