import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { supabase, type SkillTestQuestion } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const testProfiles = [
  {
    scope: "cpl",
    label: "CPL(A)",
    description:
      "P2006T systems, exact limitations, failures, performance and the follow-up questions an examiner uses to expose weak knowledge.",
  },
  {
    scope: "ir-pbn",
    label: "IR(A) with PBN",
    description:
      "Instrument procedures, PBN eligibility, avionics logic, approaches, holds and failures under progressive questioning.",
  },
  {
    scope: "sep",
    label: "SEP — Tecnam P2008JC",
    description:
      "Aircraft-specific preparation for the Sevenair P2008JC, built from the applicable AFM and operational documents.",
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
  const progressive = questions.filter((item) => (item.examiner_followups ?? []).length > 0).length;

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
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-600">
                Examiner pressure, not generic revision
              </p>
              <h1 className="mt-5 text-4xl font-light leading-tight tracking-tight text-slate-950 md:text-6xl">
                Answer. Get interrupted. Defend every detail.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                Short opening questions followed by increasingly precise interruptions: component,
                operating principle, exact values, indications, failure modes and AFM or QRH action.
                Answers stay hidden until the full interrogation is complete.
              </p>
              <Link
                href="/questions"
                className="mt-8 inline-flex rounded-lg bg-red-600 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-red-700"
              >
                Start oral interrogation
              </Link>
            </div>
            <aside className="bg-slate-950 p-8 text-white md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
                Curated bank
              </p>
              <Stat label="Active oral topics" value={questions.length} />
              <Stat label="Progressive drills" value={progressive} />
              <Stat label="Officially sourced" value={official} />
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
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-red-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-red-700">
                  {profile.label}
                </span>
                <span className="text-3xl text-red-500 transition group-hover:translate-x-1">→</span>
              </div>
              <p className="mt-6 min-h-24 text-sm leading-7 text-slate-600">
                {profile.description}
              </p>
              <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                {countFor(profile.scope)} exclusive topics
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm leading-7 text-slate-700">
          <strong className="text-slate-950">Interrogation rule:</strong> a vague answer is not marked as
          complete. The drill continues until you can give the exact aircraft value, explain the system
          consequence and state the applicable procedure.
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
