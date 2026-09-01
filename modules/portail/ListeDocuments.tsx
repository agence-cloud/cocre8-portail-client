import { Carte } from "@/lib/design/Carte";
import { Badge } from "@/lib/design/Badge";
import { Icone } from "@/lib/design/Icones";
import { formaterTaille, iconeDocument, type Document } from "@/lib/document/types";
import { formaterJourMois } from "@/lib/dates";

type Props = {
  documents: Document[];
  /** Une adresse signée par document, valable dix minutes. */
  liens: Record<string, string>;
  /** Vrai côté coach : lui seul a besoin de savoir ce qui reste interne. */
  montrerVisibilite?: boolean;
};

export function ListeDocuments({ documents, liens, montrerVisibilite = false }: Props) {
  if (documents.length === 0) {
    return (
      <p className="mt-6 text-texte-doux">
        Aucun document pour l'instant. Dès que ton coach en dépose un, tu le
        trouveras ici.
      </p>
    );
  }

  return (
    <Carte className="mt-6">
      {documents.map((document) => (
        <a
          key={document.id}
          href={liens[document.id] ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 border-b border-bordure py-3 transition-colors duration-200 last:border-0 hover:text-orange"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-icone bg-fond-alt">
            <Icone nom={iconeDocument(document.type_mime)} className="h-5 w-5 text-texte-doux" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{document.nom}</span>
            <span className="text-xs text-texte-doux">
              {/* cree_le est un timestamptz : on ne garde que le quantième,
                  seul ce que formaterJourMois sait lire. */}
              {formaterJourMois(document.cree_le.slice(0, 10))}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3 text-xs text-texte-doux">
            {montrerVisibilite && !document.visible_membre && (
              <Badge ton="attention">interne</Badge>
            )}
            {formaterTaille(document.taille_octets)}
          </span>
        </a>
      ))}
    </Carte>
  );
}
