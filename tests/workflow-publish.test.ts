import { describe, expect, it } from "vitest";
import { prepareForPublish } from "@/lib/workflow/publish";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";

describe("workflow publishing", () => {
  it("prepares a valid workflow for publication without mutating the draft", () => {
    const draft = structuredClone(sampleWorkflow);
    const published = prepareForPublish(draft);
    expect(published.status).toBe("published");
    expect(draft.status).toBe("draft");
    expect(published.nodes).toEqual(draft.nodes);
    expect(published.edges).toEqual(draft.edges);
  });

  it("rejects an invalid workflow", () => {
    const invalid = { ...structuredClone(sampleWorkflow), nodes: sampleWorkflow.nodes.filter((node) => node.type !== "trigger") };
    expect(() => prepareForPublish(invalid)).toThrow(/cannot be published/i);
  });
});
