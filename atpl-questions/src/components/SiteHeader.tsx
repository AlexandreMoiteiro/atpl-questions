import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-7">
        <Link
          href="/"
          className="flex items-center"
          aria-label="ATPL QBank dashboard"
        >
          <img
            src="/logo.png"
            alt=""
            className="block h-25 w-auto object-contain"
          />
        </Link>

        <Link
          href="/questions?new=1"
          className="rounded-full bg-amber-400 px-7 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-amber-500"
        >
          Start
        </Link>
      </div>
    </header>
  );
}
