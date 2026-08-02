import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { supabase, type SkillTestQuestion } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const testProfiles = [
  {
    scope: "cpl",
    label: "CPL(A)",
    description: "Performance, planning, diversion, tolerances and commercial-pilot judgement.",
  },
  {
    scope: "ir-pbn",
    label: "IR(A) with PBN",
    description: "Instrument tolerances, PBN eligibility, approaches, holdings and failures.",
  },
  {
    scope: "sep",
    label: "SEP — Tecnam P2008JC",
    description: "Appendix 9 and aircraft-specific preparation for the Sevenair P2008JC.",
  },
] as const;

type PracticeScope = (typeof testProfiles)[number]["scope"];

export default async function HomePage() {
  const { data, error } = await supabase
    .from("skill_test_questions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const questions = (data ?? []) as SkillTestQuestion[];
  const official = questions.filter((item) => item.verification_status === "official").length;
  const p2008 = questions.filter((item) => item.aircraft_model === "Tecnam P2008JC").length;

  function countFor(scope: PracticeScope) {
    return questions.filter((item) => item.skill_test_scope === scope).length;
  }

  return (
    <main className="min-h-screen bg-[#f4f6fa] text-slate-900">
      <AppHeader />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.4fr_0.6fr]">
            <div className="p-8 md:p-12">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-500">
                Examiner-focused oral preparation
              </p>
              <h1 className="mt-5 text-4xl font-light leading-tight tracking-tight text-slate-950 md:text-6xl">
                Explain the decision. Defend the source.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                One hundred and fifty advanced oral scenarios split into three independent banks.
                Choosing CPL, IR/PBN or SEP now loads only the questions assigned to that specific
                skill test.
              </p>
              <Link
                href="/questions"
                className="mt-8 inline-flex rounded-lg bg-amber-400 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-amber-500"
              >
                Start oral practice
              </Link>
            </div>
            <aside className="bg-slate-950 p-8 text-white md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                Curated bank
              </p>
              <Stat label="Advanced prompts" value={questions.length} />
              <Stat label="Officially sourced" value={official} />
              <Stat label="Tecnam P2008JC" value={p2008} />
            </aside>
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error.message}
          </p>
        )}

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {testProfiles.map((profile) => (
            <Link
              key={profile.scope}
              href={`/questions?scope=${profile.scope}`}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                  {profile.label}
                </span>
                <span className="text-3xl text-amber-400 transition group-hover:translate-x-1">→</span>
              </div>
              <p className="mt-6 min-h-20 text-sm leading-7 text-slate-600">
                {profile.description}
              </p>
              <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                {countFor(profile.scope)} exclusive prompts
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-slate-700">
          <strong className="text-slate-950">Separate-bank rule:</strong> each active prompt belongs to
          exactly one profile. P2006T material is assigned to CPL or IR/PBN; P2008JC material is
          assigned only to SEP.
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">{label}</p>
      <p className="mt-2 text-4xl font-light">{value}</p>
    </div>
  );
}
