import { test, expect, type Page, type Locator } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { COACH, joindreLeCoach } from "@/modules/portail/coach";

async function connecter(page: Page, email: string, motDePasse: string) {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Entrer dans mon espace" }).click();
  // Le clic déclenche la redirection sans que le test l'attende : sans ce
  // garde, un goto() suivant part avant que la session soit posée et
  // retombe sur la connexion.
  await page.waitForURL((url) => !url.pathname.startsWith("/connexion"));
}

async function connecterAdmin() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await admin.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_MOTDEPASSE!,
  });
  if (error) throw new Error(`Connexion admin impossible : ${error.message}`);
  return admin;
}

/**
 * Le filet, et il a changé de sens le 2026-09-01.
 *
 * Il vidait les questions 9 et 10 pour rendre Léa à l'état où
 * `scripts/peupler-espace.mts` la laissait, huit réponses sur dix. Ce
 * n'était pas un caprice : le script la laissait incomplète exprès, pour
 * qu'on voie vivre la carte « Ton point de départ » du tableau de bord, qui
 * disparaît à 100 %.
 *
 * Le raisonnement se retournait contre lui. Tant qu'une réponse manque, la
 * porte du profil (`modules/portail/garde.ts`) retient le membre hors de
 * TOUT l'espace : la carte qu'on voulait montrer était la seule qu'on ne
 * pouvait jamais atteindre, et « Lancer la démo » ouvrait sur la question 9
 * au lieu du tableau de bord. Le script remplit désormais les dix.
 *
 * **Cet `afterAll` remet donc Léa complète, et non plus incomplète.**
 * Sans cette inversion, une seule exécution de la suite rendrait la
 * démonstration commerciale inutilisable jusqu'au prochain `npm run peupler`.
 * Les valeurs sont celles du script, pour que la démo soit la même après une
 * exécution de tests qu'après un peuplement.
 */
const REPONSES_DEMO: Record<number, string> = {
  9: "6 à 8h",
  10: "Bouche à oreille",
};

test.afterAll(async () => {
  const admin = await connecterAdmin();
  const { data: personne } = await admin
    .from("personne")
    .select("id")
    .eq("email", process.env.DEMO_EMAIL!)
    .single();
  const { data: questions } = await admin
    .from("question_profil")
    .select("id, ordre")
    .in("ordre", [9, 10]);

  for (const question of questions ?? []) {
    const { error } = await admin
      .from("reponse_profil")
      .update({ reponse: REPONSES_DEMO[question.ordre as number] })
      .eq("personne_id", personne!.id)
      .eq("question_id", question.id);

    // Un nettoyage qui échoue en silence est pire que pas de nettoyage : on
    // croit la base rendue alors qu'elle ne l'est pas.
    if (error) throw new Error(`Profil de démonstration non rendu : ${error.message}`);
  }

  // Et on relit, parce qu'un `update` qui ne touche aucune ligne ne lève pas :
  // si la ligne de réponse n'existait plus, la démonstration rouvrirait sur la
  // porte sans que rien ne l'ait signalé.
  const { data: rendues } = await admin
    .from("reponse_profil")
    .select("reponse, question_profil!inner(ordre)")
    .eq("personne_id", personne!.id)
    .in("question_profil.ordre", [9, 10]);

  const remplies = (rendues ?? []).filter((r) => (r.reponse ?? "").trim() !== "");
  if (remplies.length !== 2) {
    throw new Error(
      `Profil de démonstration laissé incomplet : ${remplies.length} réponse(s) sur 2 aux questions 9 et 10. La démo rouvrira sur la porte.`,
    );
  }
});

/**
 * Franchit la porte du profil si elle est fermée.
 *
 * **Depuis le 2026-09-01, elle ne l'est plus au repos** : Léa a ses dix
 * réponses, donc cette fonction ne fait rien et rend faux. Elle n'est pas
 * devenue inutile pour autant, c'est elle qui rattrape un passage précédent
 * qui aurait échoué en laissant le profil entamé, et c'est le seul test de la
 * porte qui la referme volontairement.
 *
 * Renvoie si le remplissage a eu lieu, pour que l'appelant sache s'il doit le
 * défaire ensuite.
 */
async function assurerProfilComplet(page: Page): Promise<boolean> {
  await page.goto("/espace/profil");

  // Le stylo est le signal que le profil est complet : il n'apparaît que
  // dans cet état, et la porte ne le montre jamais.
  const stylo = page.getByRole("button", { name: "Modifier mon profil" });
  if (await stylo.isVisible()) return false;

  // La porte rouvre sur la première question sans réponse, donc la neuvième,
  // sans repasser par l'accueil. Une question à la fois : on ne peut pas
  // remplir la dixième avant.
  //
  // Les deux dernières sont à options, et un choix vaut réponse : il avance
  // sans « Suivant », qui n'existe pas sur ces questions-là.
  await expect(page.getByText("Question 9 sur 10")).toBeVisible();
  await page.getByRole("button", { name: /Moins de 6h/ }).click();

  await expect(page.getByText("Question 10 sur 10")).toBeVisible();
  await page.getByRole("button", { name: /Bouche à oreille/ }).click();

  // Le chargement se déroule avant l'espace : quatre lignes, puis la
  // redirection. Attendre l'adresse plutôt qu'un temps fixe.
  await page.waitForURL(/\/espace$/, { timeout: 15000 });
  return true;
}

/**
 * Referme la porte, en vidant les deux dernières questions.
 *
 * **Ce n'est plus un nettoyage, c'est une mise en scène.** Ça l'était jusqu'au
 * 2026-09-01, quand l'état de repos de Léa était huit réponses sur dix ;
 * son état de repos est maintenant complet, et vider est ce qu'on fait pour
 * éprouver la porte, pas pour rendre la base.
 *
 * Le seul appelant légitime est donc le test de la porte, qui a besoin
 * qu'elle soit fermée. Après lui, l'`afterAll` rend Léa complète.
 */
async function viderProfilComplete(page: Page) {
  await page.goto("/espace/profil");

  // Le profil est complet à cet instant : il s'affiche en résumé, et c'est le
  // stylo qui rend les champs. Pas de focus ni de blur ici : en édition
  // groupée, quitter un champ n'envoie rien, sinon « Annuler » n'annulerait
  // plus rien.
  await page.getByRole("button", { name: "Modifier mon profil" }).click();

  await page
    .getByLabel("Combien d'heures par semaine peux-tu y consacrer ?")
    .selectOption({ index: 0 });
  await page.getByLabel("D'où viennent tes clients aujourd'hui ?").selectOption({ index: 0 });

  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();

  // La porte s'est refermée, et sur la neuvième question : c'est la preuve
  // que les deux réponses sont bien parties. Sans ce garde, le test pourrait
  // se terminer avant la fin de l'écriture et laisser le profil complet en
  // base malgré des champs qui semblaient vidés à l'écran. La neuvième et
  // pas la dixième : vider un seul des deux champs rouvrirait sur celle qui
  // manque, et ce texte-ci exige les deux.
  await expect(page.getByText("Question 9 sur 10")).toBeVisible();
}

test("le membre coche une tâche et voit sa progression bouger", async ({ page }) => {
  await connecter(page, process.env.DEMO_EMAIL!, process.env.DEMO_MOTDEPASSE!);
  await expect(page).toHaveURL(/\/espace/);
  const profilRempli = await assurerProfilComplet(page);

  // Déclarée avant le try : le finally doit pouvoir décocher la case même si
  // une assertion échoue après le clic, sans quoi le pilier 1 finirait, au
  // bout de quelques passages, sans plus aucune tâche à cocher.
  let case_: Locator | undefined;

  try {
    await page.goto("/espace/piliers/1");

    // La progression avant, lue dans l'anneau.
    const anneau = page.getByLabel(/pour cent/);
    const avant = Number((await anneau.textContent())!.replace(/\D/g, ""));

    // Toutes les tâches du pilier, dans leur ordre d'affichage (stable :
    // grouperEnSections trie par "ordre", jamais par "faite"). aria-pressed
    // filtre le bouton de repli de la navigation et le pli d'une section, qui
    // n'ont pas cet attribut.
    const taches = page.locator('main button[aria-pressed]');
    // Attendre qu'au moins une tâche existe avant de les compter. Depuis que
    // les pages annoncent leur chargement par un squelette, la page répond
    // avant d'avoir son contenu : sans cette attente, evaluateAll travaille
    // sur une liste vide, et findIndex renvoie -1 exactement comme s'il n'y
    // avait plus rien à cocher. Le test échouait donc en accusant le jeu de
    // démonstration d'une dérive qui n'existait pas.
    await expect(taches.first()).toBeVisible();

    const indexPremiereNonCochee = await taches.evaluateAll((boutons) =>
      boutons.findIndex((bouton) => bouton.getAttribute("aria-pressed") === "false"),
    );
    // Un message clair plutôt qu'un délai de 30 secondes : nth(-1) attendrait
    // en vain une case qui n'existe pas si le pilier 1 se retrouvait un jour
    // entièrement coché avant que ce test démarre.
    if (indexPremiereNonCochee === -1) {
      const total = await taches.count();
      throw new Error(
        `Aucune tâche non cochée sur le pilier 1, parmi ${total} affichées : le jeu de démo n'est plus dans son état de départ.`,
      );
    }
    // Cibler par position et pas par [aria-pressed="false"] : une fois cochée,
    // ce sélecteur ne la retrouverait plus, et "first()" glisserait sur la
    // tâche suivante au lieu de vérifier celle qu'on vient de cocher.
    case_ = taches.nth(indexPremiereNonCochee);
    await case_.click();

    // La case réagit sans attendre le serveur : c'est la promesse de l'écran.
    await expect(case_).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    const apres = Number((await anneau.textContent())!.replace(/\D/g, ""));
    expect(apres).toBeGreaterThan(avant);
  } finally {
    // Décochée pour que le test reste rejouable indéfiniment, au lieu de
    // consommer une tâche du pilier 1 à chaque passage. Reload après le
    // clic, comme pour la case cochée plus haut : la mise à jour optimiste
    // affiche l'état voulu tout de suite, seul un aller-retour serveur
    // prouve que le décochage a réellement été écrit avant que le test se
    // termine et referme la page.
    if (case_) {
      await case_.click();
      await expect(case_).toHaveAttribute("aria-pressed", "false");
      await page.reload();
      await expect(case_).toHaveAttribute("aria-pressed", "false");
    }
    if (profilRempli) await viderProfilComplete(page);
  }
});

test("un pilier fermé montre sa date et ferme son adresse", async ({ page }) => {
  const admin = await connecterAdmin();
  const { data: personne } = await admin
    .from("personne")
    .select("id")
    .eq("email", process.env.DEMO_EMAIL!)
    .single();
  const { data: pilier } = await admin.from("pilier").select("id").eq("numero", 2).single();
  const { data: acces } = await admin
    .from("acces_pilier")
    .select("date_ouverture")
    .eq("personne_id", personne!.id)
    .eq("pilier_id", pilier!.id)
    .single();
  const dateOrigine = acces!.date_ouverture as string;

  await connecter(page, process.env.DEMO_EMAIL!, process.env.DEMO_MOTDEPASSE!);
  const profilRempli = await assurerProfilComplet(page);

  try {
    // Une date lointaine posée par le test lui-même, plutôt que de compter
    // sur l'âge du jeu de démo : scripts/peupler-espace.mts ouvre le pilier 2
    // cinq jours après son passage, et ce test cesserait de passer le
    // sixième jour si sa fermeture ne tenait qu'à cette date-là.
    await admin
      .from("acces_pilier")
      .update({ date_ouverture: "2099-01-01" })
      .eq("personne_id", personne!.id)
      .eq("pilier_id", pilier!.id);

    await page.goto("/espace/piliers");
    await expect(page.getByText(/Le cœur de la méthode/)).toBeVisible();

    // Son adresse ne mène nulle part : la page renvoie à la liste.
    await page.goto("/espace/piliers/2");
    await expect(page).toHaveURL(/\/espace\/piliers$/);
  } finally {
    await admin
      .from("acces_pilier")
      .update({ date_ouverture: dateOrigine })
      .eq("personne_id", personne!.id)
      .eq("pilier_id", pilier!.id);
    if (profilRempli) await viderProfilComplete(page);
  }
});

test("la date posée par le coach apparaît chez le membre", async ({ browser }) => {
  const cote_coach = await browser.newContext();
  const pageCoach = await cote_coach.newPage();
  await connecter(pageCoach, process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_MOTDEPASSE!);

  await pageCoach.goto("/pilotage");
  await pageCoach.getByRole("link", { name: /Léa/ }).click();
  await expect(pageCoach.getByText("Son calendrier de piliers")).toBeVisible();

  // Repousser le pilier 3 à une date lointaine et reconnaissable, puis la
  // remettre comme on l'a trouvée : un test de parcours écrit dans la vraie
  // base, une date de 2027 qui traîne casserait les prochains passages.
  const ligne = pageCoach.locator("div").filter({ hasText: /^3\. Action/ }).last();
  const dateOrigine = await ligne.locator('input[type="date"]').inputValue();
  try {
    await ligne.locator('input[type="date"]').fill("2027-03-15");
    await expect(pageCoach.getByText("le 15 mars")).toBeVisible();

    const cote_membre = await browser.newContext();
    const pageMembre = await cote_membre.newPage();
    let profilRempli = false;
    try {
      await connecter(pageMembre, process.env.DEMO_EMAIL!, process.env.DEMO_MOTDEPASSE!);
      profilRempli = await assurerProfilComplet(pageMembre);
      await pageMembre.goto("/espace/piliers");

      await expect(pageMembre.getByText(/15 mars/)).toBeVisible();
    } finally {
      // Dans son propre finally, imbriqué : une assertion qui échoue plus
      // haut ne doit ni laisser le profil de Léa complet à 100 %, ni
      // laisser ce contexte de navigateur ouvert.
      if (profilRempli) await viderProfilComplete(pageMembre);
      await cote_membre.close();
    }
  } finally {
    await ligne.locator('input[type="date"]').fill(dateOrigine);
    await expect(ligne.locator('input[type="date"]')).toHaveValue(dateOrigine);
    // Le champ n'est pas contrôlé : sa valeur affichée change dès le fill(),
    // avant même que l'écriture ait atteint la base. Un reload la relit
    // depuis le serveur, seule preuve que la restauration a réellement
    // abouti avant que le contexte ferme et coupe la requête en vol.
    await pageCoach.reload();
    await expect(ligne.locator('input[type="date"]')).toHaveValue(dateOrigine);
  }

  await cote_coach.close();
});

test("le profil rempli se lit, et le stylo le rouvre", async ({ page }) => {
  await connecter(page, process.env.DEMO_EMAIL!, process.env.DEMO_MOTDEPASSE!);
  const profilRempli = await assurerProfilComplet(page);

  try {
    await page.goto("/espace/profil");

    // Au repos : les questions et leurs réponses, et pas un seul champ. Le
    // retour tenait en une phrase : « plutôt un résumé sur son
    // profil entrepreneur avec les questions et les réponses ».
    // Une question du référentiel réel (migration 0021), avec son apostrophe
    // droite : c'est celle que la base contient, et getByText ne normalise
    // pas les apostrophes.
    const question = "Ton chiffre d'affaires du mois dernier";
    await expect(page.getByText(question)).toBeVisible();
    await expect(page.locator("main").getByRole("combobox")).toHaveCount(0);
    await expect(page.locator("main").getByRole("textbox")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Enregistrer", exact: true })).toHaveCount(0);

    // Le stylo rend les champs, le même geste que sur la fiche du pilotage.
    await page.getByRole("button", { name: "Modifier mon profil" }).click();
    await expect(page.getByLabel(question)).toBeVisible();
    await expect(page.getByRole("button", { name: "Enregistrer", exact: true })).toBeVisible();

    // Annuler referme sans rien écrire.
    await page.getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByRole("button", { name: "Modifier mon profil" })).toBeVisible();
    await expect(page.locator("main").getByRole("combobox")).toHaveCount(0);
  } finally {
    if (profilRempli) await viderProfilComplete(page);
  }
});

test("le membre retrouve un coaching passé, sans la note interne du coach", async ({ page }) => {
  const admin = await connecterAdmin();
  const { data: personne } = await admin
    .from("personne")
    .select("id")
    .eq("email", process.env.DEMO_EMAIL!)
    .single();

  // Un titre à lui, parce que le jeu de démonstration en pose désormais un
  // aussi : sans quoi les assertions tomberaient sur deux cartes à la fois.
  const TITRE = `Séance de test ${Date.now()}`;
  const RESUME = "On a posé ton offre et le prix qui va avec.";
  const TRANSCRIPTION = "Bonjour Léa, on reprend où on s'était arrêtés.";
  const NOTE_INTERNE = "Elle doute encore de son prix, ne pas insister aujourd'hui.";

  const { data: appel, error } = await admin
    .from("appel")
    .insert({
      personne_id: personne!.id,
      titre: TITRE,
      portee: "individuel",
      prevu_le: "2026-08-10T14:00:00Z",
      issue: "honore",
      nature: "coaching",
      lien_enregistrement: "https://exemple.fr/coaching-1",
      transcription: TRANSCRIPTION,
      resume: RESUME,
      notes: NOTE_INTERNE,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Coaching de test non créé : ${error.message}`);

  await connecter(page, process.env.DEMO_EMAIL!, process.env.DEMO_MOTDEPASSE!);
  const profilRempli = await assurerProfilComplet(page);

  try {
    await page.goto("/espace/coachings");

    // Chaque séance est un élément de liste : on vise la sienne, et non la
    // page entière, où le jeu de démonstration en pose d'autres.
    const carte = page.getByRole("listitem").filter({ hasText: TITRE });
    await expect(carte).toHaveCount(1);

    // Repliée, la séance ne montre que de quoi la reconnaître : son titre et
    // sa date. Ni le résumé, ni l'enregistrement, ni la transcription.
    // Dépliées ensemble, trois séances feraient de cette page un mur de
    // texte où le résumé, qui est ce qu'on vient lire, disparaîtrait.
    await expect(carte.getByText(RESUME)).toHaveCount(0);
    await expect(carte.getByText(TRANSCRIPTION)).toHaveCount(0);

    // Toute l'en-tête est le bouton, pas seulement le titre : une cible de
    // la largeur de la carte se clique sans viser.
    await carte.getByRole("button").click();

    // Ce que le client vient chercher, en un seul geste : l'enregistrement,
    // le résumé, et la transcription en dessous.
    await expect(carte.getByRole("link", { name: "Revoir l'enregistrement" })).toHaveAttribute(
      "href",
      "https://exemple.fr/coaching-1",
    );
    await expect(carte.getByText(RESUME)).toBeVisible();
    await expect(carte.getByText(TRANSCRIPTION)).toBeVisible();

    // Ce qu'il ne doit jamais lire, et qui se vérifie ici parce qu'une
    // frontière posée en base ne se voit pas à l'écran tant qu'on ne la
    // regarde pas : la note interne du coach. Cherchée dépliée, sur la page
    // entière et non dans sa seule carte : elle ne doit apparaître nulle
    // part, même quand tout le reste est ouvert.
    await expect(page.getByText(NOTE_INTERNE)).toHaveCount(0);
  } finally {
    await admin.from("appel").delete().eq("id", appel!.id);
    if (profilRempli) await viderProfilComplete(page);
  }
});

test("le membre trouve le numéro de son coach sur son tableau de bord", async ({ page }) => {
  await connecter(page, process.env.DEMO_EMAIL!, process.env.DEMO_MOTDEPASSE!);
  const profilRempli = await assurerProfilComplet(page);

  try {
    await page.goto("/espace");

    const contact = joindreLeCoach(COACH.telephone);

    // Un lien et non un simple texte : sur un téléphone, un membre doit
    // pouvoir appeler d'un doigt. C'est tout l'intérêt du `tel:`, et c'est la
    // seule partie que l'oeil ne vérifie pas sur une capture d'écran.
    const appel = page.getByRole("link", { name: contact.affichage });
    await expect(appel).toBeVisible();
    await expect(appel).toHaveAttribute("href", contact.href);

    await expect(page.getByText("Notre équipe est là pour vous accompagner")).toBeVisible();
  } finally {
    if (profilRempli) await viderProfilComplete(page);
  }
});

test("la porte pose une question à la fois, et n'ouvre qu'à la dernière", async ({ page }) => {
  await connecter(page, process.env.DEMO_EMAIL!, process.env.DEMO_MOTDEPASSE!);

  // Ce test est le seul à avoir besoin de la porte fermée. Si un passage
  // précédent l'a laissée ouverte, on la referme avant de commencer :
  // supposer un état de départ au lieu de le poser rend un test vert ou
  // rouge selon ce qui a tourné avant lui.
  await page.goto("/espace/profil");
  if (await page.getByRole("button", { name: "Modifier mon profil" }).isVisible()) {
    await viderProfilComplete(page);
  }

  // Le membre arrive sur la porte, quoi qu'il demande.
  await page.goto("/espace");
  await expect(page).toHaveURL(/\/espace\/profil/);

  // « Au centre directement avec aucune interface nulle part » : pas de barre
  // latérale, donc aucun lien vers le reste de l'espace.
  await expect(page.getByRole("link", { name: "Mes piliers" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Mes documents" })).toHaveCount(0);

  // Une question, et une seule. On vient de vider les deux dernières, la
  // porte rouvre donc sur la neuvième plutôt que de refaire lire les huit
  // premières, et sans repasser par l'accueil que Léa a déjà vu.
  await expect(page.getByText("Question 9 sur 10")).toBeVisible();
  await expect(page.getByText("Combien d'heures par semaine peux-tu y consacrer ?")).toBeVisible();
  await expect(page.getByText("D'où viennent tes clients aujourd'hui ?")).toHaveCount(0);

  await page.getByRole("button", { name: /Moins de 6h/ }).click();

  await expect(page.getByText("Question 10 sur 10")).toBeVisible();
  // La question précédente a disparu : on ne les voit jamais ensemble.
  await expect(page.getByText("Combien d'heures par semaine peux-tu y consacrer ?")).toHaveCount(0);

  await page.getByRole("button", { name: /Bouche à oreille/ }).click();

  // Le chargement occupe l'attente, puis l'espace s'ouvre avec sa barre et
  // tout le reste.
  await expect(page.getByText("On prépare ton espace.")).toBeVisible();
  await expect(page.getByText("Ton espace est prêt")).toBeVisible();
  await page.waitForURL(/\/espace$/, { timeout: 15000 });
  await expect(page.getByRole("link", { name: "Mes piliers" })).toBeVisible();

  // Aucun `finally` qui revide, et c'est le changement du 2026-09-01 : ce
  // test se termine en franchissant la porte, donc il laisse Léa dans
  // son état de repos, complète. Vider ici casserait la démonstration
  // commerciale jusqu'au prochain peuplement. Si le test échoue avant
  // d'arriver ici, c'est l'`afterAll` qui la rend complète.
});
