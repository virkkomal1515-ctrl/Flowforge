import type { Workflow } from "@/domain";

export const AUTOSAVE_DEBOUNCE_MS = 700;
export const AUTOSAVE_MAX_RETRIES = 2;
export const AUTOSAVE_RETRY_DELAY_MS = 500;
export type SaveStatus = "saved" | "saving" | "unsaved" | "retrying" | "save-failed";
export interface AutosaveRequest { workflow: Workflow; localRevision: number; }
export interface AutosaveControllerOptions { debounceMs?: number; maxRetries?: number; retryDelayMs?: number; initialServerRevision: number; save: (workflow: Workflow, expectedServerRevision: number) => Promise<Workflow>; onStatusChange?: (status: SaveStatus) => void; onSaved?: (request: AutosaveRequest, saved: Workflow, isLatest: boolean) => void; onFailed?: (request: AutosaveRequest, error: unknown) => void; getLatestRevision: () => number; }

export class AutosaveController {
  private readonly options: Required<Pick<AutosaveControllerOptions, "debounceMs" | "maxRetries" | "retryDelayMs">> & AutosaveControllerOptions;
  private serverRevision: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retryTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private pending: AutosaveRequest | null = null;
  private inFlight = new Map<number, AutosaveRequest>();
  private retryCounts = new Map<number, number>();
  private disposed = false;

  constructor(options: AutosaveControllerOptions) { this.options = { debounceMs: AUTOSAVE_DEBOUNCE_MS, maxRetries: AUTOSAVE_MAX_RETRIES, retryDelayMs: AUTOSAVE_RETRY_DELAY_MS, ...options }; this.serverRevision = options.initialServerRevision; }

  schedule(request: AutosaveRequest): void {
    if (this.disposed) return;
    this.pending = { workflow: structuredClone(request.workflow), localRevision: request.localRevision };
    this.retryCounts.clear();
    this.clearTimer();
    for (const timer of this.retryTimers.values()) clearTimeout(timer);
    this.retryTimers.clear();
    this.options.onStatusChange?.("unsaved");
    this.timer = setTimeout(() => { this.timer = null; void this.flush(); }, this.options.debounceMs);
  }

  cancel(): void { this.clearTimer(); for (const timer of this.retryTimers.values()) clearTimeout(timer); this.retryTimers.clear(); this.pending = null; this.retryCounts.clear(); }
  dispose(): void { this.disposed = true; this.cancel(); }

  private async flush(): Promise<void> {
    if (this.disposed || !this.pending) return;
    const request = this.pending;
    this.pending = null;
    this.inFlight.set(request.localRevision, request);
    this.retryCounts.set(request.localRevision, 0);
    this.options.onStatusChange?.("saving");
    await this.attempt(request);
  }

  private async attempt(request: AutosaveRequest): Promise<void> {
    try {
      const saved = await this.options.save(request.workflow, this.serverRevision);
      if (this.disposed) return;
      const isLatest = this.options.getLatestRevision() === request.localRevision;
      this.inFlight.delete(request.localRevision);
      this.retryCounts.delete(request.localRevision);
      if (!isLatest) {
        if (this.pending) void this.flush();
        return;
      }
      this.serverRevision = saved.version;
      this.options.onSaved?.(request, saved, true);
      if (this.pending) void this.flush();
      else this.options.onStatusChange?.("saved");
    } catch (error) {
      if (this.disposed) return;
      const isLatest = this.options.getLatestRevision() === request.localRevision;
      if (!isLatest) { this.inFlight.delete(request.localRevision); this.retryCounts.delete(request.localRevision); if (this.pending) void this.flush(); return; }
      const retryCount = this.retryCounts.get(request.localRevision) ?? 0;
      if (retryCount < this.options.maxRetries) {
        const nextRetryCount = retryCount + 1;
        this.retryCounts.set(request.localRevision, nextRetryCount);
        this.options.onStatusChange?.("retrying");
        const timer = setTimeout(() => { this.retryTimers.delete(request.localRevision); void this.attempt(request); }, this.options.retryDelayMs * nextRetryCount);
        this.retryTimers.set(request.localRevision, timer);
        return;
      }
      this.inFlight.delete(request.localRevision);
      this.retryCounts.delete(request.localRevision);
      this.options.onFailed?.(request, error);
      this.options.onStatusChange?.("save-failed");
    }
  }

  private clearTimer(): void { if (this.timer) clearTimeout(this.timer); this.timer = null; }
}
