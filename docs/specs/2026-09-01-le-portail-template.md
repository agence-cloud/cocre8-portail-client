# Le portail client, en version template

*2026-09-01. Met en oeuvre la décision `0001`.*

## À qui il s'adresse

**Le coach le plus courant du marché**, et personne de plus précis. Il coache
en solo (business, vie, sport, nutrition, peu importe), il a entre cinq et
vingt clients, il vend un accompagnement de trois à six mois, il voit ses
clients toutes les une ou deux semaines, il leur donne des choses à faire
entre deux séances, et il leur partage des documents.

Ce qu'il n'a pas : un développeur, une équipe, et l'envie de configurer quoi
que ce soit pendant deux heures avant de voir un écran.

Il fait aujourd'hui tout ça dans un Notion partagé, un Drive et WhatsApp. Sa
douleur n'est pas de manquer d'outils, c'est que **ses clients ne voient
nulle part où ils en sont**.

## Ce que l'outil doit savoir faire

*Posé le 2026-09-01, après le bloc C.* Quatre objectifs, et rien
au-delà : c'est ce qui garde l'outil simple et donnable.

1. **Créer un client et lui donner ses accès**, par email ou à la main.
2. **Un accueil avec des questions personnalisables**, que le coach écrit pour
   les siens.
3. **Un espace client** : son tableau de bord, son profil, les liens externes
   que le coach ajoute, et le suivi de son accompagnement.
4. **Deux vues sur la même chose** : le coach pose les tâches et les
   objectifs, le client les voit, avec ses coachings.

L'espace est **propre à chaque client, du premier jour au dernier** : rien
n'est commun, le coach écrit les objectifs de chacun.

**Cette ligne disait l'inverse jusqu'au 2026-09-02**, et c'est le seul virage
de fond de l'outil. Il était écrit qu'un objectif était une « partie », que
les parties donnaient la structure commune à tous, et qu'un coach préférant le
mot « objectif » n'avait qu'à le régler. Trois conséquences en découlaient,
toutes mauvaises pour un template : le coach héritait de la méthode de
l'éditeur au lieu d'écrire la sienne, le premier écran d'un nouveau client
montrait les tâches de quelqu'un d'autre, et un client ne pouvait rien avoir
que son voisin n'ait pas.

## Les deux côtés

Deux rôles, une base. `role_compte` vaut `admin` ou `membre`, et le rôle
décide de l'atterrissage.

**Côté client** (`/espace`) : son tableau de bord, ses objectifs découpés en
étapes, son profil rempli à l'entrée, ses séances passées avec leur compte
rendu, ses documents.

**Côté coach** (`/pilotage`) : la liste de ses clients, la fiche de suivi
d'un client, l'ajout d'un client et l'envoi de ses accès, et les réglages.

## Le geste qui manque

Un client ne naît pas d'une conversion commerciale ici : il est **ajouté à la
main** par le coach. C'est le seul geste vraiment nouveau de cet outil, la
création d'un compte partant jusqu'ici d'une bascule dans un CRM qui n'existe
plus.

La création elle-même ne bouge pas : elle reste dans le socle
(`lib/auth/creation.ts`) avec sa règle, **l'adresse email n'est jamais un
paramètre**, elle se lit en base à partir de l'identifiant de la fiche. Le
coach crée donc la fiche, puis envoie les accès, en deux gestes.

## Le jeu par défaut

**Aucun objectif.** Un objectif appartient à un client : en poser d'avance
reviendrait à imposer la méthode de l'éditeur à tous ceux qui installent
l'outil. L'espace d'un nouveau client est donc vide d'objectifs jusqu'à ce que
son coach en écrive un, et le jeu de démonstration est là pour montrer à quoi
ça ressemble une fois rempli.

Huit questions de profil génériques : objectif principal, situation actuelle,
échéance, obstacle principal, tentatives passées, temps disponible par
semaine, définition du succès, ce qu'il attend de son coach. Trois offres sans
prix (Accompagnement 3 mois, Accompagnement 6 mois, Suivi mensuel).

Aucune de ces valeurs n'est écrite dans du code : elles vivent dans
`install.sql`, et les questions se modifient depuis l'écran de réglages.

## Les réglages

Un écran, côté coach, et rien à configurer nulle part ailleurs :

- le nom du programme, affiché en tête de l'espace client ;
- les questions du profil : libellé, aide, type, ordre, active ou non ;
- le nom du coach et son numéro de téléphone ;
- trois liens externes, vides par défaut.

Les objectifs n'y sont pas : ils appartiennent à un client, et se saisissent
sur son écran de suivi.

**Une valeur vide n'affiche pas son lien.** Un groupe sans aucun lien ne
dessine ni titre ni filet, et la carte du coach ne se dessine pas tant que son
numéro n'est pas renseigné.

## Ce qui n'est pas réglable, et pourquoi

**La structure.** Des objectifs, leurs étapes, un profil rempli à l'entrée.
C'est la forme de l'outil, pas un paramètre.

**Elle a changé le 2026-09-02, et c'est le seul virage de fond.** L'outil
portait des « parties » communes à tous les clients, ouvertes une par mois
selon un calendrier, remplies depuis un parcours type recopié chez chacun.
Trois choses en découlaient, toutes mauvaises pour un template : le coach
héritait de la méthode de l'éditeur au lieu d'écrire la sienne, le premier
écran d'un nouveau client montrait les tâches de quelqu'un d'autre, et un
client ne pouvait rien avoir que son voisin n'ait pas. Un objectif appartient
désormais à un client, il se saisit à la main, et rien ne le range dans une
grille.

**Le profil comme porte d'entrée.** Tant qu'une réponse manque, l'espace
entier renvoie vers la porte. Ça vaut pour n'importe quel coach : un
accompagnement qui démarre sans que le client ait dit où il en est démarre
mal.

**Le tutoiement.** Toute l'interface tutoie. Le rendre réglable voudrait dire
doubler chaque chaîne, pour un gain qui ne se voit qu'à la marge. Écarté
explicitement, à rouvrir seulement si un utilisateur le demande.

**Les couleurs et le logo.** Un thème sombre, des gris froids, un seul accent
bleu, et la pile de polices du système. Pas de sélecteur de couleur : un
réglage de plus à comprendre pour un coach qui veut surtout que ça marche, et
un thème réglable mal réglé est pire qu'un thème neutre.

Neutre veut dire neutre pour tout le monde, l'éditeur compris. **Cette ligne
disait exactement l'inverse jusqu'au 2026-09-02** : que l'outil gardait la
charte de son éditeur et son « Propulsé par », au motif qu'une signature qui
voyage avec chaque installation vaut de la distribution. C'était contraire à
la consigne, qui était d'aller au plus grand nombre de coachs possible sans
que rien de l'éditeur n'apparaisse, et ça se voyait au premier écran : un
prospect ouvrait l'outil et tombait sur la marque de quelqu'un d'autre.

La marque ne subsiste que dans le README et la licence, où elle dit qui donne
l'outil. `npm run verifier` refuse désormais de la laisser passer ailleurs.

## La mise en service

**L'app n'a aucune inscription**, et c'est le trou bloquant :
`lib/auth/creation.ts` exige un coach déjà connecté. Celui qui déploie ne peut
pas entrer chez lui.

Il faut donc un chemin de premier lancement : **la base est vide, le premier
compte créé devient le coach.** Une seule fois, et la porte se referme.

Ensuite, deux boutons dans les réglages : **charger un jeu de démonstration**
(un client fictif, son profil rempli, ses tâches à moitié faites, deux séances
passées avec compte rendu) et **tout vider pour commencer**.

## Comment on saura que c'est réussi

Un coach qui n'a jamais ouvert un terminal déploie l'outil, entre dedans, voit
un jeu de démonstration, le vide, écrit le premier objectif d'un client et
lui envoie ses accès. **En moins de trente minutes, sans
poser de question.**
