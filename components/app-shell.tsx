import Link from "next/link";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-slate-950" aria-label="FlowForge home">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">F</span>
            FlowForge
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium">
            <Link href="/" className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Home</Link>
            <Link href="/dashboard" className="rounded-lg bg-white px-3 py-2 text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Workflows</Link>
          </nav>
          <Link href="/dashboard" className="hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">New workflow</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  );
}
