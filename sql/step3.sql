-- Run step2.sql first. Preserve existing learning records; convert integer IDs to UUIDs.
begin;
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vault_notes' and column_name='id' and data_type='integer') then
    alter table public.vault_notes alter column id drop default;
    alter table public.vault_notes alter column id type uuid using md5('vault-learning-' || id::text)::uuid;
  end if;
end $$;
alter table public.vault_notes alter column id set default gen_random_uuid();
alter table public.vault_notes enable row level security;
revoke all on public.vault_notes from public, anon, authenticated;
grant select, insert, update, delete on public.vault_notes to service_role;
commit;
-- Legacy fixtures remain unowned and do not appear in an account's list.
-- Optional: assign legacy rows to A using A's UUID from Auth Users, directly in SQL Editor.
