-- 005: enable realtime on alerts so the app can receive new-alert
-- notifications via postgres_changes. Idempotent — safe to re-run.

do $$ begin
  alter publication supabase_realtime add table public.alerts;
exception when duplicate_object then null;
end $$;
