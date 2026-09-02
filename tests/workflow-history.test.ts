import { describe, expect, it } from "vitest";
import { addNode, moveNode } from "@/domain";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";
import { commitWorkflowHistory, createWorkflowHistory, redoWorkflowHistory, undoWorkflowHistory } from "@/lib/workflow/history";

describe("workflow history", () => {
  it("undoes and redoes workflow snapshots", () => {
    const first = createWorkflowHistory(sampleWorkflow);
    const secondWorkflow = addNode(sampleWorkflow, "action", "history-action", { x: 20, y: 20 })!;
    const second = commitWorkflowHistory(first, secondWorkflow);
    const thirdWorkflow = moveNode(secondWorkflow, "history-action", { x: 80, y: 90 });
    const third = commitWorkflowHistory(second, thirdWorkflow);
    const undone = undoWorkflowHistory(third);
    expect(undone.present).toEqual(secondWorkflow);
    expect(redoWorkflowHistory(undone).present).toEqual(thirdWorkflow);
  });

  it("clears redo history after a divergent edit", () => {
    const first = createWorkflowHistory(sampleWorkflow);
    const second = commitWorkflowHistory(first, addNode(sampleWorkflow, "action", "a", { x: 1, y: 1 })!);
    const third = commitWorkflowHistory(second, addNode(second.present, "notification", "n", { x: 2, y: 2 })!);
    const undone = undoWorkflowHistory(third);
    const divergent = commitWorkflowHistory(undone, addNode(undone.present, "end", "e", { x: 3, y: 3 })!);
    expect(divergent.future).toHaveLength(0);
  });

  it("keeps history bounded", () => {
    let history = createWorkflowHistory(sampleWorkflow);
    for (let i = 0; i < 4; i += 1) history = commitWorkflowHistory(history, addNode(history.present, "action", `a-${i}`, { x: i, y: i })!, 2);
    expect(history.past).toHaveLength(2);
    expect(history.past[0].nodes.some((node) => node.id === "a-0")).toBe(true);
    expect(history.past[0].nodes.some((node) => node.id === "a-1")).toBe(true);
    expect(history.past[0].nodes.some((node) => node.id === "a-2")).toBe(false);
    expect(history.past[1].nodes.some((node) => node.id === "a-2")).toBe(true);
    expect(history.past[1].nodes.some((node) => node.id === "a-3")).toBe(false);
  });
});
