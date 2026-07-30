"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SkillTestQuestion } from "@/lib/supabase";

type ReviewState = "ready" | "review";

type Props = {
  questions: SkillTestQuestion[];
  profileLabel: string;
  categoryLabel?: string | null;
};

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export default function OralQuestionRunner({
  questions,
  profileLabel,
  categoryLabel,
}: Props) {
  const [orderedQuestions, setOrderedQuestions] = useState(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewState>>({});

  const currentQuestion = orderedQuestions[currentIndex];
  const reviewedCount = useMemo(
    () => Object.keys(reviewStates).length,
    [reviewStates]
  );
  const readyCount = useMemo(
    () => Object.values(reviewStates).filter((state) => state === "ready").length,
    [reviewStates]
  );

  if (!currentQuestion) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-4xl font-light text-slate-950">No prompts found.</h1>
        <p className="mt-4 text-slate-600">Choose another profile or category.</p>
        <Link
          href="/questions"
          className="mt-7 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white"
        >
          Change filters
        </Link>
      </div>
    );
  }

  function moveTo(index: number) {
    setCurrentIndex(index);
    setRevealed(false);
  }

  function assess(state: ReviewState) {
    setReviewStates((previous) => ({
      ...previous,
      [currentQuestion.id]: state,
    }));

    if (currentIndex < orderedQuestions.length - 1) {
      window.setTimeout(() => moveTo(currentIndex + 1), 120);
    }
  }

  function shuffleQuestions() {
    setOrderedQuestions(shuffled(orderedQuestions));
    setCurrentIndex(0);
    setRevealed(false);
  }

  const progress = Math.round(((currentIndex + 1) / orderedQuestions.length) * 100);

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-500">
            {profileLabel}
          </p>
          <h1 className="mt-2 text-3xl font-light tracking-tight text-slate-950">
            Examiner-style oral practice
          </h1>
          {categoryLabel && (
            <p className="mt-1 text-sm font-semibold text-slate-500">{categoryLabel}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href="/questions"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-slate-600 transition hover:bg-slate-50"
          >
            Filters
          </Link>
          <button
            type="button"
            onClick={shuffleQuestions}
            className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-white transition hover:bg-slate-800"
          >
            Shuffle
          </button>
        </div>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-6 py-5 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge>{currentQuestion.category}</Badge>
                <Badge>{currentQuestion.section_code}</Badge>
                {currentQuestion.aircraft_model && <Badge>{currentQuestion.aircraft_model}</Badge>}
              </div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                {currentIndex + 1} / {orderedQuestions.length}
              </p>
            </div>
          </header>

          <div className="p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
              Examiner prompt
            </p>
            <h2 className="mt-4 text-3xl font-light leading-tight tracking-tight text-slate-950 md:text-4xl">
              {currentQuestion.examiner_question}
            </h2>
            <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              Answer aloud before revealing the model answer. State the decision, explain the logic and
              identify the controlling document.
            </p>

            {!revealed ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mt-7 w-full rounded-xl bg-amber-400 px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-amber-500"
              >
                Reveal model answer
              </button>
            ) : (
              <div className="mt-8 space-y-6">
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                    Model answer
                  </p>
                  <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-800">
                    {currentQuestion.model_answer}
                  </p>
                </section>

                <section>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Points the examiner should hear
                  </p>
                  <ul className="mt-4 grid gap-3 md:grid-cols-2">
                    {currentQuestion.key_points.map((point) => (
                      <li
                        key={point}
                        className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </section>

                {currentQuestion.verification_status === "aircraft_manual_required" && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm leading-7 text-orange-900">
                    <strong>Exact aircraft manual required.</strong> Verify the current AFM/POH edition,
                    revision, effective pages, supplements and installed equipment before using any
                    aircraft-specific value or procedure.
                  </div>
                )}

                <SourceCard question={currentQuestion} />

                <div className="grid gap-3 border-t border-slate-200 pt-6 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => assess("review")}
                    className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-100"
                  >
                    Need to review
                  </button>
                  <button
                    type="button"
                    onClick={() => assess("ready")}
                    className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-green-700 transition hover:bg-green-100"
                  >
                    Could answer clearly
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => moveTo(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="rounded-lg border border-slate-300 px-5 py-3 text-xs font-black uppercase tracking-[0.1em] text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => moveTo(Math.min(orderedQuestions.length - 1, currentIndex + 1))}
                disabled={currentIndex === orderedQuestions.length - 1}
                className="rounded-lg bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-[0.1em] text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Session</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="Reviewed" value={`${reviewedCount}/${orderedQuestions.length}`} />
            <MiniStat label="Ready" value={readyCount.toString()} />
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {orderedQuestions.map((question, index) => {
              const state = reviewStates[question.id];
              const active = index === currentIndex;
              const className = active
                ? "border-amber-400 bg-amber-400 text-white"
                : state === "ready"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : state === "review"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 bg-slate-50 text-slate-500";

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => moveTo(index)}
                  className={`flex h-9 items-center justify-center rounded-lg border text-xs font-black ${className}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
      {children}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-light text-slate-950">{value}</p>
    </div>
  );
}

function SourceCard({ question }: { question: SkillTestQuestion }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Source</p>
      <h3 className="mt-3 text-xl font-light leading-7">{question.source_document}</h3>
      <dl className="mt-5 space-y-3 text-sm leading-6 text-white/75">
        <div>
          <dt className="font-black uppercase tracking-[0.1em] text-white/40">Authority</dt>
          <dd>{question.source_authority}</dd>
        </div>
        {question.source_revision && (
          <div>
            <dt className="font-black uppercase tracking-[0.1em] text-white/40">Revision</dt>
            <dd>{question.source_revision}</dd>
          </div>
        )}
        <div>
          <dt className="font-black uppercase tracking-[0.1em] text-white/40">Section</dt>
          <dd>{question.source_section}</dd>
        </div>
        {question.source_page && (
          <div>
            <dt className="font-black uppercase tracking-[0.1em] text-white/40">Page</dt>
            <dd>{question.source_page}</dd>
          </div>
        )}
      </dl>
      {question.source_url && (
        <a
          href={question.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-slate-950 transition hover:bg-slate-100"
        >
          Open source document
        </a>
      )}
    </section>
  );
}
