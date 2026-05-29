import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import OpenTestsTable from "@/components/OpenTestsTable";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type SubjectSummary = {
  subject: string;
  total: number;
};

type TestSessionRow = {
  id: string;
  mode: "study" | "exam";
  status: "active" | "completed" | "abandoned";
  subject: string | null;
  topic: string | null;
  current_index: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score_percent: number | string | null;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
};

type CompletedSessionRow = {
  score_percent: number | string | null;
  correct_answers: number;
  wrong_answers: number;
};

export default async function HomePage() {
  const [
    questionsResult,
    activeSessionsResult,
    completedSessionsResult,
    completedCountResult,
    allSessionsResult,
  ] = await Promise.all([
    supabase
      .from("questions")
      .select("subject", { count: "exact" })
      .order("subject", { ascending: true }),

    supabase
      .from("test_sessions")
      .select("*")
      .eq("status", "active")
      .eq("visitor_id", "anonymous")
      .order("updated_at", { ascending: false }),

    supabase
      .from("test_sessions")
      .select("score_percent, correct_answers, wrong_answers")
      .eq("status", "completed")
      .eq("visitor_id", "anonymous")
      .order("completed_at", { ascending: false })
      .limit(25),

    supabase
      .from("test_sessions")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .eq("visitor_id", "anonymous"),

    supabase
      .from("test_sessions")
      .select("correct_answers, wrong_answers")
      .eq("visitor_id", "anonymous"),
  ]);

  const questionRows = questionsResult.data ?? [];
  const totalQuestions = questionsResult.count ?? 0;

  const activeSessions = (activeSessionsResult.data ?? []) as TestSessionRow[];
  const completedSessions = (completedSessionsResult.data ?? []) as CompletedSessionRow[];

  const scores = completedSessions
    .map((session) => Number(session.score_percent ?? 0))
    .filter((score) => Number.isFinite(score));

  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

  const completedTests = completedCountResult.count ?? 0;

  const questionsSeen = (allSessionsResult.data ?? []).reduce((total, session) => {
    return total + (session.correct_answers ?? 0) + (session.wrong_answers ?? 0);
  }, 0);

  const subjectsMap = new Map<string, number>();

  for (const item of questionRows) {
    const subject = item.subject || "General";
    subjectsMap.set(subject, (subjectsMap.get(subject) ?? 0) + 1);
  }

  const subjects: SubjectSummary[] = Array.from(subjectsMap.entries()).map(
    ([subject, total]) => ({
      subject,
      total,
    })
  );

  return (
    <main className="min-h-screen bg-[#f4f6fa] text-slate-900">
      <AppHeader />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-lg bg-amber-400 p-6 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/80">
              Statistics
            </p>

            <div className="mt-7 space-y-6">
              <StatBlock label="Average Score" value={`${averageScore}%`} />
              <StatBlock label="Questions Seen" value={questionsSeen.toString()} />
              <StatBlock label="Available" value={totalQuestions.toString()} />
            </div>
          </aside>

          <div className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-500">
                  Dashboard
                </p>

                <h1 className="mt-4 max-w-2xl text-4xl font-light leading-tight tracking-wide text-slate-950 md:text-5xl">
                  Personal ATPL question bank.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  Start a new test, resume an open test, or track your progress
                  through ICAO Doc 8168 questions.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <MetricCard label="Open Tests" value={activeSessions.length.toString()} />
              <MetricCard label="Completed" value={completedTests.toString()} />
              <MetricCard label="Subjects" value={subjects.length.toString()} />
            </div>

            <div className="mt-7">
              <ScoreProgressChart scores={scores} />
            </div>
          </div>
        </div>

        <div className="mt-7">
          <SectionHeader title="Open Tests" />
          <OpenTestsTable sessions={activeSessions} />
        </div>

        <div className="mt-7">
          <SectionHeader title="Subjects" />

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link
                key={subject.subject}
                href="/questions?new=1"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-light tracking-wide text-slate-950">
                      {subject.subject}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {subject.total} questions
                    </p>
                  </div>

                  <span className="text-3xl font-light text-amber-400">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/75">
        {label}
      </p>

      <p className="mt-1 text-4xl font-light tracking-wide text-white">
        {value}
      </p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-light tracking-wide text-slate-950">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex h-12 items-center justify-between rounded-lg bg-amber-400 px-5 text-white shadow-sm">
      <h2 className="text-xl font-light tracking-wide">{title}</h2>
      <span className="text-2xl text-amber-700/40">●</span>
    </div>
  );
}

function ScoreProgressChart({ scores }: { scores: number[] }) {
  const recentScores = scores.slice(0, 12).reverse();

  if (recentScores.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            Score Progress
          </p>

          <p className="text-sm font-semibold text-slate-500">
            No completed tests yet
          </p>
        </div>

        <div className="mt-5 flex h-28 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-400">
          Complete a test to build your progress chart.
        </div>
      </div>
    );
  }

  const maxX = 760;
  const step = recentScores.length > 1 ? maxX / (recentScores.length - 1) : maxX;

  const points = recentScores.map((score, index) => {
    const safeScore = Math.max(0, Math.min(100, score));
    const x = index * step;
    const y = 110 - safeScore;
    return [x, y];
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`)
    .join(" ");

  return (
    <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          Score Progress
        </p>

        <p className="text-sm font-semibold text-slate-500">
          Last {recentScores.length} completed tests
        </p>
      </div>

      <svg viewBox="0 0 760 130" className="h-32 w-full">
        {[20, 45, 70, 95, 120].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="760"
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        <path
          d={path}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map(([x, y], index) => (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="5"
            fill="#ffffff"
            stroke="#fbbf24"
            strokeWidth="3"
          />
        ))}
      </svg>
    </div>
  );
}
