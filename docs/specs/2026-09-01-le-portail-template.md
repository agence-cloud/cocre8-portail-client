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

*Posé par le fondateur le 2026-09-01, après le bloc C.* Quatre objectifs, et rien
au-delà : c'est ce qui garde l'outil simple et donnable.

1. **Créer un client et lui donner ses accès**, par email ou à la main.
2. **Un accueil avec des questions personnalisables**, que le coach écrit pour
   les siens.
3. **Un espace client** : son tableau de bord, son profil, les liens externes
   que le coach ajoute, et le suivi de son accompagnement.
4. **Deux vues sur la même chose** : le coach pose les tâches et les
   objectifs, le client les voit, avec ses coachings.

L'espace est **le même pour tout le monde, et modifiable pour chacun** : le
parcours type donne la structure commune, et le coach ajuste ensuite chez qui
il veut.

**Un objectif est une partie, pas une chose de plus** (tranché le
2026-09-01). Les parties sont les étapes de l'accompagnement, et le coach les
remplit de tâches propres à chaque client. C'est ce que `TachesCoach` fait
déjà : appliquer le parcours type, puis ajouter ce qui ne concerne que cette
personne. Un coach qui préfère le mot « objectif » le règle depuis son écran,
et rien d'autre ne bouge.

## Les deux côtés

Deux rôles, une base. `role_compte` vaut `admin` ou `membre`, et le rôle
décide de l'atterrissage.

**Côté client** (`/espace`) : son tableau de bord, son programme découpé en
parties avec ses tâches, son profil rempli à l'entrée, ses séances passées
avec leur compte rendu, ses documents.

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

## Le vocabulaire

L'app appelle « pilier » les grandes parties d'un accompagnement. C'est le mot
d'une méthode particulière, pas un mot du marché.

**Le mot affiché devient un réglage** (Module, Pilier, Phase, Axe, Étape). La
table reste `pilier` : renommer une table pour un libellé coûterait une
migration et une reprise de tout le code, pour rien.

## Le jeu par défaut

Quatre parties, assez larges pour n'importe quel coaching, assez concrètes
pour qu'on comprenne à quoi ça sert sans les renommer :

1. **Clarté** : où tu en es, où tu veux aller, ce qui bloque.
2. **Plan** : le chemin, découpé et daté.
3. **Action** : l'exécution semaine après semaine.
4. **Ancrage** : tenir dans la durée sans le coach.

Un parcours modèle de trois tâches par partie. Huit questions de profil
génériques : objectif principal, situation actuelle, échéance, obstacle
principal, tentatives passées, temps disponible par semaine, définition du
succès, ce qu'il attend de son coach. Trois offres sans prix (Accompagnement
3 mois, Accompagnement 6 mois, Suivi mensuel).

Aucune de ces valeurs n'est écrite dans du code : elles vivent dans
`install.sql`, et se modifient toutes depuis l'écran de réglages.

## Les réglages

Un écran, côté coach, et rien à configurer nulle part ailleurs :

- le nom du programme, affiché en tête de l'espace client ;
- le mot qui remplace « pilier » ;
- les parties : nom, description, ordre, en ajouter, en retirer ;
- les questions du profil : libellé, aide, type, ordre, active ou non ;
- les tâches modèles, par partie ;
- le nom du coach et son numéro de téléphone ;
- trois liens externes, vides par défaut.

**Une valeur vide n'affiche pas son lien.** Un groupe sans aucun lien ne
dessine ni titre ni filet, et la carte du coach ne se dessine pas tant que son
numéro n'est pas renseigné.

## Ce qui n'est pas réglable, et pourquoi

**La structure.** Un programme, des parties, des tâches, un profil rempli à
l'entrée. C'est la forme de l'outil, pas un paramètre.

**Le profil comme porte d'entrée.** Tant qu'une réponse manque, l'espace
entier renvoie vers la porte. Ça vaut pour n'importe quel coach : un
accompagnement qui démarre sans que le client ait dit où il en est démarre
mal.

**Le tutoiement.** Toute l'interface tutoie. Le rendre réglable voudrait dire
doubler chaque chaîne, pour un gain qui ne se voit qu'à la marge. Écarté
explicitement, à rouvrir seulement si un utilisateur le demande.

**Les couleurs et le logo.** L'outil garde la charte de son éditeur et le
« Propulsé par Cocre8 » de l'écran de connexion : une signature qui voyage
avec chaque installation.

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
un jeu de démonstration, le vide, renomme ses quatre parties, ajoute son
premier client et lui envoie ses accès. **En moins de trente minutes, sans
poser de question.**
