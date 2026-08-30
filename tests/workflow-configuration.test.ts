import { describe, expect, it } from "vitest";
import { createDefaultNode, updateNodeConfig, validateNodeConfigInput, type Workflow } from "../domain";

const workflow = (): Workflow => ({ id: "w", name: "Test", description: "", status: "draft", version: 1, nodes: [createDefaultNode("trigger", "trigger", { x: 10, y: 20 }), createDefaultNode("action", "action", { x: 100, y: 200 })], edges: [], createdAt: "now", updatedAt: "now" });

describe("node configuration", () => {
  it("validates form input without replacing domain validation", () => {
    expect(validateNodeConfigInput("action", { actionName: "Assign", operation: "assign" })).toEqual({ actionName: "Assign", operation: "assign" });
    expect(validateNodeConfigInput("action", { actionName: "", operation: "assign" })).toBeNull();
  });

  it("updates only the selected node configuration", () => {
    const current = workflow();
    const updated = updateNodeConfig(current, "action", { actionName: "Update owner", operation: "update_status", parameter: "owner" });
    expect(updated?.nodes.find((node) => node.id === "action")).toMatchObject({ id: "action", type: "action", position: { x: 100, y: 200 }, config: { actionName: "Update owner", operation: "update_status", parameter: "owner" } });
    expect(updated?.nodes.find((node) => node.id === "trigger")).toEqual(current.nodes[0]);
  });

  it("rejects wrong configuration types and invalid domain configuration", () => {
    const current = workflow();
    expect(updateNodeConfig(current, "action", { triggerName: "wrong", triggerType: "manual" })).toBeNull();
    expect(updateNodeConfig(current, "action", { actionName: "", operation: "assign" })).toBeNull();
    expect(updateNodeConfig(current, "missing", { actionName: "x", operation: "assign" })).toBeNull();
  });
});
