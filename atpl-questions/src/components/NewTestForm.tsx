"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SubjectTopicGroup = {
  subject: string;
  topics: string[];
};

type Props = {
  subjectTopics: SubjectTopicGroup[];
};

function shuffleArray<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporaryItem = shuffled[index];

    shuffled[index] = shuffled[randomIndex];
    shuffled[randomIndex] = temporaryItem;
  }

  return shuffled;
}

export default function NewTestForm({ subjectTopics }: Props) {
  const router = useRouter();

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const topics = useMemo(() => {
    const selectedGroup = subjectTopics.find(
      (group) => group.subject === selectedSubject
    );

    return selectedGroup?.topics ?? [];
  }, [selectedSubject, subjectTopics]);

  async function startTest() {
    if (!selectedSubject) {
      setErrorMessage("Please select a subject first.");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    let query = supabase
      .from("questions")
      .select("id")
      .eq("subject", selectedSubject)
      .order("created_at", { ascending: true });

    if (selectedTopic) {
      query = query.eq("topic", selectedTopic);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      setErrorMessage(questionsError.message);
      setIsCreating(false);
      return;
    }

    if (!questions || questions.length === 0) {
      setErrorMessage("No questions found for this selection.");
      setIsCreating(false);
      return;
    }

    const shuffledQuestions = shuffleArray(questions);

    const { data: session, error: sessionError } = await supabase
      .from("test_sessions")
      .insert({
        visitor_id: "anonymous",
        mode: "study",
        status: "active",
        subject: selectedSubject,
        topic: selectedTopic || null,
        total_questions: shuffledQuestions.length,
        current_index: 0,
        correct_answers: 0,
        wrong_answers: 0,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      setErrorMessage(sessionError?.message ?? "Could not create test session.");
      setIsCreating(false);
      return;
    }

    const sessionQuestions = shuffledQuestions.map((question, index) => ({
      session_id: session.id,
      question_id: question.id,
      position: index,
    }));

    const { error: sessionQuestionsError } = await supabase
      .from("test_session_questions")
      .insert(sessionQuestions);

    if (sessionQuestionsError) {
      setErrorMessage(sessionQuestionsError.message);
      setIsCreating(false);
      return;
    }

    router.push(`/questions?session=${session.id}`);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col items-center justify-center px-6 py-12">
      <h1 className="text-center text-5xl font-light tracking-[0.08em] text-slate-950">
        New Test
      </h1>

      <div className="mt-10 h-1.5 w-24 rounded-full bg-amber-400" />

      <div className="mt-16 w-full max-w-3xl space-y-6">
        <select
          value={selectedSubject}
          onChange={(event) => {
            setSelectedSubject(event.target.value);
            setSelectedTopic("");
            setErrorMessage(null);
          }}
          className="h-16 w-full rounded-md border border-amber-400 bg-white px-5 text-2xl font-light tracking-wide text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-300"
        >
          <option value="">Please select a subject!</option>

          {subjectTopics.map((group) => (
            <option key={group.subject} value={group.subject}>
              {group.subject}
            </option>
          ))}
        </select>

        <select
          value={selectedTopic}
          onChange={(event) => {
            setSelectedTopic(event.target.value);
            setErrorMessage(null);
          }}
          disabled={!selectedSubject}
          className="h-16 w-full rounded-md border border-amber-400 bg-white px-5 text-2xl font-light tracking-wide text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">All topics</option>

          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>

        <button
          onClick={startTest}
          disabled={isCreating}
          className="h-16 w-full rounded-md bg-amber-400 text-2xl font-light uppercase tracking-[0.08em] text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isCreating ? "Creating..." : "Test"}
        </button>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
