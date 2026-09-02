alter table public.workflows
  add column if not exists published_revision integer,
  add column if not exists published_graph jsonb;

alter table public.workflows
  add constraint workflows_published_revision_check
  check (published_revision is null or published_revision >= 0);
