alter table public.skill_test_questions
  add column if not exists examiner_followups jsonb not null default '[]'::jsonb,
  add column if not exists common_wrong_answers text[] not null default '{}'::text[];

alter table public.skill_test_questions
  drop constraint if exists skill_test_questions_examiner_followups_array;

alter table public.skill_test_questions
  add constraint skill_test_questions_examiner_followups_array
  check (jsonb_typeof(examiner_followups) = 'array');

comment on column public.skill_test_questions.examiner_followups is
  'Ordered oral-exam interruptions. Each array element contains question and expected_answer strings.';

comment on column public.skill_test_questions.common_wrong_answers is
  'Typical weak or incorrect answers that an examiner would challenge.';
