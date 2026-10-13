-- Review-only: no existing notes, users, permissions or data are changed.
begin;
create table if not exists public.vault_instructors (user_id uuid primary key references auth.users(id));
create table if not exists public.vault_notices (id uuid primary key default gen_random_uuid(), title text not null, content text not null);
alter table public.vault_instructors enable row level security;
alter table public.vault_notices enable row level security;
revoke all on table public.vault_instructors, public.vault_notices from public, anon, authenticated;
grant select on table public.vault_instructors to service_role;
grant select, update on table public.vault_notices to service_role;
commit;
-- Assign an instructor only in SQL Editor after verifying the real Auth UUID.
-- No instructor or notice is created by this script. Never let clients grant their own role.
