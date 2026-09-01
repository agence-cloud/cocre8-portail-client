import { exigerAdmin } from "@/lib/auth/compte";
import { lireReglages } from "@/lib/reglages/requetes";
import { Reglages } from "@/modules/portail/Reglages";

export default async function PageReglages() {
  // Chaque page se garde elle-même, le layout ne suffit pas.
  await exigerAdmin();

  const reglages = await lireReglages();

  return (
    <>
      <h1 className="text-4xl">
        Tes <span className="text-orange">réglages</span>
      </h1>
      <p className="mt-2 text-texte-doux">
        Ce que tes clients voient, et comment tu appelles les choses.
      </p>

      <div className="mt-8 max-w-2xl">
        <Reglages reglages={reglages} />
      </div>
    </>
  );
}
