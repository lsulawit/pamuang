-- Optional setup: paste into Supabase SQL Editor in YOUR project.
-- DO NOT enable payments with this SQL; payment entitlements require verified server-side webhooks.
-- Leaderboard is BETA because client-submitted scores can be tampered with.
create table if not exists public.scores (
 user_id uuid not null references auth.users(id) on delete cascade,
 mode text not null check (mode in ('ranked')),
 nickname text not null check (char_length(nickname) between 1 and 18),
 score integer not null check (score between 0 and 999999),
 updated_at timestamptz not null default now(),
 primary key (user_id,mode)
);
create table if not exists public.challenge_scores (
 room_code text not null check (room_code ~ '^[a-z0-9]{6,24}$'),
 user_id uuid not null references auth.users(id) on delete cascade,
 nickname text not null check (char_length(nickname) between 1 and 18),
 score integer not null check (score between 0 and 999999),
 created_at timestamptz not null default now(),
 primary key (room_code,user_id)
);
alter table public.scores enable row level security;
alter table public.challenge_scores enable row level security;
create policy "Everyone may read leaderboard" on public.scores for select using(true);
create policy "Players insert their own score" on public.scores for insert to authenticated with check(auth.uid()=user_id);
create policy "Players update their own score" on public.scores for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "Anyone with room code may read room scores" on public.challenge_scores for select using(true);
create policy "Players insert their own room score" on public.challenge_scores for insert to authenticated with check(auth.uid()=user_id);
create policy "Players update their own room score" on public.challenge_scores for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
-- Turn on Auth > Providers > Email (and Google if desired); set Site URL and redirect allow list to Vercel domain.
-- For cash competitions, replace direct client writes with signed server-scored RPC or Edge Function.
