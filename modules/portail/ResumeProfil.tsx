import type { QuestionProfil } from "@/lib/profil/types";

/**
 * Le profil déjà rempli, en lecture : les questions et ce qu'on y a répondu,
 * sans un seul champ.
 *
 * Une fois le profil rempli, on veut le relire, pas le re-remplir : les
 * questions et les réponses, à plat. C'est le mouvement de tous les écrans
 * qui se modifient ici, on lit d'abord, le stylo ouvre l'édition.
 *
 * Composant serveur, volontairement : il n'a aucun état. Le stylo qui le
 * bascule en formulaire vit dans `FormulaireProfil`, qui le reçoit en
 * enfant.
 */
export function ResumeProfil({
  questions,
  reponses,
}: {
  questions: QuestionProfil[];
  reponses: Record<string, string>;
}) {
  return (
    <dl className="mt-4">
      {questions.map((question) => {
        const reponse = (reponses[question.id] ?? "").trim();

        return (
          <div
            key={question.id}
            className="border-b border-bordure py-4 last:border-0 sm:flex sm:items-baseline sm:gap-8"
          >
            <dt className="text-[15px] text-texte-doux sm:w-1/2 sm:shrink-0">
              {question.libelle}
            </dt>
            {/* Une question sans réponse le dit, en gris, plutôt que de
                laisser une ligne vide : le blanc se lit comme un bug, pas
                comme une absence. */}
            <dd className="mt-1 text-[15px] whitespace-pre-wrap sm:mt-0 sm:flex-1">
              {reponse === "" ? (
                <span className="text-texte-doux">Pas encore répondu</span>
              ) : (
                reponse
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
