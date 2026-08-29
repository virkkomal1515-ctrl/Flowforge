import type { WorkflowEdge, WorkflowNode } from "../types";
import type { ValidationIssue } from "./types";

const issue = (edge: WorkflowEdge, message: string): ValidationIssue => ({
  id: `${edge.id}:INVALID_EDGE`,
  code: "INVALID_EDGE",
  severity: "error",
  message,
  edgeId: edge.id,
});

export function validateEdge(edge: WorkflowEdge, nodes: WorkflowNode[]): ValidationIssue[] {
  const source = nodes.find((node) => node.id === edge.sourceNodeId);
  const target = nodes.find((node) => node.id === edge.targetNodeId);
  const issues: ValidationIssue[] = [];

  if (!source || !target) {
    return [issue(edge, "Edge references a node that does not exist.")];
  }
  if (source.id === target.id) issues.push(issue(edge, "A node cannot connect to itself."));
  if (edge.targetPort !== "default") issues.push(issue(edge, "Target port must be default."));

  const allowedSourcePorts = source.type === "condition" ? ["true", "false"] : ["default"];
  if (!allowedSourcePorts.includes(edge.sourcePort)) {
    issues.push(issue(edge, "Source port is not valid for the source node type."));
  }
  if (source.type === "end") issues.push(issue(edge, "End nodes cannot have outgoing connections."));
  return issues;
}

export function validateEdges(edges: WorkflowEdge[], nodes: WorkflowNode[]): ValidationIssue[] {
  const issues = edges.flatMap((edge) => validateEdge(edge, nodes));
  const seen = new Set<string>();
  for (const edge of edges) {
    const key = `${edge.sourceNodeId}:${edge.sourcePort}:${edge.targetNodeId}:${edge.targetPort}`;
    if (seen.has(key)) issues.push(issue(edge, "Duplicate connections are not allowed."));
    seen.add(key);
  }
  return issues;
}
