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
employé pour les grandes parties de l'accompagnement, ces parties elles-mêmes,
les questions du profil, les tâches modèles, le nom et le numéro du coach, les
liens externes.

**Ne se règle pas :** la structure (un programme, des parties, des tâches, un
profil rempli à l'entrée), le profil comme porte d'entrée, le tutoiement, la
charte graphique. Les valeurs qui sont des `enum` PostgreSQL non plus :
changer un type demande de recréer le type et de convertir les tables qui s'en
servent, ce n'est pas un écran.

**Une adresse ou un numéro laissé vide n'affiche pas son lien**, et un groupe
sans lien ne dessine ni titre ni filet. Mieux vaut rien qu'un lien mort, et
surtout rien qu'un numéro qui appartient à quelqu'un d'autre.

## Où en est le dépôt

**Le code compile et les tests unitaires passent. Rien ne se déploie encore.**
Il manque le schéma de la base, la première mise en service et l'écran de
réglages : ce sont les premières tâches de `docs/plans/`.

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
et un seul fichier l'utilise, `lib/auth/creation.ts`. La liste se vérifie par
`grep -rn "supabase/service" lib modules app`, jamais par une liste écrite
qu'il faudrait croire. **L'adresse email n'est jamais un paramètre de la
création d'un compte**, elle se lit en base à partir d'un identifiant de fiche.

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
