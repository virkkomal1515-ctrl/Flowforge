"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createWorkflow, deleteWorkflow, fetchWorkflows, workflowQueryKeys } from "@/lib/workflow/api";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";
import type { Workflow } from "@/domain";

function newWorkflow(): Workflow {
  const now = new Date().toISOString();
  return { ...structuredClone(sampleWorkflow), id: crypto.randomUUID(), name: "Untitled workflow", description: "", createdAt: now, updatedAt: now, version: 0 };
}

export function WorkflowList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const workflows = useQuery({ queryKey: workflowQueryKeys.list(), queryFn: fetchWorkflows });

  const create = useMutation({
    mutationFn: createWorkflow,
    onSuccess: (workflow) => {
      queryClient.setQueryData(workflowQueryKeys.detail(workflow.id), workflow);
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.list() });
      router.push(`/workflows/${encodeURIComponent(workflow.id)}`);
    },
  });

  const remove = useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: (_, workflowId) => {
      queryClient.removeQueries({ queryKey: workflowQueryKeys.detail(workflowId) });
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.list() });
    },
  });

  if (workflows.isPending) return <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading workflows…</p>;
  if (workflows.isError) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{workflows.error.message}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div><h2 className="text-lg font-semibold text-slate-950">Workflows</h2><p className="text-sm text-slate-500">Persisted workflows from the server.</p></div>
        <button type="button" onClick={() => create.mutate(newWorkflow())} disabled={create.isPending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{create.isPending ? "Creating…" : "New workflow"}</button>
      </div>
      {create.isError ? <p role="alert" className="text-sm text-red-700">{create.error.message}</p> : null}
      {workflows.data.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No workflows yet. Create your first workflow.</div> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {workflows.data.map((workflow) => (
            <li key={workflow.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0"><h3 className="truncate font-semibold text-slate-950">{workflow.name}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500">{workflow.description || "No description"}</p><p className="mt-3 text-xs text-slate-400">Updated {new Date(workflow.updatedAt).toLocaleString()}</p></div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{workflow.status}</span>
              </div>
              <div className="mt-4 flex gap-2"><Link href={`/workflows/${encodeURIComponent(workflow.id)}`} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white">Open</Link><button type="button" onClick={() => remove.mutate(workflow.id)} disabled={remove.isPending} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 disabled:opacity-50">Delete</button></div>
              {remove.isError && remove.variables === workflow.id ? <p role="alert" className="mt-2 text-xs text-red-700">{remove.error.message}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
