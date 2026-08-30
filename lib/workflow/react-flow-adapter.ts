import type { Edge, Node } from "@xyflow/react";
import type { Workflow, WorkflowEdge, WorkflowNode } from "@/domain";

export type CanvasNodeData = { domainNodeId: string; title: string; nodeType: WorkflowNode["type"]; summary: string };
export type CanvasNode = Node<CanvasNodeData, WorkflowNode["type"]>;
export type CanvasEdge = Edge;
const titles: Record<WorkflowNode["type"], string> = { trigger: "Trigger", action: "Action", condition: "Condition", notification: "Notification", end: "End" };
function summary(node: WorkflowNode): string {
  switch (node.type) {
    case "trigger": return node.config.triggerName;
    case "action": return node.config.actionName;
    case "condition": return `${node.config.field} ${node.config.operator.replaceAll("_", " ")} ${node.config.comparisonValue}`;
    case "notification": return node.config.recipient;
    case "end": return node.config.completionLabel ?? "Complete";
  }
}
export function toReactFlow(workflow: Workflow): { nodes: CanvasNode[]; edges: CanvasEdge[] } { return { nodes: workflow.nodes.map((node) => ({ id: node.id, type: node.type, position: node.position, data: { domainNodeId: node.id, title: titles[node.type], nodeType: node.type, summary: summary(node) } })), edges: workflow.edges.map((edge) => ({ id: edge.id, source: edge.sourceNodeId, target: edge.targetNodeId, sourceHandle: edge.sourcePort, targetHandle: edge.targetPort, type: "smoothstep" })) }; }
export function toDomainEdge(edge: Pick<Edge, "id" | "source" | "target" | "sourceHandle" | "targetHandle">): WorkflowEdge | null { if (!edge.source || !edge.target) return null; const sourcePort = edge.sourceHandle ?? "default"; const targetPort = edge.targetHandle ?? "default"; if (sourcePort !== "default" && sourcePort !== "true" && sourcePort !== "false") return null; if (targetPort !== "default") return null; return { id: edge.id, sourceNodeId: edge.source, sourcePort, targetNodeId: edge.target, targetPort }; }
