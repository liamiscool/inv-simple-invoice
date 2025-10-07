-- Fix template insert policy to allow curated templates (org_id = null)
drop policy "Users can create templates in their org" on template;

create policy "Users can create templates in their org or curated templates" on template
  for insert with check (org_id = get_user_org_id() or org_id is null);