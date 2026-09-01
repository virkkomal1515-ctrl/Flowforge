import { z } from "zod";
import type { Workflow, WorkflowEdge, WorkflowNode } from "@/domain";

export interface PersistedWorkflowDto {
  id: string;
  name: string;
  description: string;
  status: Workflow["status"];
  revision: number;
  graph: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

const positionSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["trigger", "action", "condition", "notification", "end"]),
  position: positionSchema,
  config: z.record(z.string(), z.unknown()),
});
const edgeSchema = z.object({
  id: z.string().min(1),
  sourceNodeId: z.string().min(1),
  sourcePort: z.enum(["default", "true", "false"]),
  targetNodeId: z.string().min(1),
  targetPort: z.literal("default"),
});

const persistedWorkflowSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string(),
  status: z.enum(["draft", "published"]),
  revision: z.number().int().nonnegative(),
  graph: z.object({
    nodes: z.array(nodeSchema),
    edges: z.array(edgeSchema),
  }),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  published_at: z.string().datetime().nullable(),
});

export function toPersistence(workflow: Workflow): PersistedWorkflowDto {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    status: workflow.status,
    revision: workflow.version,
    graph: structuredClone({ nodes: workflow.nodes, edges: workflow.edges }),
    created_at: workflow.createdAt,
    updated_at: workflow.updatedAt,
    published_at: workflow.publishedAt ?? null,
  };
}

function validateGraphReferences(nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const duplicateNodeIds = nodes.length !== nodeIds.size;
  const duplicateEdgeIds = edges.length !== new Set(edges.map((edge) => edge.id)).size;

  if (duplicateNodeIds || duplicateEdgeIds) {
    throw new Error("Persisted workflow contains duplicate identifiers.");
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
      throw new Error(`Persisted workflow edge ${edge.id} references a missing node.`);
    }
  }
}

export function fromPersistence(value: unknown): Workflow {
  const parsed = persistedWorkflowSchema.parse(value);
  validateGraphReferences(parsed.graph.nodes as WorkflowNode[], parsed.graph.edges as WorkflowEdge[]);

  return {
    id: parsed.id,
    name: parsed.name,
    description: parsed.description,
    status: parsed.status,
    version: parsed.revision,
    nodes: structuredClone(parsed.graph.nodes) as WorkflowNode[],
    edges: structuredClone(parsed.graph.edges) as WorkflowEdge[],
    createdAt: parsed.created_at,
    updatedAt: parsed.updated_at,
    ...(parsed.published_at ? { publishedAt: parsed.published_at } : {}),
  };
}
