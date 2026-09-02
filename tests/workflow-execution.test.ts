import { describe, expect, it } from "vitest";
import { executeWorkflow } from "@/domain";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";

const published = { ...structuredClone(sampleWorkflow), status: "published" as const, version: 3 };

describe("deterministic workflow execution", () => {
  it("executes the same published workflow deterministically", () => {
    const a = executeWorkflow(published, { priority: "high" }, { now: "2026-01-01T00:00:00.000Z", executionId: "run-1" });
    const b = executeWorkflow(published, { priority: "high" }, { now: "2026-01-01T00:00:00.000Z", executionId: "run-1" });
    expect(a).toEqual(b);
    expect(a.status).toBe("successful");
    expect(a.nodeResults.find((node) => node.nodeId === "notification")?.status).toBe("successful");
  });

  it("takes the false branch and marks the other branch skipped", () => {
    const result = executeWorkflow(published, { priority: "low" }, { now: "2026-01-01T00:00:00.000Z" });
    expect(result.status).toBe("successful");
    expect(result.nodeResults.find((node) => node.nodeId === "notification")?.status).toBe("skipped");
    expect(result.logs.some((log) => log.message === "Condition evaluated false.")).toBe(true);
  });

  it("fails only the explicitly selected simulated node", () => {
    const result = executeWorkflow(published, { priority: "high" }, { now: "2026-01-01T00:00:00.000Z", failNodeId: "notification" });
    expect(result.status).toBe("failed");
    expect(result.failure).toEqual({ nodeId: "notification", message: "Simulated failure for notification node." });
    expect(result.nodeResults.find((node) => node.nodeId === "notification")?.status).toBe("failed");
    expect(result.nodeResults.find((node) => node.nodeId === "end")?.status).toBe("skipped");
  });

  it("rejects draft or invalid workflows before traversal", () => {
    const draft = executeWorkflow(sampleWorkflow, {}, { now: "2026-01-01T00:00:00.000Z" });
    expect(draft.status).toBe("failed");
    expect(draft.failure?.message).toMatch(/published/i);
  });
});
