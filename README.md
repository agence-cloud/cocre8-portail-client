# Portail client

L'espace en ligne de tes clients : leur programme, leurs tâches, leurs
séances et leurs documents. Toi, tu vois où chacun en est.

Un outil que tu installes chez toi, sur ton propre hébergement et ta propre
base. Personne d'autre n'a accès à tes données, nous compris.

## Ce qu'il fait

**Côté client :** son tableau de bord, son programme découpé en parties avec
ses tâches à cocher, le profil qu'il remplit en arrivant, ses séances passées
avec leur compte rendu, ses documents.

**Côté coach :** la liste de tes clients, la fiche de suivi de chacun (ses
tâches, ses séances, les comptes rendus, ses documents), l'ajout d'un client
et l'envoi de ses accès, et les réglages.

## L'installer

Quatre étapes, une vingtaine de minutes, aucune ligne de commande.

1. **Déploie l'app.** Le bouton de déploiement crée le projet et pose les
   variables tout seul.
2. **Crée ta base.** Colle `install.sql` dans l'éditeur SQL de ton projet
   Supabase et exécute-le.
3. **Crée ton compte.** Ouvre l'app : le premier compte créé devient le tien,
   et la porte se referme derrière toi.
4. **Regarde-le vivre.** Charge le jeu de démonstration depuis les réglages,
   promène-toi dedans, puis vide-le et ajoute ton premier vrai client.

> **En chantier.** Les étapes 1 à 3 sont prêtes. L'étape 4 ne l'est pas : le
> jeu de démonstration et l'écran de réglages sont les prochaines tâches de
> `docs/plans/`. En attendant, tu peux déjà créer ton compte, ajouter un
> client à la main dans Supabase et regarder son espace.

## Le régler

Tout se règle depuis l'app, sans toucher au code : le nom de ton programme,
le mot que tu emploies pour les grandes parties de ton accompagnement
(module, pilier, phase, axe), ces parties elles-mêmes, les questions du
profil, les tâches que chaque client reçoit, ton nom et ton numéro, et tes
liens externes.

## Ce qu'il ne fait pas

Ce n'est ni un CRM ni un outil de facturation. Il ne suit pas tes prospects,
il ne compte pas ton chiffre d'affaires, et il ne se connecte à aucun autre
outil. Il fait une chose, l'espace de tes clients.

## La pile

Next.js, Supabase, Tailwind. Tout le code est là, tu peux le modifier.

## Licence

MIT. Fais-en ce que tu veux, y compris pour tes clients à toi.

Édité par [Cocre8](https://cocre8.fr).
