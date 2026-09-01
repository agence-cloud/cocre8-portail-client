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

Rien à écrire, donc. **Mais il n'a jamais été exécuté**, et il ne peut pas
l'être depuis une session d'agent : le proxy réseau bloque `*.supabase.co`.
Il se lance depuis un poste.

**Ce que ce test affirme a été vérifié autrement**, en SQL, sur le vrai
projet, en prenant l'identité d'un client puis d'un anonyme : lecture de
`appel` impossible, coaching lisible par la vue et lui seul, aucune colonne
`notes`, écritures à travers la vue sans effet, une seule fiche visible, et
rien du tout pour un anonyme. Le test reste à lancer, il n'est plus la seule
preuve.

**Toute modification de la vue doit se heurter à ce test.**

---

## Bloc B : la première mise en service

### Tâche 3 : la base vierge ouvre une porte, faite le 2026-09-01

**Fichiers :** `install.sql`, `lib/auth/installation.ts`,
`app/installation/page.tsx`, `app/installation/FormulaireInstallation.tsx`,
`app/installation/actions.ts`, `lib/supabase/session.ts`, `app/page.tsx`,
`tests/integration/installation.test.ts`.

- [x] **La garde est en base, pas en mémoire.** La table `installation` a une
      clé primaire qui vaut `true` et une contrainte qui interdit `false` :
      elle n'accepte qu'une ligne. Deux requêtes simultanées ne créent pas
      deux coachs, la seconde se heurte à un doublon.
- [x] **Un module séparé de `creation.ts`**, dont la règle « il ne sait créer
      qu'un membre, jamais d'admin » n'a pas été desserrée.
- [x] L'adresse et le mot de passe viennent du formulaire, seule fois de
      toute l'app. Acceptable ici : sur une base vierge, il n'y a personne à
      usurper.
- [x] `/installation` est publique et rend un `notFound()` dès que
      l'installation est faite. `/` y renvoie un visiteur sans session quand
      la base est vierge, plutôt que vers un formulaire de connexion qui ne
      peut fonctionner pour personne.
- [x] `CLAUDE.md` à jour : les lecteurs de la clé de service passent de un à
      deux, chacun avec sa garde.
- [x] Conseiller de sécurité relancé, et son relevé écrit dans
      `docs/conseiller-de-securite.md`.

**Deux choses valent d'être connues :**

**La réservation vient avant la création, et se libère si la suite échoue.**
Dans l'autre ordre, deux requêtes simultanées créeraient deux comptes avant
que l'une s'aperçoive d'être en trop. Le prix de ce choix : si le processus
meurt entre la réservation et le retrait, l'outil reste fermé sans compte, et
il faut vider la table `installation` à la main. C'est plus petit que le
défaut évité, et c'est écrit dans le code.

**Le test d'intégration éprouve la porte fermée**, qui est l'état de toutes
les bases sauf pendant leurs premières minutes : personne ne lit la table,
un client ne peut pas effacer la ligne pour rouvrir la porte, et le témoin
positif vérifie que la fonction répond encore. **Il n'a pas tourné**, comme
les autres : le proxy réseau des sessions d'agent bloque `*.supabase.co`.

## Bloc C : les réglages

### Tâche 4 : la table `reglage` et sa lecture, faite le 2026-09-01

**Fichiers :** `install.sql`, `lib/reglages/types.ts`, `lib/reglages/requetes.ts`,
`tests/unitaires/reglages.test.ts`, `tests/integration/reglage-etanche.test.ts`.

- [x] Une table clé-valeur, lisible par tout compte connecté, écrivable par
      le coach seul. Le `grant` d'écriture est nécessaire pour que la
      politique puisse même s'évaluer : c'est elle qui filtre, pas le `grant`.
- [x] Aucun secret n'y entre : elle est lue par le client.
- [x] `lireReglages()` rend un objet complet, chaque clé garantie présente,
      les manquantes remplies par le défaut du code. Une valeur déformée
      retombe sur son défaut plutôt que de lever.
- [x] Le test d'étanchéité, avec témoin positif.

**Un écart avec ce qui était prévu, et il compte.** Le nom du programme
s'affiche sur l'écran de connexion, donc **avant toute session**. Ouvrir la
table aux anonymes aurait donné le nom et le numéro du coach avec. Il a donc
sa propre fonction de base, `nom_du_programme()`, qui ne rend que lui. C'est
la seule valeur dupliquée entre le code et le SQL, et les deux défauts
doivent rester d'accord.

### Tâche 5 : le coach et les liens lisent le réglage, faite le 2026-09-01

**Fichiers :** `modules/portail/coach.ts`, `modules/portail/circle.ts`,
`lib/design/LogoProgramme.tsx`, `app/layout.tsx`, `app/espace/layout.tsx`,
`app/espace/page.tsx`.

- [x] Les constantes `COACH` et `CIRCLE` disparaissent. `joindreLeCoach` et
      `construireLiensCircle` **n'ont pas changé de signature** : elles
      prenaient déjà leur valeur en paramètre, et leurs tests n'ont eu à
      changer que de source.
- [x] Le titre de l'onglet devient le nom du programme. Il disait encore
      « Nouvelle École », resté de la copie.

**Le nom descend par un contexte posé dans la mise en page racine**, et non
par des propriétés : les trois écrans qui l'affichent sont des composants
clients, dont deux trop loin de leur page pour qu'une propriété descende sans
traverser des composants qui n'en ont que faire.

**Ce que ça coûte, et c'est assumé :** lire un réglage dans la mise en page
racine rend toute l'app dynamique, y compris l'écran de connexion qui était
figé à la construction. Une requête légère de plus sur une page publique,
contre un logotype qui dit le bon nom partout.

### Tâche 6 : l'écran de réglages, faite le 2026-09-01

**Fichiers :** `app/pilotage/reglages/page.tsx`, `modules/portail/Reglages.tsx`,
`modules/portail/actions-reglages.ts`, `app/pilotage/layout.tsx`.

- [x] Le geste du dépôt : on lit d'abord, le stylo ouvre l'édition, un seul
      « Enregistrer » envoie tout, et « Annuler » ne renvoie rien.
- [x] Les valeurs simples : nom du programme, mot des parties, nom et
      téléphone du coach, trois liens externes.
- [x] Le lien « Réglages » dans la barre du coach.
- [x] Les parties : nom, description, ordre, ajouter, retirer. **Retirer une
      partie où un client a déjà coché une tâche est refusé**, avec le nom de
      la partie dans le message : la base efface en cascade, et la progression
      de ce client disparaîtrait sans qu'il comprenne pourquoi.
- [x] Les questions du profil. **Une question déjà répondue ne se retire
      pas**, le message renvoie vers la case « Posée », qui la retire des
      formulaires à venir sans effacer les réponses.
- [x] Les tâches modèles, avec leur partie et leur section. **Aucune garde
      ici, volontairement** : une tâche modèle est un patron, les tâches des
      clients en sont des copies, et c'est exactement pour ça que la copie
      existe.

Trois cartes et non un formulaire : elles n'ont ni la même longueur ni les
mêmes règles, et un seul « Enregistrer » obligerait à tout revalider pour
corriger un titre.

**Chaque liste s'envoie en JSON dans un champ caché.** Des noms de champs
indexés se seraient décalés au premier retrait de ligne.

**La renumérotation se fait en deux passes**, et c'est éprouvé en base : le
numéro d'une partie est unique, et une seule passe qui échange deux valeurs se
heurte à la contrainte en cours de route. On écarte d'abord tout le monde dans
les négatifs, où personne n'est.

### Tâche 7 : le mot s'affiche partout depuis le réglage, faite le 2026-09-01

**Fichiers :** les écrans de `app/espace/piliers/`, `modules/portail/CartePilier.tsx`,
`CalendrierPiliers.tsx`, `SectionTaches.tsx`, `app/espace/layout.tsx`.

- [x] Les occurrences visibles de « pilier » et « piliers » viennent du
      réglage. **Ni les noms de tables, ni les routes, ni les variables** :
      `pilier` reste `pilier` dans le code et dans l'URL.
- [x] `motPartie` et `majuscule` accordent le mot depuis une seule écriture,
      pour que « Ton module 2 » et « Tes modules » ne divergent pas.
- [x] `iconePilier` parcourt les glyphes en boucle : une sixième partie a une
      icône plutôt qu'un trou.

**Les écrans d'authentification ont perdu le mot plutôt que de le lire.** Ils
s'affichent avant toute session, et le réglage n'est pas lisible là : leur
phrase dit « Ton programme, tes tâches et ta progression ». Une valeur de plus
ouverte aux anonymes pour une puce de liste aurait été un mauvais échange.

**Les icônes restent décoratives, et c'est un reste.** Elles ont été dessinées
pour une méthode précise, où la deuxième partie parlait de livraison. Aucun
dessin ne peut plus dire ce qu'une partie contient, puisqu'elle se nomme
depuis les réglages. Un jeu neutre reste à dessiner, c'est du travail de
design et non de code.

---

## Bloc D : ajouter un client

### Tâche 8 : l'écran d'ajout, faite le 2026-09-01

**Fichiers :** `modules/portail/AjouterClient.tsx`, `modules/portail/actions.ts`,
`modules/portail/EnvoyerLesAcces.tsx`, `lib/auth/creation.ts`,
`app/pilotage/page.tsx`.

- [x] Le formulaire : prénom, nom, email, offre, prix, date de démarrage. Le
      prix suit l'offre choisie et reste modifiable : c'est le prix de cette
      personne-là, pas celui du catalogue.
- [x] Il crée la fiche, ouvre l'accompagnement, copie le parcours type et
      pose le calendrier. **Vérifié en base** : douze tâches copiées, quatre
      parties planifiées.
- [x] **La règle du socle ne bouge pas** : l'adresse email n'est jamais un
      paramètre de la création de compte. On crée la fiche avec son email,
      puis `creerLeCompteDuMembre(personneId)` la relit en base.
- [x] L'envoi des accès reste un geste séparé, sur l'écran de suivi.
- [ ] Un parcours Playwright. Il ne peut pas tourner d'ici, il attend un
      poste.

**L'ordre des trois écritures est une garde, pas une commodité.** La fiche,
puis l'accompagnement, puis le compte : `creerLeCompteDuMembre` refuse une
fiche sans accompagnement, et c'est ce refus qui garantit qu'un contact ajouté
pour mémoire ne reçoive pas d'accès à un espace vide. Si l'accompagnement
échoue, la fiche est retirée : sans ça, son adresse bloquerait une seconde
tentative sur l'index unique.

**Les accès se donnent de deux façons, et la seconde n'est pas un
pis-aller.** Par email, avec confirmation nommant l'adresse. Ou par un lien à
copier, que le coach colle où il parle déjà à ses clients.

C'est ce second chemin qui fait marcher l'outil le premier jour : une
installation neuve utilise le service d'email de Supabase, plafonné à quelques
envois par heure et dont les textes sont en anglais tant que personne ne les a
réécrits. Un coach qui ajoute ses cinq premiers clients le même après-midi se
heurterait au plafond sans comprendre pourquoi.

**Un défaut trouvé au passage, et il n'aurait pas été vu au build.**
`lib/offre/requetes.ts` sélectionnait `provisionne_espace` et `par_defaut`,
deux colonnes retirées du schéma avec le CRM. Rien ne le signalait, aucun type
ne relie plus le code à la base : l'écran de suivi d'un client aurait échoué à
l'exécution, sur une requête qui compile.

## Bloc E : la démonstration et la sortie

### Tâche 9 : charger et vider le jeu de démonstration, faite le 2026-09-01

**Fichiers :** `modules/portail/actions-demonstration.ts`,
`modules/portail/Demonstration.tsx`, `lib/auth/creation.ts`,
`app/pilotage/reglages/page.tsx`.

- [x] Deux boutons dans les réglages. Une cliente inventée, son profil rempli
      en entier, six tâches sur dix faites parmi les parties ouvertes, et deux
      séances passées avec leur compte rendu.
- [x] « Tout vider » demande confirmation, et **ne touche jamais une fiche qui
      n'est pas marquée `demonstration`** : le filtre à la lecture, et la
      suppression de compte qui refuse de toute façon. Deux gardes sur la même
      règle, par deux chemins.
- [x] Le chargement est rejouable : un second clic ne crée pas une seconde
      cliente inventée.

**Le profil est rempli en entier, et c'est structurel.** Tant qu'une réponse
manque, l'espace entier renvoie vers la porte d'accueil : la démonstration
ouvrirait sur un questionnaire au lieu du tableau de bord qu'elle est censée
montrer.

**Vider a demandé d'ouvrir une porte dans `creation.ts`**, dont la règle 2
interdisait toute suppression. La règle est amendée plutôt que contournée, et
la base rendait la chose nécessaire : **vérifié sur le vrai projet**, une
fiche cliente refuse d'être supprimée tant que son compte existe, la
contrainte `membre_a_une_personne` interdisant un membre sans fiche. Le compte
part donc en premier, `compte` suit en cascade, la fiche devient supprimable.

**La cliente inventée ne se connecte pas toute seule**, et c'est voulu. Son
mot de passe est aléatoire et jeté, comme pour tout le monde. Pour voir son
espace, le coach prend « Obtenir un lien à copier » sur son écran de suivi et
l'ouvre dans une fenêtre privée : le détour lui fait traverser le vrai chemin
d'accès, celui que ses clients emprunteront.

### Tâche 10 : le dépôt devient public

- [x] Le bouton de déploiement et les trois variables préremplies, dans le
      README, avec l'ordre corrigé : la base d'abord, l'app ensuite. Déployer
      avant d'avoir un projet Supabase n'aurait donné aucune valeur à saisir.
- [x] **La purge vérifiée par script**, `npm run verifier`. Il ne lit que les
      fichiers suivis par git, et il cherche des personnes et des valeurs, pas
      la marque : « Cocre8 » a le droit d'apparaître, c'est la signature de
      l'éditeur.
- [ ] Le README relu par quelqu'un qui n'a jamais vu le projet.
- [ ] Passer le dépôt en public. Le geste appartient à son propriétaire.

**Le script a trouvé quatre restes le jour où il a été écrit**, dont un
ajouté la veille dans une spec. C'est la démonstration de son intérêt : la
relecture qui a suivi la copie n'a protégé qu'un jour, celui où elle a été
faite.

## Ce que ce plan ne fait pas

- **Aucun pont vers le CRM ni vers le suivi financier.** C'est la décision
  `0001`, et ce n'est pas une étape remise à plus tard.
- **Aucun paiement, aucune facturation.**
- **Aucun import automatique de réunions.** Le champ existe sur un appel, la
  garde qui protège les champs importés aussi, mais rien ne les remplit.
