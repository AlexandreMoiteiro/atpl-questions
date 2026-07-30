import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-sm font-black text-white shadow-sm transition group-hover:bg-amber-500">
            ST
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.14em] text-slate-950">
              Skill Test Prep
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              CPL · IR/PBN · SEP
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/questions"
            className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800"
          >
            Start oral practice
          </Link>
        </nav>
      </div>
    </header>
  );
}
