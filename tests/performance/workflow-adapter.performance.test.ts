import { describe, expect, it } from "vitest";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";
import { toReactFlow } from "@/lib/workflow/react-flow-adapter";
import { validateWorkflow } from "@/domain";
import type { Workflow } from "@/domain";

const SIZES = [25, 50, 100, 250] as const;
const ITERATIONS = 10;

function workflowWithNodeCount(count: number): Workflow {
  const workflow = structuredClone(sampleWorkflow);
  const nodes = Array.from({ length: count }, (_, index) => ({
    id: `action-${index}`,
    type: "action" as const,
    position: { x: (index % 10) * 240, y: Math.floor(index / 10) * 140 },
    config: { actionName: `Action ${index}`, operation: "assign" },
  }));
  return { ...workflow, id: `perf-${count}`, nodes: [...workflow.nodes, ...nodes], edges: workflow.edges };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

describe("workflow canvas transformation performance", () => {
  it.each(SIZES)("measures %i-node workflow transformation", (size) => {
    const workflow = workflowWithNodeCount(size - sampleWorkflow.nodes.length);
    const validation = validateWorkflow(workflow);
    const measurements: number[] = [];

    for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
      const start = performance.now();
      const result = toReactFlow(workflow, validation.issues);
      measurements.push(performance.now() - start);
      expect(result.nodes).toHaveLength(size);
      expect(result.edges).toHaveLength(workflow.edges.length);
    }

    const medianMs = median(measurements);
    console.info(`FlowForge performance: ${size} nodes -> ${medianMs.toFixed(2)} ms median adapter transform`);
    expect(medianMs).toBeLessThan(50);
  });
});
