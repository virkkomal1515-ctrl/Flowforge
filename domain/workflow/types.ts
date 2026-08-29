export type NodeType =
  | "trigger"
  | "action"
  | "condition"
  | "notification"
  | "end";

export type WorkflowStatus = "draft" | "published";

export type ExecutionStatus = "idle" | "running" | "successful" | "failed";

export type NodeExecutionStatus =
  | "pending"
  | "running"
  | "successful"
  | "failed"
  | "skipped";

export interface Position {
  x: number;
  y: number;
}

export type TriggerType = "manual";

export interface TriggerConfig {
  triggerName: string;
  triggerType: TriggerType;
}

export type ActionOperation = "assign" | "update_status" | "create_record";

export interface ActionConfig {
  actionName: string;
  operation: ActionOperation;
  parameter?: string;
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than";

export interface ConditionConfig {
  field: string;
  operator: ConditionOperator;
  comparisonValue: string;
}

export interface NotificationConfig {
  recipient: string;
  message: string;
}

export interface EndConfig {
  completionLabel?: string;
}

export type NodeConfig =
  | TriggerConfig
  | ActionConfig
  | ConditionConfig
  | NotificationConfig
  | EndConfig;

export interface BaseNode<TType extends NodeType, TConfig extends NodeConfig> {
  id: string;
  type: TType;
  position: Position;
  config: TConfig;
}

export type TriggerNode = BaseNode<"trigger", TriggerConfig>;
export type ActionNode = BaseNode<"action", ActionConfig>;
export type ConditionNode = BaseNode<"condition", ConditionConfig>;
export type NotificationNode = BaseNode<"notification", NotificationConfig>;
export type EndNode = BaseNode<"end", EndConfig>;

export type WorkflowNode =
  | TriggerNode
  | ActionNode
  | ConditionNode
  | NotificationNode
  | EndNode;

export type SourcePort = "default" | "true" | "false";
export type TargetPort = "default";

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  sourcePort: SourcePort;
  targetNodeId: string;
  targetPort: TargetPort;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ExecutionLog {
  timestamp: string;
  nodeId?: string;
  message: string;
  level: "info" | "error";
}

export interface NodeExecutionResult {
  nodeId: string;
  status: NodeExecutionStatus;
}

export interface ExecutionResult {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  nodeResults: NodeExecutionResult[];
  logs: ExecutionLog[];
}
