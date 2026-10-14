-- Run once in Supabase SQL Editor BEFORE the attack/recovery test.
-- Private first snapshots are immutable through the public API. Existing notes are preserved.
begin;
create schema if not exists vault_recovery;
revoke all on schema vault_recovery from public, anon, authenticated;
create extension if not exists pgcrypto with schema extensions;
create table if not exists vault_recovery.note_backups (
 id uuid primary key, owner_id uuid not null, title text not null, content text not null,
 content_hash text not null, captured_at timestamptz not null default now()
);
create table if not exists vault_recovery.audit (
 event_id bigint generated always as identity primary key,
 at timestamptz not null default now(), note_id uuid not null,
 owner_id uuid not null, content_hash text not null, operation text not null
);
alter table vault_recovery.note_backups enable row level security;
alter table vault_recovery.audit enable row level security;
revoke all on all tables in schema vault_recovery from public, anon, authenticated;
create or replace function vault_recovery.capture_insert() returns trigger
language plpgsql security definer set search_path = pg_catalog as $$
begin
 insert into vault_recovery.note_backups(id,owner_id,title,content,content_hash)
 values(new.id,new.owner_id,new.title,new.content,
 encode(extensions.digest(convert_to(jsonb_build_array(new.title,new.content)::text,'UTF8'),'sha256'),'hex'))
 on conflict(id) do nothing;
 return new;
end $$;
revoke all on function vault_recovery.capture_insert() from public,anon,authenticated;
drop trigger if exists vault_recovery_first_insert on public.vault_notes;
create trigger vault_recovery_first_insert after insert on public.vault_notes
 for each row execute function vault_recovery.capture_insert();
-- Captures existing rows once; rerunning never overwrites a pre-existing snapshot.
insert into vault_recovery.note_backups(id,owner_id,title,content,content_hash)
 select id,owner_id,title,content,
 encode(extensions.digest(convert_to(jsonb_build_array(title,content)::text,'UTF8'),'sha256'),'hex')
 from public.vault_notes where owner_id is not null
 on conflict(id) do nothing;

create or replace function public.restore_vault_note(p_id uuid,p_owner uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog as $$
declare b vault_recovery.note_backups%rowtype; current_owner uuid; actual_hash text;
begin
 -- Serialize this target only. No policy, unrelated notes, or audit deletion.
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into b from vault_recovery.note_backups where id=p_id for share;
 if not found or b.owner_id<>p_owner then raise exception 'backup_not_available'; end if;
 actual_hash:=encode(extensions.digest(convert_to(jsonb_build_array(b.title,b.content)::text,'UTF8'),'sha256'),'hex');
 if actual_hash<>b.content_hash then raise exception 'backup_verification_failed'; end if;
 select owner_id into current_owner from public.vault_notes where id=p_id for update;
 if found and current_owner is distinct from p_owner then raise exception 'restore_owner_mismatch'; end if;
 insert into public.vault_notes(id,owner_id,title,content) values(b.id,b.owner_id,b.title,b.content)
 on conflict(id) do update set title=excluded.title,content=excluded.content
 where public.vault_notes.owner_id=p_owner;
 select encode(extensions.digest(convert_to(jsonb_build_array(title,content)::text,'UTF8'),'sha256'),'hex')
 into actual_hash from public.vault_notes where id=b.id and owner_id=b.owner_id;
 if actual_hash is distinct from b.content_hash then raise exception 'restore_verification_failed'; end if;
 insert into vault_recovery.audit(note_id,owner_id,content_hash,operation)
 values(b.id,b.owner_id,b.content_hash,'restore');
 return jsonb_build_object('restored',true,'id',b.id,'contentHash',b.content_hash);
end $$;
revoke all on function public.restore_vault_note(uuid,uuid) from public,anon,authenticated;
grant execute on function public.restore_vault_note(uuid,uuid) to service_role;
commit;
notify pgrst, 'reload schema';
-- No private memo contents in the verification output.
select count(*) as verified_backups from vault_recovery.note_backups
where content_hash=encode(extensions.digest(convert_to(jsonb_build_array(title,content)::text,'UTF8'),'sha256'),'hex');
