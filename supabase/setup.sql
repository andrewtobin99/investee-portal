-- ============================================================================
-- Investee Portal — full backend setup
-- Hosted Supabase. Paste this whole file into the SQL Editor and Run once.
-- Idempotent-ish: safe to re-run (drops nothing; uses IF NOT EXISTS / upserts).
--
-- Creates: schema, RLS, the private `submission-documents` bucket + policies,
-- and a seeded admin + investee test user with sample submissions/comments.
--
-- Test logins created at the bottom:
--   investee@example.com / Password123!
--   admin@example.com    / Password123!
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- 1. Tables
-- ----------------------------------------------------------------------------

create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- One row per auth user. `is_admin` is DISPLAY-ONLY (drives the comment "Admin"
-- badge); real authorization lives in user_client_roles.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Multi-tenant role assignments (source of truth for authz).
create table if not exists public.user_client_roles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  client_id  uuid not null references public.clients(id) on delete cascade,
  role       text not null check (role in ('admin','investee')),
  created_at timestamptz not null default now(),
  primary key (user_id, client_id, role)
);

create table if not exists public.investees (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  client_id      uuid not null references public.clients(id) on delete cascade,
  company_name   text not null,
  contact_person text,
  contact_email  text,
  country        text,
  industry       text,
  status         text not null default 'active',
  metadata       jsonb not null default '{}'::jsonb,
  onboarded_at   timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (user_id, client_id)
);

create table if not exists public.workflow_statuses (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  label      text not null,
  sort_order int  not null default 0
);

create table if not exists public.submission_requests (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  investee_id uuid not null references public.investees(id) on delete cascade,
  title       text not null,
  description text,
  due_date    date,
  status_id   uuid not null references public.workflow_statuses(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.documents (
  id                    uuid primary key default gen_random_uuid(),
  submission_request_id uuid not null references public.submission_requests(id) on delete cascade,
  client_id             uuid not null references public.clients(id) on delete cascade,
  -- Storage object path: {client_id}/{submission_request_id}/{filename}
  file_path             text not null unique,
  file_name             text not null,
  file_size             bigint not null,
  content_type          text,
  uploaded_by           uuid not null references auth.users(id),
  created_at            timestamptz not null default now()
);

create table if not exists public.comment_visibility_types (
  id    uuid primary key default gen_random_uuid(),
  slug  text not null unique,   -- 'external' | 'internal'
  label text not null
);

-- author_id -> profiles(id) so PostgREST can embed the `comment_author` view.
create table if not exists public.comments (
  id                    uuid primary key default gen_random_uuid(),
  submission_request_id uuid not null references public.submission_requests(id) on delete cascade,
  author_id             uuid not null references public.profiles(id),
  body                  text not null,
  visibility_type_id    uuid not null references public.comment_visibility_types(id),
  created_at            timestamptz not null default now()
);

create table if not exists public.submission_status_history (
  id                    uuid primary key default gen_random_uuid(),
  submission_request_id uuid not null references public.submission_requests(id) on delete cascade,
  status_id             uuid not null references public.workflow_statuses(id),
  changed_by            uuid references auth.users(id),
  changed_at            timestamptz not null default now()
);

create index if not exists idx_submission_requests_investee on public.submission_requests(investee_id);
create index if not exists idx_documents_submission on public.documents(submission_request_id);
create index if not exists idx_comments_submission on public.comments(submission_request_id);
create index if not exists idx_investees_user on public.investees(user_id);

-- ----------------------------------------------------------------------------
-- 2. View the frontend embeds:  comments -> author:comment_author(id,display_name,role)
--    security_invoker=on so the caller's RLS on profiles applies.
-- ----------------------------------------------------------------------------
create or replace view public.comment_author
  with (security_invoker = on) as
select
  p.id,
  coalesce(p.display_name, 'User') as display_name,
  case when p.is_admin then 'admin' else 'investee' end as role
from public.profiles p;

-- ----------------------------------------------------------------------------
-- 3. Helper functions (SECURITY DEFINER to avoid RLS recursion in policies)
-- ----------------------------------------------------------------------------
create or replace function public.current_investee_ids()
returns setof uuid language sql security definer stable
set search_path = public as $$
  select id from public.investees
  where user_id = auth.uid() and deleted_at is null
$$;

create or replace function public.is_client_admin(p_client_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.user_client_roles
    where user_id = auth.uid() and client_id = p_client_id and role = 'admin'
  )
$$;

-- Auto-create a profile row on signup (display_name from sign-up metadata).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.clients                 enable row level security;
alter table public.profiles                enable row level security;
alter table public.user_client_roles       enable row level security;
alter table public.investees               enable row level security;
alter table public.workflow_statuses       enable row level security;
alter table public.submission_requests     enable row level security;
alter table public.documents               enable row level security;
alter table public.comment_visibility_types enable row level security;
alter table public.comments                enable row level security;
alter table public.submission_status_history enable row level security;

-- Lookups: any signed-in user may read.
drop policy if exists "read workflow_statuses" on public.workflow_statuses;
create policy "read workflow_statuses" on public.workflow_statuses
  for select to authenticated using (true);

drop policy if exists "read visibility_types" on public.comment_visibility_types;
create policy "read visibility_types" on public.comment_visibility_types
  for select to authenticated using (true);

-- Profiles: readable by any signed-in user (names shown in comment threads).
drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles
  for select to authenticated using (true);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- user_client_roles: a user may read their own role rows.
drop policy if exists "read own roles" on public.user_client_roles;
create policy "read own roles" on public.user_client_roles
  for select to authenticated using (user_id = auth.uid());

-- clients: visible if you belong to them (investee or admin).
drop policy if exists "read own clients" on public.clients;
create policy "read own clients" on public.clients
  for select to authenticated using (
    exists (select 1 from public.investees i where i.client_id = clients.id and i.user_id = auth.uid())
    or public.is_client_admin(clients.id)
  );

-- investees: own row, or admin of the client.
drop policy if exists "read own investee" on public.investees;
create policy "read own investee" on public.investees
  for select to authenticated using (
    user_id = auth.uid() or public.is_client_admin(client_id)
  );

-- submission_requests: owned by the investee, or admin of the client.
drop policy if exists "read own submissions" on public.submission_requests;
create policy "read own submissions" on public.submission_requests
  for select to authenticated using (
    investee_id in (select public.current_investee_ids())
    or public.is_client_admin(client_id)
  );

-- documents: visible if the parent submission is visible.
drop policy if exists "read submission docs" on public.documents;
create policy "read submission docs" on public.documents
  for select to authenticated using (
    submission_request_id in (
      select id from public.submission_requests sr
      where sr.investee_id in (select public.current_investee_ids())
         or public.is_client_admin(sr.client_id)
    )
  );

-- documents: investee may insert metadata for their own submissions.
drop policy if exists "insert own docs" on public.documents;
create policy "insert own docs" on public.documents
  for insert to authenticated with check (
    uploaded_by = auth.uid()
    and submission_request_id in (
      select id from public.submission_requests sr
      where sr.investee_id in (select public.current_investee_ids())
    )
  );

-- documents: a user may delete only files they uploaded.
drop policy if exists "delete own docs" on public.documents;
create policy "delete own docs" on public.documents
  for delete to authenticated using (uploaded_by = auth.uid());

-- comments: external comments + your own, on submissions you can see.
drop policy if exists "read submission comments" on public.comments;
create policy "read submission comments" on public.comments
  for select to authenticated using (
    submission_request_id in (
      select id from public.submission_requests sr
      where sr.investee_id in (select public.current_investee_ids())
         or public.is_client_admin(sr.client_id)
    )
    and (
      author_id = auth.uid()
      or visibility_type_id in (select id from public.comment_visibility_types where slug = 'external')
      or exists (
        select 1 from public.submission_requests sr
        where sr.id = comments.submission_request_id and public.is_client_admin(sr.client_id)
      )
    )
  );

-- comments: investees may post only EXTERNAL comments as themselves; admins any.
drop policy if exists "insert comment" on public.comments;
create policy "insert comment" on public.comments
  for insert to authenticated with check (
    author_id = auth.uid()
    and submission_request_id in (
      select id from public.submission_requests sr
      where sr.investee_id in (select public.current_investee_ids())
         or public.is_client_admin(sr.client_id)
    )
    and (
      visibility_type_id in (select id from public.comment_visibility_types where slug = 'external')
      or exists (
        select 1 from public.submission_requests sr
        where sr.id = comments.submission_request_id and public.is_client_admin(sr.client_id)
      )
    )
  );

-- status history: visible if the parent submission is visible.
drop policy if exists "read status history" on public.submission_status_history;
create policy "read status history" on public.submission_status_history
  for select to authenticated using (
    submission_request_id in (
      select id from public.submission_requests sr
      where sr.investee_id in (select public.current_investee_ids())
         or public.is_client_admin(sr.client_id)
    )
  );

-- Grants (RLS still filters rows). Supabase usually grants these by default;
-- we set them explicitly to be safe.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.comment_author to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Storage: private bucket + path-scoped policies
--    Path strategy: {client_id}/{submission_request_id}/{filename}
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('submission-documents', 'submission-documents', false)
on conflict (id) do nothing;

drop policy if exists "docs read" on storage.objects;
create policy "docs read" on storage.objects
  for select to authenticated using (
    bucket_id = 'submission-documents'
    and exists (
      select 1 from public.submission_requests sr
      where sr.id::text = (storage.foldername(name))[2]
        and sr.client_id::text = (storage.foldername(name))[1]
        and (sr.investee_id in (select public.current_investee_ids())
             or public.is_client_admin(sr.client_id))
    )
  );

drop policy if exists "docs upload" on storage.objects;
create policy "docs upload" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'submission-documents'
    and exists (
      select 1 from public.submission_requests sr
      where sr.id::text = (storage.foldername(name))[2]
        and sr.client_id::text = (storage.foldername(name))[1]
        and sr.investee_id in (select public.current_investee_ids())
    )
  );

-- Delete only your own objects (storage records the uploader in `owner`).
drop policy if exists "docs delete" on storage.objects;
create policy "docs delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'submission-documents' and owner = auth.uid()
  );

-- ----------------------------------------------------------------------------
-- 6. Reference data
-- ----------------------------------------------------------------------------
insert into public.workflow_statuses (slug, label, sort_order) values
  ('draft','Draft',0),
  ('submitted','Submitted',1),
  ('under_review','Under review',2),
  ('follow_up_requested','Follow-up requested',3),
  ('approved','Approved',4),
  ('rejected','Rejected',5)
on conflict (slug) do nothing;

insert into public.comment_visibility_types (slug, label) values
  ('external','External (investee visible)'),
  ('internal','Internal (admin only)')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 7. Seed test users + sample data
--    NOTE: direct auth.users inserts work in the SQL Editor. If your project
--    rejects them, create the two users in Dashboard -> Authentication instead,
--    then re-run from the DO block with their real UUIDs.
-- ----------------------------------------------------------------------------
do $$
declare
  v_client       uuid;
  v_investee_uid uuid := '11111111-1111-1111-1111-111111111111';
  v_admin_uid    uuid := '22222222-2222-2222-2222-222222222222';
  v_investee_id  uuid;
  v_draft uuid; v_submitted uuid; v_review uuid; v_followup uuid;
  v_sr1 uuid; v_sr2 uuid; v_sr3 uuid;
  v_ext uuid;
begin
  -- auth users (skip if they already exist)
  if not exists (select 1 from auth.users where id = v_investee_uid) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      -- GoTrue scans these as non-null strings; NULL => "Database error querying schema" on login.
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_investee_uid, 'authenticated','authenticated',
      'investee@example.com', extensions.crypt('Password123!', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Acme Capital"}'::jsonb, false,
      '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at)
    values (gen_random_uuid(), v_investee_uid,
      jsonb_build_object('sub', v_investee_uid::text, 'email','investee@example.com'),
      'email', v_investee_uid::text, now(), now(), now());
  end if;

  if not exists (select 1 from auth.users where id = v_admin_uid) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_admin_uid, 'authenticated','authenticated',
      'admin@example.com', extensions.crypt('Password123!', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Fund Administrator"}'::jsonb, false,
      '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at)
    values (gen_random_uuid(), v_admin_uid,
      jsonb_build_object('sub', v_admin_uid::text, 'email','admin@example.com'),
      'email', v_admin_uid::text, now(), now(), now());
  end if;

  -- profiles (trigger may have created them; set names + admin flag)
  insert into public.profiles (id, display_name, is_admin) values
    (v_investee_uid, 'Acme Capital', false),
    (v_admin_uid,    'Fund Administrator', true)
  on conflict (id) do update
    set display_name = excluded.display_name, is_admin = excluded.is_admin;

  -- client
  select id into v_client from public.clients where name = 'Demo Fund I' limit 1;
  if v_client is null then
    insert into public.clients (name) values ('Demo Fund I') returning id into v_client;
  end if;

  -- roles
  insert into public.user_client_roles (user_id, client_id, role) values
    (v_admin_uid, v_client, 'admin'),
    (v_investee_uid, v_client, 'investee')
  on conflict do nothing;

  -- investee
  select id into v_investee_id from public.investees
    where user_id = v_investee_uid and client_id = v_client;
  if v_investee_id is null then
    insert into public.investees (user_id, client_id, company_name, contact_person, contact_email, country, industry)
    values (v_investee_uid, v_client, 'Acme Capital', 'Jane Doe', 'jane@acme.example', 'United Kingdom', 'Manufacturing')
    returning id into v_investee_id;
  end if;

  select id into v_draft    from public.workflow_statuses where slug = 'draft';
  select id into v_submitted from public.workflow_statuses where slug = 'submitted';
  select id into v_review   from public.workflow_statuses where slug = 'under_review';
  select id into v_followup from public.workflow_statuses where slug = 'follow_up_requested';
  select id into v_ext      from public.comment_visibility_types where slug = 'external';

  -- sample submission requests (only if none exist for this investee yet)
  if not exists (select 1 from public.submission_requests where investee_id = v_investee_id) then
    insert into public.submission_requests (client_id, investee_id, title, description, due_date, status_id)
    values (v_client, v_investee_id, 'Q2 2026 Financial Statements',
            'Upload your quarterly management accounts and balance sheet.',
            (now() + interval '10 days')::date, v_draft)
    returning id into v_sr1;

    insert into public.submission_requests (client_id, investee_id, title, description, due_date, status_id)
    values (v_client, v_investee_id, 'Annual ESG Questionnaire',
            'Complete the ESG disclosure pack for the 2025 reporting year.',
            (now() - interval '3 days')::date, v_followup)
    returning id into v_sr2;

    insert into public.submission_requests (client_id, investee_id, title, description, due_date, status_id)
    values (v_client, v_investee_id, 'Cap Table Update',
            'Provide your latest fully-diluted capitalisation table.',
            (now() + interval '21 days')::date, v_review)
    returning id into v_sr3;

    -- an admin (external) comment on the follow-up request
    insert into public.comments (submission_request_id, author_id, body, visibility_type_id)
    values (v_sr2, v_admin_uid,
            'Thanks for the initial submission. Could you also attach the scope 3 emissions breakdown?',
            v_ext);
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 8. Realtime: publish the tables the UI subscribes to. RLS still applies to
--    what each client can read back. Guarded so re-runs don't error.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'submission_requests'
  ) then
    alter publication supabase_realtime add table public.submission_requests;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 9. Admin write access. Investees keep their own-row policies; client admins
--    additionally get status updates and full document management. (Re-run this
--    section on an existing project — every statement is drop/replace-safe.)
-- ----------------------------------------------------------------------------

-- Admins may update submissions in their client(s) (e.g. change status).
drop policy if exists "admin update submissions" on public.submission_requests;
create policy "admin update submissions" on public.submission_requests
  for update to authenticated
  using (public.is_client_admin(client_id))
  with check (public.is_client_admin(client_id));

-- documents insert: investee on own submission, OR client admin.
drop policy if exists "insert own docs" on public.documents;
create policy "insert docs" on public.documents
  for insert to authenticated with check (
    uploaded_by = auth.uid()
    and (
      submission_request_id in (
        select id from public.submission_requests sr
        where sr.investee_id in (select public.current_investee_ids())
      )
      or exists (
        select 1 from public.submission_requests sr
        where sr.id = documents.submission_request_id
          and public.is_client_admin(sr.client_id)
      )
    )
  );

-- documents delete: own upload, OR client admin.
drop policy if exists "delete own docs" on public.documents;
drop policy if exists "delete docs" on public.documents;
create policy "delete docs" on public.documents
  for delete to authenticated using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.submission_requests sr
      where sr.id = documents.submission_request_id
        and public.is_client_admin(sr.client_id)
    )
  );

-- storage upload: investee on own submission, OR client admin (replaces §5).
drop policy if exists "docs upload" on storage.objects;
create policy "docs upload" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'submission-documents'
    and exists (
      select 1 from public.submission_requests sr
      where sr.id::text = (storage.foldername(name))[2]
        and sr.client_id::text = (storage.foldername(name))[1]
        and (sr.investee_id in (select public.current_investee_ids())
             or public.is_client_admin(sr.client_id))
    )
  );

-- storage delete: own object, OR client admin (replaces §5).
drop policy if exists "docs delete" on storage.objects;
create policy "docs delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'submission-documents'
    and (
      owner = auth.uid()
      or exists (
        select 1 from public.submission_requests sr
        where sr.id::text = (storage.foldername(name))[2]
          and public.is_client_admin(sr.client_id)
      )
    )
  );

-- Auto-log status changes into submission_status_history (records who/when),
-- so the client only has to update status_id.
create or replace function public.log_submission_status_change()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if new.status_id is distinct from old.status_id then
    insert into public.submission_status_history (submission_request_id, status_id, changed_by)
    values (new.id, new.status_id, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists on_submission_status_change on public.submission_requests;
create trigger on_submission_status_change
  after update on public.submission_requests
  for each row execute function public.log_submission_status_change();

-- ============================================================================
-- Done. Generate frontend types (optional) with:
--   npx supabase gen types typescript --project-id <ref> --schema public
-- ============================================================================
