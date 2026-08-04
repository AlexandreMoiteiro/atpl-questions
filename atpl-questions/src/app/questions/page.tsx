import AppHeader from "@/components/AppHeader";
import NewTestForm from "@/components/NewTestForm";
import OralQuestionRunner from "@/components/OralQuestionRunner";
import {
  supabase,
  type SkillTestQuestion,
  type SkillTestScope,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const profiles = {
  cpl: {
    label: "CPL(A) — Tecnam P2006T",
    description:
      "Aircraft systems, exact values, failure indications, limitations and QRH actions under progressive examiner pressure.",
  },
  "ir-pbn": {
    label: "IR(A) with PBN",
    description:
      "IFR procedures, avionics logic, PBN eligibility, approaches, holds and failures under progressive questioning.",
  },
  sep: {
    label: "SEP — Tecnam P2008JC",
    description:
      "Aircraft-specific preparation for the Sevenair Tecnam P2008JC using the applicable AFM and operational documents.",
  },
} as const;

type PracticeScope = keyof typeof profiles;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isPracticeScope(value: string | undefined): value is PracticeScope {
  return value === "cpl" || value === "ir-pbn" || value === "sep";
}

export default async function QuestionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedScope = firstValue(params.scope);
  const requestedCategory = firstValue(params.category)?.trim() || "";

  const { data, error } = await supabase
    .from("skill_test_questions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const allQuestions = (data ?? []) as SkillTestQuestion[];

  const groups = (Object.keys(profiles) as PracticeScope[]).map((scope) => {
    const questions = allQuestions.filter((question) => question.skill_test_scope === scope);
    const categories = Array.from(new Set(questions.map((question) => question.category))).sort(
      (left, right) => left.localeCompare(right)
    );

    return {
      scope: scope as SkillTestScope,
      label: profiles[scope].label,
      description: profiles[scope].description,
      categories,
      count: questions.length,
    };
  });

  if (!isPracticeScope(requestedScope)) {
    return (
      <main className="min-h-screen bg-[#f4f6fa] text-slate-900">
        <AppHeader />
        {error && (
          <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            Could not load the curated bank: {error.message}
          </div>
        )}
        <NewTestForm groups={groups} />
      </main>
    );
  }

  const questionsForScope = allQuestions.filter(
    (question) => question.skill_test_scope === requestedScope
  );
  const filteredQuestions = requestedCategory
    ? questionsForScope.filter((question) => question.category === requestedCategory)
    : questionsForScope;

  return (
    <main className="min-h-screen bg-[#f4f6fa] text-slate-900">
      <AppHeader />
      {error && (
        <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Could not load the curated bank: {error.message}
        </div>
      )}
      <OralQuestionRunner
        questions={filteredQuestions}
        profileLabel={profiles[requestedScope].label}
        categoryLabel={requestedCategory || null}
      />
    </main>
  );
}
