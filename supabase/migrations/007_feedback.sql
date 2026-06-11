-- Feedback table: in-app bug reports and suggestions from beta users.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  email text,
  category text not null check (category in ('bug', 'sugestao', 'outro')),
  message text not null,
  page text,
  user_agent text,
  created_at timestamptz default now()
);

alter table public.feedback enable row level security;

-- Owners may insert their own feedback.
create policy "feedback: owner insert" on public.feedback
  for insert
  with check (auth.uid() = user_id);

-- Only admins may read feedback, via the JWT app_metadata role
-- (same pattern as migration 003).
create policy "feedback: admin select" on public.feedback
  for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);
