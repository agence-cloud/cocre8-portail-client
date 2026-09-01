import { ouvrirLesSessions } from "./sessions";

/**
 * Playwright appelle ceci une fois, avant tous les parcours : les deux
 * sessions partagées s'ouvrent ici, et nulle part ailleurs.
 */
export default async function avantLesParcours() {
  await ouvrirLesSessions(
    process.env.URL_A_TESTER ?? `http://localhost:${process.env.PORT ?? "3000"}`,
  );
}
