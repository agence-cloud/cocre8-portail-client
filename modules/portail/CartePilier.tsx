import Link from "next/link";
import { Carte } from "@/lib/design/Carte";
import { Icone } from "@/lib/design/Icones";
import { phraseCadenas, iconePilier, type Pilier } from "@/lib/pilier/types";
import type { EtatPilier } from "@/lib/pilier/etat";

type Props = {
  pilier: Pilier;
  etat: EtatPilier;
  progression: number;
};

/**
 * Le bandeau donne son visage au pilier. L'icône est posée deux fois : en
 * petit dans son cartouche blanc, qui l'ancre et la rend lisible, et en très
 * grand derrière, presque effacée. C'est ce filigrane qui distingue les cinq
 * bandeaux les uns des autres, là où un motif commun les aurait uniformisés.
 *
 * Les couleurs du système suffisent à séparer l'ouvert du fermé : ni
 * dégradé, ni glow, ni image importée, la charte les interdit.
 */
function Bandeau({ pilier, ouvert }: { pilier: Pilier; ouvert: boolean }) {
  const icone = iconePilier(pilier.numero);

  return (
    <div
      className={`relative h-24 overflow-hidden rounded-t-carte ${
        ouvert ? "bg-orange-tint" : "bg-fond-alt"
      }`}
    >
      <Icone
        nom={icone}
        className={`pointer-events-none absolute -right-4 -bottom-9 h-[150px] w-[150px] ${
          ouvert ? "text-orange/15" : "text-texte/10"
        }`}
      />
      {/* Le cartouche blanc décolle l'icône du fond teinté : sans lui elle se
          confondrait avec son propre filigrane. */}
      <span className="absolute top-6 left-6 flex h-11 w-11 items-center justify-center rounded-icone bg-fond shadow-carte">
        <Icone
          nom={icone}
          className={`h-6 w-6 ${ouvert ? "text-orange" : "text-texte-doux"}`}
        />
      </span>
    </div>
  );
}

/**
 * Un pilier fermé garde sa carte au lieu de disparaître : montrer ce qui
 * attend le membre donne envie, le cacher ne raconte rien. Le cadenas est
 * accompagné d'une phrase qui explique l'attente et enseigne la méthode.
 */
export function CartePilier({ pilier, etat, progression }: Props) {
  if (etat.statut !== "ouvert") {
    const date = etat.statut === "a_venir" ? etat.date : null;

    return (
      <Carte className="overflow-hidden p-0">
        <Bandeau pilier={pilier} ouvert={false} />
        <div className="p-6">
          <h2 className="flex items-center gap-2.5 text-xl text-texte-doux">
            <Icone nom="cadenas" className="h-[18px] w-[18px] text-orange" />
            {pilier.numero}. {pilier.nom}
          </h2>
          <p className="mt-2 text-sm text-texte-doux">
            {phraseCadenas(pilier.numero, date)}
          </p>
        </div>
      </Carte>
    );
  }

  return (
    <Link href={`/espace/piliers/${pilier.numero}`} className="block">
      <Carte className="h-full overflow-hidden p-0 transition-shadow duration-200 hover:shadow-lg">
        <Bandeau pilier={pilier} ouvert />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl">
                {pilier.numero}. {pilier.nom}
              </h2>
              <p className="mt-2 text-sm text-texte-doux">{pilier.description}</p>
            </div>
            <span className="shrink-0 text-2xl font-bold">{progression} %</span>
          </div>
          <div className="mt-5 h-1.5 w-full rounded-pilule bg-fond-alt">
            <div
              className="h-1.5 rounded-pilule bg-orange transition-all duration-200"
              style={{ width: `${progression}%` }}
            />
          </div>
        </div>
      </Carte>
    </Link>
  );
}
