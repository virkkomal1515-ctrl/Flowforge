import type { Workflow } from "../types";

export type PersistedWorkflow = Workflow;

export function toPersistence(workflow: Workflow): PersistedWorkflow {
  return structuredClone(workflow);
}

export function fromPersistence(value: PersistedWorkflow): Workflow {
  return structuredClone(value);
}
