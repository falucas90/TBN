-- ============================================================
-- Crivo — Companies (multi-user stands)
--
-- Introduces real multi-tenancy: a company (stand) owns the deal
-- flow; users belong to exactly one company as 'owner' or 'member'.
-- Platform admins (app_metadata.role = 'admin') have no company.
--
--   companies            new table; business settings live here
--   profiles             + company_id, + company_role
--   searches / alerts    + company_id; RLS becomes company-scoped
--
-- Alert lifecycle status (new/saved/dismissed) is shared by the
-- whole company: the team works one queue. status_changed_by
-- records who acted.
-- ============================================================

-- ——— Companies ——————————————————————————————————————————————
create table if not exists public.companies (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  nif                    text,
  status                 text not null default 'active' check (status in ('active', 'suspended')),
  default_transport_cost integer not null default 800,
  min_margin             integer not null default 2000,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.companies enable row level security;

create trigger companies_updated_at
  before update on public.companies
  for each row execute procedure public.set_updated_at();

-- ——— Membership columns ——————————————————————————————————————
alter table public.profiles
  add column if not exists company_id uuid references public.companies on delete set null,
  add column if not exists company_role text not null default 'member'
    check (company_role in ('owner', 'member'));

alter table public.searches
  add column if not exists company_id uuid references public.companies on delete cascade;

alter table public.alerts
  add column if not exists company_id uuid references public.companies on delete cascade,
  add column if not exists status_changed_by uuid references auth.users on delete set null;

-- ——— Backfill: each existing dealer becomes a one-person company —
do $$
declare
  p record;
  new_company uuid;
begin
  for p in
    select pr.id, pr.company, pr.nif, pr.full_name,
           pr.default_transport_cost, pr.min_margin,
           u.email, u.raw_app_meta_data->>'role' as role
    from public.profiles pr
    join auth.users u on u.id = pr.id
    where pr.company_id is null
  loop
    -- Platform admins are operators, not dealers: no company.
    if coalesce(p.role, 'dealer') = 'admin' then
      continue;
    end if;
    insert into public.companies (name, nif, default_transport_cost, min_margin)
    values (
      coalesce(nullif(p.company, ''), nullif(p.full_name, ''), split_part(p.email, '@', 1)),
      p.nif,
      p.default_transport_cost,
      p.min_margin
    )
    returning id into new_company;
    update public.profiles
      set company_id = new_company, company_role = 'owner'
      where id = p.id;
  end loop;
end $$;

update public.searches s
  set company_id = pr.company_id
  from public.profiles pr
  where pr.id = s.user_id and s.company_id is null;

update public.alerts a
  set company_id = pr.company_id
  from public.profiles pr
  where pr.id = a.user_id and a.company_id is null;

-- ——— Business settings move from profile to company ——————————
alter table public.profiles
  drop column if exists default_transport_cost,
  drop column if exists min_margin,
  drop column if exists company,
  drop column if exists nif;

-- ——— Helper functions (security definer: bypass RLS, no recursion)
-- A suspended company resolves to null: members lose access to
-- company-scoped data without their accounts being touched.
create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select p.company_id
  from public.profiles p
  join public.companies c on c.id = p.company_id
  where p.id = auth.uid() and c.status = 'active';
$$;

create or replace function public.is_company_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and company_id is not null and company_role = 'owner'
  );
$$;

-- ——— Auto-fill company_id on insert ——————————————————————————
-- Clients and the ingestion backend keep inserting without
-- company_id; these triggers resolve it server-side. RLS WITH CHECK
-- runs after BEFORE triggers, so the policies below still apply.
create or replace function public.searches_set_company()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.company_id is null then
    select company_id into new.company_id from public.profiles where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger searches_set_company
  before insert on public.searches
  for each row execute procedure public.searches_set_company();

create or replace function public.alerts_set_company()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.company_id is null and new.search_id is not null then
    select company_id into new.company_id from public.searches where id = new.search_id;
  end if;
  if new.company_id is null then
    select company_id into new.company_id from public.profiles where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger alerts_set_company
  before insert on public.alerts
  for each row execute procedure public.alerts_set_company();

-- Record who saved/dismissed an alert (shared queue attribution).
create or replace function public.alerts_track_status_change()
returns trigger language plpgsql as $$
begin
  if new.user_status is distinct from old.user_status then
    new.status_changed_by = auth.uid();
  end if;
  return new;
end;
$$;

create trigger alerts_status_attribution
  before update on public.alerts
  for each row execute procedure public.alerts_track_status_change();

-- ——— RLS: companies ——————————————————————————————————————————
create policy "companies: member select"
  on public.companies for select
  using (id = public.current_company_id());

create policy "companies: owner update"
  on public.companies for update
  using (id = public.current_company_id() and public.is_company_owner())
  with check (id = public.current_company_id());

-- No client insert/delete: companies are created by the signup
-- trigger or the service role.

-- ——— RLS: profiles ———————————————————————————————————————————
-- Team members can see each other (name + role for the team list).
create policy "profiles: company select"
  on public.profiles for select
  using (company_id is not null and company_id = public.current_company_id());

-- Membership changes (company_id / company_role) must go through
-- the service role. RLS cannot restrict columns, so use column
-- grants: the owner update/insert policies stay, but clients can
-- only touch personal fields.
revoke insert, update on public.profiles from authenticated, anon;
grant insert (id, full_name, phone, notif_channel) on public.profiles to authenticated;
grant update (full_name, phone, notif_channel) on public.profiles to authenticated;

-- ——— RLS: searches (owner-scoped → company-scoped) ———————————
drop policy if exists "searches: owner select" on public.searches;
drop policy if exists "searches: owner insert" on public.searches;
drop policy if exists "searches: owner update" on public.searches;
drop policy if exists "searches: owner delete" on public.searches;

create policy "searches: company select"
  on public.searches for select
  using (company_id = public.current_company_id());

create policy "searches: company insert"
  on public.searches for insert
  with check (company_id = public.current_company_id() and user_id = auth.uid());

create policy "searches: company update"
  on public.searches for update
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy "searches: company delete"
  on public.searches for delete
  using (company_id = public.current_company_id());

-- ——— RLS: alerts (owner-scoped → company-scoped) —————————————
drop policy if exists "alerts: owner select" on public.alerts;
drop policy if exists "alerts: owner update" on public.alerts;

create policy "alerts: company select"
  on public.alerts for select
  using (company_id = public.current_company_id());

create policy "alerts: company update"
  on public.alerts for update
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- Clients may only flip the lifecycle status — closes the 004
-- caveat where any alert column was updatable by its owner.
revoke update on public.alerts from authenticated, anon;
grant update (user_status) on public.alerts to authenticated;

-- Company owners manage business settings but not their own
-- status; suspension is a platform-admin action via service role.
revoke insert, update, delete on public.companies from authenticated, anon;
grant update (name, nif, default_transport_cost, min_margin) on public.companies to authenticated;

-- ——— Signup trigger: link or create the company ——————————————
-- Three paths, driven by the invite/signup metadata:
--   company_id present          → invited into an existing company
--   role <> 'admin'             → standalone signup / platform invite:
--                                 fresh company, user is its owner
--   role = 'admin'              → platform admin, no company
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta_role        text;
  meta_company_id  uuid;
  meta_company_role text;
  new_company_id   uuid;
begin
  meta_role := coalesce(new.raw_user_meta_data->>'role', 'dealer');
  meta_company_id := nullif(new.raw_user_meta_data->>'company_id', '')::uuid;
  meta_company_role := coalesce(nullif(new.raw_user_meta_data->>'company_role', ''), 'member');

  if meta_company_id is not null then
    insert into public.profiles (id, full_name, company_id, company_role)
    values (new.id, new.raw_user_meta_data->>'full_name', meta_company_id, meta_company_role)
    on conflict (id) do nothing;
  elsif meta_role <> 'admin' then
    insert into public.companies (name, nif)
    values (
      coalesce(
        nullif(new.raw_user_meta_data->>'company', ''),
        nullif(new.raw_user_meta_data->>'full_name', ''),
        split_part(new.email, '@', 1)
      ),
      new.raw_user_meta_data->>'nif'
    )
    returning id into new_company_id;
    insert into public.profiles (id, full_name, company_id, company_role)
    values (new.id, new.raw_user_meta_data->>'full_name', new_company_id, 'owner')
    on conflict (id) do nothing;
  else
    insert into public.profiles (id, full_name)
    values (new.id, new.raw_user_meta_data->>'full_name')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

-- ——— Indexes ————————————————————————————————————————————————
create index if not exists profiles_company_idx on public.profiles (company_id);
create index if not exists searches_company_idx on public.searches (company_id);
create index if not exists alerts_company_idx on public.alerts (company_id, created_at desc);
create index if not exists alerts_company_status_idx on public.alerts (company_id, user_status);
