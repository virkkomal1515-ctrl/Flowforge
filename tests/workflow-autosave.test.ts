import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Workflow } from "@/domain";
import { AutosaveController } from "@/lib/workflow/autosave";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";

const workflow = (name: string): Workflow => ({ ...structuredClone(sampleWorkflow), name });

describe("autosave controller", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("debounces rapid edits and saves the latest scheduled revision", async () => {
    const save = vi.fn(async (request: { workflow: Workflow; localRevision: number }) => request.workflow);
    let latestRevision = 0;
    const controller = new AutosaveController({ save, debounceMs: 100, getLatestRevision: () => latestRevision });
    latestRevision = 1;
    controller.schedule({ workflow: workflow("A"), localRevision: 1 });
    vi.advanceTimersByTime(80);
    latestRevision = 2;
    controller.schedule({ workflow: workflow("B"), localRevision: 2 });
    vi.advanceTimersByTime(99);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].localRevision).toBe(2);
    controller.dispose();
  });

  it("retries bounded failures and reports exhaustion", async () => {
    const save = vi.fn().mockRejectedValue(new Error("offline"));
    const statuses: string[] = [];
    const controller = new AutosaveController({ save, debounceMs: 10, maxRetries: 2, retryDelayMs: 5, getLatestRevision: () => 1, onStatusChange: (status) => statuses.push(status) });
    controller.schedule({ workflow: workflow("A"), localRevision: 1 });
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(5);
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(15);
    expect(save).toHaveBeenCalledTimes(3);
    expect(statuses).toContain("retrying");
    expect(statuses.at(-1)).toBe("save-failed");
    controller.dispose();
  });

  it("ignores stale success when a newer revision exists", async () => {
    const deferred: Array<{ resolve: (value: Workflow) => void }> = [];
    const save = vi.fn(() => new Promise<Workflow>((resolve) => deferred.push({ resolve })));
    let latestRevision = 1;
    const statuses: string[] = [];
    const saved: number[] = [];
    const controller = new AutosaveController({ save, debounceMs: 1, getLatestRevision: () => latestRevision, onStatusChange: (status) => statuses.push(status), onSaved: (request, _, isLatest) => { if (isLatest) saved.push(request.localRevision); } });
    controller.schedule({ workflow: workflow("A"), localRevision: 1 });
    await vi.advanceTimersByTimeAsync(1);
    latestRevision = 2;
    controller.schedule({ workflow: workflow("B"), localRevision: 2 });
    deferred[0].resolve(workflow("A"));
    await vi.advanceTimersByTimeAsync(1);
    expect(saved).toEqual([]);
    deferred[1].resolve(workflow("B"));
    await vi.advanceTimersByTimeAsync(0);
    expect(saved).toEqual([2]);
    expect(statuses.at(-1)).toBe("saved");
    controller.dispose();
  });

  it("does not surface stale failures after a newer edit", async () => {
    const deferred: Array<{ reject: (error: Error) => void; resolve: (value: Workflow) => void }> = [];
    const save = vi.fn(() => new Promise<Workflow>((resolve, reject) => deferred.push({ resolve, reject })));
    let latestRevision = 1;
    const statuses: string[] = [];
    const controller = new AutosaveController({ save, debounceMs: 1, getLatestRevision: () => latestRevision, onStatusChange: (status) => statuses.push(status) });
    controller.schedule({ workflow: workflow("A"), localRevision: 1 });
    await vi.advanceTimersByTimeAsync(1);
    latestRevision = 2;
    controller.schedule({ workflow: workflow("B"), localRevision: 2 });
    deferred[0].reject(new Error("stale failure"));
    await vi.advanceTimersByTimeAsync(1);
    expect(statuses).not.toContain("save-failed");
    deferred[1].resolve(workflow("B"));
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toBe("saved");
    controller.dispose();
  });
});
