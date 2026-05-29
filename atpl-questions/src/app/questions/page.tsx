import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import NewTestForm from "@/components/NewTestForm";
import QuestionRunner from "@/components/QuestionRunner";
import { supabase, type Question } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    session?: string;
    new?: string;
  }>;
};

type SessionAnswerRow = {
  question_id: string;
  selected_option: "A" | "B" | "C" | "D";
  correct_option: "A" | "B" | "C" | "D";
  is_correct: boolean;
};

type SessionQuestionRow = {
  position: number;
  question: Question | Question[] | null;
};

type QuestionTopicRow = {
  subject: string;
  topic: string | null;
};

export default async function QuestionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.session ?? null;

  if (!sessionId) {
    const subjectsResult = await supabase
      .from("questions")
      .select("subject, topic")
      .order("subject", { ascending: true })
      .order("topic", { ascending: true });

    const rows = (subjectsResult.data ?? []) as QuestionTopicRow[];

    const subjectMap = new Map<string, Set<string>>();

    for (const row of rows) {
      if (!row.subject) continue;

      if (!subjectMap.has(row.subject)) {
        subjectMap.set(row.subject, new Set<string>());
      }

      if (row.topic) {
        subjectMap.get(row.subject)?.add(row.topic);
      }
    }

    const subjectTopics = Array.from(subjectMap.entries()).map(
      ([subject, topics]) => ({
        subject,
        topics: Array.from(topics).sort((a, b) => a.localeCompare(b)),
      })
    );

    return (
      <main className="min-h-screen bg-[#f4f6fa]">
        <AppHeader />
        <NewTestForm subjectTopics={subjectTopics} />
      </main>
    );
  }

  const [sessionResult, sessionQuestionsResult, answersResult] = await Promise.all([
    supabase
      .from("test_sessions")
      .select("*")
      .eq("id", sessionId)
      .single(),

    supabase
      .from("test_session_questions")
      .select("position, question:questions(*)")
      .eq("session_id", sessionId)
      .order("position", { ascending: true }),

    supabase
      .from("test_session_answers")
      .select("question_id, selected_option, correct_option, is_correct")
      .eq("session_id", sessionId),
  ]);

  const session = sessionResult.data;

  const rows = (sessionQuestionsResult.data ?? []) as SessionQuestionRow[];

  const questions = rows
    .map((row) => {
      if (Array.isArray(row.question)) return row.question[0] ?? null;
      return row.question;
    })
    .filter(Boolean) as Question[];

  const answerRows = (answersResult.data ?? []) as SessionAnswerRow[];

  const initialAnswers = Object.fromEntries(
    answerRows.map((answer) => [
      answer.question_id,
      {
        selectedOption: answer.selected_option,
        correctOption: answer.correct_option,
        isCorrect: answer.is_correct,
      },
    ])
  );

  const initialCurrentIndex = session?.current_index ?? 0;

  return (
    <main className="min-h-screen bg-[#f4f6fa]">
      <AppHeader />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-black uppercase tracking-[0.14em] text-amber-500 transition hover:text-amber-600"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-3 text-5xl font-light tracking-wide text-slate-950">
              {session?.topic ?? session?.subject ?? "Saved Test"}
            </h1>

            <p className="mt-2 text-slate-600">
              Click an answer to save it automatically. Use ← and → to move between questions.
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Questions
            </p>
            <p className="mt-1 text-2xl font-light text-slate-950">
              {questions.length}
            </p>
          </div>
        </div>

        <QuestionRunner
          questions={questions}
          initialSessionId={sessionId}
          initialCurrentIndex={initialCurrentIndex}
          initialAnswers={initialAnswers}
        />
      </section>
    </main>
  );
}
