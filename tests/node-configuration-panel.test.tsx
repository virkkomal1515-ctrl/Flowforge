import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultNode, type WorkflowNode } from "../domain";
import { NodeConfigurationPanel } from "../components/workflow/node-configuration-panel";

const node = (type: WorkflowNode["type"]): WorkflowNode => createDefaultNode(type, type, { x: 10, y: 20 });

describe("NodeConfigurationPanel", () => {
  it("renders empty selection", () => { render(<NodeConfigurationPanel node={undefined} onApply={() => true} />); expect(screen.queryByText("Nothing selected")).not.toBeNull(); });
  it.each(["trigger", "action", "condition", "notification", "end"] as const)("renders the %s form", (type) => { render(<NodeConfigurationPanel node={node(type)} onApply={() => true} />); expect(screen.queryByText(type, { exact: true })).not.toBeNull(); expect(screen.queryByRole("button", { name: "Apply changes" })).not.toBeNull(); });
  it("shows validation errors", () => { const onApply = vi.fn(() => true); render(<NodeConfigurationPanel node={node("action")} onApply={onApply} />); fireEvent.change(screen.getByLabelText("Action name"), { target: { value: "" } }); fireEvent.click(screen.getByRole("button", { name: "Apply changes" })); expect(screen.queryByText("Action name is required.")).not.toBeNull(); expect(onApply).not.toHaveBeenCalled(); });
  it("successfully applies configuration", () => { const onApply = vi.fn(() => true); render(<NodeConfigurationPanel node={node("action")} onApply={onApply} />); const input = screen.getByLabelText("Action name") as HTMLInputElement; fireEvent.change(input, { target: { value: "Route request" } }); fireEvent.click(screen.getByRole("button", { name: "Apply changes" })); expect(onApply).toHaveBeenCalledWith("action", expect.objectContaining({ actionName: "Route request" })); expect(input.value).toBe("Route request"); });
  it("cancels draft edits", () => { render(<NodeConfigurationPanel node={node("action")} onApply={() => true} />); const input = screen.getByLabelText("Action name") as HTMLInputElement; fireEvent.change(input, { target: { value: "Draft only" } }); fireEvent.click(screen.getByRole("button", { name: "Cancel" })); expect(input.value).toBe("New action"); });
  it("does not reset after a rejected domain update", () => { const onApply = vi.fn(() => false); render(<NodeConfigurationPanel node={node("action")} onApply={onApply} />); const input = screen.getByLabelText("Action name") as HTMLInputElement; fireEvent.change(input, { target: { value: "Rejected update" } }); fireEvent.click(screen.getByRole("button", { name: "Apply changes" })); expect(onApply).toHaveBeenCalled(); expect(input.value).toBe("Rejected update"); });
});
