create table if not exists public.workflows (
  id text primary key,
  name text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  revision integer not null default 0 check (revision >= 0),
  graph jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  published_at timestamptz
);

create index if not exists workflows_updated_at_idx on public.workflows (updated_at desc);
