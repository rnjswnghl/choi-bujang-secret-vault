-- Review and replace the two example emails locally in SQL Editor before running.
-- Run step3.sql first. No API or permission changes in this script.
begin;
do $$
declare
  a_id uuid;
  b_id uuid;
  a_email text := 'REPLACE_A_EMAIL';
  b_email text := 'REPLACE_B_EMAIL';
  fixture_ids uuid[] := array[
    md5('vault-learning-1')::uuid, md5('vault-learning-2')::uuid,
    md5('vault-learning-3')::uuid, md5('vault-learning-4')::uuid
  ];
begin
  if a_email = 'REPLACE_A_EMAIL' or b_email = 'REPLACE_B_EMAIL' then
    raise exception 'Replace A/B email placeholders in SQL Editor before execution.';
  end if;
  select id into a_id from auth.users where lower(email) = lower(a_email);
  select id into b_id from auth.users where lower(email) = lower(b_email);
  if a_id is null or b_id is null or a_id = b_id then
    raise exception 'Create distinct A/B learning accounts and replace the example emails.';
  end if;
  if (select count(*) from public.vault_notes where id = any(fixture_ids)) <> 4 then
    raise exception 'Expected four migrated learning fixtures; inspect step2/step3 setup first.';
  end if;
  update public.vault_notes set owner_id = a_id where id = any(fixture_ids[1:3]);
  update public.vault_notes set owner_id = b_id where id = fixture_ids[4];
end $$;
-- Inspect these four rows: first three must be A, fourth must be B.
select id, owner_id from public.vault_notes
where id in (md5('vault-learning-1')::uuid, md5('vault-learning-2')::uuid,
            md5('vault-learning-3')::uuid, md5('vault-learning-4')::uuid)
order by case id when md5('vault-learning-1')::uuid then 1
                 when md5('vault-learning-2')::uuid then 2
                 when md5('vault-learning-3')::uuid then 3 else 4 end;
commit;
