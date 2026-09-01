import { expect, test } from "@playwright/test";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";

test("loads, saves, reloads, and preserves workflow configuration", async ({ page }) => {
  let stored = structuredClone(sampleWorkflow);

  await page.route("**/api/workflows/demo", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stored) });
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON() as { workflow: typeof stored; expectedRevision: number };
      stored = { ...body.workflow, version: body.expectedRevision + 1 };
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stored) });
    }
    return route.continue();
  });

  await page.goto("/workflows/demo");
  await expect(page.getByText("Request routing")).toBeVisible();
  await page.getByRole("group", { name: "Workflow action" }).click();
  await page.getByLabel("Action name").fill("Persisted route");
  await page.getByRole("button", { name: "Apply changes" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Workflow saved.")).toBeVisible();

  await page.reload();
  await page.getByRole("group", { name: "Workflow action" }).click();
  await expect(page.getByLabel("Action name")).toHaveValue("Persisted route");
});
