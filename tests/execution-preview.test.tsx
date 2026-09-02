import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExecutionPreview } from "@/components/workflow/execution-preview";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";

const executeMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/workflow/api", () => ({ executeWorkflow: executeMock }));

const published = { ...structuredClone(sampleWorkflow), status: "published" as const };
const success = { id: "run-1", workflowId: published.id, status: "successful" as const, startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:00:05.000Z", nodeResults: published.nodes.map((node) => ({ nodeId: node.id, status: "successful" as const })), logs: [{ timestamp: "2026-01-01T00:00:00.000Z", message: "Workflow completed.", level: "info" as const }] };
const failure = { ...success, id: "run-2", status: "failed" as const, failure: { nodeId: "notification", message: "Simulated failure for notification node." }, nodeResults: success.nodeResults.map((node) => node.nodeId === "notification" ? { ...node, status: "failed" as const } : node) };

describe("ExecutionPreview", () => {
  it("runs a published workflow and displays progress and logs", async () => {
    executeMock.mockResolvedValueOnce(success);
    render(<ExecutionPreview workflow={published} />);
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => expect(screen.getByText("Execution completed successfully.")).toBeInTheDocument());
    expect(screen.getByText("Workflow completed.")).toBeInTheDocument();
    expect(screen.getByText("trigger · trigger")).toBeInTheDocument();
  });

  it("shows deterministic failure and retries without the failure fixture", async () => {
    executeMock.mockResolvedValueOnce(failure).mockResolvedValueOnce(success);
    render(<ExecutionPreview workflow={published} />);
    fireEvent.change(screen.getByLabelText("Deterministic failure fixture"), { target: { value: "notification" } });
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => expect(screen.getByText("Simulated failure for notification node.")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.getByText("Execution completed successfully.")).toBeInTheDocument());
    expect(executeMock).toHaveBeenLastCalledWith(published.id, { priority: "high" }, undefined);
  });
});
