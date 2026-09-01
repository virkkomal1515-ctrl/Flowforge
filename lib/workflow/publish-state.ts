import { validateForPublish, type Workflow } from "@/domain";

export function canPublish(workflow: Workflow): boolean {
  return validateForPublish(workflow).valid;
}
