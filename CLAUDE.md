# CLAUDE.md : Portail client

## Ce que c'est

Un outil gratuit, édité par Cocre8, donné à des coachs. Chacun l'installe
chez lui, sur son propre hébergement et sa propre base : **il n'y a pas de
version hébergée, pas de multi-locataire, et personne d'autre ne voit ses
données.**

Il a deux côtés : le client, qui vit son accompagnement, et le coach, qui
suit ses clients.

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

**Se règle, depuis l'app, sans toucher au code :** le nom du programme, le mot
employé pour les grandes parties de l'accompagnement, le nom et le numéro du
coach, les liens externes. Viendront s'y ajouter les parties elles-mêmes, les
questions du profil et les tâches modèles.

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

**Ne se règle pas :** la structure (un programme, des parties, des tâches, un
profil rempli à l'entrée), le profil comme porte d'entrée, le tutoiement, la
charte graphique. Les valeurs qui sont des `enum` PostgreSQL non plus :
changer un type demande de recréer le type et de convertir les tables qui s'en
servent, ce n'est pas un écran.

**Une adresse ou un numéro laissé vide n'affiche pas son lien**, et un groupe
sans lien ne dessine ni titre ni filet. Mieux vaut rien qu'un lien mort, et
surtout rien qu'un numéro qui appartient à quelqu'un d'autre.

## Où en est le dépôt

**Le code compile, les tests unitaires passent, et le schéma existe**
(`install.sql`, à coller dans l'éditeur SQL de Supabase). Il manque la
première mise en service et l'écran de réglages : ce sont les prochaines
tâches de `docs/plans/`.

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
parties et tâches, séances et comptes rendus, documents), l'écran de suivi
d'un client côté coach, la connexion et le chemin de récupération de mot de
passe.

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
