import Link from "next/link";

const steps = [
  ["01", "Create", "Start with a ready-to-edit workflow from the workspace."],
  ["02", "Edit", "Configure nodes and connect the visual graph."],
  ["03", "Validate", "Catch disconnected nodes and invalid branches before publishing."],
  ["04", "Publish", "Promote a validated draft into a stable published snapshot."],
  ["05", "Preview", "Run the published snapshot without changing your draft."],
] as const;

const nodeStyles = {
  trigger: "border-emerald-200 bg-emerald-50 text-emerald-950",
  action: "border-blue-200 bg-blue-50 text-blue-950",
  condition: "border-amber-200 bg-amber-50 text-amber-950",
  notification: "border-violet-200 bg-violet-50 text-violet-950",
  end: "border-slate-200 bg-white text-slate-950",
};

function PreviewNode({ className, type, title, meta }: { className: string; type: keyof typeof nodeStyles; title: string; meta: string }) {
  return (
    <div className={`absolute w-36 rounded-xl border p-3 shadow-sm sm:w-40 ${nodeStyles[type]} ${className}`}>
      <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-60">{type}</span><span className="h-2 w-2 rounded-full bg-current opacity-50" /></div>
      <p className="mt-2 text-xs font-bold sm:text-sm">{title}</p>
      <p className="mt-1 truncate text-[10px] opacity-60">{meta}</p>
    </div>
  );
}

function WorkflowPreview() {
  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] sm:min-h-[430px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.13),transparent_42%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="relative flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-5">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">Workflow preview</p><p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">Request routing</p></div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Published v3</span>
      </div>
      <div className="relative mx-auto mt-5 h-[315px] w-full max-w-[520px] sm:mt-8 sm:h-[335px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 335" fill="none" aria-hidden="true">
          <path d="M260 78V111" stroke="#94A3B8" strokeWidth="2" /><path d="M260 181V208" stroke="#94A3B8" strokeWidth="2" /><path d="M260 208H150V238" stroke="#94A3B8" strokeWidth="2" /><path d="M260 208H370V238" stroke="#94A3B8" strokeWidth="2" /><path d="M150 300V312H260V320" stroke="#94A3B8" strokeWidth="2" /><path d="M370 300V312H260" stroke="#94A3B8" strokeWidth="2" />
          <circle cx="260" cy="208" r="4" fill="#F59E0B" /><text x="164" y="226" fill="#64748B" fontSize="10">true</text><text x="378" y="226" fill="#64748B" fontSize="10">false</text>
        </svg>
        <PreviewNode className="left-1/2 top-0 -translate-x-1/2" type="trigger" title="New request" meta="Incoming event" />
        <PreviewNode className="left-1/2 top-[105px] -translate-x-1/2" type="action" title="Route request" meta="HTTP action" />
        <PreviewNode className="left-[calc(50%-176px)] top-[232px]" type="notification" title="Notify team" meta="Notification" />
        <PreviewNode className="right-[calc(50%-176px)] top-[232px]" type="end" title="Finish" meta="Workflow end" />
        <PreviewNode className="left-1/2 top-[265px] -translate-x-1/2" type="condition" title="Priority?" meta="True / false branch" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <section className="relative overflow-hidden border-b border-slate-100 bg-slate-50/70 px-5 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div className="absolute -left-32 top-8 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl" aria-hidden="true" /><div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-violet-100/60 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Visual workflow automation</div>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">Build workflows.<br /><span className="text-indigo-600">Ship with confidence.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">Design deterministic automations visually, validate the graph before release, and preview the exact published snapshot that will execute.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Open workflows <span className="ml-2">→</span></Link><a href="#lifecycle" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">See how it works</a></div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><span>✓ Visual graph editing</span><span>✓ Validation before publish</span><span>✓ Deterministic preview</span></div>
          </div>
          <WorkflowPreview />
        </div>
      </section>
      <section id="lifecycle" className="px-5 py-12 sm:px-10 sm:py-16 lg:px-14"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">The product loop</p><h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">From idea to reliable execution.</h2><p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Keep the workflow editable while you build, then promote a validated version into the snapshot used for execution.</p></div><div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{steps.map(([number, title, description], index) => <article key={number} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">{index < steps.length - 1 ? <span className="absolute right-[-11px] top-10 z-10 hidden text-slate-300 lg:block" aria-hidden="true">→</span> : null}<span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-indigo-50 px-2 text-xs font-bold text-indigo-700">{number}</span><h3 className="mt-5 text-base font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div></div></section>
      <section className="border-t border-slate-100 bg-slate-50/70 px-5 py-12 sm:px-10 sm:py-14 lg:px-14"><div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2"><article className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8"><span className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Draft</span><h2 className="mt-3 text-xl font-bold text-slate-950">Build without fear of breaking release.</h2><p className="mt-3 text-sm leading-6 text-slate-600">Your editable graph can change as you configure nodes, connections, and conditions. Autosave keeps the draft synchronized while you work.</p><div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">Editable graph · Autosaved · Validated before publish</div></article><article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8"><span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Published</span><h2 className="mt-3 text-xl font-bold text-slate-950">Execute a stable version.</h2><p className="mt-3 text-sm leading-6 text-slate-600">Publishing promotes the validated draft into a stable snapshot. Execution Preview runs that snapshot without changing the draft you are still editing.</p><div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-800">Stable snapshot · Versioned · Ready for preview</div></article></div></section>
      <section className="flex flex-col gap-5 border-t border-slate-100 px-5 py-9 sm:px-10 sm:py-11 lg:flex-row lg:items-center lg:justify-between lg:px-14"><div><p className="text-lg font-semibold text-slate-950">Ready to build the next workflow?</p><p className="mt-1 text-sm text-slate-600">Open the workspace and start with a ready-to-edit graph.</p></div><Link href="/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">Go to workspace →</Link></section>
    </main>
  );
}
