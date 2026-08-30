import type { Workflow } from "@/domain";

export const sampleWorkflow: Workflow = {
  id: "canvas-demo",
  name: "Request routing",
  description: "Deterministic canvas demo data.",
  status: "draft",
  version: 1,
  createdAt: "2026-08-30T00:00:00.000Z",
  updatedAt: "2026-08-30T00:00:00.000Z",
  nodes: [
    { id: "trigger", type: "trigger", position: { x: 40, y: 160 }, config: { triggerName: "Manual start", triggerType: "manual" } },
    { id: "action", type: "action", position: { x: 300, y: 160 }, config: { actionName: "Assign owner", operation: "assign" } },
    { id: "condition", type: "condition", position: { x: 560, y: 160 }, config: { field: "priority", operator: "equals", comparisonValue: "high" } },
    { id: "notification", type: "notification", position: { x: 840, y: 60 }, config: { recipient: "team@example.com", message: "High priority request" } },
    { id: "end", type: "end", position: { x: 1100, y: 160 }, config: { completionLabel: "Complete" } },
  ],
  edges: [
    { id: "e-trigger-action", sourceNodeId: "trigger", sourcePort: "default", targetNodeId: "action", targetPort: "default" },
    { id: "e-action-condition", sourceNodeId: "action", sourcePort: "default", targetNodeId: "condition", targetPort: "default" },
    { id: "e-condition-notification", sourceNodeId: "condition", sourcePort: "true", targetNodeId: "notification", targetPort: "default" },
    { id: "e-condition-end", sourceNodeId: "condition", sourcePort: "false", targetNodeId: "end", targetPort: "default" },
    { id: "e-notification-end", sourceNodeId: "notification", sourcePort: "default", targetNodeId: "end", targetPort: "default" },
  ],
};
