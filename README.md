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
écris ses objectifs et leurs étapes, où tu poses ses séances et leur compte
rendu, et où tu déposes ses documents), l'ajout d'un client et l'envoi de ses
accès, et les réglages.

## Le récupérer

Deux façons, et la première suffit à presque tout le monde.

**Le plus simple : le bouton vert « Use this template »**, en haut de cette
page. GitHub te crée ta propre copie, chez toi, que tu peux modifier. Il te
faut un compte GitHub, gratuit.

**Sans compte GitHub :** clique sur « Code » puis « Download ZIP ». Tu as le
dossier sur ton ordinateur. Tu pourras le remettre sur GitHub plus tard si tu
veux le déployer en ligne.

## L'installer

Quatre étapes, une vingtaine de minutes, aucune ligne de commande.

### 1. Ta base de données

Va sur [supabase.com](https://supabase.com), crée un compte gratuit, puis
« New project ». Donne-lui un nom, choisis une région proche de toi, et note
le mot de passe qu'il te demande quelque part. Attends deux minutes qu'il se
prépare.

C'est ta base : elle t'appartient, et personne d'autre n'y a accès.

### 2. Créer les tables

Ouvre le fichier [`install.sql`](./install.sql) sur cette page, et clique sur
l'icône de copie en haut à droite du fichier.

Retourne sur Supabase, clique sur **SQL Editor** dans la colonne de gauche,
colle, et clique sur **Run**. C'est fait. Tu n'as rien à comprendre dans ce
fichier.

### 3. Mettre l'app en ligne

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fagence-cloud%2Fcocre8-portail-client&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Les%20trois%20valeurs%20de%20ton%20projet%20Supabase&project-name=portail-client&repository-name=portail-client)

Ce bouton t'emmène chez Vercel, qui héberge l'app gratuitement. Il te demande
trois valeurs avant de démarrer. Elles sont toutes dans ton projet Supabase :

| Ce que Vercel demande | Où le trouver dans Supabase |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings, **Data API**, ligne « Project URL » |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings, **API Keys**, la clé `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | Au même endroit, la clé `service_role` |

**Copie chaque clé avec le petit bouton de copie**, jamais en sélectionnant le
texte à l'écran. Supabase les affiche masquées avec des points, et une clé
masquée a exactement la même longueur que la vraie : rien ne permet de les
distinguer à l'oeil.

La troisième, `service_role`, est un secret. Elle sert à créer les comptes de
tes clients, et elle ne doit jamais sortir de chez toi.

Si tu te trompes, l'installation s'arrête et te dit en français laquelle des
trois cloche et pourquoi. Corrige la valeur chez Vercel, puis clique sur
**Redeploy** : une valeur corrigée ne prend effet qu'au déploiement suivant.

### 4. Ton compte

Ouvre l'adresse que Vercel te donne. Un écran te demande ton nom, ton email et
un mot de passe.

Ce premier compte devient le tien, et **la porte se referme derrière toi pour
toujours** : il n'y a pas de formulaire d'inscription sur ton portail,
personne d'autre ne peut s'y créer un compte.

Charge ensuite le jeu de démonstration depuis tes réglages : une cliente
inventée, ses objectifs, ses séances. Promène-toi dedans, puis vide-le et
ajoute ton premier vrai client.

## Le faire tourner sur ton ordinateur

Facultatif. L'app marche très bien sans que tu ouvres jamais un terminal. Ceci
ne sert qu'à modifier le code.

Il te faut [Node.js](https://nodejs.org), puis dans le dossier :

```
npm install
cp .env.example .env.local     # puis remplis les trois valeurs
npm run dev
```

L'app répond sur `http://localhost:3000`, contre la même base que ta version
en ligne.

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

## Voir ce que ton client voit

« Voir son espace », sur son écran de suivi, ouvre son espace réel, pas une
imitation. Un bandeau reste en haut tant que tu y es, et te ramène à ton
pilotage d'un clic.

Tu y agis sous son identité : une case cochée là est cochée chez lui. C'est le
prix de voir le vrai écran, et le bandeau est là pour que tu ne l'oublies pas.

## Ce qu'il ne fait pas

Ce n'est ni un CRM ni un outil de facturation. Il ne suit pas tes prospects,
il ne compte pas ton chiffre d'affaires, et il ne se connecte à aucun autre
outil. Il fait une chose, l'espace de tes clients.

## La pile

Next.js, Supabase, Tailwind. Tout le code est là, tu peux le modifier.

## Licence

MIT. Fais-en ce que tu veux, y compris pour tes clients à toi.

Édité par [Cocre8](https://cocre8.fr).
