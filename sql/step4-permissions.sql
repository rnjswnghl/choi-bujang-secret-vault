-- Review and execute manually. Only public.vault_notes is changed.
-- BEFORE: inspect inherited PUBLIC privileges as well as explicit role grants.
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='vault_notes'
  and grantee in ('PUBLIC','anon','authenticated') order by grantee, privilege_type;
select r.role, p.privilege, has_table_privilege(r.role, 'public.vault_notes', p.privilege) as allowed
from (values ('anon'),('authenticated')) r(role)
cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege);

begin;
revoke all on table public.vault_notes from public, anon, authenticated;
-- Remove any column-level grants that could survive table-level REVOKE.
do $$
declare cols text;
begin
  select string_agg(quote_ident(attname), ', ') into cols from pg_attribute
  where attrelid='public.vault_notes'::regclass and attnum > 0 and not attisdropped;
  execute format('revoke all privileges (%s) on table public.vault_notes from public, anon, authenticated', cols);
end $$;
alter table public.vault_notes enable row level security;
-- Permissive policies are OR'ed: remove old policies on this table before replacement.
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='vault_notes' loop
    execute format('drop policy %I on public.vault_notes', p.policyname);
  end loop;
end $$;
grant select, insert, update, delete on table public.vault_notes to authenticated;
create policy vault_select_own on public.vault_notes for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy vault_insert_own on public.vault_notes for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy vault_update_own on public.vault_notes for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy vault_delete_own on public.vault_notes for delete to authenticated
  using ((select auth.uid()) = owner_id);
commit;

-- AFTER: anon must be false for all seven; authenticated true only for CRUD.
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='vault_notes'
  and grantee in ('PUBLIC','anon','authenticated') order by grantee, privilege_type;
select r.role, p.privilege, has_table_privilege(r.role, 'public.vault_notes', p.privilege) as allowed
from (values ('anon'),('authenticated')) r(role)
cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege);
select policyname, cmd, roles, qual, with_check from pg_policies
where schemaname='public' and tablename='vault_notes' order by policyname;
