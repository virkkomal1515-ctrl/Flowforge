import type { Workflow } from "@/domain";

export interface WorkflowHistory {
  past: Workflow[];
  present: Workflow;
  future: Workflow[];
}

export const DEFAULT_HISTORY_LIMIT = 50;

const clone = (workflow: Workflow): Workflow => structuredClone(workflow);

export function createWorkflowHistory(workflow: Workflow): WorkflowHistory {
  return { past: [], present: clone(workflow), future: [] };
}

export function commitWorkflowHistory(history: WorkflowHistory, workflow: Workflow, limit = DEFAULT_HISTORY_LIMIT): WorkflowHistory {
  if (JSON.stringify(history.present) === JSON.stringify(workflow)) return history;
  const nextPast = [...history.past, clone(history.present)];
  return {
    past: nextPast.length > limit ? nextPast.slice(nextPast.length - limit) : nextPast,
    present: clone(workflow),
    future: [],
  };
}

export function undoWorkflowHistory(history: WorkflowHistory): WorkflowHistory {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: clone(previous),
    future: [clone(history.present), ...history.future],
  };
}

export function redoWorkflowHistory(history: WorkflowHistory, limit = DEFAULT_HISTORY_LIMIT): WorkflowHistory {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  return {
    past: [...history.past, clone(history.present)].slice(-limit),
    present: clone(next),
    future: history.future.slice(1),
  };
}
