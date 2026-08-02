do $$
declare
  common_count integer;
  updated_count integer;
begin
  select count(*)
  into common_count
  from public.skill_test_questions
  where is_active = true
    and skill_test_scope = 'common';

  with mapping(section_code, topic, target_scope) as (
    values
      ('ANAC FEH 7.5', 'Combined weather and system-defect scenario', 'cpl'),
      ('ANAC FEH 6(a)', 'Hierarchy and applicability of aircraft documents', 'sep'),
      ('AMC2 FCL.1015(s)(3)', 'Agreed simulation limits and examiner intervention', 'ir-pbn'),
      ('P2006T AFM Section 0', 'Applicability of P2006T AFM data', 'cpl'),
      ('SERA.5001 Table S5-1', 'VMC minima across altitude boundaries', 'cpl'),
      ('SERA.8015', 'Unsafe or doubtful ATC clearance', 'cpl'),
      ('FCL.305.A; FCL.605; FCL.700', 'Privileges after course completion', 'cpl'),
      ('FCL-SEP-01', 'SEP revalidation by experience across the validity period', 'sep'),
      ('FCL.060', 'Passenger recency across class, day and night', 'sep'),
      ('FCL-SEP-02', 'SEP instructor-flight exemption trap', 'sep'),
      ('ICAO Doc 8168 Vol I', 'DA/H, MDA/H, CDFA and MAPt interaction', 'ir-pbn'),
      ('FCL-SEP-03', 'Renewal of an expired SEP rating', 'sep'),
      ('FCL-REC-01', 'Night passenger recency with day landings', 'sep'),
      ('ICAO Annex 3 / EASA MET rules', 'Overlapping BECMG, TEMPO and PROB at the arrival window', 'cpl'),
      ('ICAO Annex 3', 'RVR versus meteorological visibility', 'ir-pbn'),
      ('P2006T AFM Section 7', 'Stall strip function', 'cpl'),
      ('P2006T AFM Section 7', 'Left bus and right bus controls', 'ir-pbn'),
      ('SERA-IFR-01', 'Changing from VFR to IFR before entering IMC', 'ir-pbn'),
      ('P2006T AFM Sections 2, 3 and 7', 'Electrical failure diagnosis', 'ir-pbn'),
      ('SERA-SVFR-02', 'Special VFR crossing versus aerodrome minima', 'sep'),
      ('SERA-VMC-02', 'Reduced Class G visibility is not automatic', 'sep'),
      ('SERA.14095', 'Minimum fuel versus MAYDAY fuel', 'cpl'),
      ('FCL-01', 'Licence, rating and medical interaction', 'cpl'),
      ('FCL-02', 'Ramp inspection evidence and electronic documents', 'cpl'),
      ('FCL-05', 'Class rating applicability', 'sep'),
      ('LAW-01', 'PIC authority versus ATC clearance', 'cpl'),
      ('LAW-02', 'Conditional runway clearance', 'cpl'),
      ('LAW-04', 'Class C separation, traffic information and see-and-avoid', 'cpl'),
      ('LAW-09', 'VFR in Class C after radio failure', 'sep'),
      ('LAW-10', 'VFR cruising levels across the transition altitude', 'sep'),
      ('LAW-11', 'Arrival report failure and alerting-service consequences', 'sep'),
      ('LAW-12', 'Special VFR misunderstanding', 'sep'),
      ('ASSESS-01', 'Fail despite remaining within tolerance', 'cpl'),
      ('ASSESS-02', 'Allowance for turbulence and ATC', 'cpl'),
      ('FCL-ADV-07', 'CPL with only an LAPL medical', 'sep'),
      ('FCL-ADV-10', 'Passenger recency across SEP and MEP', 'sep'),
      ('FCL-ADV-11', 'Night passenger recency with an IR', 'sep'),
      ('FCL-ADV-12', 'Variant differences and familiarisation', 'sep'),
      ('SERA-01', 'VFR weather deterioration in controlled airspace', 'cpl'),
      ('SERA-02', 'Clearance before entering controlled airspace', 'cpl'),
      ('SERA-03', 'Reduced Class G visibility conditions', 'sep'),
      ('SERA-04', 'Special VFR transit below aerodrome reporting minima', 'sep'),
      ('SERA-05', 'Special VFR at night', 'sep'),
      ('SERA-06', 'Conditional runway clearance after losing visual contact', 'cpl'),
      ('SERA-11', 'Emergency departure from the rules', 'cpl'),
      ('SERA-12', 'Flight information versus pilot decision', 'cpl'),
      ('MET-ADV-01', 'QNH error and obstacle clearance', 'ir-pbn'),
      ('MET-ADV-02', 'Carburettor icing without visible moisture', 'sep'),
      ('MET-ADV-03', 'TEMPO/PROB weather and planning minima', 'ir-pbn'),
      ('MET-ADV-04', 'Embedded convection on an IFR route', 'ir-pbn'),
      ('PERF-ADV-01', 'Density altitude and climb margin', 'cpl')
  )
  update public.skill_test_questions as question
  set skill_test_scope = mapping.target_scope,
      updated_at = now()
  from mapping
  where question.is_active = true
    and question.skill_test_scope = 'common'
    and question.section_code = mapping.section_code
    and question.topic = mapping.topic;

  get diagnostics updated_count = row_count;

  if common_count > 0 and updated_count <> common_count then
    raise exception 'Expected to reassign % active common questions, reassigned %', common_count, updated_count;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'skill_test_questions_no_active_common_check'
      and conrelid = 'public.skill_test_questions'::regclass
  ) then
    alter table public.skill_test_questions
      add constraint skill_test_questions_no_active_common_check
      check (not is_active or skill_test_scope <> 'common');
  end if;
end
$$;

comment on constraint skill_test_questions_no_active_common_check
  on public.skill_test_questions
  is 'Active questions belong to exactly one selectable skill-test bank; common questions are not injected across profiles.';
