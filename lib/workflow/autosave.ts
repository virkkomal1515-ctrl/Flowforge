import type { Workflow } from "@/domain";

export const AUTOSAVE_DEBOUNCE_MS = 700;
export const AUTOSAVE_MAX_RETRIES = 2;
export const AUTOSAVE_RETRY_DELAY_MS = 500;

export type SaveStatus = "saved" | "saving" | "unsaved" | "retrying" | "save-failed";

export interface AutosaveRequest {
  workflow: Workflow;
  localRevision: number;
}

export interface AutosaveControllerOptions {
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  save: (request: AutosaveRequest) => Promise<Workflow>;
  onStatusChange?: (status: SaveStatus) => void;
  onSaved?: (request: AutosaveRequest, saved: Workflow, isLatest: boolean) => void;
  onFailed?: (request: AutosaveRequest, error: unknown) => void;
  getLatestRevision: () => number;
}

export class AutosaveController {
  private readonly options: Required<Pick<AutosaveControllerOptions, "debounceMs" | "maxRetries" | "retryDelayMs">> & AutosaveControllerOptions;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private pending: AutosaveRequest | null = null;
  private inFlight: AutosaveRequest | null = null;
  private retryCount = 0;
  private disposed = false;

  constructor(options: AutosaveControllerOptions) {
    this.options = { debounceMs: AUTOSAVE_DEBOUNCE_MS, maxRetries: AUTOSAVE_MAX_RETRIES, retryDelayMs: AUTOSAVE_RETRY_DELAY_MS, ...options };
  }

  schedule(request: AutosaveRequest): void {
    if (this.disposed) return;
    this.pending = { workflow: structuredClone(request.workflow), localRevision: request.localRevision };
    this.retryCount = 0;
    this.options.onStatusChange?.("unsaved");
    this.clearTimer();
    this.clearRetryTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.options.debounceMs);
  }

  cancel(): void {
    this.clearTimer();
    this.clearRetryTimer();
    this.pending = null;
    this.retryCount = 0;
  }

  dispose(): void {
    this.disposed = true;
    this.cancel();
  }

  private async flush(): Promise<void> {
    if (this.disposed || this.inFlight || !this.pending) return;
    const request = this.pending;
    this.pending = null;
    this.inFlight = request;
    this.retryCount = 0;
    this.options.onStatusChange?.("saving");
    await this.attempt(request);
  }

  private async attempt(request: AutosaveRequest): Promise<void> {
    try {
      const saved = await this.options.save(request);
      if (this.disposed) return;
      this.inFlight = null;
      const isLatest = this.options.getLatestRevision() === request.localRevision;
      this.options.onSaved?.(request, saved, isLatest);
      if (this.pending) void this.flush();
      else if (isLatest) this.options.onStatusChange?.("saved");
    } catch (error) {
      if (this.disposed) return;
      if (this.options.getLatestRevision() !== request.localRevision) {
        this.inFlight = null;
        if (this.pending) void this.flush();
        return;
      }
      if (this.retryCount < this.options.maxRetries) {
        this.retryCount += 1;
        this.options.onStatusChange?.("retrying");
        this.clearRetryTimer();
        this.retryTimer = setTimeout(() => {
          this.retryTimer = null;
          void this.attempt(request);
        }, this.options.retryDelayMs * this.retryCount);
        return;
      }
      this.inFlight = null;
      this.options.onFailed?.(request, error);
      this.options.onStatusChange?.("save-failed");
    }
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }
}
