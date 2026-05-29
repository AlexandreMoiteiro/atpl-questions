"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Question } from "@/lib/supabase";
import DeleteQuestionButton from "@/components/DeleteQuestionButton";

type OptionKey = "A" | "B" | "C" | "D";

type AnswerRecord = {
  selectedOption: OptionKey;
  correctOption: OptionKey;
  isCorrect: boolean;
};

type Props = {
  questions: Question[];
  initialSessionId: string;
  initialCurrentIndex?: number;
  initialAnswers?: Record<string, AnswerRecord>;
};

export default function QuestionRunner({
  questions,
  initialSessionId,
  initialCurrentIndex = 0,
  initialAnswers = {},
}: Props) {
  const router = useRouter();

  const [sessionId] = useState(initialSessionId);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(
    Math.min(initialCurrentIndex, Math.max(questions.length - 1, 0))
  );

  const [selectedOptions, setSelectedOptions] = useState<Record<string, OptionKey>>(() => {
    return Object.fromEntries(
      Object.entries(initialAnswers).map(([questionId, answer]) => [
        questionId,
        answer.selectedOption,
      ])
    );
  });

  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>(initialAnswers);
  const [finished, setFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const autoNextTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = questions[currentIndex];

  const currentSelectedOption = currentQuestion
    ? selectedOptions[currentQuestion.id] ?? null
    : null;

  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id] ?? null
    : null;

  const answered = Boolean(currentAnswer);

  const score = useMemo(() => {
    return Object.values(answers).filter((answer) => answer.isCorrect).length;
  }, [answers]);

  const wrongAnswers = useMemo(() => {
    return Object.values(answers).filter((answer) => !answer.isCorrect).length;
  }, [answers]);

  const options = useMemo(() => {
    if (!currentQuestion) return [];

    return [
      { key: "A" as OptionKey, text: currentQuestion.option_a },
      { key: "B" as OptionKey, text: currentQuestion.option_b },
      { key: "C" as OptionKey, text: currentQuestion.option_c },
      { key: "D" as OptionKey, text: currentQuestion.option_d },
    ];
  }, [currentQuestion]);

  useEffect(() => {
    return () => {
      if (autoNextTimeout.current) {
        clearTimeout(autoNextTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();

      if (tagName === "input" || tagName === "textarea" || tagName === "select") {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousQuestion();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextQuestion();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  useEffect(() => {
    if (!sessionId) return;

    void supabase
      .from("test_sessions")
      .update({ current_index: currentIndex })
      .eq("id", sessionId);
  }, [currentIndex, sessionId]);

  if (questions.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h2 className="text-3xl font-light tracking-wide text-slate-950">
          No questions found.
        </h2>

        <p className="mt-3 text-slate-600">
          This test has no questions attached to it.
        </p>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="bg-amber-400 p-8 text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/80">
            Test complete
          </p>

          <h2 className="mt-4 text-6xl font-light tracking-wide">
            {percentage}%
          </h2>

          <p className="mt-3 text-lg">
            {score} correct answers out of {questions.length}.
          </p>
        </div>

        <div className="flex gap-3 p-8">
          <button
            onClick={() => router.push("/")}
            className="rounded-md bg-slate-950 px-6 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-slate-800"
          >
            Dashboard
          </button>

          <button
            onClick={() => router.push("/questions?new=1")}
            className="rounded-md bg-amber-400 px-6 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-amber-500"
          >
            New Test
          </button>
        </div>
      </div>
    );
  }

  async function saveAnswer(question: Question, option: OptionKey, nextAnswers: Record<string, AnswerRecord>) {
    const answer = nextAnswers[question.id];

    const nextCorrectAnswers = Object.values(nextAnswers).filter(
      (item) => item.isCorrect
    ).length;

    const nextWrongAnswers = Object.values(nextAnswers).filter(
      (item) => !item.isCorrect
    ).length;

    setIsSaving(true);
    setSessionError(null);

    const { error: answerError } = await supabase
      .from("test_session_answers")
      .upsert(
        {
          session_id: sessionId,
          question_id: question.id,
          selected_option: option,
          correct_option: question.correct_option,
          is_correct: answer.isCorrect,
        },
        {
          onConflict: "session_id,question_id",
        }
      );

    if (answerError) {
      setSessionError(answerError.message);
      setIsSaving(false);
      return;
    }

    const { error: sessionUpdateError } = await supabase
      .from("test_sessions")
      .update({
        correct_answers: nextCorrectAnswers,
        wrong_answers: nextWrongAnswers,
      })
      .eq("id", sessionId);

    if (sessionUpdateError) {
      setSessionError(sessionUpdateError.message);
    }

    setIsSaving(false);
  }

  function answerQuestion(option: OptionKey) {
    if (!currentQuestion) return;
    if (answers[currentQuestion.id]) return;
    if (isSaving) return;

    const isCorrect = option === currentQuestion.correct_option;

    const nextAnswers: Record<string, AnswerRecord> = {
      ...answers,
      [currentQuestion.id]: {
        selectedOption: option,
        correctOption: currentQuestion.correct_option,
        isCorrect,
      },
    };

    setSelectedOptions((previous) => ({
      ...previous,
      [currentQuestion.id]: option,
    }));

    setAnswers(nextAnswers);

    void saveAnswer(currentQuestion, option, nextAnswers);

    if (isCorrect && currentIndex < questions.length - 1) {
      autoNextTimeout.current = setTimeout(() => {
        setCurrentIndex((previousIndex) => previousIndex + 1);
      }, 180);
    }
  }

  async function finishSession(finalAnswers = answers) {
    const finalScore = Object.values(finalAnswers).filter((answer) => answer.isCorrect).length;
    const finalWrongAnswers = Object.values(finalAnswers).filter((answer) => !answer.isCorrect).length;

    setIsSaving(true);
    setSessionError(null);

    const { error: updateError } = await supabase
      .from("test_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        current_index: currentIndex,
        correct_answers: finalScore,
        wrong_answers: finalWrongAnswers,
      })
      .eq("id", sessionId);

    if (updateError) {
      setSessionError(updateError.message);
      setIsSaving(false);
      return;
    }

    await supabase
      .from("test_session_answers")
      .delete()
      .eq("session_id", sessionId);

    await supabase
      .from("test_session_questions")
      .delete()
      .eq("session_id", sessionId);

    setIsSaving(false);
    setFinished(true);
  }

  async function cancelSession() {
    const confirmed = window.confirm("Cancel this test? It will disappear from open tests.");

    if (!confirmed) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("test_sessions")
      .delete()
      .eq("id", sessionId);

    setIsSaving(false);

    if (error) {
      setSessionError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  function nextQuestion() {
    if (currentIndex === questions.length - 1) return;

    setCurrentIndex((previousIndex) => previousIndex + 1);
  }

  function previousQuestion() {
    if (currentIndex === 0) return;
    setCurrentIndex((previousIndex) => previousIndex - 1);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_190px]">
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500">
                {currentQuestion.subject}
              </p>

              {currentQuestion.topic && (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {currentQuestion.topic}
                </p>
              )}
            </div>

            <p className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-500">
              Single best answer
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8">
            <div className="mb-4 flex justify-end">
              <DeleteQuestionButton question={currentQuestion} />
            </div>

          <h2 className="text-3xl font-light leading-tight tracking-wide text-slate-950">
            {currentQuestion.question_text}
          </h2>

          {currentQuestion.figure_url && (
            <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentQuestion.figure_url}
                alt={`Visual reference for ${currentQuestion.subject}`}
                className="mx-auto max-h-[300px] max-w-[620px] rounded bg-white object-contain"
              />
            </div>
          )}

          <div className="mt-8 grid gap-3">
            {options.map((option) => {
              const isSelected = currentSelectedOption === option.key;
              const isCorrect =
                answered && option.key === currentQuestion.correct_option;
              const isWrong =
                answered &&
                isSelected &&
                option.key !== currentQuestion.correct_option;

              return (
                <button
                  key={option.key}
                  onClick={() => answerQuestion(option.key)}
                  disabled={Boolean(currentAnswer) || isSaving}
                  className={[
                    "flex items-start gap-4 rounded-md border p-4 text-left transition",
                    !currentAnswer ? "hover:border-amber-300 hover:bg-amber-50/40" : "",
                    isSelected
                      ? "border-amber-400 bg-amber-50"
                      : "border-slate-200 bg-white",
                    isCorrect ? "border-green-500 bg-green-50" : "",
                    isWrong ? "border-red-500 bg-red-50" : "",
                    currentAnswer ? "cursor-default" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-black",
                      isSelected
                        ? "bg-amber-400 text-white"
                        : "bg-slate-100 text-slate-600",
                      isCorrect ? "bg-green-600 text-white" : "",
                      isWrong ? "bg-red-600 text-white" : "",
                    ].join(" ")}
                  >
                    {option.key}
                  </span>

                  <span className="pt-2 text-base font-semibold leading-6 text-slate-800">
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {answered && !currentAnswer?.isCorrect && (
            <div className="mt-7 rounded-md border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                  Correct answer: {currentQuestion.correct_option}
                </p>

                <p className="rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-700">
                  Incorrect
                </p>
              </div>

              {currentQuestion.explanation && (
                <p className="mt-4 leading-7 text-slate-700">
                  {currentQuestion.explanation}
                </p>
              )}

              {currentQuestion.source && (
                <p className="mt-4 border-t border-slate-200 pt-4 text-xs font-semibold text-slate-500">
                  Source: {currentQuestion.source}
                </p>
              )}
            </div>
          )}

          {sessionError && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {sessionError}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
            <button
              onClick={previousQuestion}
              disabled={currentIndex === 0 || isSaving}
              className="rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                disabled={isSaving}
                className="rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Leave
              </button>

              <button
                onClick={currentIndex === questions.length - 1 ? () => void finishSession() : nextQuestion}
                disabled={isSaving}
                className="rounded-md bg-slate-950 px-6 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSaving
                  ? "Saving..."
                  : currentIndex === questions.length - 1
                    ? "Finish Test"
                    : "Next"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:self-start">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Test
          </p>

          <button
            onClick={cancelSession}
            disabled={isSaving}
            className="rounded-md border border-red-300 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-500 transition hover:bg-red-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {questions.map((question, index) => {
            const questionAnswer = answers[question.id];
            const isCurrent = index === currentIndex;

            let colorClass =
              "border-slate-200 bg-slate-50 text-slate-500 hover:border-amber-300";

            if (questionAnswer?.isCorrect) {
              colorClass = "border-green-500 bg-green-50 text-green-700";
            }

            if (questionAnswer && !questionAnswer.isCorrect) {
              colorClass = "border-red-500 bg-red-50 text-red-700";
            }

            if (isCurrent) {
              colorClass = "border-amber-400 bg-amber-400 text-white";
            }

            return (
              <button
                key={question.id}
                onClick={() => setCurrentIndex(index)}
                className={[
                  "flex h-8 items-center justify-center rounded-md border text-xs font-black transition",
                  colorClass,
                ].join(" ")}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-400">
          Use ← and → to move between questions.
        </p>
      </aside>
    </div>
  );
}
