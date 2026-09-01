# Plan 01 : de la copie à un outil qui s'installe

**Objectif :** qu'un coach qui n'a jamais ouvert un terminal déploie l'outil,
entre dedans, voie un jeu de démonstration, le vide, renomme ses quatre
parties, ajoute son premier client et lui envoie ses accès, en moins de trente
minutes.

**Point de départ :** le code compile et les tests unitaires passent, mais
**rien ne se déploie** : il n'y a pas de schéma de base, pas d'inscription, et
pas d'écran de réglages.

**Spec :** `docs/specs/2026-09-01-le-portail-template.md`
**Décision :** `docs/decisions/0001-un-outil-isole-et-reglable.md`

## Contraintes globales

- **Français** partout : commits, commentaires, docs. Le code reste en anglais.
- **Interdit : les tirets longs.** Un test le vérifie sur tout le dépôt.
- **Commits atomiques.**
- **Rien de personnel n'entre ici.** Ni numéro, ni adresse, ni prix, ni nom de
  client réel. Ce dépôt deviendra public.
- **Sur le schéma `public`, révoquer avant d'accorder**, et lancer le
  conseiller de sécurité Supabase après chaque changement de schéma.
- **Aucun pont vers un autre outil.** Pas d'export, pas de schéma partagé, pas
  d'API ouverte. C'est la décision `0001` et c'est la raison d'être du produit.

---

## Bloc A : le schéma et le jeu de départ

Rien ne peut être vérifié tant que la base n'existe pas. C'est donc le premier
bloc, et le plus mécanique.

### Tâche 1 : `install.sql`, faite le 2026-09-01

**Fichiers :** `install.sql`, `lib/personne/types.ts`, `lib/personne/requetes.ts`,
`lib/auth/creation.ts`, `lib/pilier/etat.ts`, `lib/pilier/types.ts`.

- [x] Le schéma à plat : `personne`, `compte`, `offre`, `accompagnement`,
      `pilier`, `question_profil`, `reponse_profil`, `document`,
      `acces_pilier`, `appel`, `parcours_modele`, `tache_modele`, `tache`,
      plus la vue `coaching_membre`.
- [x] Les permissions par ligne, révoquer avant d'accorder, et la surface RPC
      refermée sur `PUBLIC` et non sur `anon` seul.
- [x] Le jeu de départ neutre : quatre parties, huit questions, trois tâches
      par partie, trois offres sans prix.

**Trois écarts avec ce qui était prévu, tous dans le sens du produit :**

**Le vocabulaire du pipe ne s'est pas allégé, il a disparu.** Le plan disait
de retirer `academie` des `enum`. En pratique `etape`, `motif_sortie`,
`canal`, `chemin`, les UTM, `a_relier` et `renvoye_academie` n'ont aucun sens
dans un outil qui ne suit pas de prospects : la fiche ne garde que l'identité,
et les quatre types `enum` correspondants ne sont pas créés. Toute fiche est
celle d'un client.

**La garde de `creation.ts` a changé de critère.** Elle refusait « une fiche
qui n'est pas cliente », ce qui se lisait sur `etape`. Elle refuse maintenant
une fiche **sans accompagnement**, ce qui est le même sens sans le pipe :
c'est l'accompagnement qui fait d'une fiche un client.

**`lib/supabase/types.ts` a été supprimé au lieu d'être regénéré.** Personne
ne l'importait, et il décrivait encore `lead_entrant`, `paiement` et
`etape_pipe`. Un fichier de types que rien ne relit et qui ment sur le schéma
vaut moins que pas de fichier. Il se regénère depuis un vrai projet le jour
où quelqu'un veut un client typé.

**Le pilier 0 n'existe plus.** Les parties sont numérotées de 1 à 4 et
`planifier_piliers` les ouvre une par mois à partir du démarrage, sans en
réserver aucune. La partie d'onboarding qui s'ouvrait le jour même et la
partie 4 débloquée à la main étaient deux règles d'une méthode précise.

### Tâche 2 : la frontière de confidentialité, déjà couverte

**Fichier :** `tests/integration/coaching.test.ts`, venu avec la copie.

Il porte déjà les cinq assertions qui comptent, témoin positif compris : le
client lit son propre coaching, ne lit pas ses appels de vente, ne lit pas le
coaching d'un autre, ne peut rien écrire à travers la vue (ni corriger, ni
effacer, ni ajouter), et ne voit jamais la note interne.

Rien à écrire, donc. **Mais il n'a jamais été exécuté contre ce schéma-ci**,
et il ne le sera pas avant qu'un projet Supabase existe. C'est la première
chose à lancer ce jour-là.

**Toute modification de la vue doit se heurter à ce test.**

---

## Bloc B : la première mise en service

### Tâche 3 : la base vierge ouvre une porte, une seule fois

**Fichiers :** `install.sql` (table `installation`), `lib/auth/installation.ts`,
`app/installation/page.tsx`, `app/installation/actions.ts`,
`lib/supabase/session.ts`.

C'est la tâche sensible du plan : une route publique qui crée un compte
administrateur avec la clé de service.

- [ ] **La garde est en base, pas en mémoire.** « Aucun coach n'existe » lu
      puis écrit laisserait passer deux requêtes simultanées. Une table
      `installation` à ligne unique (clé primaire à `true`, contrainte qui
      interdit `false`) fait échouer le second appel sur un doublon.
- [ ] **Un module séparé de `creation.ts`.** Celui-ci porte en tête « il ne
      sait créer qu'un membre, jamais d'admin ». Ne pas desserrer cette règle :
      la création du premier compte vit ailleurs, avec ses propres gardes.
- [ ] L'adresse et le mot de passe viennent du formulaire, et **c'est la seule
      fois de toute l'app où c'est le cas.** Acceptable ici et nulle part
      ailleurs : sur une base vierge, il n'y a personne à usurper.
- [ ] `/installation` entre dans `ROUTES_PUBLIQUES` et répond `notFound()` dès
      que la ligne existe. Un test le vérifie.
- [ ] Mettre à jour `CLAUDE.md` : les lecteurs de la clé de service passent de
      un à deux.

---

## Bloc C : les réglages

### Tâche 4 : la table `reglage` et sa lecture

**Fichiers :** `install.sql`, `lib/reglages/types.ts`, `lib/reglages/requetes.ts`,
`tests/integration/reglage-etanche.test.ts`.

- [ ] Une table clé-valeur (`cle text primary key`, `valeur jsonb`) plutôt
      qu'une table à vingt colonnes : chaque réglage nouveau serait sinon une
      migration.
- [ ] Lisible par tout compte connecté, écrivable par les seuls coachs. **Le
      `grant` d'écriture est nécessaire pour que la politique s'applique** :
      sans droit de table, la politique ne s'évalue jamais. C'est la politique
      qui filtre, pas le `grant`.
- [ ] **Aucun secret dans cette table.** Elle est lue par le client : tout ce
      qu'on y pose est public pour lui.
- [ ] `lireReglages()` rend un objet complet, chaque clé garantie présente,
      les manquantes remplies par le défaut du code.
- [ ] Le test d'étanchéité, avec témoin positif.

### Tâche 5 : le coach, les liens et le nom du programme lisent le réglage

**Fichiers :** `modules/portail/coach.ts`, `modules/portail/circle.ts`,
`lib/design/LogoProgramme.tsx`.

- [ ] `joindreLeCoach(telephone)` et `construireLiensCircle(adresses)` **ne
      changent pas de signature** : les deux prennent déjà leur valeur en
      paramètre, précisément pour être éprouvées sans dépendre de la
      constante. Seule la source change.
- [ ] Les tests existants restent verts sans être modifiés. S'il faut les
      toucher, la source a fuité dans la fonction.

### Tâche 6 : l'écran de réglages

**Fichiers :** `app/pilotage/reglages/page.tsx`, `modules/portail/Reglages.tsx`,
`modules/portail/actions-reglages.ts`, `app/pilotage/layout.tsx`.

- [ ] Le geste du dépôt : **on lit d'abord, le stylo ouvre l'édition, un seul
      « Enregistrer » envoie tout** (`lib/design/BoutonStylo.tsx`).
- [ ] Les valeurs simples : nom du programme, mot pour « partie », nom et
      téléphone du coach, trois liens externes.
- [ ] Les parties : nom, description, ordre, ajouter, retirer. **Retirer une
      partie qui porte des tâches déjà cochées doit être refusé**, pas caché :
      la progression d'un client en dépend.
- [ ] Les questions du profil. Désactiver plutôt que supprimer quand une
      réponse existe.
- [ ] Les tâches modèles, par partie.
- [ ] Le lien « Réglages » s'ajoute dans la barre du coach.

### Tâche 7 : le mot « partie » s'affiche partout depuis le réglage

**Fichiers :** les écrans de `app/espace/piliers/`, `modules/portail/CartePilier.tsx`,
`CalendrierPiliers.tsx`, `SectionTaches.tsx`, `app/espace/layout.tsx`.

- [ ] Remplacer les occurrences visibles de « pilier » et « piliers ». **Ni
      les noms de tables, ni les routes, ni les variables** : `pilier` reste
      `pilier` dans le code et dans l'URL.
- [ ] Un test unitaire sur la fonction qui accorde le mot, pour que « Ton
      module 2 » et « Tes modules » sortent d'une seule écriture.
- [ ] **Les quatre icônes de partie sont taillées pour une méthode qui n'est
      plus là** (un temple, un colis, un aimant). Et elles ne passent pas à
      l'échelle : le nombre de parties est réglable, donc une cinquième partie
      n'aurait pas d'icône. Les remplacer par un jeu qui ne dépend pas du
      nombre.

---

## Bloc D : ajouter un client

### Tâche 8 : l'écran d'ajout

**Fichiers :** `modules/portail/AjouterClient.tsx`, `modules/portail/actions.ts`,
`app/pilotage/page.tsx`.

- [ ] Le formulaire : nom, prénom, email, offre, prix.
- [ ] Il crée la fiche, ouvre l'accompagnement, copie le parcours modèle et
      pose le calendrier des parties.
- [ ] **La règle du socle ne bouge pas : l'adresse email n'est jamais un
      paramètre de la création de compte.** On crée la fiche avec son email,
      puis `creerLeCompteDuMembre(personneId)` la relit en base.
- [ ] L'envoi des accès reste un geste séparé, sur l'écran de suivi.
- [ ] Un parcours Playwright : un coach ajoute un client, il apparaît dans la
      liste, son espace existe.

---

## Bloc E : la démonstration et la sortie

### Tâche 9 : charger et vider le jeu de démonstration

**Fichiers :** `modules/portail/actions-demonstration.ts`, `Reglages.tsx`.

- [ ] Deux boutons : charger, tout vider. Un client fictif, son profil rempli,
      ses tâches à moitié faites, deux séances passées avec compte rendu.
- [ ] « Tout vider » demande une confirmation et **ne touche jamais une fiche
      qui n'est pas marquée `demonstration`.**

### Tâche 10 : le dépôt devient public

- [ ] Le bouton de déploiement et les variables préremplies.
- [ ] Le README relu par quelqu'un qui n'a jamais vu le projet.
- [ ] **Une dernière relecture de ce qui part** : aucune adresse, aucun
      numéro, aucun prix, aucun nom de client réel.
- [ ] Passer le dépôt en public.

---

## Ce que ce plan ne fait pas

- **Aucun pont vers le CRM ni vers le suivi financier.** C'est la décision
  `0001`, et ce n'est pas une étape remise à plus tard.
- **Aucun paiement, aucune facturation.**
- **Aucun import automatique de réunions.** Le champ existe sur un appel, la
  garde qui protège les champs importés aussi, mais rien ne les remplit.
