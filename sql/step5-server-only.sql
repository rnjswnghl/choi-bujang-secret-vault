-- Review and run manually after confirming A's CRUD through the Vercel API.
-- Only public.vault_notes is affected. Existing rows, RLS and service_role remain intact.
-- BEFORE: explicit grants and effective table privileges.
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='vault_notes'
  and grantee in ('PUBLIC','anon','authenticated') order by grantee, privilege_type;
select r.role, p.privilege,
  has_table_privilege(r.role, 'public.vault_notes', p.privilege) as table_allowed
from (values ('anon'),('authenticated')) r(role)
cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege);

begin;
revoke all on table public.vault_notes from public, anon, authenticated;
-- Column grants can survive a table-level REVOKE; remove them on this table too.
do $$
declare cols text;
begin
  select string_agg(quote_ident(attname), ', ') into cols from pg_attribute
  where attrelid='public.vault_notes'::regclass and attnum > 0 and not attisdropped;
  execute format('revoke all privileges (%s) on table public.vault_notes from public, anon, authenticated', cols);
end $$;
commit;

-- AFTER: both roles must have no table or column access. If false is not observed,
-- investigate inherited grants before claiming the direct path is closed.
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='vault_notes'
  and grantee in ('PUBLIC','anon','authenticated') order by grantee, privilege_type;
select r.role, p.privilege,
  has_table_privilege(r.role, 'public.vault_notes', p.privilege) as table_allowed
from (values ('anon'),('authenticated')) r(role)
cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege);
select r.role, p.privilege,
  has_any_column_privilege(r.role, 'public.vault_notes', p.privilege) as column_allowed
from (values ('anon'),('authenticated')) r(role)
cross join (values ('SELECT'),('INSERT'),('UPDATE'),('REFERENCES')) p(privilege);
select has_table_privilege('service_role','public.vault_notes','SELECT') as server_select,
       has_table_privilege('service_role','public.vault_notes','INSERT') as server_insert,
       has_table_privilege('service_role','public.vault_notes','UPDATE') as server_update,
       has_table_privilege('service_role','public.vault_notes','DELETE') as server_delete;
