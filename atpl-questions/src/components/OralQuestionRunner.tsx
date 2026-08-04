"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ExaminerFollowup, SkillTestQuestion } from "@/lib/supabase";

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
  const [visibleFollowupCount, setVisibleFollowupCount] = useState(0);
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

  const followups = currentQuestion.examiner_followups ?? [];
  const visibleFollowups = followups.slice(0, visibleFollowupCount);
  const nextFollowup = followups[visibleFollowupCount];
  const allFollowupsShown = visibleFollowupCount >= followups.length;

  function moveTo(index: number) {
    setCurrentIndex(index);
    setVisibleFollowupCount(0);
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
    setVisibleFollowupCount(0);
    setRevealed(false);
  }

  function pressFurther() {
    setVisibleFollowupCount((count) => Math.min(count + 1, followups.length));
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
            Progressive oral interrogation
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
              The examiner opens with
            </p>
            <h2 className="mt-4 text-3xl font-light leading-tight tracking-tight text-slate-950 md:text-4xl">
              {currentQuestion.examiner_question}
            </h2>

            <div className="mt-5 rounded-xl border border-slate-300 bg-slate-950 p-5 text-sm leading-7 text-white/80">
              <strong className="text-white">Answer directly.</strong> Define the component, explain the
              operating logic, quote the aircraft values, identify the failure indications and finish with
              the AFM/QRH action. Expect the examiner to interrupt vague answers.
            </div>

            {visibleFollowups.length > 0 && (
              <section className="mt-7 space-y-3">
                {visibleFollowups.map((followup, index) => (
                  <ExaminerInterruption key={`${followup.question}-${index}`} followup={followup} index={index} />
                ))}
              </section>
            )}

            {!revealed && (
              <div className="mt-7 grid gap-3 md:grid-cols-2">
                {nextFollowup ? (
                  <button
                    type="button"
                    onClick={pressFurther}
                    className="rounded-xl bg-red-600 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-red-700"
                  >
                    Examiner interrupts — next question
                  </button>
                ) : (
                  <div className="flex items-center justify-center rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-center text-xs font-black uppercase tracking-[0.12em] text-green-700">
                    Full interrogation delivered
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="rounded-xl bg-amber-400 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-amber-500"
                >
                  {allFollowupsShown ? "Reveal exact answers" : "Stop and reveal answers"}
                </button>
              </div>
            )}

            {revealed && (
              <div className="mt-8 space-y-6">
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                    Opening answer
                  </p>
                  <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-800">
                    {currentQuestion.model_answer}
                  </p>
                </section>

                {followups.length > 0 && (
                  <section>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Answers to the examiner&apos;s interruptions
                    </p>
                    <div className="mt-4 space-y-3">
                      {followups.map((followup, index) => (
                        <FollowupAnswer key={`${followup.question}-${index}`} followup={followup} index={index} />
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Exact points that must be heard
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

                {(currentQuestion.common_wrong_answers ?? []).length > 0 && (
                  <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                      Answers the examiner will attack
                    </p>
                    <ul className="mt-4 space-y-3">
                      {currentQuestion.common_wrong_answers.map((answer) => (
                        <li key={answer} className="text-sm font-semibold leading-6 text-red-900">
                          “{answer}”
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {currentQuestion.verification_status === "aircraft_manual_required" && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm leading-7 text-orange-900">
                    <strong>Exact aircraft manual required.</strong> Verify the current AFM edition,
                    revision, effective pages, supplements, registration and installed equipment before
                    quoting a value or procedure.
                  </div>
                )}

                <SourceCard question={currentQuestion} />

                <div className="grid gap-3 border-t border-slate-200 pt-6 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => assess("review")}
                    className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-100"
                  >
                    Broke under questioning
                  </button>
                  <button
                    type="button"
                    onClick={() => assess("ready")}
                    className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-green-700 transition hover:bg-green-100"
                  >
                    Answered every follow-up
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

function ExaminerInterruption({ followup, index }: { followup: ExaminerFollowup; index: number }) {
  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">
        Examiner interruption {index + 1}
      </p>
      <p className="mt-2 text-xl font-semibold leading-8 text-slate-950">{followup.question}</p>
    </div>
  );
}

function FollowupAnswer({ followup, index }: { followup: ExaminerFollowup; index: number }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">
          Follow-up {index + 1}
        </p>
        <p className="mt-2 text-lg font-semibold leading-7 text-slate-950">{followup.question}</p>
      </div>
      <p className="p-5 text-sm leading-7 text-slate-700">{followup.expected_answer}</p>
    </article>
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
      {question.source_url && !question.source_url.startsWith("uploaded://") && (
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
