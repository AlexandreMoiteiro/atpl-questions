"use client";

import { useState } from "react";

type QuestionLike = {
  id?: string | number | null;
  question_id?: string | number | null;
  subject?: string | null;
  topic?: string | null;
  question_text?: string | null;
};

type DeleteQuestionButtonProps = {
  question?: QuestionLike | null;
  questionId?: string | number | null;
};

export default function DeleteQuestionButton({
  question,
  questionId,
}: DeleteQuestionButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const id =
    questionId ??
    question?.id ??
    question?.question_id ??
    null;

  const questionText = question?.question_text ?? "";
  const canDelete = Boolean(id || questionText);

  async function handleDelete() {
    if (!canDelete || isDeleting) return;

    const confirmed = window.confirm(
      "Apagar esta pergunta permanentemente do banco de perguntas?"
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/admin/delete-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: id,
          questionText,
          subject: question?.subject ?? "",
          topic: question?.topic ?? "",
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? "Não foi possível apagar a pergunta.");
      }

      window.location.reload();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível apagar a pergunta."
      );
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={!canDelete || isDeleting}
      className="rounded-md border border-red-100 bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-red-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
      title={
        canDelete
          ? "Apagar esta pergunta"
          : "Não encontrei o ID/texto desta pergunta"
      }
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
