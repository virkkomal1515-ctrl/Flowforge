import { describe, expect, it } from "vitest";
import { fromPersistence, toPersistence } from "@/lib/workflow/persistence-transforms";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";

const persisted = toPersistence(sampleWorkflow);

describe("workflow persistence transforms", () => {
  it("maps the domain workflow to the storage representation", () => {
    expect(persisted).toMatchObject({
      id: sampleWorkflow.id,
      revision: sampleWorkflow.version,
      graph: { nodes: sampleWorkflow.nodes, edges: sampleWorkflow.edges },
    });
    expect(persisted).not.toHaveProperty("selectedNodeId");
  });

  it("round-trips workflow identity, metadata, graph, and configuration", () => {
    expect(fromPersistence(persisted)).toEqual(sampleWorkflow);
  });

  it("accepts valid ISO UTC timestamps", () => {
    expect(() => fromPersistence(persisted)).not.toThrow();
  });

  it("rejects malformed timestamps", () => {
    expect(() => fromPersistence({ ...persisted, created_at: "not-a-timestamp" })).toThrow();
    expect(() => fromPersistence({ ...persisted, updated_at: "2026-02-30T00:00:00.000Z" })).toThrow();
    expect(() => fromPersistence({ ...persisted, published_at: "2026-08-30" })).toThrow();
  });

  it("accepts a null published timestamp", () => {
    expect(fromPersistence({ ...persisted, published_at: null })).toEqual(sampleWorkflow);
  });

  it("rejects malformed persisted data", () => {
    expect(() => fromPersistence({ ...persisted, graph: { ...persisted.graph, nodes: "invalid" } })).toThrow();
  });

  it("rejects missing required fields", () => {
    const invalid = { ...persisted } as Partial<typeof persisted>;
    delete invalid.id;
    expect(() => fromPersistence(invalid)).toThrow();
  });

  it("rejects edges that reference missing nodes", () => {
    expect(() => fromPersistence({
      ...persisted,
      graph: { ...persisted.graph, edges: [{ ...persisted.graph.edges[0], targetNodeId: "missing-node" }] },
    })).toThrow(/missing node/);
  });

  it("rejects incompatible node configurations", () => {
    const node = persisted.graph.nodes.find((candidate) => candidate.type === "trigger");
    expect(node).toBeDefined();
    const invalidNode = { ...node!, config: { triggerName: "broken", triggerType: "unknown" } };
    expect(() => fromPersistence({ ...persisted, graph: { ...persisted.graph, nodes: persisted.graph.nodes.map((candidate) => candidate === node ? invalidNode : candidate) } })).toThrow();
  });
});
