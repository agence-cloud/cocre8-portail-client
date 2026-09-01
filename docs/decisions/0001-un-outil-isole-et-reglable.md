# 0001 : un outil isolé, réglable en données

*Tranché le 2026-09-01, au moment de créer ce dépôt.*

## Le contexte

Cet outil est un extrait d'une application de coaching complète, donné
gratuitement à des coachs. Deux autres suivront, un CRM et un suivi financier,
chacun dans son dépôt.

Deux questions se posaient avant d'écrire la première ligne : jusqu'où va la
personnalisation, et à quel point les trois outils se connaissent.

## La décision

**Ils ne se connaissent pas du tout. Chacun son dépôt, chacun sa base.**

**Et ce qui varie d'un coach à l'autre vit en table, réglable depuis l'app.**

## Pourquoi l'isolement

C'est la raison d'être de ces outils. Un coach obtient trois outils utiles et
séparés, il saisit son client trois fois, et c'est cette couture qui donne
envie d'un ensemble où tout se parle.

**La friction n'est pas dans les dépôts, elle est dans les bases.** Trois
dépôts veulent dire trois projets Supabase, donc trois fiches client qui ne se
connaissent pas. Les relier demanderait de fusionner trois schémas, pas trois
dossiers.

Un socle partagé aurait produit l'inverse : trois modules parlant déjà la même
base, à un fichier d'installation près de reformer l'application complète.

**Le prix accepté : une correction du socle se fait trois fois.** Il est
tenable parce que ces outils sont figés. Ils reçoivent des corrections, pas
des fonctionnalités.

## Pourquoi les réglages en données

Sans eux, l'outil ne parlerait qu'aux coachs qui pratiquent exactement la
méthode dont il est sorti. Quatre parties nommées d'après une méthode
particulière, dix questions de profil taillées pour une niche : personne
d'autre ne s'y reconnaît.

Or presque tout ce qui varie était déjà en table (`pilier`, `offre`,
`question_profil`, `parcours_modele`, `tache_modele`). Il ne manquait qu'un
écran. **Aucun coach ne touche au code pour se l'approprier**, et nous ne
faisons aucun sur-mesure : un seul paquet, pour tout le monde.

## Ce qui reste hors de portée des réglages

**Les `enum` PostgreSQL.** Changer un type demande de le recréer et de
convertir chaque table qui s'en sert : ce n'est pas un écran, c'est une
migration à risque. Les valeurs de ces types sont donc fixes.

**La structure et le ton.** Un programme, des parties, des tâches, un profil
rempli à l'entrée, et le tutoiement partout. Rendre le tutoiement réglable
voudrait dire doubler chaque chaîne de l'interface, pour un gain marginal.

**La charte graphique.** L'outil garde celle de son éditeur, et le « Propulsé
par Cocre8 » de l'écran de connexion. Ce n'est pas un oubli : c'est une
signature qui voyage avec chaque installation.

## Les alternatives écartées

**Une version hébergée et gratuite, un compte par coach.** C'est ce qui
convertirait le mieux : rien à installer. Écarté parce que c'est un produit à
exploiter, pas un aimant à prospects. Toute l'app est bâtie pour un seul
cabinet, et la rendre multi-locataire est un projet à part entière.

**Un zip figé, envoyé par email.** Un correctif ne rattrape jamais ceux qui
ont déjà téléchargé. Le lien porte toujours la dernière version.

**Un dépôt source unique générant les trois outils.** Le meilleur pour la
maintenance, et c'était le premier choix. Écarté parce qu'il redonnait aux
trois outils un socle commun, donc la capacité de se relier.

## Ce que ça engage

**Rien de personnel n'entre dans ce dépôt.** Ni numéro, ni adresse, ni prix,
ni nom de client, ni clé. Une valeur d'exemple laissée dans le code finit
affichée à de vrais clients.

**Une valeur vide n'affiche pas son lien.** C'est la règle qui rend un outil
neuf présentable : sans elle, une installation fraîche montrerait un bouton
qui appelle le numéro de quelqu'un d'autre.
