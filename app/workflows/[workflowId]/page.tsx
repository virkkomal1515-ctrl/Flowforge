import { AppShell } from "@/components/app-shell";

export default async function WorkflowPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;

  return (
    <AppShell>
      <section className="space-y-4">
        <p className="text-sm font-medium text-slate-500">Workflow editor</p>
        <h1 className="text-3xl font-semibold tracking-tight">Workflow {workflowId}</h1>
        <p className="max-w-xl text-slate-600">The editor surface is intentionally reserved for Milestone 3. This route establishes the application boundary.</p>
      </section>
    </AppShell>
  );
}
