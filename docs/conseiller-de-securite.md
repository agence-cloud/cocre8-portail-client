# Ce que le conseiller de sécurité Supabase signale, et pourquoi ça reste

*Relevé le 2026-09-01, après la première mise en service.*

**À lancer après toute migration.** C'est lui qui a trouvé le seul vrai défaut
du schéma à ce jour, une surface anonyme laissée ouverte.

## Ce qu'il a trouvé, et qui a été corrigé

**Les quatre fonctions de permission étaient exécutables par `anon`.**
`install.sql` révoquait à `PUBLIC` seulement, or Supabase accorde aussi le
droit à `anon` en direct sur toute fonction nouvelle du schéma public, et un
`revoke` à `PUBLIC` ne retire pas un `grant` direct.

Trois de ces fonctions ne disent rien d'utile à un anonyme. La quatrième
répondait sur la personne qu'on lui nommait, et elle a disparu depuis avec les
parties communes. Corrigé en révoquant aux deux, et vérifié avec
`has_function_privilege` avant et après.

**La leçon, qui vaut pour toute fonction ajoutée ensuite : révoquer à `public`
ET à `anon`.** Le signalement ne suffit pas à lui seul, il faut le vérifier :
un lint peut être conservateur, et ici il avait raison.

## Ce qui reste, et qui ne doit pas être corrigé

**ERREUR : `coaching_membre` est une vue `SECURITY DEFINER`.**
C'est exactement ce qui la fait fonctionner. Elle lit `appel` avec les droits
de son propriétaire, là où le client n'a aucun droit sur cette table, et elle
filtre elle-même sur `ma_personne()`. La passer en `SECURITY INVOKER` ne
rendrait plus rien au client : l'écran de ses coachings deviendrait vide.

C'est aussi elle qui tient la note interne du coach hors de sa portée, en ne
la sélectionnant pas. **Lui ajouter une colonne la rend lisible par le client,
sans autre geste.**

**INFO : `installation` a la sécurité par ligne activée sans aucune
politique.** C'est le but. Personne ne lit ni n'écrit cette table depuis une
session : ni le coach, ni son client, ni un anonyme. Seules la clé de service,
au moment de la mise en service, et la fonction `installation_faite()` y
touchent. Une politique, quelle qu'elle soit, ouvrirait une porte que rien ne
demande.

**AVERTISSEMENT : `installation_faite()` et `nom_du_programme()` sont
exécutables par `anon`.** Nécessaire dans les deux cas, et c'est le même
raisonnement : ces deux réponses sont attendues par quelqu'un qui n'a pas
encore de session. Celui qui installe l'outil doit pouvoir demander si
l'installation reste à faire ; l'écran de connexion doit pouvoir afficher le
nom du programme.

Chacune ne rend qu'une valeur sur l'instance, jamais rien sur quelqu'un.
**C'est précisément pour ça que le nom du programme a sa propre fonction** :
ouvrir toute la table `reglage` aux anonymes aurait aussi donné le nom et le
numéro du coach, qui ne regardent que ses clients connectés.

**AVERTISSEMENT : les quatre fonctions de permission sont exécutables par
`authenticated`.** Nécessaire aussi, et c'est le piège à ne pas corriger : les
politiques appellent ces fonctions **au nom de l'appelant**. Leur retirer ce
droit ferait tomber toutes les permissions par ligne d'un coup, et l'app
deviendrait vide pour tout le monde.

**AVERTISSEMENT : la protection contre les mots de passe fuités est
désactivée.** Elle est réservée au plan Pro de Supabase. Elle restera
signalée tant que le projet est en Free, et ce n'est pas corrigeable par le
code.

## Ce que celui qui installe l'outil devrait durcir

Dans Supabase, Authentication, Sign In / Providers, Email : **longueur
minimale du mot de passe à 8** et des exigences de caractères. Le formulaire
de mise en service en exige déjà 8 de son côté, mais un réglage de la base
vaut mieux qu'une garde d'écran, qui ne protège que le chemin qu'elle garde.
