import type { Workflow, WorkflowNode } from "../types";
import { validateNode } from "./node-validation";
import { validateEdges } from "./edge-validation";
import type { ValidationIssue, ValidationResult } from "./types";

const issue = (
  code: ValidationIssue["code"],
  message: string,
  nodeId?: string,
): ValidationIssue => ({
  id: `${code}:${nodeId ?? "workflow"}`,
  code,
  severity: "error",
  message,
  nodeId,
});

export function validateWorkflow(workflow: Workflow): ValidationResult {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set<string>();
  const triggers = workflow.nodes.filter((node) => node.type === "trigger");
  const ends = workflow.nodes.filter((node) => node.type === "end");

  for (const node of workflow.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push(issue("INVALID_EDGE", "Node IDs must be unique.", node.id));
    }
    nodeIds.add(node.id);
    issues.push(...validateNode(node));
  }

  if (triggers.length === 0) issues.push(issue("WORKFLOW_NO_TRIGGER", "Workflow must contain a Trigger node."));
  if (triggers.length > 1) issues.push(issue("WORKFLOW_MULTIPLE_TRIGGERS", "Workflow must contain exactly one Trigger node."));
  if (ends.length === 0) issues.push(issue("WORKFLOW_NO_END", "Workflow must contain an End node."));

  issues.push(...validateEdges(workflow.edges, workflow.nodes));

  if (triggers.length === 1) {
    const reachable = getReachableNodeIds(workflow, triggers[0].id);
    for (const node of workflow.nodes) {
      if (!reachable.has(node.id)) issues.push(issue("UNREACHABLE_NODE", "Node is not reachable from the workflow Trigger.", node.id));
    }
    if (ends.length > 0 && !ends.some((end) => reachable.has(end.id))) {
      issues.push(issue("WORKFLOW_NO_REACHABLE_END", "Workflow has no reachable terminal path."));
    }
  }

  if (hasCycle(workflow)) issues.push(issue("CYCLE_NOT_ALLOWED", "Workflow connections must not form a cycle."));

  for (const node of workflow.nodes) {
    if (node.type !== "condition") continue;
    const outgoing = workflow.edges.filter((edge) => edge.sourceNodeId === node.id);
    const trueEdges = outgoing.filter((edge) => edge.sourcePort === "true");
    const falseEdges = outgoing.filter((edge) => edge.sourcePort === "false");
    if (outgoing.some((edge) => edge.sourcePort === "default")) {
      issues.push(issue("INVALID_BRANCH", "Condition nodes cannot use a default output branch.", node.id));
    }
    if (trueEdges.length === 0 || falseEdges.length === 0) {
      issues.push(issue("INVALID_BRANCH", "Condition nodes must explicitly represent both true and false branches.", node.id));
    }
    if (trueEdges.length > 1 || falseEdges.length > 1) {
      issues.push(issue("INVALID_BRANCH", "Each condition branch may have at most one outgoing connection.", node.id));
    }
  }

  return { valid: !issues.some((item) => item.severity === "error"), issues };
}

function getReachableNodeIds(workflow: Workflow, startNodeId: string): Set<string> {
  const adjacency = new Map<string, string[]>();
  for (const node of workflow.nodes) adjacency.set(node.id, []);
  for (const edge of workflow.edges) adjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId);
  const visited = new Set<string>();
  const queue = [startNodeId];
  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) if (!visited.has(next)) queue.push(next);
  }
  return visited;
}

function hasCycle(workflow: Workflow): boolean {
  const adjacency = new Map<string, string[]>();
  for (const node of workflow.nodes) adjacency.set(node.id, []);
  for (const edge of workflow.edges) adjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: WorkflowNode): boolean => {
    if (visiting.has(node.id)) return true;
    if (visited.has(node.id)) return false;
    visiting.add(node.id);
    for (const targetId of adjacency.get(node.id) ?? []) {
      const target = workflow.nodes.find((candidate) => candidate.id === targetId);
      if (target && visit(target)) return true;
    }
    visiting.delete(node.id);
    visited.add(node.id);
    return false;
  };
  return workflow.nodes.some(visit);
}
