import type { Workflow } from "@/domain";
import { validateForPublish } from "@/domain";

export function prepareForPublish(workflow: Workflow): Workflow {
  const validation = validateForPublish(workflow);
  if (!validation.valid) throw new Error("Workflow cannot be published until all validation errors are resolved.");
  return { ...structuredClone(workflow), status: "published", publishedAt: workflow.publishedAt };
}
