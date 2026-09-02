-- =====================================================================
--  Portail client : le schéma complet, en une fois.
--
--  À coller dans l'éditeur SQL de ton projet Supabase, puis exécuter.
--  Une seule fois, sur une base neuve.
--
--  Il crée les tables, les permissions par ligne, le coffre à documents,
--  et un jeu de départ que tu pourras renommer entièrement depuis l'app.
-- =====================================================================


-- ---------------------------------------------------------------------
--  1. Les types
-- ---------------------------------------------------------------------

create type role_compte as enum ('admin', 'membre');
create type type_offre as enum ('ponctuel', 'mensuel');
create type statut_accompagnement as enum ('actif', 'termine', 'suspendu');

-- La portée dit à qui s'adresse la séance, la nature dit ce qu'on y fait.
create type portee_reunion as enum ('collectif', 'individuel');
create type nature_appel as enum ('prospection', 'coaching');
create type issue_appel as enum ('a_venir', 'honore', 'no_show');


-- ---------------------------------------------------------------------
--  2. Les tables du socle
-- ---------------------------------------------------------------------

-- La fiche d'un client. Une seule ligne par personne, pour toute la durée
-- de la relation : tout ce qui s'y attache reste au même endroit.
create table personne (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text,
  email text,
  telephone text,
  entreprise text,
  -- Fiche du jeu de démonstration. C'est ce drapeau que « tout vider » suit,
  -- et lui qui empêche un client inventé de compter comme un vrai.
  demonstration boolean not null default false,
  notes text,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

-- Unicité insensible à la casse, et non `email text unique` : sans elle,
-- Jean@exemple.fr et jean@exemple.fr coexisteraient comme deux clients.
-- Les fiches sans email restent autorisées en plusieurs exemplaires.
create unique index personne_email_idx on personne (lower(email));

-- Le compte de connexion. Un client pointe vers sa fiche, le coach non.
create table compte (
  id uuid primary key references auth.users (id) on delete cascade,
  role role_compte not null,
  personne_id uuid references personne (id) on delete set null,
  nom text not null,
  actif boolean not null default true,
  cree_le timestamptz not null default now(),
  constraint membre_a_une_personne
    check (role = 'admin' or personne_id is not null)
);

-- Ce que tu vends. Le prix par défaut vit ici, le prix réellement pratiqué
-- vit sur l'accompagnement : deux clients n'achètent pas toujours au même
-- montant, et celui qui a signé à un prix l'a signé à ce prix pour toujours.
create table offre (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prix_defaut numeric(10, 2) not null,
  type type_offre not null,
  duree_mois smallint,
  active boolean not null default true,
  cree_le timestamptz not null default now()
);

-- Un client peut en cumuler plusieurs (le programme, puis un suivi).
create table accompagnement (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid not null references personne (id) on delete cascade,
  offre_id uuid not null references offre (id),
  prix_negocie numeric(10, 2) not null,
  date_debut date not null,
  date_fin date,
  statut statut_accompagnement not null default 'actif',
  -- Recalculée par un déclencheur à chaque tâche touchée, jamais saisie.
  progression smallint not null default 0 check (progression between 0 and 100),
  cree_le timestamptz not null default now()
);

create index accompagnement_personne_idx on accompagnement (personne_id);

-- Un objectif d'un client, posé par son coach, et ses sous-tâches en dessous.
--
-- **Il appartient au client, pas à l'outil.** Le schéma portait auparavant des
-- « parties » communes à tout le monde, ouvertes une par mois selon un
-- calendrier, avec un parcours type recopié chez chacun. C'était la méthode
-- d'un coach imposée à tous ceux qui installent l'outil. Deux clients d'un
-- même coach n'ont pas les mêmes objectifs, et un coach n'a pas les mêmes que
-- son voisin : l'objectif se saisit donc pour un client, à la main, et rien
-- ne le range dans une grille.
--
-- Pas d'état « atteint » : un objectif est atteint quand ses tâches le sont,
-- et une colonne de plus se contredirait avec elles au premier oubli.
create table objectif (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid not null references personne (id) on delete cascade,
  titre text not null,
  description text,
  -- Facultative : tous les objectifs ne se datent pas, et une date obligatoire
  -- se remplirait au hasard.
  echeance date,
  ordre smallint not null default 0,
  cree_par uuid references compte (id) on delete set null,
  cree_le timestamptz not null default now()
);

create index objectif_personne_idx on objectif (personne_id, ordre);

-- Le questionnaire que le client remplit en arrivant. Configurable sans
-- toucher au code.
create table question_profil (
  id uuid primary key default gen_random_uuid(),
  libelle text not null,
  aide text,
  type text not null check (type in ('texte_court', 'texte_long', 'nombre', 'choix')),
  options jsonb,
  ordre smallint not null,
  active boolean not null default true
);

-- Structuré et non un bloc de texte : chaque réponse reste rattachée à sa
-- question, donc renommer une question ne perd pas ce qui y a été répondu.
create table reponse_profil (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid not null references personne (id) on delete cascade,
  question_id uuid not null references question_profil (id) on delete cascade,
  reponse text,
  modifie_le timestamptz not null default now(),
  unique (personne_id, question_id)
);

create table document (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid not null references personne (id) on delete cascade,
  nom text not null,
  chemin_storage text not null,
  taille_octets bigint,
  type_mime text,
  depose_par uuid references compte (id) on delete set null,
  visible_membre boolean not null default true,
  cree_le timestamptz not null default now()
);

-- Une seule table dit « une réunion ».
--
-- Deux tables séparées, l'une pour la séance et l'autre pour ce qu'il en
-- reste, font qu'une séance posée à l'avance n'a aucun moyen de recevoir son
-- compte rendu. Le compte rendu a quatre morceaux et ils n'ont pas le même
-- destinataire : `lien_enregistrement`, `transcription` et `resume` vont chez
-- le client, `notes` reste au coach.
create table appel (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid references personne (id) on delete cascade,
  titre text,
  nature nature_appel not null default 'coaching',
  portee portee_reunion not null default 'individuel',
  prevu_le timestamptz not null,
  duree_minutes smallint,
  lien_visio text,
  issue issue_appel not null default 'a_venir',
  lien_enregistrement text,
  transcription text,
  resume text,
  -- La note interne du coach. Elle ne franchit pas la vue coaching_membre.
  notes text,
  -- Renseignés par un import automatique, nuls pour une saisie à la main.
  source_externe text,
  reference_externe text,
  cree_par uuid references compte (id) on delete set null,
  cree_le timestamptz not null default now()
);

create index appel_personne_idx on appel (personne_id, prevu_le);

-- L'unicité qui rend un import rejouable : deux livraisons du même événement
-- ne créent qu'une réunion.
create unique index appel_reference_externe_idx
  on appel (source_externe, reference_externe)
  where reference_externe is not null;


-- ---------------------------------------------------------------------
--  3. Les sous-tâches d'un objectif
-- ---------------------------------------------------------------------

-- Une sous-tâche, sous son objectif. Le coach les écrit, le client les coche.
--
-- **Elle ne porte pas `personne_id`**, alors que la version précédente le
-- faisait. Le propriétaire se lit sur l'objectif, donc une tâche ne peut pas
-- se retrouver rattachée à un client et rangée sous l'objectif d'un autre :
-- le cas n'existe plus, au lieu d'être interdit par une contrainte de plus.
-- Les politiques de permission passent par une jointure, ce qui est le prix
-- honnête de cette garantie.
create table tache (
  id uuid primary key default gen_random_uuid(),
  objectif_id uuid not null references objectif (id) on delete cascade,
  titre text not null,
  description text,
  ordre smallint not null default 0,
  faite boolean not null default false,
  faite_le timestamptz,
  cree_par uuid references compte (id) on delete set null,
  cree_le timestamptz not null default now(),
  -- Une tâche faite porte forcément une date, et l'inverse.
  constraint faite_le_coherent
    check ((faite and faite_le is not null) or (not faite and faite_le is null))
);

create index tache_objectif_idx on tache (objectif_id, ordre);

-- Les réglages de l'outil : ce que chaque coach change pour se
-- l'approprier, sans toucher au code.
--
-- Une table clé-valeur plutôt qu'une table à une ligne et vingt colonnes :
-- chaque réglage nouveau serait sinon une migration, sur un outil qui n'en
-- reçoit plus une fois donné.
--
-- **Aucun secret n'entre ici.** La table est lue par le client autant que par
-- le coach : tout ce qu'on y pose est public pour lui. Une clé d'API n'y a
-- rien à faire.
create table reglage (
  cle text primary key,
  valeur jsonb not null,
  modifie_le timestamptz not null default now()
);

alter table reglage enable row level security;

-- La marque de la première mise en service, et le verrou qui l'accompagne.
--
-- Une seule ligne possible, à jamais : la clé primaire vaut `true` et la
-- contrainte interdit `false`. Le second appel se heurte donc à un doublon
-- plutôt qu'à une lecture qui a vieilli, ce qui compte : « aucun compte
-- n'existe » lu puis écrit laisserait passer deux requêtes simultanées, et
-- l'app aurait deux coachs au lieu d'un.
--
-- Personne ne la lit ni ne l'écrit depuis une session : aucune politique, et
-- tout droit révoqué. Seules la clé de service et la fonction ci-dessous y
-- touchent.
create table installation (
  id boolean primary key default true check (id),
  faite_le timestamptz not null default now()
);

alter table installation enable row level security;
revoke all on installation from anon, authenticated;


-- ---------------------------------------------------------------------
--  4. Les fonctions qui décident des permissions
--
--  `security definer` : sans lui, lire la table compte depuis une politique
--  qui protège la table compte déclencherait une récursion infinie.
--  `set search_path = public` : sans lui, quelqu'un qui parviendrait à créer
--  un objet dans un schéma consulté avant public détournerait ce qu'elles
--  appellent.
-- ---------------------------------------------------------------------

create or replace function est_admin() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from compte where id = auth.uid() and role = 'admin' and actif
  );
$$;

create or replace function ma_personne() returns uuid
language sql stable security definer set search_path = public
as $$
  select personne_id from compte where id = auth.uid() and actif;
$$;

-- « Connecté » veut dire « a une ligne dans compte », et non « a réussi à
-- créer un utilisateur ». L'inscription publique de Supabase permet de créer
-- un `auth.users` avec la seule clé publique : sans cette distinction, ce
-- compte fantôme lirait les référentiels.
create or replace function a_un_compte() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from compte where id = auth.uid() and actif);
$$;

-- Le nom du programme, et lui seul, avant toute session.
--
-- L'écran de connexion l'affiche, et celui qui s'y présente n'a pas encore de
-- session : il lui faut donc un chemin à lui. Ouvrir toute la table `reglage`
-- à `anon` aurait été plus simple et bien pire, elle porte aussi le nom et le
-- numéro du coach, qui ne regardent que ses clients connectés.
--
-- Rend la valeur par défaut quand rien n'est réglé, plutôt que null : une
-- base neuve affiche un nom, pas un trou.
create or replace function nom_du_programme() returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select valeur #>> '{}' from reglage where cle = 'nom_programme'),
    'Espace Client'
  );
$$;

-- La seule chose que l'app dise avant d'être installée : l'est-elle ?
--
-- Elle doit répondre à un visiteur non connecté, puisque c'est lui qui
-- installe. Elle ne rend qu'un booléen sur l'instance, jamais rien sur
-- quelqu'un : c'est le minimum nécessaire, et c'est le maximum acceptable.
create or replace function installation_faite() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from installation);
$$;

-- ---------------------------------------------------------------------
--  5. Les déclencheurs
-- ---------------------------------------------------------------------

create or replace function touche_modifie_le()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.modifie_le := now();
  return new;
end;
$$;

create trigger personne_touche_modifie_le
before update on personne for each row execute function touche_modifie_le();

create trigger reponse_profil_touche_modifie_le
before update on reponse_profil for each row execute function touche_modifie_le();

-- Un formulaire HTML poste la chaîne vide, pas NULL. Sans cette
-- normalisation, la deuxième fiche sans email tomberait sur une violation
-- d'unicité incompréhensible.
create or replace function normalise_email_personne()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.email := nullif(trim(new.email), '');
  return new;
end;
$$;

create trigger personne_normalise_email
before insert or update on personne for each row
execute function normalise_email_personne();

-- Un client coche ses tâches, il ne les réécrit pas.
--
-- La politique d'update autorise ses propres lignes, mais PostgreSQL ne sait
-- pas restreindre une politique à certaines colonnes : sans ce déclencheur,
-- un client pourrait changer le titre, la section ou l'ordre de sa tâche. Or
-- le parcours est posé par le coach, c'est ce qui fait la valeur du suivi.
create or replace function tache_membre_coche_seulement()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if est_admin() then
    return new;
  end if;

  if new.titre is distinct from old.titre
    or new.description is distinct from old.description
    or new.objectif_id is distinct from old.objectif_id
    or new.ordre is distinct from old.ordre
    or new.cree_par is distinct from old.cree_par
  then
    raise exception 'Un client peut cocher ses tâches, pas les modifier.';
  end if;

  return new;
end;
$$;

create trigger tache_coche_seulement
before update on tache for each row
execute function tache_membre_coche_seulement();

-- La progression d'un accompagnement, recalculée à chaque tâche touchée.
--
-- Toutes les tâches de tous ses objectifs, sans exception. Le calcul écartait
-- auparavant les parties non encore ouvertes, ce qui n'a plus lieu d'être :
-- un objectif est visible le jour où le coach le pose.
--
-- `security definer` : un client qui coche une tâche n'a le droit que de lire
-- son accompagnement. Sans lui, sa progression ne s'écrirait jamais.
create or replace function rafraichir_progression()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_objectif uuid := coalesce(new.objectif_id, old.objectif_id);
  v_personne uuid;
  v_progression smallint;
begin
  select personne_id into v_personne from objectif where id = v_objectif;
  if v_personne is null then
    return null;
  end if;

  select coalesce(
    round(100.0 * count(*) filter (where t.faite) / nullif(count(*), 0)), 0
  )
  into v_progression
  from tache t
  join objectif o on o.id = t.objectif_id
  where o.personne_id = v_personne;

  update accompagnement
  set progression = v_progression
  where personne_id = v_personne and statut = 'actif';

  return null;
end;
$$;

create trigger tache_rafraichit_la_progression
after insert or update or delete on tache for each row
execute function rafraichir_progression();

-- Un objectif supprimé emporte ses tâches en cascade, sans que le déclencheur
-- ci-dessus ne voie passer les lignes une à une : la progression garderait
-- l'ancien dénominateur.
create or replace function rafraichir_progression_objectif()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_progression smallint;
begin
  select coalesce(
    round(100.0 * count(*) filter (where t.faite) / nullif(count(*), 0)), 0
  )
  into v_progression
  from tache t
  join objectif o on o.id = t.objectif_id
  where o.personne_id = coalesce(new.personne_id, old.personne_id);

  update accompagnement
  set progression = v_progression
  where personne_id = coalesce(new.personne_id, old.personne_id) and statut = 'actif';

  return null;
end;
$$;

create trigger objectif_rafraichit_la_progression
after insert or delete on objectif for each row
execute function rafraichir_progression_objectif();


-- ---------------------------------------------------------------------
--  7. Les permissions par ligne
--
--  Chaque table est verrouillée, puis ouverte explicitement. Toutes les
--  politiques portent `to authenticated` : sans cette clause elles
--  s'appliqueraient au rôle `public`, anonyme compris.
-- ---------------------------------------------------------------------

alter table personne enable row level security;
alter table compte enable row level security;
alter table offre enable row level security;
alter table accompagnement enable row level security;
alter table objectif enable row level security;
alter table question_profil enable row level security;
alter table reponse_profil enable row level security;
alter table document enable row level security;
alter table appel enable row level security;
alter table tache enable row level security;

-- Le coach fait tout, partout.
create policy admin_tout on personne for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on compte for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on offre for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on accompagnement for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on objectif for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on question_profil for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on reponse_profil for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on document for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on appel for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on tache for all to authenticated using (est_admin()) with check (est_admin());

-- Un client lit son compte, sa fiche et son accompagnement, rien d'autre.
create policy membre_lit_son_compte on compte
  for select to authenticated using (id = auth.uid());

create policy membre_lit_sa_fiche on personne
  for select to authenticated using (id = ma_personne());

create policy membre_lit_son_accompagnement on accompagnement
  for select to authenticated using (personne_id = ma_personne());

-- Le questionnaire : sans lui, la porte d'entrée du profil n'a rien à
-- demander.
create policy tous_lisent_les_questions on question_profil
  for select to authenticated using (a_un_compte() and active);

create policy membre_gere_ses_reponses on reponse_profil
  for all to authenticated using (personne_id = ma_personne())
  with check (personne_id = ma_personne());

-- Un client lit ses objectifs et coche leurs tâches. Il ne peut ni en créer
-- ni en supprimer : c'est son coach qui les pose.
--
-- La jointure remplace la colonne `personne_id` que `tache` portait : le
-- propriétaire d'une tâche se lit sur son objectif, et nulle part ailleurs.
create policy membre_lit_ses_objectifs on objectif
  for select to authenticated using (personne_id = ma_personne());

create policy membre_lit_ses_taches on tache
  for select to authenticated
  using (exists (
    select 1 from objectif o
    where o.id = tache.objectif_id and o.personne_id = ma_personne()
  ));

create policy membre_coche_ses_taches on tache
  for update to authenticated
  using (exists (
    select 1 from objectif o
    where o.id = tache.objectif_id and o.personne_id = ma_personne()
  ))
  with check (exists (
    select 1 from objectif o
    where o.id = tache.objectif_id and o.personne_id = ma_personne()
  ));

-- Les réglages : tout compte connecté les lit, le coach seul les écrit.
--
-- Le `grant` d'écriture est nécessaire pour que la politique puisse même
-- s'évaluer : sans droit sur la table, PostgreSQL refuse avant d'en arriver
-- là. C'est la politique qui filtre, pas le `grant`.
revoke all on reglage from anon, authenticated;
grant select, insert, update, delete on reglage to authenticated;

create policy tous_lisent_les_reglages on reglage
  for select to authenticated using (a_un_compte());

create policy admin_ecrit_les_reglages on reglage
  for all to authenticated using (est_admin()) with check (est_admin());

create policy membre_lit_ses_documents on document
  for select to authenticated using (personne_id = ma_personne() and visible_membre);

-- La vérification porte aussi sur le chemin : sans elle, un client pourrait
-- écrire une ligne qui pointe sur le fichier d'un autre, avec son propre
-- identifiant et `visible_membre` à vrai, et ouvrir ainsi l'accès au coffre.
create policy membre_depose_un_document on document
  for insert to authenticated
  with check (
    personne_id = ma_personne()
    and chemin_storage like ma_personne()::text || '/%'
  );

-- Aucune politique de lecture sur `appel` : le client passe par la vue
-- ci-dessous, qui ne lui montre pas la note interne du coach.


-- ---------------------------------------------------------------------
--  8. La vue qui tient la frontière
--
--  Les permissions de PostgreSQL se posent par ligne, jamais par colonne :
--  donner accès à la ligne donnerait accès à `notes`. C'est cette vue qui
--  tient la note interne hors de portée, en ne la sélectionnant pas.
--
--  Restreindre les colonnes côté application ne la remplacerait pas : le
--  client détient la clé publique et peut interroger la base directement.
--
--  LUI AJOUTER UNE COLONNE LA REND LISIBLE PAR LE CLIENT, SANS AUTRE GESTE.
-- ---------------------------------------------------------------------

create view coaching_membre as
  select
    id, personne_id, titre, portee, prevu_le, duree_minutes, lien_visio,
    issue, lien_enregistrement, transcription, resume
  from appel
  where nature = 'coaching'
    and personne_id = ma_personne();

-- Révoquer avant d'accorder, et ce n'est pas de la précaution : Supabase pose
-- des privilèges par défaut sur le schéma `public`, et toute vue nouvelle y
-- reçoit INSERT, UPDATE et DELETE pour `anon` et `authenticated`. Une vue
-- simple sur une seule table étant modifiable, un `grant select` seul
-- laisserait un client écrire dans `appel` à travers elle, avec les droits du
-- propriétaire, sans qu'aucune politique ne s'applique.
revoke all on coaching_membre from anon;
revoke all on coaching_membre from authenticated;
grant select on coaching_membre to authenticated;


-- ---------------------------------------------------------------------
--  9. Le coffre à documents
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy admin_gere_le_coffre on storage.objects for all to authenticated
  using (bucket_id = 'documents' and est_admin())
  with check (bucket_id = 'documents' and est_admin());

-- Le client dépose dans son propre dossier, et nulle part ailleurs. La
-- vérification porte sur le dossier et non sur la table `document` : à
-- l'insertion du fichier, la ligne correspondante n'existe pas encore.
create policy membre_depose_dans_son_dossier on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = ma_personne()::text
  );

-- Deux verrous sur la même règle par deux chemins : le dossier, et la
-- jointure vers une ligne qui lui appartient et qui est marquée visible. Si
-- l'un régresse un jour, l'autre continue seul d'empêcher un client de lire
-- hors de son dossier.
create policy membre_lit_ses_fichiers on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = ma_personne()::text
    and exists (
      select 1 from document d
      where d.chemin_storage = storage.objects.name
        and d.personne_id = ma_personne()
        and d.visible_membre
    )
  );


-- ---------------------------------------------------------------------
--  10. La surface exposée en RPC
--
--  PostgREST expose toute fonction du schéma public. Le droit d'exécuter
--  arrive par deux chemins à la fois, et il faut couper les deux : `anon`
--  hérite de `PUBLIC`, et Supabase lui accorde en plus le droit en direct
--  sur toute fonction nouvelle du schéma. Révoquer à `PUBLIC` seul laisse
--  donc la porte ouverte, et révoquer à `anon` seul aussi.
--
--  Mesuré, pas supposé : avec un `revoke from public` seul, le conseiller de
--  sécurité a signalé les quatre fonctions comme exécutables par `anon`, et
--  `has_function_privilege('anon', ...)` l'a confirmé. Trois d'entre elles
--  ne disaient rien d'utile à un anonyme, la quatrième répondait sur la
--  personne qu'on lui nommait.
--
--  Puis on rend à `authenticated` ce dont les politiques ont besoin : elles
--  appellent ces fonctions au nom de l'appelant. Sans cette seconde moitié,
--  toutes les permissions par ligne tomberaient d'un coup.
-- ---------------------------------------------------------------------

revoke execute on function public.ma_personne() from public, anon;
revoke execute on function public.est_admin() from public, anon;
revoke execute on function public.a_un_compte() from public, anon;

grant execute on function public.ma_personne() to authenticated;
grant execute on function public.est_admin() to authenticated;
grant execute on function public.a_un_compte() to authenticated;

-- Les deux gestes de mise en service sont appelés avec la session du coach.
-- Celle-ci répond à un anonyme, et c'est voulu : il n'y a personne d'autre
-- pour installer l'outil.
revoke execute on function public.installation_faite() from public;
grant execute on function public.installation_faite() to anon, authenticated;

-- Celle-ci aussi répond à un anonyme : l'écran de connexion affiche le nom du
-- programme, et personne n'a de session à ce moment-là.
revoke execute on function public.nom_du_programme() from public;
grant execute on function public.nom_du_programme() to anon, authenticated;

-- Les fonctions de déclencheur ne s'appellent pas : PostgreSQL les exécute
-- lui-même, sans vérifier le droit de l'appelant. Les exposer n'apporte rien.
revoke execute on function public.touche_modifie_le() from public, anon, authenticated;
revoke execute on function public.normalise_email_personne() from public, anon, authenticated;
revoke execute on function public.tache_membre_coche_seulement() from public, anon, authenticated;
revoke execute on function public.rafraichir_progression() from public, anon, authenticated;
revoke execute on function public.rafraichir_progression_objectif() from public, anon, authenticated;


-- ---------------------------------------------------------------------
--  11. Le jeu de départ
--
--  Tout ce qui suit se renomme, se réécrit et se supprime depuis l'app.
--  Ce sont des valeurs de départ, pas une méthode.
-- ---------------------------------------------------------------------

insert into offre (nom, prix_defaut, type, duree_mois) values
  ('Accompagnement 3 mois', 0, 'ponctuel', 3),
  ('Accompagnement 6 mois', 0, 'ponctuel', 6),
  ('Suivi mensuel', 0, 'mensuel', null);

insert into question_profil (libelle, aide, type, ordre) values
  ('Quel est ton objectif principal ?', 'En une phrase, ce que tu veux avoir obtenu à la fin.', 'texte_long', 1),
  ('Où en es-tu aujourd''hui ?', 'Ton point de départ, sans le maquiller.', 'texte_long', 2),
  ('Pour quand ?', 'Une date, même approximative.', 'texte_court', 3),
  ('Qu''est-ce qui te bloque le plus ?', null, 'texte_long', 4),
  ('Qu''as-tu déjà essayé ?', 'Et pourquoi ça n''a pas tenu.', 'texte_long', 5),
  ('Combien d''heures par semaine peux-tu y consacrer ?', null, 'nombre', 6),
  ('À quoi verras-tu que c''est réussi ?', 'Le signe concret, pas le sentiment.', 'texte_long', 7),
  ('Qu''attends-tu de ton coach ?', null, 'texte_long', 8);

-- Aucun objectif de départ, et c'est délibéré. Les objectifs appartiennent à
-- un client, pas à l'outil : en poser d'avance reviendrait à imposer la
-- méthode de l'éditeur à tous ceux qui l'installent. Le coach écrit les siens
-- sur l'écran de suivi de chaque client, et le jeu de démonstration en montre
-- l'usage.

