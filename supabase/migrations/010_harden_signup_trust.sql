-- ============================================================
-- Crivo — Harden signup trigger: stop trusting client metadata
--                                 for tenant binding
--
-- SECURITY (beta go-live blocker, cross-tenant takeover)
--
-- The 009 version of public.handle_new_user() read company_id and
-- company_role from new.raw_user_meta_data (the auth user_metadata
-- bag). That bag is fully client-writable via
--   supabase.auth.signUp({ options: { data } })
-- so the trigger could not tell an admin invite from a self-crafted
-- signup. If public self-signup is ever enabled, an attacker could
-- sign up with { company_id: '<victim-uuid>', company_role: 'owner' }
-- and become owner of another stand — a full cross-tenant takeover.
-- The trigger also created a brand-new company straight from client
-- metadata, which is equally untrustworthy.
--
-- This migration makes the trigger create ONLY a minimal, bare
-- profile (id, full_name) with company_id = NULL and the default
-- company_role. It no longer reads company_id / company_role / role
-- from user_metadata and never creates a company. Tenancy is now
-- assigned exclusively by the service role in the update-user-role
-- edge function, AFTER the invite — the only trusted path.
--
-- Net effect: a brand-new auth user gets a bare profile with no
-- company (and therefore no access to any tenant) until the invite
-- flow links them server-side.
--
-- This migration only replaces the function body. It does NOT drop
-- or alter any other 009 object (policies, column grants, columns,
-- the other helper/trigger functions).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Trust ONLY full_name from client metadata. company_id stays NULL
  -- and company_role keeps its column default ('member'); both are
  -- assigned later by the service role via the invite flow. We never
  -- read company_id / company_role / role here, and never create a
  -- company from client-controlled metadata.
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
