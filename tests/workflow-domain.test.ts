import { describe, expect, it } from "vitest";
import { fromPersistence, toPersistence, validateEdge, validateNode, validateWorkflow, type Workflow, type WorkflowEdge, type WorkflowNode } from "../domain";

const trigger: WorkflowNode = { id: "trigger", type: "trigger", position: { x: 0, y: 0 }, config: { triggerName: "Manual start", triggerType: "manual" } };
const action: WorkflowNode = { id: "action", type: "action", position: { x: 200, y: 0 }, config: { actionName: "Assign owner", operation: "assign" } };
const condition: WorkflowNode = { id: "condition", type: "condition", position: { x: 400, y: 0 }, config: { field: "priority", operator: "equals", comparisonValue: "high" } };
const notification: WorkflowNode = { id: "notification", type: "notification", position: { x: 600, y: -100 }, config: { recipient: "ops@example.com", message: "High priority request" } };
const end: WorkflowNode = { id: "end", type: "end", position: { x: 800, y: 0 }, config: { completionLabel: "Complete" } };
const edge = (id: string, sourceNodeId: string, targetNodeId: string, sourcePort: WorkflowEdge["sourcePort"] = "default"): WorkflowEdge => ({ id, sourceNodeId, sourcePort, targetNodeId, targetPort: "default" });
const validWorkflow = (): Workflow => ({ id: "workflow-1", name: "Request handling", description: "A valid workflow", status: "draft", version: 1, nodes: [trigger, action, condition, notification, end], edges: [edge("e1", "trigger", "action"), edge("e2", "action", "condition"), edge("e3", "condition", "notification", "true"), edge("e4", "condition", "end", "false"), edge("e5", "notification", "end")], createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" });

describe("FlowForge workflow domain", () => {
  it("accepts a valid workflow", () => expect(validateWorkflow(validWorkflow()).valid).toBe(true));
  it("rejects missing trigger/end", () => {
    const workflow = validWorkflow(); workflow.nodes = [action]; workflow.edges = [];
    expect(validateWorkflow(workflow).issues.map((x) => x.code)).toEqual(expect.arrayContaining(["WORKFLOW_NO_TRIGGER", "WORKFLOW_NO_END"]));
  });
  it("rejects multiple triggers", () => {
    const workflow = validWorkflow(); workflow.nodes = [...workflow.nodes, { ...trigger, id: "trigger-2" }];
    expect(validateWorkflow(workflow).issues.map((x) => x.code)).toContain("WORKFLOW_MULTIPLE_TRIGGERS");
  });
  it("validates invalid configurations", () => {
    expect(validateNode({ ...action, config: { actionName: "", operation: "assign" } })).toEqual(expect.arrayContaining([expect.objectContaining({ fieldPath: "actionName" })]));
    expect(validateNode({ ...condition, config: { field: "", operator: "equals", comparisonValue: "" } })).toHaveLength(2);
    expect(validateNode({ ...notification, config: { recipient: "", message: "" } })).toHaveLength(2);
    expect(validateNode({ ...trigger, config: { triggerName: "", triggerType: "manual" } })).toHaveLength(1);
    expect(validateNode({ ...end, config: { completionLabel: "   " } })).toHaveLength(1);
  });
  it("rejects missing references and invalid ports", () => {
    const workflow = validWorkflow();
    expect(validateEdge(edge("missing", "action", "does-not-exist"), workflow.nodes)).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_EDGE" })]));
    expect(validateEdge(edge("bad-port", "action", "condition", "true"), workflow.nodes)).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_EDGE" })]));
    expect(validateEdge({ ...edge("bad-target", "action", "condition"), targetPort: "unknown" as never }, workflow.nodes)).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_EDGE" })]));
  });
  it("rejects self connections and end outgoing connections", () => {
    const workflow = validWorkflow(); workflow.edges.push(edge("end-out", "end", "action"), edge("self", "action", "action"));
    const codes = validateWorkflow(workflow).issues.map((x) => x.code);
    expect(codes).toContain("INVALID_EDGE"); expect(codes).toContain("CYCLE_NOT_ALLOWED");
  });
  it("rejects cycles", () => {
    const workflow = validWorkflow(); workflow.edges.push(edge("cycle", "end", "action"));
    expect(validateWorkflow(workflow).issues.map((x) => x.code)).toContain("CYCLE_NOT_ALLOWED");
  });
  it("rejects unreachable nodes", () => {
    const workflow = validWorkflow(); workflow.nodes.push({ ...notification, id: "orphan", position: { x: 1000, y: 1000 } });
    expect(validateWorkflow(workflow).issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "UNREACHABLE_NODE", nodeId: "orphan" })]));
  });
  it("requires both condition branches", () => {
    const workflow = validWorkflow(); workflow.edges = workflow.edges.filter((x) => x.sourcePort !== "false");
    expect(validateWorkflow(workflow).issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_BRANCH", nodeId: "condition" })]));
  });
  it("round-trips through persistence transforms", () => {
    const workflow = validWorkflow(); const restored = fromPersistence(toPersistence(workflow));
    expect(restored).toEqual(workflow); expect(restored).not.toBe(workflow); expect(restored.nodes).not.toBe(workflow.nodes);
  });
});
