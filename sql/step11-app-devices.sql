-- Supabase SQL Editor: create the private server device registry once.
begin;
create table if not exists public.vault_app_devices (
 id text primary key check(id ~ '^[a-f0-9]{64}$'),owner_id uuid not null,
 public_key jsonb not null,status text not null default 'pending' check(status in ('pending','approved','revoked')),
 requested_at timestamptz not null default now()
);
create table if not exists public.vault_app_nonces (
 device_id text references public.vault_app_devices(id),nonce text not null check(nonce ~ '^[a-f0-9]{32}$'),
 used_at timestamptz not null default now(),primary key(device_id,nonce)
);
alter table public.vault_app_devices enable row level security;
alter table public.vault_app_nonces enable row level security;
revoke all on public.vault_app_devices,public.vault_app_nonces from public,anon,authenticated;
grant select,insert,update on public.vault_app_devices to service_role;
grant insert on public.vault_app_nonces to service_role;
commit;
notify pgrst,'reload schema';
-- Review owner and device identifier before separately approving EXACTLY ONE row:
-- update public.vault_app_devices set status='approved'
-- where id='REPLACE_DEVICE_ID' and owner_id='REPLACE_OWNER_UUID' and status='pending';
-- Revoke with status='revoked'. Never approve every pending row.
