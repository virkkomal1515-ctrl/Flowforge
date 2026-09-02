import { describe, expect, it, vi, beforeEach } from "vitest";
import { deleteWorkflow, fetchWorkflows } from "@/lib/workflow/api";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("workflow API client", () => {
  it("loads the workflow list from the persistence API", async () => {
    const workflows = [{ id: "workflow-1", name: "One" }];
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ workflows }) });

    await expect(fetchWorkflows()).resolves.toEqual(workflows);
    expect(fetchMock).toHaveBeenCalledWith("/api/workflows", undefined);
  });

  it("surfaces delete failures returned by the API", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: { message: "Delete failed." } }) });

    await expect(deleteWorkflow("workflow-1")).rejects.toThrow("Delete failed.");
    expect(fetchMock).toHaveBeenCalledWith("/api/workflows/workflow-1", { method: "DELETE" });
  });
});
