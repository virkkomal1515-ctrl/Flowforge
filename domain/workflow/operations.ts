import type { NodeConfig, NodeType, Position, Workflow, WorkflowEdge, WorkflowNode } from "./types";
import { validateEdge, validateNode, isNodeConfigForType } from "./validation";

export function createDefaultNode(type: NodeType, id: string, position: Position): WorkflowNode {
  const base = { id, position: { ...position } };

  switch (type) {
    case "trigger":
      return { ...base, type, config: { triggerName: "Manual start", triggerType: "manual" } };
    case "action":
      return { ...base, type, config: { actionName: "New action", operation: "assign" } };
    case "condition":
      return { ...base, type, config: { field: "status", operator: "equals", comparisonValue: "ready" } };
    case "notification":
      return { ...base, type, config: { recipient: "recipient@example.com", message: "Workflow notification" } };
    case "end":
      return { ...base, type, config: { completionLabel: "Complete" } };
  }
}

export function addNode(workflow: Workflow, type: NodeType, id: string, position: Position): Workflow | null {
  if (workflow.nodes.some((node) => node.id === id)) return null;
  if (type === "trigger" && workflow.nodes.some((node) => node.type === "trigger")) return null;
  return { ...workflow, nodes: [...workflow.nodes, createDefaultNode(type, id, position)] };
}

export function moveNode(workflow: Workflow, nodeId: string, position: Position): Workflow {
  return { ...workflow, nodes: workflow.nodes.map((node) => node.id === nodeId ? { ...node, position: { ...position } } : node) };
}

export function updateNodeConfig(workflow: Workflow, nodeId: string, config: NodeConfig): Workflow | null {
  const node = workflow.nodes.find((candidate) => candidate.id === nodeId);
  if (!node || !isNodeConfigForType(node.type, config)) return null;
  const updatedNode = { ...node, config } as WorkflowNode;
  if (validateNode(updatedNode).some((issue) => issue.severity === "error")) return null;
  return { ...workflow, nodes: workflow.nodes.map((candidate) => candidate.id === nodeId ? updatedNode : candidate) };
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
