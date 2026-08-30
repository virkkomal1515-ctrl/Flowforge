// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultNode, type WorkflowNode } from "../domain";
import { NodeConfigurationPanel } from "../components/workflow/node-configuration-panel";

const node = (type: WorkflowNode["type"]): WorkflowNode => createDefaultNode(type, type, { x: 10, y: 20 });

describe("NodeConfigurationPanel", () => {
  it("renders empty selection", () => { render(<NodeConfigurationPanel node={undefined} onApply={() => true} />); expect(screen.getByText("Nothing selected")).toBeInTheDocument(); });
  it.each(["trigger", "action", "condition", "notification", "end"] as const)("renders the %s form", (type) => { render(<NodeConfigurationPanel node={node(type)} onApply={() => true} />); expect(screen.getByText(type, { exact: true })).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Apply changes" })).toBeInTheDocument(); });
  it("shows validation errors", () => { const onApply = vi.fn(() => true); render(<NodeConfigurationPanel node={node("action")} onApply={onApply} />); fireEvent.change(screen.getByLabelText("Action name"), { target: { value: "" } }); fireEvent.click(screen.getByRole("button", { name: "Apply changes" })); expect(screen.getByText("Action name is required.")).toBeInTheDocument(); expect(onApply).not.toHaveBeenCalled(); });
  it("successfully applies configuration", () => { const onApply = vi.fn(() => true); render(<NodeConfigurationPanel node={node("action")} onApply={onApply} />); const input = screen.getByLabelText("Action name"); fireEvent.change(input, { target: { value: "Route request" } }); fireEvent.click(screen.getByRole("button", { name: "Apply changes" })); expect(onApply).toHaveBeenCalledWith("action", expect.objectContaining({ actionName: "Route request" })); expect(screen.getByLabelText("Action name")).toHaveValue("Route request"); });
  it("cancels draft edits", () => { render(<NodeConfigurationPanel node={node("action")} onApply={() => true} />); const input = screen.getByLabelText("Action name"); fireEvent.change(input, { target: { value: "Draft only" } }); fireEvent.click(screen.getByRole("button", { name: "Cancel" })); expect(input).toHaveValue("New action"); });
  it("does not reset after a rejected domain update", () => { const onApply = vi.fn(() => false); render(<NodeConfigurationPanel node={node("action")} onApply={onApply} />); const input = screen.getByLabelText("Action name"); fireEvent.change(input, { target: { value: "Rejected update" } }); fireEvent.click(screen.getByRole("button", { name: "Apply changes" })); expect(onApply).toHaveBeenCalled(); expect(input).toHaveValue("Rejected update"); });
});
