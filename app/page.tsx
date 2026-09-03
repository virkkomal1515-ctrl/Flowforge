import Link from "next/link";

const steps = [
  ["01", "Create", "Start with a ready-to-edit workflow from the workspace."],
  ["02", "Edit", "Configure nodes and connect the visual graph."],
  ["03", "Validate", "Catch disconnected nodes and invalid branches before publishing."],
  ["04", "Save", "Autosave keeps the editable draft synchronized with the server."],
  ["05", "Publish", "Promote a validated draft into a stable published snapshot."],
  ["06", "Preview", "Run the published snapshot without changing your draft."],
] as const;

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <section className="relative overflow-hidden px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-100 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-100 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <p className="text-sm font-semibold text-indigo-600">Visual workflow automation</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Build workflows with FlowForge.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Create deterministic workflows visually, validate them before release, and preview exactly what the published snapshot will execute.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Open workflows</Link>
            <a href="#lifecycle" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">How it works</a>
          </div>
        </div>
      </section>
      <section id="lifecycle" className="border-t border-slate-100 bg-slate-50/70 px-5 py-10 sm:px-10 lg:px-16 lg:py-14">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">From idea to preview</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">The product loop stays simple: edit the draft, validate it, then publish the version you want to execute.</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map(([number, title, description]) => (
            <article key={number} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-indigo-50 px-2 text-xs font-bold text-indigo-700">{number}</span>
              <h3 className="mt-5 text-base font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-5 border-t border-slate-100 px-5 py-8 sm:px-10 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:px-16">
        <div><h2 className="text-lg font-semibold text-slate-950">Drafts stay editable. Published versions stay predictable.</h2><p className="mt-1 text-sm text-slate-600">Execution Preview always runs the published snapshot.</p></div>
        <Link href="/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">Go to workspace →</Link>
      </section>
    </main>
  );
}
