import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type ValidationResult, type Workflow, validateWorkflow } from "../domain";
import { ValidationPanel } from "../components/workflow/validation-panel";
import { canPublish } from "../lib/workflow/publish-state";
import { toReactFlow } from "../lib/workflow/react-flow-adapter";

const workflow: Workflow = {
  id: "workflow-1",
  name: "Invalid workflow",
  description: "",
  status: "draft",
  version: 1,
  nodes: [
    { id: "trigger", type: "trigger", position: { x: 0, y: 0 }, config: { triggerName: "", triggerType: "manual" } },
    { id: "orphan", type: "action", position: { x: 300, y: 0 }, config: { actionName: "", operation: "assign" } },
  ],
  edges: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const validResult: ValidationResult = { valid: true, issues: [] };

describe("workflow validation UI integration", () => {
  it("renders node and graph-level validation issues", () => {
    const result = validateWorkflow(workflow);
    render(<ValidationPanel result={result} onSelectNode={vi.fn()} />);
    expect(screen.getByRole("region", { name: "Workflow validation" })).toBeTruthy();
    expect(screen.getByText("Workflow must contain an End node.")).toBeTruthy();
    expect(screen.getByText("Trigger name is required.")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Select affected node" }).length).toBeGreaterThan(0);
    expect(screen.getByText("Workflow-level issue")).toBeTruthy();
  });

  it("selects the affected node from an issue", () => {
    const onSelectNode = vi.fn();
    const result = validateWorkflow(workflow);
    render(<ValidationPanel result={result} onSelectNode={onSelectNode} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Select affected node" })[0]);
    expect(onSelectNode).toHaveBeenCalledWith("trigger");
  });

  it("renders a valid state without issue rows", () => {
    render(<ValidationPanel result={validResult} onSelectNode={vi.fn()} />);
    expect(screen.getByText("Workflow is valid.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Select affected node" })).toBeNull();
  });

  it("marks nodes with validation errors in the canvas adapter", () => {
    const result = validateWorkflow(workflow);
    const { nodes } = toReactFlow(workflow, result.issues);
    expect(nodes.find((node) => node.id === "trigger")?.data.hasValidationError).toBe(true);
    expect(nodes.find((node) => node.id === "orphan")?.data.hasValidationError).toBe(true);
  });

  it("blocks publish for an invalid workflow and allows a valid workflow", () => {
    expect(canPublish(workflow)).toBe(false);
    const valid = structuredClone(workflow);
    valid.nodes = [
      { id: "trigger", type: "trigger", position: { x: 0, y: 0 }, config: { triggerName: "Start", triggerType: "manual" } },
      { id: "end", type: "end", position: { x: 200, y: 0 }, config: { completionLabel: "Complete" } },
    ];
    valid.edges = [{ id: "edge-1", sourceNodeId: "trigger", sourcePort: "default", targetNodeId: "end", targetPort: "default" }];
    expect(canPublish(valid)).toBe(true);
  });
});
