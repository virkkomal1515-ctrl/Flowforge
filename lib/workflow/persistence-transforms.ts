import { z } from "zod";
import type { Workflow, WorkflowEdge, WorkflowNode } from "@/domain";

export interface PersistedWorkflowDto {
  id: string;
  name: string;
  description: string;
  status: Workflow["status"];
  revision: number;
  graph: { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
  created_at: string;
  updated_at: string;
  published_at: string | null;
  published_revision?: number | null;
  published_graph?: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null;
}

const positionSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
const triggerConfigSchema = z.object({ triggerName: z.string(), triggerType: z.literal("manual") }).strict();
const actionConfigSchema = z.object({ actionName: z.string(), operation: z.enum(["assign", "update_status", "create_record"]), parameter: z.string().optional() }).strict();
const conditionConfigSchema = z.object({ field: z.string(), operator: z.enum(["equals", "not_equals", "greater_than", "less_than"]), comparisonValue: z.string() }).strict();
const notificationConfigSchema = z.object({ recipient: z.string(), message: z.string() }).strict();
const endConfigSchema = z.object({ completionLabel: z.string().optional() }).strict();
const nodeSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string().min(1), type: z.literal("trigger"), position: positionSchema, config: triggerConfigSchema }),
  z.object({ id: z.string().min(1), type: z.literal("action"), position: positionSchema, config: actionConfigSchema }),
  z.object({ id: z.string().min(1), type: z.literal("condition"), position: positionSchema, config: conditionConfigSchema }),
  z.object({ id: z.string().min(1), type: z.literal("notification"), position: positionSchema, config: notificationConfigSchema }),
  z.object({ id: z.string().min(1), type: z.literal("end"), position: positionSchema, config: endConfigSchema }),
]);
const edgeSchema = z.object({ id: z.string().min(1), sourceNodeId: z.string().min(1), sourcePort: z.enum(["default", "true", "false"]), targetNodeId: z.string().min(1), targetPort: z.literal("default") }).strict();
const graphSchema = z.object({ nodes: z.array(nodeSchema), edges: z.array(edgeSchema) }).strict();
const isoUtcTimestampSchema = z.string().refine((value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?Z$/.exec(value);
  if (!match) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 19) === value.slice(0, 19);
}, { message: "Invalid ISO UTC timestamp" });
const persistedWorkflowSchema = z.object({
  id: z.string().min(1), name: z.string(), description: z.string(), status: z.enum(["draft", "published"]), revision: z.number().int().nonnegative(),
  graph: graphSchema, created_at: isoUtcTimestampSchema, updated_at: isoUtcTimestampSchema, published_at: isoUtcTimestampSchema.nullable(),
  published_revision: z.number().int().nonnegative().nullable().optional(), published_graph: graphSchema.nullable().optional(),
}).strict();

function validateGraphReferences(nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (nodes.length !== nodeIds.size || edges.length !== new Set(edges.map((edge) => edge.id)).size) throw new Error("Persisted workflow contains duplicate identifiers.");
  for (const edge of edges) if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) throw new Error(`Persisted workflow edge ${edge.id} references a missing node.`);
}

export function toPersistence(workflow: Workflow): PersistedWorkflowDto {
  return { id: workflow.id, name: workflow.name, description: workflow.description, status: workflow.status, revision: workflow.version, graph: structuredClone({ nodes: workflow.nodes, edges: workflow.edges }), created_at: workflow.createdAt, updated_at: workflow.updatedAt, published_at: workflow.publishedAt ?? null };
}

export function fromPersistence(value: unknown): Workflow {
  const parsed = persistedWorkflowSchema.parse(value);
  validateGraphReferences(parsed.graph.nodes, parsed.graph.edges);
  return { id: parsed.id, name: parsed.name, description: parsed.description, status: parsed.status, version: parsed.revision, nodes: structuredClone(parsed.graph.nodes), edges: structuredClone(parsed.graph.edges), createdAt: parsed.created_at, updatedAt: parsed.updated_at, ...(parsed.published_at ? { publishedAt: parsed.published_at } : {}) };
}

export function publishedFromPersistence(value: unknown): Workflow {
  const parsed = persistedWorkflowSchema.parse(value);
  if (!parsed.published_at || parsed.published_revision === null || parsed.published_revision === undefined || !parsed.published_graph) throw new Error("Workflow has no published version.");
  validateGraphReferences(parsed.published_graph.nodes, parsed.published_graph.edges);
  return { id: parsed.id, name: parsed.name, description: parsed.description, status: "published", version: parsed.published_revision, nodes: structuredClone(parsed.published_graph.nodes), edges: structuredClone(parsed.published_graph.edges), createdAt: parsed.created_at, updatedAt: parsed.updated_at, publishedAt: parsed.published_at };
}
