import { AppShell } from "@/components/app-shell";
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";

export default async function WorkflowPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;

  return (
    <AppShell>
      <section className="space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-500">Workflow editor</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Workflow {workflowId}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Build and configure a workflow. Saved workflow data is loaded through the persistence API and rendered through the existing React Flow adapter.</p>
        </div>
        <WorkflowCanvas workflowId={workflowId} />
      </section>
    </AppShell>
  );
}
