import Link from "next/link";
import { exigerMembre } from "@/lib/auth/compte";
import { exigerProfilComplet } from "@/modules/portail/garde";
import { lirePiliers, lireCalendrier } from "@/lib/pilier/requetes";
import { etatPilier } from "@/lib/pilier/etat";
import { lireQuestions, lireReponses } from "@/lib/profil/requetes";
import { completude } from "@/lib/profil/completude";
import { lireProchainsCoachings } from "@/lib/coaching/requetes";
import { lireTaches } from "@/modules/portail/requetes";
import { joindreLeCoach } from "@/modules/portail/coach";
import { lireReglages } from "@/lib/reglages/requetes";
import {
  progression,
  progressionPilier,
  pilierEnCours,
} from "@/modules/portail/progression";
import { Anneau } from "@/modules/portail/Anneau";
import { CaseTache } from "@/modules/portail/CaseTache";
import { ProchainsCoachings } from "@/modules/portail/ProchainsCoachings";
import { Carte } from "@/lib/design/Carte";
import { CarteStat } from "@/lib/design/CarteStat";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import { Bouton } from "@/lib/design/Bouton";
import { formaterJourMoisCourt } from "@/lib/dates";

/* Le chevron reste discret au repos et prend la couleur du lien au survol :
   c'est un repère, pas une décoration qui se dispute le regard. `group` sur
   la ligne, `group-hover` sur le chevron, pour que survoler n'importe où sur
   la ligne les allume tous les deux. */
const LIGNE_ACCES =
  "group flex items-center gap-3 py-1.5 transition-colors duration-200 hover:text-orange";
const CHEVRON =
  "text-xs text-texte-doux/50 transition-colors duration-200 group-hover:text-orange";

export default async function AccueilEspace() {
  const compte = await exigerMembre();
  const personneId = compte.personneId!;
  await exigerProfilComplet(personneId);

  const [piliers, calendrier, taches, questions, reponses, coachings] =
    await Promise.all([
      lirePiliers(),
      lireCalendrier(personneId),
      lireTaches(personneId),
      lireQuestions(),
      lireReponses(personneId),
      lireProchainsCoachings(2),
    ]);

  const aujourdhui = new Date();
  const ouverts = new Set(
    calendrier
      .filter(
        (a) => etatPilier(a.date_ouverture, aujourdhui).statut === "ouvert",
      )
      .map((a) => a.pilier_id),
  );

  const courant = pilierEnCours(piliers, taches, ouverts);
  const restantes = courant
    ? taches.filter((t) => t.pilier_id === courant.id && !t.faite)
    : [];
  const bilan = completude(questions, reponses);
  const reglages = await lireReglages();
  const contact = joindreLeCoach(reglages.coach_telephone);

  return (
    <>
      {/* Le titre monte à 48 px et passe en bleu nuit. La charte prévoit 56
          pour un titre de page et l'app était à 36 : elle était en dessous de
          son propre système. Le nuit plutôt que le charcoal vient de la
          décision 0020. */}
      <h1 className="text-[40px] tracking-[-0.035em] text-nuit lg:text-5xl">
        Bonjour <span className="text-orange">{compte.nom}</span>
      </h1>
      <p className="mt-3 text-[17px] text-texte-doux">
        {courant
          ? `Tu es sur le pilier ${courant.numero}, ${courant.nom}.`
          : "Ton accompagnement démarre bientôt, ton coach prépare ton parcours."}
      </p>

      {/* La rangée de chiffres, motif que la charte décrit comme un élément de
          design à part entière et qui manquait sur tous les écrans d'accueil.
          Trois cartes et pas plus : la quatrième oblige à choisir un chiffre
          qui n'en vaut pas la peine. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CarteStat
          icone="coche"
          libelle="Tâches restantes"
          valeur={courant ? restantes.length : 0}
          detail={courant ? `Sur le pilier ${courant.numero}, ${courant.nom}` : "Ton parcours arrive"}
        />
        <CarteStat
          icone="evenement"
          libelle="Prochain coaching"
          valeur={coachings[0] ? formaterJourMoisCourt(coachings[0].prevu_le) : "Aucun"}
          detail={coachings[0] ? "Ton coach t'attend" : "Aucun coaching programmé"}
        />
        <CarteStat
          icone="piliers"
          libelle="Piliers ouverts"
          valeur={ouverts.size}
          detail={`Sur les ${piliers.length} du parcours`}
        />
      </div>

      {/* `items-start` : sans lui, chaque carte s'étire à la hauteur de la
          plus haute de sa rangée, et celle de l'anneau se retrouvait vide aux
          neuf dixièmes. Une carte doit faire la taille de ce qu'elle porte. */}
      {/* Deux colonnes qui s'empilent chacune de leur côté, et non une
          grille de quatre cases. Avec une grille, les rangées s'alignent : la
          carte de l'anneau, courte, laissait un vide sous elle à la hauteur
          de la carte du pilier, qui est longue. Ici chaque colonne coule. */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* L'ombre la plus haute de l'écran : un membre doit savoir quoi
              faire sans lire le reste. Les autres cartes portent désormais
              l'ombre douce plutôt que rien du tout (décision 0020), donc la
              hiérarchie ne se joue plus entre « une ombre » et « aucune »
              mais entre trois niveaux, comme la charte les définit. */}
          <Carte className="lg:p-8">
            {courant ? (
              <>
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <MicroLibelle>Ton pilier en cours</MicroLibelle>
                    <h2 className="mt-2 text-[28px] tracking-[-0.035em] lg:text-[32px]">
                      {courant.numero}. {courant.nom}
                    </h2>
                  </div>
                  {/* Le chiffre accompagne le titre, il ne se bat plus avec lui :
                    c'est le nom du pilier qu'on vient lire, pas son taux. */}
                  <span className="shrink-0 text-[15px] text-texte-doux">
                    <span className="font-bold text-texte">
                      {progressionPilier(taches, courant.id)} %
                    </span>{" "}
                    fait
                  </span>
                </div>

                <MicroLibelle className="mt-8">
                  {restantes.length > 0
                    ? "Tes prochaines étapes"
                    : "Tout est fait sur ce pilier"}
                </MicroLibelle>
                <div className="mt-2 divide-y divide-bordure">
                  {restantes.slice(0, 3).map((tache) => (
                    <CaseTache
                      key={tache.id}
                      id={tache.id}
                      titre={tache.titre}
                      description={tache.description}
                      faite={tache.faite}
                    />
                  ))}
                </div>

                <Link href={`/espace/piliers/${courant.numero}`}>
                  <Bouton className="group mt-6 inline-flex items-center gap-2.5 hover:-translate-y-px hover:shadow-[0_8px_20px_-6px_rgba(255,99,32,0.45)]">
                    Ouvrir le pilier
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Bouton>
                </Link>
              </>
            ) : (
              <p className="text-texte-doux">
                Ton espace se remplit dès que ton accompagnement démarre.
              </p>
            )}
          </Carte>

          <ProchainsCoachings coachings={coachings} />
        </div>

        <div className="flex flex-col gap-5">
          <Carte ton="calme" className="flex flex-col items-center text-center shadow-douce">
            <MicroLibelle className="self-start">Ta progression</MicroLibelle>
            <div className="mt-5">
              <Anneau pourcentage={progression(taches, ouverts)} />
            </div>
            <p className="mt-4 text-sm text-texte-doux">
              Sur tes piliers ouverts
            </p>
          </Carte>

          {/* La carte disparaît une fois le profil complet : une carte qui
              n'appelle plus aucune action devient du décor. */}
          {bilan.repondues < bilan.total && (
            <Carte ton="calme" className="shadow-douce">
              <MicroLibelle>Ton point de départ</MicroLibelle>
              <p className="mt-3 text-sm text-texte-doux">
                {bilan.repondues} question{bilan.repondues > 1 ? "s" : ""} sur{" "}
                {bilan.total}. Ce sont ces chiffres qui rendront tes résultats
                indiscutables.
              </p>
              {/* Secondaire, et pas orange : l'action principale de cet
                  écran est d'ouvrir son pilier. Deux boutons orange de même
                  poids diluent la hiérarchie que ce tableau de bord existe
                  pour créer. */}
              <Link href="/espace/profil">
                <Bouton variante="secondaire" className="mt-4">
                  Reprendre
                </Bouton>
              </Link>
            </Carte>
          )}

          <Carte ton="calme" className="shadow-douce">
            <MicroLibelle>Tes accès</MicroLibelle>
            {/* Chaque ligne porte sa flèche, pour qu'on lise trois liens et
                non trois étiquettes. La même sur les trois, oblique.

                Elle ne dit donc pas ici ce qu'elle dit dans la barre
                latérale, où elle marque les liens qui sortent de l'app. C'est
                un écart assumé : sur ce bloc, ce qu'on veut faire comprendre
                est qu'on peut cliquer, et trois glyphes identiques le disent
                mieux que deux familles à distinguer. */}
            <div className="mt-4 flex flex-col text-sm">
              {reglages.liens_externes.communaute && (
                <a
                  href={reglages.liens_externes.communaute}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LIGNE_ACCES}
                >
                  <span className="flex-1">La communauté</span>
                  <span aria-hidden="true" className={CHEVRON}>
                    ↗
                  </span>
                </a>
              )}
              <Link href="/espace/piliers" className={LIGNE_ACCES}>
                <span className="flex-1">Tes piliers</span>
                <span aria-hidden="true" className={CHEVRON}>
                  ↗
                </span>
              </Link>
              <Link href="/espace/documents" className={LIGNE_ACCES}>
                <span className="flex-1">Tes documents</span>
                <span aria-hidden="true" className={CHEVRON}>
                  ↗
                </span>
              </Link>
            </div>
          </Carte>

          {/* Tant que le numéro du coach n'est pas renseigné, la carte ne se
              dessine pas : un bouton d'appel vide, ou pire, qui composerait
              un numéro d'exemple, vaut moins que rien. Une fois renseigné,
              elle ne se cache jamais, y compris avant que l'accompagnement
              démarre : c'est justement là qu'un client a le plus besoin de
              savoir qui appeler. */}
          {reglages.coach_telephone && (
            <Carte ton="calme" className="shadow-douce">
              <MicroLibelle>Besoin d'aide ?</MicroLibelle>
              <p className="mt-3 text-sm text-texte-doux">
                {reglages.coach_nom
                  ? `${reglages.coach_nom} est là pour t'aider`
                  : "Ton coach est là pour t'aider"}
              </p>
              {/* Le numéro est le contenu de cette carte, pas l'ornement d'un
                  verbe : « Appeler ton coach » obligerait à cliquer pour
                  savoir quoi composer, or on le lit souvent depuis un
                  ordinateur pour le composer sur un téléphone. */}
              <a href={contact.href} className="mt-4 block">
                <Bouton
                  variante="secondaire"
                  className="w-full tabular-nums tracking-[0.02em]"
                >
                  {contact.affichage}
                </Bouton>
              </a>
            </Carte>
          )}
        </div>
      </div>
    </>
  );
}
