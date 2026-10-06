-- Learning-only fixtures. Hex is reversible encoding, not encryption.
begin;
create table if not exists public.vault_notes (
  id integer primary key,
  owner_id uuid,
  title text not null,
  content text not null
);
alter table public.vault_notes enable row level security;
revoke all on table public.vault_notes from public, anon, authenticated;
grant select on table public.vault_notes to service_role;
insert into public.vault_notes (id, title, content) values
  (1, convert_from(decode('eab3bceca09c', 'hex'), 'UTF8'), convert_from(decode('ec8ba4ec8ab5ec9aa920eab080ec838120eab3bceca09c20eab8b0eba19d', 'hex'), 'UTF8')),
  (2, convert_from(decode('ed8faced8ab8ed8fb4eba6acec98a4', 'hex'), 'UTF8'), convert_from(decode('ec8ba4ec8ab5ec9aa920eab080ec838120ed8faced8ab8ed8fb4eba6acec98a420eab8b0eba19d', 'hex'), 'UTF8')),
  (3, convert_from(decode('ec9584ecb9a820eba6acecb694ec96bc', 'hex'), 'UTF8'), convert_from(decode('ec8ba4ec8ab5ec9aa920eab080ec838120eba6acecb694ec96bc20eab8b0eba19d', 'hex'), 'UTF8')),
  (4, convert_from(decode('ed9b88eba0a820ed9689eca09520ec9e90eba38c', 'hex'), 'UTF8'), convert_from(decode('ec8ba4ec8ab5ec9aa920eab080ec838120ed9689eca09520eab8b0eba19d', 'hex'), 'UTF8'))
on conflict (id) do update set title = excluded.title, content = excluded.content;
commit;
-- Verify owner_id and RLS after execution:
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'vault_notes' and column_name = 'owner_id';
select relrowsecurity from pg_class where oid = 'public.vault_notes'::regclass;
select role, has_table_privilege(role, 'public.vault_notes', 'SELECT') as can_read
from (values ('anon'), ('authenticated')) as roles(role);
