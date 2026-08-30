import { expect, test } from "@playwright/test";

test("open workflow, select node, edit configuration, and apply", async ({ page }) => {
  await page.goto("/workflows/demo");
  await expect(page.getByText("Request routing")).toBeVisible();
  await page.getByRole("group", { name: "Workflow action" }).click();
  await expect(page.getByRole("heading", { name: "action" })).toBeVisible();
  await page.getByLabel("Action name").fill("Route request");
  await page.getByRole("button", { name: "Apply changes" }).click();
  await expect(page.getByText("Node configuration updated.")).toBeVisible();
  await expect(page.getByRole("group", { name: "Workflow action" })).toContainText("Route request");
});
