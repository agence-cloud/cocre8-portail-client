# Portail client

L'espace en ligne de tes clients : leur programme, leurs tâches, leurs
séances et leurs documents. Toi, tu vois où chacun en est.

Un outil que tu installes chez toi, sur ton propre hébergement et ta propre
base. Personne d'autre n'a accès à tes données, nous compris.

## Ce qu'il fait

**Côté client :** son tableau de bord, ses objectifs découpés en étapes à
cocher, le profil qu'il remplit en arrivant, ses séances passées avec leur
compte rendu, ses documents.

**Côté coach :** la liste de tes clients, la fiche de suivi de chacun (où tu
écris ses objectifs et leurs étapes, et où tu retrouves ses séances, les
comptes rendus et ses documents), l'ajout d'un client et l'envoi de ses accès,
et les réglages.

## L'installer

Quatre étapes, une vingtaine de minutes, aucune ligne de commande.

1. **Crée un projet Supabase**, gratuit, sur
   [supabase.com](https://supabase.com). C'est ta base : elle t'appartient,
   et personne d'autre n'y a accès.
2. **Crée ta base.** Ouvre l'éditeur SQL de ton projet, colle le contenu de
   [`install.sql`](./install.sql), exécute.
3. **Déploie l'app.**

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fagence-cloud%2Fcocre8-portail-client&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Les%20trois%20valeurs%20de%20ton%20projet%20Supabase&project-name=portail-client&repository-name=portail-client)

   Vercel te demandera trois valeurs, toutes dans ton projet Supabase, sous
   Project Settings puis API : l'URL du projet, la clé `anon`, et la clé
   `service_role`. **Cette dernière est un secret** : elle sert à créer les
   comptes de tes clients, et elle ne doit jamais sortir d'ici.

4. **Crée ton compte et regarde-le vivre.** Ouvre l'adresse que Vercel te
   donne : le premier compte créé devient le tien, et la porte se referme
   derrière toi. Charge ensuite le jeu de démonstration depuis tes réglages,
   promène-toi dedans, puis vide-le et ajoute ton premier vrai client.

## Si quelque chose ne répond pas

Ouvre `/diagnostic` sur ton installation, par exemple
`https://ton-app.vercel.app/diagnostic`. La page dit l'adresse qu'elle
interroge, si tes trois valeurs sont bien arrivées, et si ton projet Supabase
lui répond. C'est la première chose à regarder quand la connexion refuse : une
adresse ou une clé fausse produit exactement le même écran qu'un mot de passe
faux.

Trois pièges qui coûtent une soirée chacun :

- **Copie tes clés avec le bouton de copie**, jamais en sélectionnant le texte
  affiché. Supabase les montre masquées, et une clé masquée a exactement la
  longueur de la vraie : rien ne distingue les deux à l'oeil, et l'app se
  contente de refuser la connexion.

- Sur Vercel, une variable de type **Secret** n'est pas lisible pendant la
  construction. Les deux valeurs `NEXT_PUBLIC_` doivent être de type
  **Config**, sinon elles arrivent vides sans que rien ne le montre. Seule
  `SUPABASE_SERVICE_ROLE_KEY` reste un Secret.
- Une valeur corrigée ne prend effet qu'au **déploiement suivant**. Corrige,
  puis redéploie.

## Le régler

Tout se règle depuis l'app, sans toucher au code : le nom de ton programme,
les questions du profil, ton nom et ton numéro, et tes liens externes.

**Les objectifs de tes clients ne se règlent pas ici**, et c'est voulu : tu
les écris pour chacun, sur son écran de suivi, avec leurs étapes en dessous.
Deux de tes clients n'ont pas les mêmes objectifs, et l'outil n'a aucune
méthode à t'imposer.

## Donner ses accès à un client

Deux façons, au choix, depuis son écran de suivi.

**Par email :** l'app lui envoie le lien qui lui fera poser son mot de passe.
Attention, le service d'email de Supabase plafonne à quelques envois par heure
sur un projet neuf, et ses textes sont en anglais tant que tu ne les as pas
réécrits (Authentication, Emails).

**Par un lien à copier :** l'app fabrique le lien sans rien envoyer, tu le
colles où tu parles déjà à tes clients. Il vaut une heure et ouvre son espace,
donc ne le colle qu'en privé.

## Ce qu'il ne fait pas

Ce n'est ni un CRM ni un outil de facturation. Il ne suit pas tes prospects,
il ne compte pas ton chiffre d'affaires, et il ne se connecte à aucun autre
outil. Il fait une chose, l'espace de tes clients.

## La pile

Next.js, Supabase, Tailwind. Tout le code est là, tu peux le modifier.

## Licence

MIT. Fais-en ce que tu veux, y compris pour tes clients à toi.

Édité par [Cocre8](https://cocre8.fr).
