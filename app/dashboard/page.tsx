import { AppShell } from "@/components/app-shell";
import { WorkflowList } from "@/components/workflow/workflow-list";

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-medium text-slate-500">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your workflows</h1>
          <p className="mt-2 max-w-xl text-slate-600">Create, open, and delete persisted workflows. Server state is cached and synchronized with TanStack Query.</p>
        </div>
        <WorkflowList />
      </section>
    </AppShell>
  );
}
