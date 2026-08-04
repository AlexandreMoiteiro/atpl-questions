alter table public.skill_test_questions
  drop constraint if exists skill_test_questions_active_quality_check;

alter table public.skill_test_questions
  add constraint skill_test_questions_active_quality_check
  check (
    not is_active
    or (
      difficulty = 'advanced'
      and (
        length(btrim(examiner_question)) >= 70
        or jsonb_array_length(examiner_followups) >= 4
      )
      and length(btrim(model_answer)) >= 250
      and cardinality(key_points) >= 3
      and nullif(btrim(source_document), '') is not null
      and nullif(btrim(source_section), '') is not null
      and nullif(btrim(source_authority), '') is not null
    )
  );
