# CLAUDE.md : Portail client

## Ce que c'est

Un outil gratuit, édité par Cocre8, donné à des coachs. Chacun l'installe
chez lui, sur son propre hébergement et sa propre base : **il n'y a pas de
version hébergée, pas de multi-locataire, et personne d'autre ne voit ses
données.**

Il a deux côtés : le client, qui vit son accompagnement, et le coach, qui
suit ses clients.

**Rien de l'éditeur ne doit se voir dedans.** Ni ses couleurs, ni sa police,
ni son logotype, ni une signature au pied d'un écran. Un coach qui installe
l'outil est chez lui : c'est le nom de son programme qui s'affiche, et c'est
tout. L'habillage est donc volontairement sourd, un thème sombre en gris
froids avec un seul accent bleu, qui ne ressemble ni à l'éditeur ni à
personne. `npm run verifier` refuse toute réapparition de la marque hors du
README et de la licence.

Cette règle a été enfreinte une fois, dans le sens qui coûte : l'écran de
connexion est parti avec la charte de l'éditeur et son « Propulsé par », et
c'est le premier écran qu'un prospect ouvre. Corrigé le 2026-09-02.

## D'où il vient, et ce que ça implique

Ce dépôt est une **copie propre, sans historique**, du socle et du module
portail d'une application de coaching complète. La copie a été prise une
fois, le 2026-09-01, et ce dépôt vit sa vie depuis.

Trois conséquences qui gouvernent tout le reste :

**1. C'est un produit figé.** Il reçoit des corrections, pas des
fonctionnalités. Le jour où il en réclame une vraie, c'est le signe qu'elle
appartient à un produit payant, pas à celui-ci.

**2. Il ne se relie à rien, et c'est le point le plus important.** Deux autres
outils gratuits existent, un CRM et un suivi financier. Ils vivent dans leurs
propres dépôts, avec leurs propres bases, et **ils ne doivent pas pouvoir se
parler**. Ce n'est pas un manque de temps, c'est la raison d'être de ces
outils : ils sont utiles et isolés, et c'est cette couture que la version
payante supprime. Toute idée d'exporter vers un autre outil, de partager un
schéma ou de fabriquer un socle commun est à refuser.

**3. Rien de personnel n'entre ici.** Ni numéro, ni adresse, ni prix, ni nom
de client, ni clé. Le dépôt est destiné à devenir public. Une valeur
d'exemple laissée dans le code finit affichée à de vrais clients.

## La règle d'architecture

**Le partage passe par le socle (`lib/`), jamais d'un module à l'autre en
direct.** Il n'y a qu'un module ici, `modules/portail/`, mais la règle reste
écrite : c'est elle qui a permis de sortir cet outil d'une application plus
grande sans tirer tout le reste derrière lui.

Le socle porte ce qui appartient à tout le monde : le compte connecté, les
fiches, l'authentification, le design. Le module porte ce qu'il est seul à
manipuler.

## Ce qui se règle, et ce qui ne se règle pas

**Se règle, depuis l'app, sans toucher au code :** le nom du programme, les
questions d'accueil, le nom et le numéro du coach, les liens externes.

**Ce qui appartient à un client se saisit sur son écran de suivi**, pas dans
les réglages : ses objectifs, et les étapes de chacun. C'est la bascule du
2026-09-02. L'outil portait avant des « parties » communes à tous, ouvertes
une par mois selon un calendrier, remplies depuis un parcours type recopié
chez chaque nouveau client. C'était la méthode de l'éditeur imposée à tous
ceux qui installent l'outil, alors que deux clients d'un même coach n'ont pas
les mêmes objectifs, et deux coachs encore moins.

**Une suppression est refusée, et le message dit quoi faire à la place :**
retirer une question déjà répondue (on la décoche pour ne plus la poser, ce
qui garde les réponses). Un objectif se retire librement, avec ses étapes :
l'écran demande confirmation et dit combien partent avec lui, parce que c'est
le nombre qui fait hésiter.

Les réglages vivent dans la table `reglage`, en clé-valeur, et
`lib/reglages/types.ts` porte leur forme et leurs valeurs par défaut. **Une
valeur absente ou déformée retombe sur son défaut plutôt que de lever** : une
base neuve n'a aucune ligne, et une base qu'on a modifiée à la main ne doit
pas faire tomber un écran.

**Aucun secret n'entre dans les réglages.** Ils sont lus par le client autant
que par le coach. **Le nom du programme a sa propre fonction de base**,
`nom_du_programme()`, ouverte aux anonymes : l'écran de connexion l'affiche
avant toute session, et ouvrir la table entière aurait donné le numéro du
coach avec.

**Ne se règle pas :** la structure (des objectifs, leurs étapes, un profil
rempli à l'entrée), le profil comme porte d'entrée, le tutoiement,
l'habillage. Les valeurs qui sont des `enum` PostgreSQL non plus :
changer un type demande de recréer le type et de convertir les tables qui s'en
servent, ce n'est pas un écran.

**Une adresse ou un numéro laissé vide n'affiche pas son lien**, et un groupe
sans lien ne dessine ni titre ni filet. Mieux vaut rien qu'un lien mort, et
surtout rien qu'un numéro qui appartient à quelqu'un d'autre.

## Où en est le dépôt

**Le code compile, les tests unitaires passent, et le schéma existe**
(`install.sql`, à coller dans l'éditeur SQL de Supabase). La première mise en
service et l'écran de réglages sont là depuis ; `docs/plans/` est devenu un
journal, et son en-tête dit ce qui a changé depuis son exécution.

**`npm test` ne lance que les unitaires, et c'est délibéré.** Ils passent sur
un dépôt qu'on vient de récupérer, sans base ni `.env.local`. Les tests
d'intégration se connectent pour de vrai et ont leur propre commande,
`npm run test:integration` : mêlés aux autres, ils faisaient échouer cinq
fichiers sur une installation neuve, pour la seule raison qu'aucune base
n'existait encore.

**Avant de publier quoi que ce soit : `npm run verifier`.** Il refuse de
laisser partir une donnée qui appartient à l'éditeur, et il a trouvé quatre
restes le jour où il a été écrit. La relecture qui a suivi la copie n'a
protégé qu'un jour, celui où elle a été faite.

**Le schéma a été appliqué à un vrai projet Supabase et son modèle de
permissions a été éprouvé** (2026-09-01). Ce qui a été vérifié, en SQL, en
prenant l'identité d'un client puis celle d'un anonyme :

- un client ne lit pas la table `appel`, mais lit son coaching à travers la
  vue, et **seulement le coaching** : son ancien appel de prospection n'y
  apparaît pas ;
- la vue ne porte aucune colonne `notes` ;
- ni `update` ni `delete` à travers la vue ne touchent la ligne ;
- un client ne voit que sa propre fiche ;
- un anonyme ne voit rien nulle part, et la vue lui est refusée à la porte.

**Et une deuxième fois le 2026-09-02, sur une base vierge, ce qui a trouvé un
trou que la première n'avait pas vu.** `install.sql` ne posait aucun `grant`
sur les dix tables du portail : il comptait sur les privilèges que Supabase
accorde tout seul sur `public`. Deux conséquences. Chez Supabase, `anon`
gardait INSERT, UPDATE et DELETE sur ces dix tables, bloqué par les seules
politiques : la deuxième ligne de défense, celle que ce fichier prêche
partout ailleurs, n'existait pas là où il y a le plus à protéger. Et sur
toute autre base, l'app installée ne lisait plus rien du tout. Le fichier
révoque et accorde désormais explicitement, comme il le fait déjà pour
`reglage` et `coaching_membre`.

**La leçon, plus large que ce trou :** comparer la liste des objets créés ne
prouve rien sur les droits. C'est la première vérification qui l'avait fait,
et elle avait conclu « identique, objet pour objet ».

**Les tests d'intégration et les parcours, eux, n'ont jamais tourné.** Ce
n'est pas un oubli : le proxy réseau des sessions d'agent bloque
`*.supabase.co`, donc aucun test qui se connecte pour de vrai ne peut partir
d'ici. **Ils se lancent depuis un poste**, avec un `.env.local` renseigné, et
c'est la première chose à faire avant d'écrire du neuf.

**Ce que le conseiller de sécurité Supabase signale est relevé et expliqué
dans `docs/conseiller-de-securite.md`.** Quatre de ses signalements ne doivent
surtout pas être « corrigés », à commencer par la vue `coaching_membre` en
`SECURITY DEFINER`, qui est ce qui la fait fonctionner. Le lire avant d'y
toucher, et le relancer après toute migration.

Ce qui est là : l'espace client entier (tableau de bord, profil et sa porte,
objectifs et étapes, séances et comptes rendus, documents), l'écran de suivi
d'un client côté coach, la connexion et le chemin de récupération de mot de
passe.

**Une séance ne porte plus d'issue.** L'app d'origine notait chaque réunion
Honoré ou No-show, parce que le taux de présence y était une métrique
commerciale. Un coach qui suit ses clients ne compte pas leurs absences : le
tag est parti, le compte rendu s'ouvre toujours, et **une séance se retire**,
ce qui manquait. Le retrait dit ce qui part avec elle, le compte rendu étant
ce qui a de la valeur.

**Un document part au coffre depuis le navigateur, jamais par une action
serveur.** Il passait par là, et une action serveur plafonne à 1 Mo chez Next,
à 4,5 Mo chez Vercel : au-delà, la requête était coupée avant d'arriver et
l'écran affichait « An unexpected response was received from the server »,
en anglais et sans rapport avec la taille, pendant que le cadre annonçait
20 Mo. Les politiques du coffre décident déjà de qui écrit où. L'action
serveur reste pour la ligne qui décrit le fichier, quelques centaines
d'octets, et c'est elle qui tient la visibilité.

**Le coach peut ouvrir l'espace d'un client tel que ce client le voit**
(`lib/auth/apercu.ts`, troisième lecteur de la clé de service). Il n'emprunte
qu'un compte membre, jamais un admin, et l'adresse email n'est pas un
paramètre. Le jeton de retour du coach est mis de côté dans un cookie
`httpOnly` avant la bascule : après, sa session n'existe plus, et il n'y
aurait plus aucun moyen de le ramener sans lui redemander son mot de passe. Un
bandeau non refermable rappelle qu'il agit sous l'identité de son client, une
case cochée là étant cochée pour de bon.

Ce qui a été retiré à la copie : le CRM, les statistiques, les webhooks, tout
import automatique, et la bascule commerciale qui créait les clients. **Un
client s'ajoute donc à la main**, et c'est le geste que le plan doit encore
écrire.

## Deux choses à savoir sur le code

**La clé de service n'est lue qu'à un seul endroit**, `lib/supabase/service.ts`,
et deux fichiers l'utilisent. La liste se vérifie par
`grep -rn "supabase/service" lib modules app`, jamais par une liste écrite
qu'il faudrait croire.

- `lib/auth/creation.ts` crée le compte d'un client. **L'adresse email n'y est
  jamais un paramètre**, elle se lit en base à partir d'un identifiant de
  fiche : sans cette règle, une requête forgée créerait un compte sur
  n'importe quelle adresse.
- `lib/auth/installation.ts` crée le compte du coach, une seule fois, sur une
  base vierge. **C'est le seul endroit de l'app où une adresse et un mot de
  passe viennent d'un formulaire**, et c'est acceptable là et nulle part
  ailleurs : sur une base vierge, il n'y a aucun compte à usurper. La porte se
  ferme par la base et non par une lecture, la table `installation` n'acceptant
  qu'une seule ligne.

**La vue `coaching_membre` est une frontière de confidentialité.** Le compte
rendu d'une séance a quatre morceaux, et la note interne du coach n'est pas
pour le client. C'est la vue qui tient cette frontière, pas l'écran : lui
ajouter une colonne la rend lisible par le client, sans autre geste.

## Conventions

- **Français** partout : commits, commentaires, noms de branches, docs. Le
  code (variables, fonctions) reste en anglais.
- **Tutoiement** dans toute interface, des deux côtés.
- **Interdit : les tirets longs** (cadratin et demi-cadratin). Virgules,
  deux-points ou parenthèses à la place. Un test le vérifie sur tout le dépôt.
- **Commits atomiques.** Un commit = un changement cohérent.
- Toute décision d'architecture s'écrit dans `docs/decisions/`.

## Sécurité

- Les secrets vivent dans `.env.local`, jamais dans le code, jamais commités.
- **Sur le schéma `public`, révoquer avant d'accorder.** Supabase donne par
  défaut `INSERT`, `UPDATE` et `DELETE` à `anon` et `authenticated` sur toute
  table ou vue nouvelle. Un `grant select` seul ajoute un droit sans en retirer
  aucun.
- **Après toute migration, lancer le conseiller de sécurité de Supabase.**
