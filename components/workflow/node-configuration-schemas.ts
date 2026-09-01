import { z } from "zod";

export const triggerConfigSchema = z.object({
  triggerName: z.string().trim().min(1, "Trigger name is required."),
  triggerType: z.literal("manual"),
});

export const actionConfigSchema = z.object({
  actionName: z.string().trim().min(1, "Action name is required."),
  operation: z.enum(["assign", "update_status", "create_record"]),
  parameter: z.string().optional(),
});

export const conditionConfigSchema = z.object({
  field: z.string().trim().min(1, "Condition field is required."),
  operator: z.enum(["equals", "not_equals", "greater_than", "less_than"]),
  comparisonValue: z.string().trim().min(1, "Comparison value is required."),
});

export const notificationConfigSchema = z.object({
  recipient: z.string().trim().min(1, "Notification recipient is required.").email("Enter a valid email address."),
  message: z.string().trim().min(1, "Notification message is required."),
});

export const endConfigSchema = z.object({
  completionLabel: z.string().trim().optional(),
});

export const nodeConfigSchemas = {
  trigger: triggerConfigSchema,
  action: actionConfigSchema,
  condition: conditionConfigSchema,
  notification: notificationConfigSchema,
  end: endConfigSchema,
} as const;
