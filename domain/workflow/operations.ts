import type { Position, Workflow, WorkflowEdge } from "./types";
import { validateEdge } from "./validation";

export function moveNode(workflow: Workflow, nodeId: string, position: Position): Workflow {
  return { ...workflow, nodes: workflow.nodes.map((node) => node.id === nodeId ? { ...node, position: { ...position } } : node) };
}

export function deleteNodes(workflow: Workflow, nodeIds: readonly string[]): Workflow {
  const ids = new Set(nodeIds);
  return {
    ...workflow,
    nodes: workflow.nodes.filter((node) => !ids.has(node.id)),
    edges: workflow.edges.filter((edge) => !ids.has(edge.sourceNodeId) && !ids.has(edge.targetNodeId)),
  };
}

export function addEdge(workflow: Workflow, edge: WorkflowEdge): Workflow | null {
  if (validateEdge(edge, workflow.nodes).length > 0) return null;
  if (workflow.edges.some((existing) => existing.id === edge.id)) return null;
  if (workflow.edges.some((existing) => existing.sourceNodeId === edge.sourceNodeId && existing.sourcePort === edge.sourcePort && existing.targetNodeId === edge.targetNodeId && existing.targetPort === edge.targetPort)) return null;
  return { ...workflow, edges: [...workflow.edges, edge] };
}
