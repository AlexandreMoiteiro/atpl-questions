create table if not exists public.skill_test_questions (
  id uuid primary key default gen_random_uuid(),
  skill_test_scope text not null
    check (skill_test_scope in ('common', 'cpl', 'ir-pbn', 'sep')),
  section_code text not null,
  category text not null,
  topic text not null,
  aircraft_model text,
  examiner_question text not null,
  model_answer text not null,
  key_points text[] not null default '{}',
  source_document text not null,
  source_revision text,
  source_section text not null,
  source_page text,
  source_url text,
  source_authority text not null,
  verification_status text not null default 'official'
    check (verification_status in ('official', 'aircraft_manual_required')),
  difficulty text not null default 'intermediate'
    check (difficulty in ('core', 'intermediate', 'advanced')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.skill_test_questions enable row level security;

drop policy if exists "Public can read active skill test questions"
  on public.skill_test_questions;

create policy "Public can read active skill test questions"
  on public.skill_test_questions
  for select
  to anon, authenticated
  using (is_active = true);

grant select on table public.skill_test_questions to anon, authenticated;

create index if not exists skill_test_questions_scope_idx
  on public.skill_test_questions (skill_test_scope, is_active, sort_order);

create index if not exists skill_test_questions_category_idx
  on public.skill_test_questions (category, topic);

comment on table public.skill_test_questions is
  'Curated oral-examination question bank for CPL, IR/PBN and SEP skill tests.';

comment on column public.skill_test_questions.verification_status is
  'official = supported by cited authority; aircraft_manual_required = exact aircraft AFM/POH revision must be checked before operational use.';
