"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createWorkflow, deleteWorkflow, fetchWorkflows, workflowQueryKeys } from "@/lib/workflow/api";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";
import type { Workflow } from "@/domain";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";

function newWorkflow(): Workflow {
  const now = new Date().toISOString();
  return { ...structuredClone(sampleWorkflow), id: crypto.randomUUID(), name: "Untitled workflow", description: "", createdAt: now, updatedAt: now, version: 0 };
}

export function WorkflowList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Workflow["status"]>("all");
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const workflows = useQuery({ queryKey: workflowQueryKeys.list(), queryFn: fetchWorkflows });

  const create = useMutation({
    mutationFn: createWorkflow,
    onSuccess: (workflow) => {
      queryClient.setQueryData(workflowQueryKeys.detail(workflow.id), workflow);
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.list() });
      toast({ tone: "success", title: "Workflow created", message: "Opening the new draft." });
      router.push(`/workflows/${encodeURIComponent(workflow.id)}`);
    },
    onError: (error) => toast({ tone: "error", title: "Could not create workflow", message: error instanceof Error ? error.message : "Please try again." }),
  });

  const remove = useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: (_, workflowId) => {
      queryClient.removeQueries({ queryKey: workflowQueryKeys.detail(workflowId) });
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.list() });
      setWorkflowToDelete(null);
      toast({ tone: "success", title: "Workflow deleted" });
    },
    onError: (error) => toast({ tone: "error", title: "Could not delete workflow", message: error instanceof Error ? error.message : "Please try again." }),
  });

  const filteredWorkflows = useMemo(() => {
    if (!workflows.data) return [];
    const query = search.trim().toLowerCase();
    return workflows.data.filter((workflow) => {
      const matchesSearch = !query || workflow.name.toLowerCase().includes(query) || workflow.description.toLowerCase().includes(query);
      const matchesStatus = status === "all" || workflow.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status, workflows.data]);

  if (workflows.isPending) return <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">Loading workflows…</div>;
  if (workflows.isError) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{workflows.error.message}</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Workspace</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Your workflows</h2>
          <p className="mt-1 text-sm text-slate-500">{workflows.data.length} {workflows.data.length === 1 ? "workflow" : "workflows"} in your workspace.</p>
        </div>
        <button type="button" onClick={() => create.mutate(newWorkflow())} disabled={create.isPending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">{create.isPending ? "Creating…" : "+ New workflow"}</button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search workflows</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search workflows…" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
        </label>
        <label className="sm:w-40">
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as "all" | Workflow["status"])} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50">
            <option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option>
          </select>
        </label>
      </div>

      {workflows.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-xl text-indigo-600">＋</div><h3 className="mt-4 font-semibold text-slate-950">No workflows yet</h3><p className="mt-1 text-sm text-slate-500">Create your first workflow to start building.</p><button type="button" onClick={() => create.mutate(newWorkflow())} disabled={create.isPending} className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Create workflow</button></div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm"><h3 className="font-semibold text-slate-950">No matching workflows</h3><p className="mt-1 text-sm text-slate-500">Try a different search or status filter.</p><button type="button" onClick={() => { setSearch(""); setStatus("all"); }} className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700">Clear filters</button></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left"><caption className="sr-only">FlowForge workflows</caption><thead className="border-b border-slate-200 bg-slate-50"><tr><th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Workflow</th><th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th><th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Updated</th><th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">
              {filteredWorkflows.map((workflow) => <tr key={workflow.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-4"><div className="max-w-[360px]"><p className="truncate font-semibold text-slate-950">{workflow.name}</p><p className="mt-1 truncate text-xs text-slate-500">{workflow.description || "No description"}</p></div></td><td className="px-5 py-4"><StatusBadge status={workflow.status} /></td><td className="px-5 py-4 text-sm text-slate-500">{new Date(workflow.updatedAt).toLocaleString()}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/workflows/${encodeURIComponent(workflow.id)}`} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Edit</Link><button type="button" onClick={() => setWorkflowToDelete(workflow)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">Delete</button></div></td></tr>)}
            </tbody></table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredWorkflows.map((workflow) => <article key={workflow.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold text-slate-950">{workflow.name}</h3><p className="mt-1 truncate text-xs text-slate-500">{workflow.description || "No description"}</p></div><StatusBadge status={workflow.status} /></div><p className="mt-4 text-xs text-slate-500">Updated {new Date(workflow.updatedAt).toLocaleString()}</p><div className="mt-4 grid grid-cols-2 gap-2"><Link href={`/workflows/${encodeURIComponent(workflow.id)}`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white">Edit</Link><button type="button" onClick={() => setWorkflowToDelete(workflow)} className="rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button></div></article>)}
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Showing {filteredWorkflows.length} of {workflows.data.length} workflows</div>
        </div>
      )}

      <ConfirmDialog open={Boolean(workflowToDelete)} title="Delete workflow?" description={`This will permanently remove “${workflowToDelete?.name ?? "this workflow"}” and its saved data. This action cannot be undone.`} confirmLabel="Delete workflow" destructive busy={remove.isPending} onCancel={() => setWorkflowToDelete(null)} onConfirm={() => { if (workflowToDelete) remove.mutate(workflowToDelete.id); }} />
    </div>
  );
}

function StatusBadge({ status }: Readonly<{ status: Workflow["status"] }>) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{status === "published" ? "Published" : "Draft"}</span>;
}
