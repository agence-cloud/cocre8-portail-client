import { exigerMembre } from "@/lib/auth/compte";
import { exigerProfilComplet } from "@/modules/portail/garde";
import { lireDocuments, signerDocument } from "@/lib/document/requetes";
import { ListeDocuments } from "@/modules/portail/ListeDocuments";
import { DepotDocument } from "@/modules/portail/DepotDocument";

export default async function PageDocuments() {
  const compte = await exigerMembre();
  const personneId = compte.personneId!;
  await exigerProfilComplet(personneId);

  const documents = await lireDocuments(personneId);

  // Le coffre est privé : sans signature, aucune adresse ne fonctionne. Les
  // liens sont signés à chaque rendu plutôt que stockés, pour qu'une adresse
  // copiée depuis un vieil onglet cesse de marcher.
  const liens = Object.fromEntries(
    await Promise.all(
      documents.map(async (document) => [
        document.id,
        (await signerDocument(document.chemin_storage)) ?? "#",
      ]),
    ),
  );

  return (
    <>
      <h1 className="text-4xl">
        Tes <span className="text-accent">documents</span>
      </h1>
      <p className="mt-2 text-texte-doux">
        Ce que ton coach dépose pour toi, et ce que tu lui envoies.
      </p>

      <DepotDocument personneId={personneId} />
      <ListeDocuments documents={documents} liens={liens} />
    </>
  );
}
