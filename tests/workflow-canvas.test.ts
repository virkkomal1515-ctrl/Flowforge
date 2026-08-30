import { describe, expect, it } from "vitest";
import type { Workflow } from "../domain";
import { addEdge, addNode, deleteNodes, moveNode } from "../domain";
import { toDomainEdge, toReactFlow } from "../lib/workflow/react-flow-adapter";
import { sampleWorkflow } from "../lib/workflow/sample-workflow";

describe("workflow canvas adapter", () => {
  it("maps all five domain node types to React Flow nodes and edges back to ports", () => {
    const { nodes, edges } = toReactFlow(sampleWorkflow);
    expect(nodes.map((node) => node.type)).toEqual(["trigger", "action", "condition", "notification", "end"]);
    expect(edges).toHaveLength(5);
    expect(edges.find((edge) => edge.id === "e-condition-notification")?.sourceHandle).toBe("true");
    expect(toDomainEdge({ id: "new-edge", source: "condition", target: "end", sourceHandle: "false", targetHandle: "default" })).toEqual({ id: "new-edge", sourceNodeId: "condition", sourcePort: "false", targetNodeId: "end", targetPort: "default" });
  });

  it("rejects malformed handles at the adapter boundary", () => {
    expect(toDomainEdge({ id: "bad", source: "action", target: "end", sourceHandle: "unknown", targetHandle: "default" })).toBeNull();
    expect(toDomainEdge({ id: "bad-target", source: "action", target: "end", sourceHandle: "default", targetHandle: "output" })).toBeNull();
  });
});

describe("canvas domain operations", () => {
  it("adds and moves a node without importing UI types", () => {
    const added = addNode(sampleWorkflow, "action", "new-action", { x: 20, y: 40 });
    expect(added?.nodes.at(-1)?.position).toEqual({ x: 20, y: 40 });
    const moved = moveNode(added as Workflow, "new-action", { x: 80, y: 120 });
    expect(moved.nodes.find((node) => node.id === "new-action")?.position).toEqual({ x: 80, y: 120 });
  });

  it("accepts valid connections and rejects invalid domain connections", () => {
    const valid = addEdge(sampleWorkflow, { id: "new", sourceNodeId: "action", sourcePort: "default", targetNodeId: "end", targetPort: "default" });
    expect(valid?.edges.some((edge) => edge.id === "new")).toBe(true);
    const invalidPort = toDomainEdge({ id: "bad-port", source: "action", target: "end", sourceHandle: "true", targetHandle: "default" });
    expect(invalidPort).not.toBeNull();
    expect(addEdge(sampleWorkflow, invalidPort!)).toBeNull();
    const invalid = addEdge(sampleWorkflow, { id: "bad", sourceNodeId: "end", sourcePort: "default", targetNodeId: "action", targetPort: "default" });
    expect(invalid).toBeNull();
  });

  it("deletes a node and its connected edges as one domain operation", () => {
    const result = deleteNodes(sampleWorkflow, ["condition"]);
    expect(result.nodes.some((node) => node.id === "condition")).toBe(false);
    expect(result.edges.some((edge) => edge.sourceNodeId === "condition" || edge.targetNodeId === "condition")).toBe(false);
  });
});
