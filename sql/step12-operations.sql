-- Aggregate only the authenticated owner's recovery metadata. No note bodies or identifiers.
begin;
create or replace function public.vault_operations_recovery(p_owner uuid)
returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 select jsonb_build_object('restoreCount',count(*),'lastRestoreAt',max(at))
 from vault_recovery.audit where owner_id=p_owner and operation='restore';
$$;
revoke all on function public.vault_operations_recovery(uuid) from public,anon,authenticated;
grant execute on function public.vault_operations_recovery(uuid) to service_role;
commit;
notify pgrst,'reload schema';
