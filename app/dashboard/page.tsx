import { AppShell } from "@/components/app-shell";
import { WorkflowList } from "@/components/workflow/workflow-list";

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-indigo-600">Workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Workflows</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">Create, edit, validate, publish, and preview your automation workflows.</p>
        </div>
        <WorkflowList />
      </section>
    </AppShell>
  );
}
