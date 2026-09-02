import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";
import { WorkflowNotFoundError, WorkflowNotPublishedError, WorkflowRevisionConflictError, workflowRepository } from "@/features/workflow-persistence/repository";
import type { PersistedWorkflowDto } from "@/lib/workflow/persistence-transforms";

const requestMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ supabaseRequest: requestMock }));

const persisted = { id: sampleWorkflow.id, name: sampleWorkflow.name, description: sampleWorkflow.description, status: sampleWorkflow.status, revision: sampleWorkflow.version, graph: { nodes: sampleWorkflow.nodes, edges: sampleWorkflow.edges }, created_at: sampleWorkflow.createdAt, updated_at: sampleWorkflow.updatedAt, published_at: sampleWorkflow.publishedAt ?? null } satisfies PersistedWorkflowDto;

beforeEach(() => requestMock.mockReset());

describe("workflow repository", () => {
  it("creates a workflow", async () => { requestMock.mockResolvedValue({ data: [persisted], error: null }); await expect(workflowRepository.create(sampleWorkflow)).resolves.toEqual(sampleWorkflow); expect(requestMock).toHaveBeenCalledWith("workflows", expect.objectContaining({ method: "POST" })); });
  it("loads a workflow", async () => { requestMock.mockResolvedValue({ data: [persisted], error: null }); await expect(workflowRepository.get(sampleWorkflow.id)).resolves.toEqual(sampleWorkflow); });
  it("reports workflow not found", async () => { requestMock.mockResolvedValue({ data: [], error: null }); await expect(workflowRepository.get("missing")).rejects.toBeInstanceOf(WorkflowNotFoundError); });
  it("updates only the expected revision", async () => { const updated = { ...persisted, revision: persisted.revision + 1 }; requestMock.mockResolvedValue({ data: [updated], error: null }); await expect(workflowRepository.update(sampleWorkflow, persisted.revision)).resolves.toEqual({ ...sampleWorkflow, version: persisted.revision + 1 }); expect(requestMock).toHaveBeenCalledWith(expect.stringContaining(`revision=eq.${persisted.revision}`), expect.objectContaining({ method: "PATCH" })); });
  it("detects a revision conflict", async () => { requestMock.mockResolvedValue({ data: [], error: null }); await expect(workflowRepository.update(sampleWorkflow, persisted.revision)).rejects.toBeInstanceOf(WorkflowRevisionConflictError); });
  it("publishes a validated snapshot at the expected revision", async () => { const published = { ...persisted, status: "published" as const, published_at: "2026-01-01T00:01:00.000Z", published_revision: sampleWorkflow.version, published_graph: { nodes: sampleWorkflow.nodes, edges: sampleWorkflow.edges } }; requestMock.mockResolvedValue({ data: [published], error: null }); await expect(workflowRepository.publish(sampleWorkflow, sampleWorkflow.version)).resolves.toMatchObject({ status: "published", version: sampleWorkflow.version, publishedAt: published.published_at }); expect(requestMock).toHaveBeenCalledWith(expect.stringContaining(`revision=eq.${sampleWorkflow.version}`), expect.objectContaining({ method: "PATCH", body: expect.stringContaining("published_graph") })); });
  it("loads the immutable published snapshot", async () => { const published = { ...persisted, status: "published" as const, published_at: "2026-01-01T00:01:00.000Z", published_revision: 2, published_graph: { nodes: sampleWorkflow.nodes, edges: sampleWorkflow.edges } }; requestMock.mockResolvedValue({ data: [published], error: null }); const workflow = await workflowRepository.getPublished(sampleWorkflow.id); expect(workflow.status).toBe("published"); expect(workflow.version).toBe(2); expect(workflow.publishedAt).toBe(published.published_at); });
  it("rejects execution when no published snapshot exists", async () => { requestMock.mockResolvedValue({ data: [persisted], error: null }); await expect(workflowRepository.getPublished(sampleWorkflow.id)).rejects.toBeInstanceOf(WorkflowNotPublishedError); });
  it("deletes a workflow", async () => { requestMock.mockResolvedValue({ data: [], error: null }); await expect(workflowRepository.delete(sampleWorkflow.id)).resolves.toBeUndefined(); expect(requestMock).toHaveBeenCalledWith(expect.stringContaining(`workflows?id=eq.${sampleWorkflow.id}`), expect.objectContaining({ method: "DELETE" })); });
  it("surfaces storage failures", async () => { requestMock.mockResolvedValue({ data: null, error: "database unavailable" }); await expect(workflowRepository.create(sampleWorkflow)).rejects.toThrow(/persistence failed/i); });
});
