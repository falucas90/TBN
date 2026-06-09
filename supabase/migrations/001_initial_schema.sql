-- ============================================================
-- Crivo — Initial Schema
-- Run this in Supabase SQL Editor or via supabase db push
-- ============================================================

-- ——— Profiles ———————————————————————————————————————————————
create table if not exists public.profiles (
  id                    uuid primary key references auth.users on delete cascade,
  full_name             text,
  company               text,
  nif                   text,
  phone                 text,
  default_transport_cost integer not null default 800,
  min_margin            integer not null default 2000,
  notif_channel         text not null default 'WhatsApp',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner select"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles: owner insert"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, company, nif)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'nif'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ——— Searches ———————————————————————————————————————————————
create table if not exists public.searches (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  title            text not null,
  status           text not null default 'active' check (status in ('active', 'paused', 'draft')),
  criteria         jsonb not null default '{}',
  sources          text[] not null default '{}',
  min_margin       integer not null default 2500,
  alert_threshold  integer not null default 3000,
  alert_channels   jsonb not null default '{"whatsapp": true, "email": false}',
  daily_summary    boolean not null default true,
  matches_today    integer not null default 0,
  avg_margin       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.searches enable row level security;

create policy "searches: owner select"
  on public.searches for select using (auth.uid() = user_id);

create policy "searches: owner insert"
  on public.searches for insert with check (auth.uid() = user_id);

create policy "searches: owner update"
  on public.searches for update using (auth.uid() = user_id);

create policy "searches: owner delete"
  on public.searches for delete using (auth.uid() = user_id);

-- ——— Alerts ————————————————————————————————————————————————
create table if not exists public.alerts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  search_id       uuid references public.searches on delete set null,
  date            text not null default 'Today',
  car_title       text not null,
  platform        text not null,
  listing_url     text,
  price_original  integer not null,
  cc              integer,
  co2             integer,
  fuel_type       text,
  age_years       integer,
  transport_est   integer not null default 800,
  market_price    integer,
  flags           text[] not null default '{}',
  created_at      timestamptz not null default now()
);

alter table public.alerts enable row level security;

create policy "alerts: owner select"
  on public.alerts for select using (auth.uid() = user_id);

-- Only backend (service_role) inserts alerts — no client insert policy

-- ——— Indexes ————————————————————————————————————————————————
create index if not exists searches_user_id_idx on public.searches (user_id);
create index if not exists searches_status_idx on public.searches (user_id, status);
create index if not exists alerts_user_id_idx on public.alerts (user_id);
create index if not exists alerts_created_at_idx on public.alerts (user_id, created_at desc);

-- ——— updated_at auto-bump ————————————————————————————————————
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger searches_updated_at
  before update on public.searches
  for each row execute procedure public.set_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
