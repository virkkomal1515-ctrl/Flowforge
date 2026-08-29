import { validateWorkflow } from "./graph-validation";
import type { Workflow } from "../types";
import type { ValidationResult } from "./types";

export function validateForPublish(workflow: Workflow): ValidationResult {
  return validateWorkflow(workflow);
}
