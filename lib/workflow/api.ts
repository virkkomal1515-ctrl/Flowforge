import type { ExecutionInput, ExecutionResult, Workflow } from "@/domain";

export const workflowQueryKeys = {
  all: ["workflows"] as const,
  list: () => [...workflowQueryKeys.all, "list"] as const,
  detail: (workflowId: string) => [...workflowQueryKeys.all, "detail", workflowId] as const,
};

interface ErrorPayload { error?: { message?: string; issues?: unknown[] } }

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as (T & ErrorPayload) | null;
  if (!response.ok) throw new Error(body?.error?.message ?? "Workflow request failed.");
  return body as T;
}

export function fetchWorkflows() { return request<{ workflows: Workflow[] }>("/api/workflows").then(({ workflows }) => workflows); }
export function fetchWorkflow(workflowId: string) { return request<Workflow>(`/api/workflows/${encodeURIComponent(workflowId)}`); }
export function createWorkflow(workflow: Workflow) { return request<Workflow>("/api/workflows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workflow) }); }
export function updateWorkflow(workflow: Workflow) { return request<Workflow>(`/api/workflows/${encodeURIComponent(workflow.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow, expectedRevision: workflow.version }) }); }
export function publishWorkflow(workflow: Workflow) { return request<Workflow>(`/api/workflows/${encodeURIComponent(workflow.id)}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow, expectedRevision: workflow.version }) }); }
export function executeWorkflow(workflowId: string, input: ExecutionInput = {}, failNodeId?: string) { return request<ExecutionResult>(`/api/workflows/${encodeURIComponent(workflowId)}/execute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input, failNodeId }) }); }
export function deleteWorkflow(workflowId: string) { return fetch(`/api/workflows/${encodeURIComponent(workflowId)}`, { method: "DELETE" }).then(async (response) => { if (response.ok) return; const body = (await response.json().catch(() => null)) as ErrorPayload | null; throw new Error(body?.error?.message ?? "Unable to delete workflow."); }); }
