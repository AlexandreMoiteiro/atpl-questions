"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SkillTestScope } from "@/lib/supabase";

type PracticeGroup = {
  scope: Exclude<SkillTestScope, "common">;
  label: string;
  description: string;
  categories: string[];
  count: number;
};

type Props = {
  groups: PracticeGroup[];
};

export default function NewTestForm({ groups }: Props) {
  const router = useRouter();
  const [scope, setScope] = useState("");
  const [category, setCategory] = useState("");

  const selectedGroup = useMemo(
    () => groups.find((group) => group.scope === scope),
    [groups, scope]
  );

  function startPractice() {
    if (!scope) return;

    const params = new URLSearchParams({ scope });
    if (category) params.set("category", category);
    router.push(`/questions?${params.toString()}`);
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-500">
          New oral practice session
        </p>
        <h1 className="mt-4 text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
          Choose the skill-test profile
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          Read the examiner prompt, answer aloud, then reveal the model answer, key points and the
          exact regulatory or aircraft-document reference.
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {groups.map((group) => {
          const selected = group.scope === scope;

          return (
            <button
              key={group.scope}
              type="button"
              onClick={() => {
                setScope(group.scope);
                setCategory("");
              }}
              className={[
                "rounded-2xl border p-6 text-left shadow-sm transition",
                selected
                  ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200"
                  : "border-slate-200 bg-white hover:-translate-y-1 hover:border-amber-300 hover:shadow-md",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-amber-600">
                  {group.label}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                  {group.count}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{group.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Optional category filter
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          disabled={!selectedGroup}
          className="mt-3 h-14 w-full rounded-lg border border-slate-300 bg-white px-4 text-base font-semibold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">All relevant categories</option>
          {(selectedGroup?.categories ?? []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={startPractice}
          disabled={!scope}
          className="mt-5 h-14 w-full rounded-lg bg-slate-950 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Start oral practice
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-slate-700">
        CPL and IR/PBN use the Tecnam P2006T where aircraft-specific content is relevant. The SEP
        profile is built for the Sevenair Tecnam P2008JC using AFM Doc. 2008/100, Edition 2,
        Revision 18 and the supplements applicable to the actual aircraft.
      </div>
    </section>
  );
}
