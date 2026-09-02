"use client";

import { useState } from "react";
import type { ExecutionResult, Workflow } from "@/domain";
import { executeWorkflow } from "@/lib/workflow/api";

export function ExecutionPreview({ workflow }: { workflow: Workflow }) {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [failNodeId, setFailNodeId] = useState<string>("");
  const [message, setMessage] = useState("Publish the workflow to enable execution preview.");
  const published = workflow.status === "published";

  const run = async (failureNode?: string) => {
    setRunning(true);
    setMessage("Execution started.");
    try {
      const next = await executeWorkflow(workflow.id, { priority: "high" }, failureNode);
      setResult(next);
      setMessage(next.status === "successful" ? "Execution completed successfully." : next.failure?.message ?? "Execution failed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start execution.");
    } finally { setRunning(false); }
  };

  const statuses = new Map(result?.nodeResults.map((node) => [node.nodeId, node.status]));
  return <section aria-label="Execution Preview" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium text-slate-500">Published workflow</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Execution Preview</h2><p className="mt-1 text-sm text-slate-600">Runs the immutable published snapshot. Editing the draft does not change an execution already started.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={!published || running} onClick={() => run(failNodeId || undefined)} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{running ? "Running…" : "Run Preview"}</button><button type="button" disabled={!published || !result || running} onClick={() => run()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Retry</button></div>
    </div>
    <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700" role="status" aria-live="polite">{message}</div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div><label htmlFor="failure-node" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deterministic failure fixture</label><select id="failure-node" value={failNodeId} onChange={(event) => setFailNodeId(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">No simulated failure</option>{workflow.nodes.filter((node) => node.type !== "trigger" && node.type !== "end").map((node) => <option key={node.id} value={node.id}>Fail {node.type}: {node.id}</option>)}</select></div>
      <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Execution status</p><p className="mt-2 text-sm font-semibold text-slate-900">{result?.status ?? "idle"}</p></div>
    </div>
    {result ? <div className="mt-5 grid gap-4 lg:grid-cols-2"><div><h3 className="text-sm font-semibold text-slate-900">Node progress</h3><ul className="mt-2 space-y-2">{workflow.nodes.map((node) => <li key={node.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"><span>{node.type} · {node.id}</span><span className="font-medium">{statuses.get(node.id) ?? "pending"}</span></li>)}</ul></div><div><h3 className="text-sm font-semibold text-slate-900">Execution logs</h3><ul className="mt-2 max-h-64 space-y-2 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-white">{result.logs.map((log, index) => <li key={`${log.timestamp}-${index}`}><span className="opacity-60">{log.timestamp}</span> {log.message}</li>)}</ul></div></div> : null}
  </section>;
}
