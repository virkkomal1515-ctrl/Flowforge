export type ValidationSeverity = "error" | "warning";

export type ValidationCode =
  | "NODE_CONFIG_MISSING"
  | "NODE_CONFIG_INVALID"
  | "WORKFLOW_NO_TRIGGER"
  | "WORKFLOW_MULTIPLE_TRIGGERS"
  | "WORKFLOW_NO_END"
  | "WORKFLOW_NO_REACHABLE_END"
  | "INVALID_EDGE"
  | "UNREACHABLE_NODE"
  | "CYCLE_NOT_ALLOWED"
  | "INVALID_BRANCH";

export interface ValidationIssue {
  id: string;
  code: ValidationCode;
  severity: ValidationSeverity;
  message: string;
  nodeId?: string;
  edgeId?: string;
  fieldPath?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
