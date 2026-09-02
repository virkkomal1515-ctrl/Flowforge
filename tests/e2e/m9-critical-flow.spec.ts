import { expect, test } from "./fixtures";
import { sampleWorkflow } from "../../lib/workflow/sample-workflow";

test.describe("Milestone 9 critical workflow journey", () => {
  test("create → edit → configure → connect → validate → save → reload → publish → execute", async ({ page }) => {
    let stored = structuredClone(sampleWorkflow);
    const workflowId = "m9-critical";
    stored = { ...stored, id: workflowId, name: "Untitled workflow", version: 1 };

    await page.route("**/api/workflows", async (route) => {
      if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ workflows: [] }) });
      if (route.request().method() === "POST") {
        const created = route.request().postDataJSON() as typeof stored;
        stored = { ...created, id: workflowId, version: 1 };
        return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(stored) });
      }
      return route.continue();
    });

    await page.route("**/api/workflows/*", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/publish")) {
        stored = { ...stored, status: "published", version: stored.version + 1, publishedAt: "2026-09-02T00:00:02.000Z" };
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stored) });
      }
      if (path.endsWith("/execute")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "m9-run", workflowId, status: "successful", startedAt: "2026-09-02T00:00:03.000Z", completedAt: "2026-09-02T00:00:04.000Z", nodeResults: stored.nodes.map((node) => ({ nodeId: node.id, status: "successful" })), logs: [{ timestamp: "2026-09-02T00:00:04.000Z", message: "Workflow completed.", level: "info" }] }) });
      }
      if (route.request().method() === "PATCH") {
        const body = route.request().postDataJSON() as { workflow: typeof stored; expectedRevision: number };
        stored = { ...body.workflow, version: body.expectedRevision + 1, updatedAt: "2026-09-02T00:00:01.000Z" };
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stored) });
      }
      if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stored) });
      return route.continue();
    });

    await page.goto("/dashboard");
    await page.getByRole("button", { name: "New workflow" }).click();
    await page.waitForURL(`/workflows/${workflowId}`);

    await page.getByRole("group", { name: "Workflow action" }).click();
    await page.getByLabel("Action name").fill("Configured action");
    await page.getByRole("button", { name: "Apply changes" }).click();
    await expect(page.getByText("Node configuration updated.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Workflow validation" })).toContainText("Workflow is valid.");
    await expect(page.getByText(/Saved|automatically/i).first()).toBeVisible({ timeout: 3000 });

    await page.reload();
    await page.getByRole("group", { name: "Workflow action" }).click();
    await expect(page.getByLabel("Action name")).toHaveValue("Configured action");
    await expect(page.getByRole("button", { name: "Publish" })).toBeEnabled();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText(/Published version \d+ successfully\./)).toBeVisible();

    await page.getByRole("button", { name: "Run Preview" }).click();
    await expect(page.getByText("Execution completed successfully.")).toBeVisible();
    await expect(page.getByText("Workflow completed.")).toBeVisible();
  });
});
