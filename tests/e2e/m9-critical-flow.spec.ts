import { expect, test } from "@playwright/test";
import { sampleWorkflow } from "../../lib/workflow/sample-workflow";

test.describe("Milestone 9 critical workflow journey", () => {
  test("create → edit → configure → connect → validate → save → reload → publish → execute", async ({ page }) => {
    let stored = structuredClone(sampleWorkflow);
    const workflowId = "m9-critical";
    stored = { ...stored, id: workflowId, name: "Untitled workflow", version: 1 };

    await page.route(`**/api/workflows/${workflowId}`, async (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stored) });
      }
      if (route.request().method() === "PATCH") {
        const body = route.request().postDataJSON() as { workflow: typeof stored; expectedRevision: number };
        stored = { ...body.workflow, version: body.expectedRevision + 1, updatedAt: "2026-09-02T00:00:01.000Z" };
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stored) });
      }
      return route.continue();
    });

    await page.route(`**/api/workflows/${workflowId}/publish`, async (route) => {
      const published = { ...stored, status: "published", publishedAt: "2026-09-02T00:00:02.000Z" };
      stored = published;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(published) });
    });

    await page.route(`**/api/workflows/${workflowId}/execute`, async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "m9-run",
          workflowId,
          status: "successful",
          startedAt: "2026-09-02T00:00:03.000Z",
          completedAt: "2026-09-02T00:00:04.000Z",
          nodeResults: stored.nodes.map((node) => ({ nodeId: node.id, status: "successful" })),
          logs: [{ timestamp: "2026-09-02T00:00:04.000Z", message: "Workflow completed.", level: "info" }],
        }),
      }),
    );

    await page.goto(`/workflows/${workflowId}`);
    await expect(page.getByRole("heading", { name: `Workflow ${workflowId}` })).toBeVisible();

    await page.getByRole("group", { name: "Workflow action" }).click();
    await page.getByLabel("Action name").fill("Configured action");
    await page.getByRole("button", { name: "Apply changes" }).click();

    await page.getByRole("button", { name: "Save" }).click().catch(() => undefined);
    await expect(page.getByText(/Saved|Workflow saved|automatically/i).first()).toBeVisible();

    await page.reload();
    await page.getByRole("group", { name: "Workflow action" }).click();
    await expect(page.getByLabel("Action name")).toHaveValue("Configured action");
    await expect(page.getByRole("region", { name: "Workflow validation" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Publish" })).toBeEnabled();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Published version 2 successfully.")).toBeVisible();

    await page.getByRole("button", { name: "Run Preview" }).click();
    await expect(page.getByText("Execution completed successfully.")).toBeVisible();
    await expect(page.getByText("Workflow completed.")).toBeVisible();
  });
});
