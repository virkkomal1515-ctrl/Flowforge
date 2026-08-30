import { expect, test } from "@playwright/test";

test("select node, edit configuration, apply, and see updated canvas state", async ({ page }) => {
  await page.goto("/workflows/demo");
  await expect(page.getByText("Request routing")).toBeVisible();

  await page.getByRole("group", { name: "Workflow action" }).click();
  await expect(page.getByRole("heading", { name: "action" })).toBeVisible();

  const actionName = page.getByLabel("Action name");
  await actionName.fill("Route request");
  await page.getByRole("button", { name: "Apply changes" }).click();

  await expect(page.getByText("Node configuration updated.")).toBeVisible();
  await expect(page.getByRole("group", { name: "Workflow action" })).toContainText("assign");
});
