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

-- Les grandes parties de ton accompagnement. Le mot qui les désigne à
-- l'écran (module, pilier, phase, axe) se règle depuis l'app.
create table pilier (
  id uuid primary key default gen_random_uuid(),
  numero smallint not null unique,
  nom text not null,
  description text,
  ordre smallint not null
);

-- Le questionnaire que le client remplit en arrivant. Configurable sans
-- toucher au code.
create table question_profil (
  id uuid primary key default gen_random_uuid(),
  pilier_id uuid references pilier (id) on delete set null,
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

-- Quelles parties sont ouvertes pour un client, et quand les autres
-- s'ouvriront.
--
-- Trois états dans une seule colonne. Une date passée : la partie est
-- ouverte. Une date à venir : elle s'ouvrira ce jour-là, et c'est ce que le
-- client lit sur son cadenas. Pas de ligne : la partie n'est pas prévue pour
-- lui.
create table acces_pilier (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid not null references personne (id) on delete cascade,
  pilier_id uuid not null references pilier (id) on delete cascade,
  date_ouverture date not null,
  par_compte uuid references compte (id) on delete set null,
  cree_le timestamptz not null default now(),
  unique (personne_id, pilier_id)
);

create index acces_pilier_personne_idx on acces_pilier (personne_id);

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
--  3. Les tables du parcours
-- ---------------------------------------------------------------------

-- Le parcours type, copié dans l'espace d'un client à son arrivée. Sans lui,
-- son espace est vide à la première connexion.
create table parcours_modele (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  offre_id uuid references offre (id) on delete set null,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

create table tache_modele (
  id uuid primary key default gen_random_uuid(),
  parcours_modele_id uuid not null references parcours_modele (id) on delete cascade,
  pilier_id uuid not null references pilier (id) on delete cascade,
  -- Le titre de section sous lequel la tâche se range. Une colonne texte et
  -- non une table : un titre de section n'a ni identité ni attribut.
  groupe text,
  titre text not null,
  description text,
  ordre smallint not null
);

create table tache (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid not null references personne (id) on delete cascade,
  pilier_id uuid not null references pilier (id) on delete cascade,
  groupe text,
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

create index tache_personne_idx on tache (personne_id, pilier_id);

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

create or replace function pilier_ouvert(p_personne uuid, p_pilier uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from acces_pilier
    where personne_id = p_personne
      and pilier_id = p_pilier
      and date_ouverture <= current_date
  );
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
    or new.pilier_id is distinct from old.pilier_id
    or new.personne_id is distinct from old.personne_id
    or new.ordre is distinct from old.ordre
    or new.groupe is distinct from old.groupe
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
-- Le calcul ne porte que sur les parties ouvertes. Compter les quatre
-- bloquerait un client à 25 % pendant tout son premier mois, au moment où il
-- a le plus besoin de voir que ça avance.
--
-- `security definer` : un client qui coche une tâche n'a le droit que de lire
-- son accompagnement. Sans lui, sa progression ne s'écrirait jamais.
create or replace function rafraichir_progression()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_personne uuid := coalesce(new.personne_id, old.personne_id);
  v_progression smallint;
begin
  select coalesce(
    round(100.0 * count(*) filter (where t.faite) / nullif(count(*), 0)), 0
  )
  into v_progression
  from tache t
  where t.personne_id = v_personne
    and pilier_ouvert(v_personne, t.pilier_id);

  update accompagnement
  set progression = v_progression
  where personne_id = v_personne and statut = 'actif';

  return null;
end;
$$;

create trigger tache_rafraichit_la_progression
after insert or update or delete on tache for each row
execute function rafraichir_progression();

-- Le jour où une partie s'ouvre, le dénominateur du calcul change mais la
-- colonne garderait son ancienne valeur jusqu'à ce que le client coche
-- quelque chose : sur l'écran du coach qui regarde ce jour-là, la progression
-- mentirait.
create trigger acces_pilier_rafraichit_la_progression
after insert or update or delete on acces_pilier for each row
execute function rafraichir_progression();


-- ---------------------------------------------------------------------
--  6. Les deux gestes de mise en service d'un client
--
--  Pas de `security definer`, volontairement : elles s'exécutent avec les
--  droits de qui les appelle, donc les permissions continuent de
--  s'appliquer. Un client qui les appellerait n'écrirait rien.
-- ---------------------------------------------------------------------

create or replace function appliquer_parcours_modele(p_personne uuid)
returns integer language plpgsql set search_path = public
as $$
declare
  ajoutees integer;
begin
  insert into tache (personne_id, pilier_id, groupe, titre, description, ordre)
  select p_personne, tm.pilier_id, tm.groupe, tm.titre, tm.description, tm.ordre
  from tache_modele tm
  join parcours_modele pm on pm.id = tm.parcours_modele_id
  where pm.actif
    -- Idempotente : relancer n'ajoute que ce qui manque. Sans cette
    -- condition, un coach qui reclique doublerait tout le parcours de son
    -- client, cases cochées d'un côté et vides de l'autre.
    and not exists (
      select 1 from tache t
      where t.personne_id = p_personne
        and t.pilier_id = tm.pilier_id
        and t.titre = tm.titre
    );

  get diagnostics ajoutees = row_count;
  return ajoutees;
end;
$$;

-- Le calendrier d'ouverture des parties : la première au démarrage, puis une
-- par mois. Le coach corrige ensuite chaque date à la main.
--
-- L'addition d'intervalle de PostgreSQL ramène au dernier jour du mois quand
-- le jour n'existe pas : 31 janvier plus un mois donne le 28 février.
create or replace function planifier_piliers(p_personne uuid, p_demarrage date)
returns integer language plpgsql set search_path = public
as $$
declare
  posees integer;
begin
  insert into acces_pilier (personne_id, pilier_id, date_ouverture)
  select p_personne, p.id,
    (p_demarrage + make_interval(months => greatest(p.numero - 1, 0)))::date
  from pilier p
  -- Écrase les dates existantes, y compris celles corrigées à la main :
  -- l'écran demande donc confirmation avant d'appeler.
  on conflict (personne_id, pilier_id)
    do update set date_ouverture = excluded.date_ouverture;

  get diagnostics posees = row_count;
  return posees;
end;
$$;


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
alter table pilier enable row level security;
alter table question_profil enable row level security;
alter table reponse_profil enable row level security;
alter table document enable row level security;
alter table acces_pilier enable row level security;
alter table appel enable row level security;
alter table parcours_modele enable row level security;
alter table tache_modele enable row level security;
alter table tache enable row level security;

-- Le coach fait tout, partout.
create policy admin_tout on personne for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on compte for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on offre for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on accompagnement for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on pilier for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on question_profil for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on reponse_profil for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on document for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on acces_pilier for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on appel for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on parcours_modele for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on tache_modele for all to authenticated using (est_admin()) with check (est_admin());
create policy admin_tout on tache for all to authenticated using (est_admin()) with check (est_admin());

-- Un client lit son compte, sa fiche et son accompagnement, rien d'autre.
create policy membre_lit_son_compte on compte
  for select to authenticated using (id = auth.uid());

create policy membre_lit_sa_fiche on personne
  for select to authenticated using (id = ma_personne());

create policy membre_lit_son_accompagnement on accompagnement
  for select to authenticated using (personne_id = ma_personne());

-- Les référentiels : sans les parties ni les questions, l'espace du client
-- n'a rien à afficher.
create policy tous_lisent_les_piliers on pilier
  for select to authenticated using (a_un_compte());

create policy tous_lisent_les_questions on question_profil
  for select to authenticated using (a_un_compte() and active);

create policy membre_gere_ses_reponses on reponse_profil
  for all to authenticated using (personne_id = ma_personne())
  with check (personne_id = ma_personne());

-- Un client lit et coche les tâches d'une partie qui lui est ouverte, et il
-- ne peut ni en créer ni en supprimer : c'est le coach qui pose le parcours.
create policy membre_lit_ses_taches on tache
  for select to authenticated
  using (personne_id = ma_personne() and pilier_ouvert(ma_personne(), pilier_id));

create policy membre_coche_ses_taches on tache
  for update to authenticated
  using (personne_id = ma_personne() and pilier_ouvert(ma_personne(), pilier_id))
  with check (personne_id = ma_personne() and pilier_ouvert(ma_personne(), pilier_id));

-- Il lit tout son calendrier, dates à venir comprises : c'est ce qu'on lui
-- montre sur une partie fermée.
create policy membre_lit_son_calendrier on acces_pilier
  for select to authenticated using (personne_id = ma_personne());

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
--  ne disent rien d'utile à un anonyme, `pilier_ouvert` répondait sur la
--  personne qu'on lui nommait.
--
--  Puis on rend à `authenticated` ce dont les politiques ont besoin : elles
--  appellent ces fonctions au nom de l'appelant. Sans cette seconde moitié,
--  toutes les permissions par ligne tomberaient d'un coup.
-- ---------------------------------------------------------------------

revoke execute on function public.ma_personne() from public, anon;
revoke execute on function public.est_admin() from public, anon;
revoke execute on function public.a_un_compte() from public, anon;
revoke execute on function public.pilier_ouvert(uuid, uuid) from public, anon;

grant execute on function public.ma_personne() to authenticated;
grant execute on function public.est_admin() to authenticated;
grant execute on function public.a_un_compte() to authenticated;
grant execute on function public.pilier_ouvert(uuid, uuid) to authenticated;

-- Les deux gestes de mise en service sont appelés avec la session du coach.
-- Celle-ci répond à un anonyme, et c'est voulu : il n'y a personne d'autre
-- pour installer l'outil.
revoke execute on function public.installation_faite() from public;
grant execute on function public.installation_faite() to anon, authenticated;

revoke execute on function public.appliquer_parcours_modele(uuid) from public, anon;
revoke execute on function public.planifier_piliers(uuid, date) from public, anon;
grant execute on function public.appliquer_parcours_modele(uuid) to authenticated;
grant execute on function public.planifier_piliers(uuid, date) to authenticated;

-- Les fonctions de déclencheur ne s'appellent pas : PostgreSQL les exécute
-- lui-même, sans vérifier le droit de l'appelant. Les exposer n'apporte rien.
revoke execute on function public.touche_modifie_le() from public, anon, authenticated;
revoke execute on function public.normalise_email_personne() from public, anon, authenticated;
revoke execute on function public.tache_membre_coche_seulement() from public, anon, authenticated;
revoke execute on function public.rafraichir_progression() from public, anon, authenticated;


-- ---------------------------------------------------------------------
--  11. Le jeu de départ
--
--  Tout ce qui suit se renomme, se réécrit et se supprime depuis l'app.
--  Ce sont des valeurs de départ, pas une méthode.
-- ---------------------------------------------------------------------

insert into pilier (numero, nom, description, ordre) values
  (1, 'Clarté', 'Où tu en es, où tu veux aller, et ce qui bloque.', 1),
  (2, 'Plan', 'Le chemin, découpé et daté.', 2),
  (3, 'Action', 'L''exécution, semaine après semaine.', 3),
  (4, 'Ancrage', 'Tenir dans la durée, sans ton coach.', 4);

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

-- Le parcours type. Sans offre rattachée : il s'applique à tous.
insert into parcours_modele (nom) values ('Parcours type');

insert into tache_modele (parcours_modele_id, pilier_id, groupe, titre, description, ordre)
select
  (select id from parcours_modele where nom = 'Parcours type'),
  p.id, t.groupe, t.titre, t.description, t.ordre
from pilier p
join (values
  (1, 'Pour démarrer', 'Remplis ton profil', 'Tes réponses servent de point de départ à tout le reste.', 1),
  (1, 'Pour démarrer', 'Écris ton objectif en une phrase', 'Une seule, et qu''elle soit vérifiable.', 2),
  (1, 'Pour démarrer', 'Note ce qui te bloque vraiment', null, 3),
  (2, 'Construire', 'Découpe ton objectif en trois étapes', null, 1),
  (2, 'Construire', 'Pose une date sur chaque étape', null, 2),
  (2, 'Construire', 'Choisis la première action à faire cette semaine', null, 3),
  (3, 'Avancer', 'Bloque un créneau récurrent dans ton agenda', 'Le même jour, à la même heure.', 1),
  (3, 'Avancer', 'Fais le point chaque semaine', null, 2),
  (3, 'Avancer', 'Note ce qui a marché et ce qui a coincé', null, 3),
  (4, 'Tenir', 'Écris ta routine, celle que tu garderas', null, 1),
  (4, 'Tenir', 'Identifie ce qui te ferait décrocher', null, 2),
  (4, 'Tenir', 'Prévois quoi faire le jour où ça arrive', null, 3)
) as t (numero, groupe, titre, description, ordre) on t.numero = p.numero;
