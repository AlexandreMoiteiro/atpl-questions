do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'skill_test_questions_active_quality_check'
      and conrelid = 'public.skill_test_questions'::regclass
  ) then
    alter table public.skill_test_questions
      add constraint skill_test_questions_active_quality_check
      check (
        not is_active
        or (
          difficulty = 'advanced'
          and length(btrim(examiner_question)) >= 70
          and length(btrim(model_answer)) >= 250
          and cardinality(key_points) >= 3
          and nullif(btrim(source_document), '') is not null
          and nullif(btrim(source_section), '') is not null
          and nullif(btrim(source_authority), '') is not null
        )
      );
  end if;
end
$$;

comment on constraint skill_test_questions_active_quality_check
  on public.skill_test_questions
  is 'Active oral skill-test questions must meet the examiner-level quality floor: advanced difficulty, developed scenario and answer, at least three key points, and identified source metadata.';
