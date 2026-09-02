import { expect, test } from "@playwright/test";

const workflow = {
  id: "e2e-m8",
  name: "Request routing",
  description: "Deterministic test workflow.",
  status: "draft",
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  nodes: [
    { id: "trigger", type: "trigger", position: { x: 40, y: 160 }, config: { triggerName: "Manual start", triggerType: "manual" } },
    { id: "action", type: "action", position: { x: 300, y: 160 }, config: { actionName: "Assign owner", operation: "assign" } },
    { id: "condition", type: "condition", position: { x: 560, y: 160 }, config: { field: "priority", operator: "equals", comparisonValue: "high" } },
    { id: "notification", type: "notification", position: { x: 840, y: 60 }, config: { recipient: "team@example.com", message: "High priority request" } },
    { id: "end", type: "end", position: { x: 1100, y: 160 }, config: { completionLabel: "Complete" } },
  ],
  edges: [
    { id: "e1", sourceNodeId: "trigger", sourcePort: "default", targetNodeId: "action", targetPort: "default" },
    { id: "e2", sourceNodeId: "action", sourcePort: "default", targetNodeId: "condition", targetPort: "default" },
    { id: "e3", sourceNodeId: "condition", sourcePort: "true", targetNodeId: "notification", targetPort: "default" },
    { id: "e4", sourceNodeId: "condition", sourcePort: "false", targetNodeId: "end", targetPort: "default" },
    { id: "e5", sourceNodeId: "notification", sourcePort: "default", targetNodeId: "end", targetPort: "default" },
  ],
};

test("publish then execute preview", async ({ page }) => {
  const published = { ...workflow, status: "published", publishedAt: "2026-01-01T00:01:00.000Z" };
  await page.route("**/api/workflows/e2e-m8", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(workflow) }));
  await page.route("**/api/workflows/e2e-m8/publish", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(published) }));
  await page.route("**/api/workflows/e2e-m8/execute", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "run-1", workflowId: "e2e-m8", status: "successful", startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:00:05.000Z", nodeResults: published.nodes.map((node) => ({ nodeId: node.id, status: "successful" })), logs: [{ timestamp: "2026-01-01T00:00:05.000Z", message: "Workflow completed.", level: "info" }] }) }));

  await page.goto("/workflows/e2e-m8");
  await expect(page.getByRole("button", { name: "Publish" })).toBeEnabled();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Published version 1 successfully.")).toBeVisible();
  await page.getByRole("button", { name: "Run Preview" }).click();
  await expect(page.getByText("Execution completed successfully.")).toBeVisible();
  await expect(page.getByText("Workflow completed.")).toBeVisible();
});
