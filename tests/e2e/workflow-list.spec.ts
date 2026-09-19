import { expect, test } from "@playwright/test";
import { sampleWorkflow } from "../../lib/workflow/sample-workflow";

test("lists, creates, and deletes workflows", async ({ page }) => {
  const first = { ...structuredClone(sampleWorkflow), id: "workflow-1", name: "Existing workflow" };
  let workflows = [first];

  await page.route("**/api/workflows", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ workflows }) });
    if (route.request().method() === "POST") {
      const created = route.request().postDataJSON() as typeof first;
      workflows = [...workflows, created];
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(created) });
    }
    return route.continue();
  });
  await page.route("**/api/workflows/*", async (route) => {
    if (route.request().method() === "DELETE") {
      const id = new URL(route.request().url()).pathname.split("/").pop();
      workflows = workflows.filter((workflow) => workflow.id !== id);
      return route.fulfill({ status: 204, body: "" });
    }
    return route.continue();
  });

  await page.goto("/dashboard");
  await expect(page.getByRole("table").getByText("Existing workflow")).toBeVisible();
  await page.getByRole("button", { name: "New workflow" }).click();
  await page.waitForURL(/\/workflows\//);

  await page.goto("/dashboard");
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows.filter({ hasText: "Existing workflow" })).toHaveCount(1);
  await expect(rows.filter({ hasText: "Existing workflow" }).getByRole("link", { name: "Edit" })).toBeVisible();

  await rows.filter({ hasText: "Existing workflow" }).getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Delete workflow" }).click();
  await expect(page.getByRole("table").getByText("Existing workflow")).not.toBeVisible();
});
