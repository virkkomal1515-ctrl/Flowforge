import { describe, expect, it } from "vitest";
import { createDefaultNode, updateNodeConfig, type Workflow } from "../domain";
import { nodeConfigSchemas } from "../components/workflow/node-configuration-schemas";

const workflow = (): Workflow => ({ id: "w", name: "Test", description: "", status: "draft", version: 1, nodes: [createDefaultNode("trigger", "trigger", { x: 10, y: 20 }), createDefaultNode("action", "action", { x: 100, y: 200 })], edges: [], createdAt: "now", updatedAt: "now" });

describe("node configuration", () => {
  it("validates all five form schemas", () => {
    expect(nodeConfigSchemas.trigger.safeParse({ triggerName: "Start", triggerType: "manual" }).success).toBe(true);
    expect(nodeConfigSchemas.action.safeParse({ actionName: "Assign", operation: "assign" }).success).toBe(true);
    expect(nodeConfigSchemas.condition.safeParse({ field: "priority", operator: "equals", comparisonValue: "high" }).success).toBe(true);
    expect(nodeConfigSchemas.notification.safeParse({ recipient: "team@example.com", message: "Hello" }).success).toBe(true);
    expect(nodeConfigSchemas.end.safeParse({ completionLabel: "Complete" }).success).toBe(true);
  });
  it("reports invalid form input", () => {
    expect(nodeConfigSchemas.action.safeParse({ actionName: "", operation: "assign" }).success).toBe(false);
    expect(nodeConfigSchemas.notification.safeParse({ recipient: "not-an-email", message: "" }).success).toBe(false);
  });
  it("updates only the selected node configuration and preserves identity/position/type", () => {
    const current = workflow(); const updated = updateNodeConfig(current, "action", { actionName: "Update owner", operation: "update_status", parameter: "owner" });
    expect(updated).not.toBeNull(); expect(updated?.nodes.find((node) => node.id === "action")).toMatchObject({ id: "action", type: "action", position: { x: 100, y: 200 }, config: { actionName: "Update owner", operation: "update_status", parameter: "owner" } }); expect(updated?.nodes.find((node) => node.id === "trigger")).toEqual(current.nodes[0]);
  });
  it("rejects wrong types, invalid domain configuration, and missing nodes", () => {
    const current = workflow(); expect(updateNodeConfig(current, "action", { triggerName: "wrong", triggerType: "manual" })).toBeNull(); expect(updateNodeConfig(current, "action", { actionName: "", operation: "assign" })).toBeNull(); expect(updateNodeConfig(current, "missing", { actionName: "x", operation: "assign" })).toBeNull();
  });
});
