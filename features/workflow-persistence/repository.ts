import type { Workflow } from "@/domain";
import { fromPersistence, toPersistence, type PersistedWorkflowDto } from "@/lib/workflow/persistence-transforms";
import { supabaseRequest } from "@/lib/supabase/server";

export class WorkflowNotFoundError extends Error { constructor(id: string) { super(`Workflow ${id} was not found.`); this.name = "WorkflowNotFoundError"; } }
export class WorkflowRevisionConflictError extends Error { constructor() { super("Workflow has changed since it was loaded."); this.name = "WorkflowRevisionConflictError"; } }
export class WorkflowPersistenceError extends Error { constructor(message: string) { super(message); this.name = "WorkflowPersistenceError"; } }

export interface WorkflowRepository {
  list(): Promise<Workflow[]>;
  create(workflow: Workflow): Promise<Workflow>;
  get(id: string): Promise<Workflow>;
  update(workflow: Workflow, expectedRevision: number): Promise<Workflow>;
  delete(id: string): Promise<void>;
}

function toError(error: string): WorkflowPersistenceError { return new WorkflowPersistenceError(`Workflow persistence failed: ${error}`); }
function mapResult(result: { data: PersistedWorkflowDto[] | null; error: string | null }): Workflow {
  if (result.error) throw toError(result.error);
  const persisted = result.data?.[0];
  if (!persisted) throw toError("Storage returned no workflow.");
  try { return fromPersistence(persisted); } catch (error) { throw toError(error instanceof Error ? error.message : "Invalid persisted workflow."); }
}

export const workflowRepository: WorkflowRepository = {
  async list() {
    const result = await supabaseRequest<PersistedWorkflowDto[]>("workflows?select=*&order=updated_at.desc");
    if (result.error) throw toError(result.error);
    try { return (result.data ?? []).map(fromPersistence); } catch (error) { throw toError(error instanceof Error ? error.message : "Invalid persisted workflow."); }
  },
  async create(workflow) { return mapResult(await supabaseRequest<PersistedWorkflowDto[]>("workflows", { method: "POST", body: JSON.stringify(toPersistence(workflow)) })); },
  async get(id) {
    const result = await supabaseRequest<PersistedWorkflowDto[]>(`workflows?id=eq.${encodeURIComponent(id)}&select=*`);
    if (result.error) throw toError(result.error);
    const persisted = result.data?.[0];
    if (!persisted) throw new WorkflowNotFoundError(id);
    try { return fromPersistence(persisted); } catch (error) { throw toError(error instanceof Error ? error.message : "Invalid persisted workflow."); }
  },
  async update(workflow, expectedRevision) {
    const result = await supabaseRequest<PersistedWorkflowDto[]>(`workflows?id=eq.${encodeURIComponent(workflow.id)}&revision=eq.${expectedRevision}`, { method: "PATCH", body: JSON.stringify({ ...toPersistence(workflow), revision: expectedRevision + 1 }) });
    if (result.error) throw toError(result.error);
    if (!result.data?.[0]) throw new WorkflowRevisionConflictError();
    try { return fromPersistence(result.data[0]); } catch (error) { throw toError(error instanceof Error ? error.message : "Invalid persisted workflow."); }
  },
  async delete(id) {
    const result = await supabaseRequest<unknown[]>(`workflows?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    if (result.error) throw toError(result.error);
  },
};
