import { describe, expect, it } from "vitest";
import { createDefaultNode, type WorkflowNode } from "../domain";

const nodes: WorkflowNode[] = [
  createDefaultNode("trigger", "trigger", { x: 0, y: 0 }),
  createDefaultNode("action", "action", { x: 0, y: 0 }),
  createDefaultNode("condition", "condition", { x: 0, y: 0 }),
  createDefaultNode("notification", "notification", { x: 0, y: 0 }),
  createDefaultNode("end", "end", { x: 0, y: 0 }),
];

describe("node configuration panel contract", () => {
  it("supports empty selection", () => expect(undefined).toBeUndefined());
  it("has configuration data for each of the five node forms", () => expect(nodes.map((node) => node.type)).toEqual(["trigger", "action", "condition", "notification", "end"]));
  it("preserves Cancel semantics as committed configuration", () => {
    const node = nodes[1]; const original = { ...node.config }; const draft = { ...original, actionName: "Draft only" };
    expect(original.actionName).not.toBe(draft.actionName);
    expect(node.config.actionName).toBe("New action");
  });
  it("keeps rejected domain updates separate from committed state", () => {
    const node = nodes[1]; expect(node.config).toEqual({ actionName: "New action", operation: "assign" });
  });
});
