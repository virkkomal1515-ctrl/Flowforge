import type {
  ActionNode,
  ConditionNode,
  EndNode,
  NodeConfig,
  NotificationNode,
  TriggerNode,
  WorkflowNode,
} from "../types";
import type { ValidationIssue } from "./types";

const issue = (
  nodeId: string,
  code: ValidationIssue["code"],
  message: string,
  fieldPath?: string,
): ValidationIssue => ({
  id: `${nodeId}:${code}:${fieldPath ?? "node"}`,
  code,
  severity: "error",
  message,
  nodeId,
  fieldPath,
});

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function validateNode(node: WorkflowNode): ValidationIssue[] {
  if (node.config === null || node.config === undefined) {
    return [issue(node.id, "NODE_CONFIG_MISSING", "Node configuration is required.")];
  }

  switch (node.type) {
    case "trigger":
      return validateTrigger(node);
    case "action":
      return validateAction(node);
    case "condition":
      return validateCondition(node);
    case "notification":
      return validateNotification(node);
    case "end":
      return validateEnd(node);
  }
}

function validateTrigger(node: TriggerNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmptyString(node.config.triggerName)) {
    issues.push(issue(node.id, "NODE_CONFIG_INVALID", "Trigger name is required.", "triggerName"));
  }
  if (node.config.triggerType !== "manual") {
    issues.push(issue(node.id, "NODE_CONFIG_INVALID", "Trigger type must be manual.", "triggerType"));
  }
  return issues;
}

function validateAction(node: ActionNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmptyString(node.config.actionName)) {
    issues.push(issue(node.id, "NODE_CONFIG_INVALID", "Action name is required.", "actionName"));
  }
  if (!["assign", "update_status", "create_record"].includes(node.config.operation)) {
    issues.push(issue(node.id, "NODE_CONFIG_INVALID", "Action operation is invalid.", "operation"));
  }
  return issues;
}

function validateCondition(node: ConditionNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmptyString(node.config.field)) {
    issues.push(issue(node.id, "NODE_CONFIG_INVALID", "Condition field is required.", "field"));
  }
  if (!["equals", "not_equals", "greater_than", "less_than"].includes(node.config.operator)) {
    issues.push(issue(node.id, "NODE_CONFIG_INVALID", "Condition operator is invalid.", "operator"));
  }
  if (!isNonEmptyString(node.config.comparisonValue)) {
    issues.push(issue(node.id, "NODE_CONFIG_INVALID", "Condition comparison value is required.", "comparisonValue"));
  }
  return issues;
}

function validateNotification(node: NotificationNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmptyString(node.config.recipient)) {
    issues.push(issue(node.id, "NODE_CONFIG_INVALID", "Notification recipient is required.", "recipient"));
  }
  if (!isNonEmptyString(node.config.message)) {
    issues.push(issue(node.id, "NODE_CONFIG_INVALID", "Notification message is required.", "message"));
  }
  return issues;
}

function validateEnd(node: EndNode): ValidationIssue[] {
  if (node.config.completionLabel !== undefined && !isNonEmptyString(node.config.completionLabel)) {
    return [issue(node.id, "NODE_CONFIG_INVALID", "Completion label must be non-empty when provided.", "completionLabel")];
  }
  return [];
}

export function isNodeConfigForType(type: WorkflowNode["type"], config: NodeConfig): boolean {
  switch (type) {
    case "trigger":
      return "triggerName" in config && "triggerType" in config;
    case "action":
      return "actionName" in config && "operation" in config;
    case "condition":
      return "field" in config && "operator" in config && "comparisonValue" in config;
    case "notification":
      return "recipient" in config && "message" in config;
    case "end":
      return Object.keys(config).every((key) => key === "completionLabel");
  }
}
