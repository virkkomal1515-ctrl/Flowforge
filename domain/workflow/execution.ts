import type { ConditionOperator, ExecutionInput, ExecutionResult, ExecutionSimulationOptions, NodeExecutionResult, Workflow, WorkflowEdge, WorkflowNode } from "./types";
import { validateForPublish } from "./validation";

const STEP_MS = 1000;
function isoStep(start: number, step: number): string { return new Date(start + step * STEP_MS).toISOString(); }
function compare(left: string | number | boolean | null | undefined, operator: ConditionOperator, right: string): boolean {
  if (left === null || left === undefined) return operator === "not_equals" && right !== "";
  switch (operator) {
    case "equals": return String(left) === right;
    case "not_equals": return String(left) !== right;
    case "greater_than": return Number(left) > Number(right);
    case "less_than": return Number(left) < Number(right);
  }
}
function outgoing(edges: WorkflowEdge[], nodeId: string, port?: WorkflowEdge["sourcePort"]): WorkflowEdge[] { return edges.filter((edge) => edge.sourceNodeId === nodeId && (!port || edge.sourcePort === port)); }
function addResult(results: NodeExecutionResult[], nodeId: string, status: NodeExecutionResult["status"]): void { const existing = results.find((result) => result.nodeId === nodeId); if (existing) existing.status = status; else results.push({ nodeId, status }); }

export function executeWorkflow(workflow: Workflow, input: ExecutionInput = {}, options: ExecutionSimulationOptions = {}): ExecutionResult {
  const validation = validateForPublish(workflow);
  const start = Date.parse(options.now ?? "2026-01-01T00:00:00.000Z");
  const startedAt = new Date(start).toISOString();
  const result: ExecutionResult = { id: options.executionId ?? `execution-${workflow.id}-${workflow.version}`, workflowId: workflow.id, status: "running", startedAt, nodeResults: workflow.nodes.map((node) => ({ nodeId: node.id, status: "pending" })), logs: [] };
  if (!validation.valid || workflow.status !== "published") { result.status = "failed"; result.completedAt = startedAt; result.failure = { nodeId: workflow.nodes[0]?.id ?? "workflow", message: "Only a valid published workflow can execute." }; result.logs.push({ timestamp: startedAt, message: result.failure.message, level: "error" }); return result; }
  const trigger = workflow.nodes.find((node): node is Extract<WorkflowNode, { type: "trigger" }> => node.type === "trigger");
  if (!trigger) throw new Error("Validated workflow has no trigger.");
  const nodeById = new Map(workflow.nodes.map((node) => [node.id, node]));
  const visited = new Set<string>(); let current: WorkflowNode | undefined = trigger; let step = 0;
  while (current) {
    if (visited.has(current.id)) { result.status = "failed"; result.failure = { nodeId: current.id, message: "Execution stopped because a cycle was encountered." }; break; }
    visited.add(current.id); addResult(result.nodeResults, current.id, "running"); result.logs.push({ timestamp: isoStep(start, step), nodeId: current.id, message: `${current.type} started.`, level: "info" });
    if (options.failNodeId === current.id) { addResult(result.nodeResults, current.id, "failed"); result.failure = { nodeId: current.id, message: `Simulated failure for ${current.type} node.` }; result.logs.push({ timestamp: isoStep(start, step + 1), nodeId: current.id, message: result.failure.message, level: "error" }); result.status = "failed"; break; }
    let nextEdge: WorkflowEdge | undefined;
    if (current.type === "condition") {
      const selected = compare(input[current.config.field], current.config.operator, current.config.comparisonValue) ? "true" : "false";
      const skipped = selected === "true" ? "false" : "true";
      for (const edge of outgoing(workflow.edges, current.id, skipped)) addResult(result.nodeResults, edge.targetNodeId, "skipped");
      nextEdge = outgoing(workflow.edges, current.id, selected)[0]; result.logs.push({ timestamp: isoStep(start, step + 1), nodeId: current.id, message: `Condition evaluated ${selected}.`, level: "info" });
    } else nextEdge = outgoing(workflow.edges, current.id, "default")[0];
    addResult(result.nodeResults, current.id, "successful"); result.logs.push({ timestamp: isoStep(start, step + 1), nodeId: current.id, message: `${current.type} completed.`, level: "info" });
    if (current.type === "end") break;
    current = nextEdge ? nodeById.get(nextEdge.targetNodeId) : undefined; step += 1;
  }
  if (!result.failure) { result.status = current?.type === "end" || [...visited].some((id) => nodeById.get(id)?.type === "end") ? "successful" : "failed"; if (result.status === "failed") result.failure = { nodeId: current?.id ?? trigger.id, message: "Execution ended without reaching an End node." }; }
  result.completedAt = isoStep(start, step + 1); result.logs.push({ timestamp: result.completedAt, message: result.status === "successful" ? "Workflow completed." : "Workflow failed.", level: result.status === "successful" ? "info" : "error" }); return result;
}
